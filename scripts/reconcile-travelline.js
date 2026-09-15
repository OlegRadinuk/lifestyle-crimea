#!/usr/bin/env node

/**
 * scripts/reconcile-travelline.js
 *
 * Full reconciliation of blocked_dates (source='travelline') against Travelline's live state.
 *
 * DESIGN (Phase A only — future-focused, no historical scan):
 *
 *   The incremental sync (sync-travelline.js) runs every 20 min and reliably catches
 *   new bookings. What it can miss is CANCELLATION events when the cron is down.
 *   Reconciliation covers exactly that gap.
 *
 *   Phase A — Verify existing future blocks:
 *     Take every booking_number from blocked_dates WHERE end_date >= today AND source='travelline'.
 *     Call GET /bookings/{number} for each.
 *     If Cancelled or 404 → mark for deletion.
 *     If still active but dates/room changed → update.
 *     Result: ~N API calls where N = future blocked rows in DB (typically 50–150, cheap).
 *
 *   Stale cleanup (always):
 *     Delete rows WHERE source='travelline' AND end_date < today.
 *     These don't affect availability (the API route already filters end_date >= today),
 *     but keeping the table clean avoids confusion.
 *
 *   Optional catch-up via --recent-days=N:
 *     If you suspect a missed NEW booking (not just missed cancellation), pass
 *     --recent-days=45 to also fetch summaries modified in the last N days and
 *     inspect those booking_numbers too. Off by default — the live incremental sync
 *     handles new bookings; this flag is for manual recovery after a multi-day outage.
 *
 * SAFETY:
 *   - Dry-run by default; requires --apply to touch the DB.
 *   - Network errors on individual bookings are skipped (block stays, logged) — only
 *     explicit Cancelled/404 triggers deletion. A completely broken API can't cause mass removal.
 *   - Hard abort if total fetch errors >= ERROR_ABORT_THRESHOLD and we have blocks to delete.
 *   - All DB changes in a single SQLite transaction.
 *   - WAL checkpoint after write.
 *   - Only touches rows with source='travelline'. Manual blocks are never touched.
 *
 * USAGE:
 *   node scripts/reconcile-travelline.js                    # dry-run (safe, default)
 *   node scripts/reconcile-travelline.js --apply            # apply changes
 *   node scripts/reconcile-travelline.js --apply --recent-days=45  # + catch recent missed bookings
 *
 * CRON (daily at 04:00 in apply mode):
 *   0 4 * * *  /var/www/lovelifestyle/scripts/run-reconcile.sh --apply
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: false });

const { ROOM_TYPE_MAPPING, isParking, maskSecrets } = require('./travelline-room-mapping');

// ── Configuration ─────────────────────────────────────────────────────────────

const TRAVELLINE_CLIENT_ID     = process.env.TRAVELLINE_CLIENT_ID;
const TRAVELLINE_CLIENT_SECRET = process.env.TRAVELLINE_CLIENT_SECRET;
const TRAVELLINE_PROPERTY_ID   = process.env.TRAVELLINE_PROPERTY_ID;

if (!TRAVELLINE_CLIENT_ID || !TRAVELLINE_CLIENT_SECRET || !TRAVELLINE_PROPERTY_ID) {
  console.error('ERROR: TRAVELLINE_CLIENT_ID / TRAVELLINE_CLIENT_SECRET / TRAVELLINE_PROPERTY_ID not set');
  process.exit(1);
}

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

// Delay between API calls — respect Travelline rate limits
const REQUEST_DELAY_MS = 500;

// Abort if this many fetch errors accumulated while we also have blocks to delete.
// Protects against "API is down" looking like "everything is cancelled".
// Override via RECONCILE_ERROR_THRESHOLD env var.
const ERROR_ABORT_THRESHOLD = parseInt(process.env.RECONCILE_ERROR_THRESHOLD || '10', 10);

// Abort if the ratio of bookings-to-delete exceeds this fraction of inspected bookings
// (only applies when toInspect.size >= RATIO_GUARD_MIN_SAMPLE).
// Protects against a buggy API returning mass 404s/Cancelleds without network errors
// (those don't increment fetchErrors, so the error-count guard won't catch them).
// Example: 60 out of 80 inspected marked for deletion = 75% → abort at default 50%.
// Override via RECONCILE_MAX_DELETE_RATIO env var (0..1). Set to 1.0 to disable.
const MAX_DELETE_RATIO     = parseFloat(process.env.RECONCILE_MAX_DELETE_RATIO || '0.5');
const RATIO_GUARD_MIN_SAMPLE = 5; // don't apply ratio guard on tiny samples

// ── Argument parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);

const DRY_RUN = !args.includes('--apply');

// --recent-days=N : also scan summaries modified in last N days (catch missed new bookings)
// Disabled by default; only needed after a multi-day sync outage.
let RECENT_DAYS = 0;
const recentArg = args.find(a => a.startsWith('--recent-days='));
if (recentArg) {
  RECENT_DAYS = parseInt(recentArg.split('=')[1], 10);
  if (!RECENT_DAYS || RECENT_DAYS <= 0) {
    console.error('ERROR: --recent-days must be a positive integer, e.g. --recent-days=45');
    process.exit(1);
  }
}

// --force-large-delete : bypass the ratio guard (use after manual review when a mass
// cancellation wave is legitimately expected, e.g. a hotel closure announcement).
const FORCE_LARGE_DELETE = args.includes('--force-large-delete');

// ── Room type mapping ─────────────────────────────────────────────────────────
// Импортируется из scripts/travelline-room-mapping.js — единственный источник правды.

// ── DB ────────────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);

// ── Дедупликация алертов (не чаще 1 раза в 24 ч на roomTypeId) ───────────────

const ALERTED_STATE_PATH = path.join(__dirname, '..', 'logs', 'travelline-unmapped-alerted.json');
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

function loadAlertedState() {
  try {
    return JSON.parse(fs.readFileSync(ALERTED_STATE_PATH, 'utf8'));
  } catch (_) {
    return {};
  }
}

function saveAlertedState(state) {
  try {
    fs.mkdirSync(path.join(__dirname, '..', 'logs'), { recursive: true });
    fs.writeFileSync(ALERTED_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Дедуп: не удалось сохранить ${ALERTED_STATE_PATH}: ${err.message}`);
  }
}

function filterNewForAlert(ids, state) {
  const now = Date.now();
  const toAlert = [];
  const updatedState = Object.assign({}, state);
  for (const id of ids) {
    const last = updatedState[id];
    if (!last || now - new Date(last).getTime() > DEDUP_TTL_MS) {
      toAlert.push(id);
      updatedState[id] = new Date(now).toISOString();
    }
  }
  return { toAlert, updatedState };
}

// ── Телеграм-алерты ───────────────────────────────────────────────────────────

function getTelegramCredentials() {
  let botToken = null;
  let chatId   = null;
  try {
    const tgRow = db.prepare(`
      SELECT bot_token, chat_id FROM telegram_settings
      WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1
    `).get();
    if (tgRow) { botToken = tgRow.bot_token; chatId = tgRow.chat_id; }
  } catch (_) { /* таблица может отсутствовать */ }
  if (!botToken || !chatId) {
    botToken = process.env.TELEGRAM_BOT_TOKEN;
    chatId   = process.env.TELEGRAM_CHAT_ID;
  }
  return { botToken, chatId };
}

async function sendTelegramAlert(text) {
  const base = (process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/$/, '');
  const { botToken, chatId } = getTelegramCredentials();
  if (!botToken || !chatId) {
    console.error('TG алерт не отправлен: нет учётных данных (telegram_settings пуст и TELEGRAM_BOT_TOKEN не задан)');
    return;
  }
  try {
    const res  = await fetch(`${base}/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const data = await res.json();
    if (!data.ok) console.error(`TG алерт: ошибка API — ${data.description}`);
    else          console.log('TG алерт отправлен.');
  } catch (err) {
    console.error(`TG алерт: ошибка отправки — ${err.message}`);
  }
}

// ── Валидация маппинга ────────────────────────────────────────────────────────

/**
 * Проверяет, что каждый apartment_id из ROOM_TYPE_MAPPING существует в таблице apartments.
 * Реконсиляция НЕ останавливается: возвращает Set невалидных roomTypeId для пропуска.
 */
async function validateMapping() {
  const invalidRoomTypeIds = new Set();
  const missingLines = [];
  for (const [roomTypeId, apartmentId] of Object.entries(ROOM_TYPE_MAPPING)) {
    const row = db.prepare('SELECT id FROM apartments WHERE id = ?').get(apartmentId);
    if (!row) {
      invalidRoomTypeIds.add(roomTypeId);
      missingLines.push({ roomTypeId, line: `roomType ${roomTypeId} → "${apartmentId}"` });
    }
  }
  if (invalidRoomTypeIds.size === 0) return invalidRoomTypeIds;

  console.error(`\nMAP ERROR: ${invalidRoomTypeIds.size} apartment_id не найдены в таблице apartments:`);
  missingLines.forEach(({ line }) => console.error('  ' + line));
  console.error('Эти типы номеров будут пропущены. Обнови маппинг или проверь БД.\n');

  const state = loadAlertedState();
  const { toAlert, updatedState } = filterNewForAlert(Array.from(invalidRoomTypeIds), state);
  if (toAlert.length > 0) {
    const lines = missingLines.filter(({ roomTypeId }) => toAlert.includes(roomTypeId));
    const msg = [
      '❌ <b>Travelline-реконсиляция: маппинг сломан!</b>',
      '',
      `Следующие apartment_id из <code>travelline-room-mapping.js</code> не найдены в таблице apartments (${lines.length} шт.):`,
      ...lines.map(({ line }) => `  • ${line}`),
      '',
      'Брони по этим номерам <b>не учтены</b>. Обнови маппинг или проверь БД.',
    ].join('\n');
    await sendTelegramAlert(msg);
    saveAlertedState(updatedState);
  }

  return invalidRoomTypeIds;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    last_sync DATETIME NOT NULL,
    continue_token TEXT,
    last_modified_date DATETIME,
    status TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Travelline auth ───────────────────────────────────────────────────────────

let _token      = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const res = await fetch('https://partner.tlintegration.com/auth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     TRAVELLINE_CLIENT_ID,
      client_secret: TRAVELLINE_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Auth failed ${res.status}: ${maskSecrets(body)}`);
  }
  const data   = await res.json();
  _token       = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _token;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── API helpers ───────────────────────────────────────────────────────────────

/**
 * Fetch one booking by number.
 * Returns booking object, or null on 404 (not found / removed in Travelline).
 * Throws on other HTTP errors → caller treats as fetch error, block stays in place.
 */
async function fetchBookingDetails(bookingNumber) {
  const token = await getToken();
  const url   = `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings/${bookingNumber}`;
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.booking;
}

/**
 * Fetch booking summaries modified in the last recentDays days.
 * Only used when --recent-days flag is passed.
 */
async function fetchRecentSummaries(recentDays) {
  const since = new Date();
  since.setDate(since.getDate() - recentDays);
  const sinceISO = since.toISOString();

  console.log(`  [recent-days] Fetching summaries modified since ${sinceISO}...`);

  const summaries   = [];
  let continueToken = null;
  let page          = 0;

  while (true) {
    page++;
    const url = new URL(
      `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`
    );
    if (continueToken) {
      url.searchParams.set('continueToken', continueToken);
    } else {
      url.searchParams.set('lastModification', sinceISO);
    }

    const token = await getToken();
    const res   = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Summaries page ${page} failed: ${res.status}`);

    const data  = await res.json();
    const batch = data.bookingSummaries || [];
    summaries.push(...batch);
    process.stdout.write(`\r  [recent-days] Page ${page}: ${summaries.length} summaries...`);

    if (!data.hasMoreData || !data.continueToken) break;
    continueToken = data.continueToken;
    await sleep(REQUEST_DELAY_MS);
  }

  process.stdout.write('\n');
  return summaries;
}

/**
 * Extract room-stay blocks that are still active (guest has not yet checked out).
 *
 * IMPORTANT: we filter on checkOut, NOT checkIn.
 * A booking with checkIn in the past but checkOut in the future means the guest
 * is currently in the room. Filtering on checkIn < today would wrongly drop that
 * block → the reconciliation would mark it for DELETE → double-booking risk.
 * Correct rule: skip only fully-past stays where checkOut <= today.
 * The actual dates stored in blocked_dates (checkIn..checkOut) are left unchanged;
 * the availability route uses overlap logic (start_date < checkOut AND end_date > checkIn)
 * which correctly handles in-progress stays.
 */
/**
 * Возвращает { blocks, hadSkippedRoomStays }.
 *   blocks               — будущие блоки с известным apartment_id
 *   hadSkippedRoomStays  — true, если хотя бы один будущий стой был пропущен
 *                          из-за отсутствия/невалидности маппинга (НЕ парковки,
 *                          НЕ прошедшие даты — только «не знаем куда»).
 * Если hadSkippedRoomStays — бронь нельзя удалять/апдейтить в сторону уменьшения.
 */
function extractFutureBlocks(booking, today, unmappedSet, invalidRoomTypeIds) {
  const blocks = [];
  let hadSkippedRoomStays = false;

  for (const roomStay of booking.roomStays || []) {
    const checkIn  = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
    const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
    if (!checkIn || !checkOut) continue;
    // Пропускаем только полностью прошедшие (гость уже выехал)
    if (checkOut <= today) continue;

    const roomTypeId = roomStay.roomType?.id;

    // Парковки — молча пропускаем, не считаем skipped
    if (isParking(roomTypeId, roomStay.roomType)) continue;

    const apartment_id = ROOM_TYPE_MAPPING[roomTypeId];
    const isInvalid    = invalidRoomTypeIds && invalidRoomTypeIds.has(String(roomTypeId));

    if (!apartment_id || isInvalid) {
      // Будущий стой без маппинга — skipped, не удалять бронь
      hadSkippedRoomStays = true;
      // Незамапленные (не невалидные) копим для алерта
      if (unmappedSet && !isInvalid) {
        unmappedSet.add(String(roomTypeId));
      }
      continue;
    }

    blocks.push({ apartment_id, start_date: checkIn, end_date: checkOut });
  }

  return { blocks, hadSkippedRoomStays };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function reconcile() {
  const startedAt = new Date().toISOString();

  console.log('='.repeat(80));
  console.log('TRAVELLINE RECONCILIATION (future-focused)');
  console.log('='.repeat(80));

  // Незамапленные типы номеров за прогон (не парковки) — один алерт в конце
  const unmappedRoomTypeIds = new Set();
  // Проверяем маппинг до любых сетевых запросов
  console.log('Проверка маппинга...');
  const invalidRoomTypeIds = await validateMapping();
  if (invalidRoomTypeIds.size === 0) {
    console.log(`Маппинг OK (${Object.keys(ROOM_TYPE_MAPPING).length} типов)`);
  } else {
    console.log(`MAP WARNING: ${invalidRoomTypeIds.size} невалидных записей, реконсиляция продолжается без них`);
  }
  console.log('');

  console.log(`Mode:           ${DRY_RUN ? 'DRY-RUN (no DB changes)' : 'APPLY'}`);
  console.log(`Property ID:    ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Started:        ${startedAt}`);
  console.log(`Error threshold: abort if >= ${ERROR_ABORT_THRESHOLD} HTTP errors while deletions pending`);
  console.log(`Ratio guard:     abort if > ${Math.round(MAX_DELETE_RATIO * 100)}% of inspected marked for delete (min sample: ${RATIO_GUARD_MIN_SAMPLE})`);
  if (FORCE_LARGE_DELETE) console.log(`FORCE_LARGE_DELETE: ON — ratio guard bypassed`);
  if (RECENT_DAYS) {
    console.log(`Recent-days:    ON — also scan summaries modified in last ${RECENT_DAYS} days`);
  } else {
    console.log(`Recent-days:    OFF (default) — Phase A only, no historical scan`);
  }
  console.log('='.repeat(80));

  const today = new Date().toISOString().split('T')[0];

  // ── Phase A: collect booking_numbers from DB future blocks ─────────────────

  console.log(`\n[Phase A] Loading future blocks from DB (end_date >= ${today})...`);

  const currentRows = db.prepare(`
    SELECT id, apartment_id, start_date, end_date, booking_number
    FROM blocked_dates
    WHERE source         = 'travelline'
      AND end_date       >= ?
      AND booking_number IS NOT NULL
    ORDER BY booking_number, start_date
  `).all(today);

  // Group by booking_number
  const currentByBN = new Map(); // booking_number → row[]
  for (const row of currentRows) {
    if (!currentByBN.has(row.booking_number)) currentByBN.set(row.booking_number, []);
    currentByBN.get(row.booking_number).push(row);
  }

  console.log(`  Future blocks in DB: ${currentRows.length} rows / ${currentByBN.size} unique bookings`);

  // ── Optional: extend with recently-modified summaries ─────────────────────

  const toInspect = new Set(currentByBN.keys());

  if (RECENT_DAYS > 0) {
    console.log(`\n[Optional] Fetching recent summaries (last ${RECENT_DAYS} days)...`);
    const recentSummaries = await fetchRecentSummaries(RECENT_DAYS);
    let added = 0;
    for (const s of recentSummaries) {
      if (!toInspect.has(s.number)) { toInspect.add(s.number); added++; }
    }
    console.log(`  Added ${added} new booking_numbers from recent summaries (total to inspect: ${toInspect.size})`);
  }

  if (toInspect.size === 0) {
    console.log('\nNo future blocks to verify and no recent summaries. Running stale cleanup only.');
    applyStaleCleanup(today, DRY_RUN);
    return;
  }

  // ── Fetch details for each booking_number ─────────────────────────────────

  console.log(`\n[Fetching] ${toInspect.size} booking details...`);

  // Map<booking_number, blocks[] | 'error' | 'cancelled' | 'notfound'>
  const verified    = new Map();
  const inspectList = Array.from(toInspect);
  let   fetchErrors = 0;

  for (let i = 0; i < inspectList.length; i++) {
    const bn  = inspectList[i];
    const pct = `[${i + 1}/${inspectList.length}]`;

    let booking;
    try {
      booking = await fetchBookingDetails(bn);
    } catch (err) {
      console.log(`  ${pct} ${bn} FETCH ERROR: ${err.message} — block preserved`);
      verified.set(bn, 'error');
      fetchErrors++;
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (!booking) {
      console.log(`  ${pct} ${bn} NOT FOUND (404)`);
      verified.set(bn, 'notfound');
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (booking.status === 'Cancelled') {
      console.log(`  ${pct} ${bn} Cancelled`);
      verified.set(bn, 'cancelled');
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const extractResult = extractFutureBlocks(booking, today, unmappedRoomTypeIds, invalidRoomTypeIds);
    verified.set(bn, extractResult);

    if (extractResult.blocks.length === 0 && !extractResult.hadSkippedRoomStays) {
      console.log(`  ${pct} ${bn} ${booking.status} — no future room stays`);
    } else if (extractResult.hadSkippedRoomStays) {
      const known = extractResult.blocks.map(b => `${b.apartment_id} (${b.start_date}–${b.end_date})`).join(', ');
      console.log(`  ${pct} ${bn} ${booking.status} — preserved (unmapped stays)${known ? '; known: ' + known : ''}`);
    } else {
      const summary = extractResult.blocks.map(b => `${b.apartment_id} (${b.start_date}–${b.end_date})`).join(', ');
      console.log(`  ${pct} ${bn} ${booking.status}: ${summary}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n  Done. Fetch errors: ${fetchErrors} / ${inspectList.length}`);

  // ── Diff ──────────────────────────────────────────────────────────────────

  const bnToDelete   = [];
  const bnToInsert   = [];
  const bnToUpdate   = [];
  const bnPreserved  = []; // активная бронь с незамапленными стоями — не трогать
  let   unchanged    = 0;

  for (const [bn, result] of verified.entries()) {
    const dbRows = currentByBN.get(bn); // undefined if came from --recent-days only

    if (result === 'error') {
      // Сетевая ошибка → блок сохраняем
      continue;
    }

    if (result === 'cancelled' || result === 'notfound') {
      if (dbRows) bnToDelete.push({ bn, dbRows });
      continue;
    }

    // result is { blocks, hadSkippedRoomStays }
    const { blocks: targetBlocks, hadSkippedRoomStays } = result;

    if (!dbRows) {
      // Из --recent-days: активная бронь отсутствует в нашей БД → пропущена инкрементальным синком
      if (targetBlocks.length > 0) bnToInsert.push({ bn, targetBlocks });
      // При hadSkipped без блоков — ничего безопасного сделать нельзя
      continue;
    }

    if (hadSkippedRoomStays) {
      // Есть будущие стои без маппинга — полная картина неизвестна, не удалять и не уменьшать
      bnPreserved.push({ bn, dbRows });
      continue;
    }

    if (targetBlocks.length === 0) {
      // Все стои в прошлом / нет дат — блок больше не нужен
      bnToDelete.push({ bn, dbRows });
      continue;
    }

    // Сравниваем DB vs Travelline
    const dbKey = dbRows.map(r => `${r.apartment_id}|${r.start_date}|${r.end_date}`).sort().join(';');
    const tgKey = targetBlocks.map(b => `${b.apartment_id}|${b.start_date}|${b.end_date}`).sort().join(';');

    if (dbKey !== tgKey) {
      bnToUpdate.push({ bn, dbRows, targetBlocks });
    } else {
      unchanged++;
    }
  }

  // ── Safety guard ───────────────────────────────────────────────────────────
  //
  // If we have blocks to delete AND saw many fetch errors, the API may be down.
  // "API returning all 404s" looks identical to "all bookings cancelled" — abort.

  // Guard 1: error-count — network/HTTP errors suggest API is down
  if (bnToDelete.length > 0 && fetchErrors >= ERROR_ABORT_THRESHOLD) {
    const msg = (
      `SAFETY ABORT (error-count guard): ${fetchErrors} fetch errors with ${bnToDelete.length} deletions pending. ` +
      `API may be down — refusing to delete anything. ` +
      `Fix the connection and re-run. ` +
      `Lower threshold via RECONCILE_ERROR_THRESHOLD env var (current: ${ERROR_ABORT_THRESHOLD}).`
    );
    console.error(`\n${msg}\n`);
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES ('travelline-reconcile', ?, 'aborted', ?)
    `).run(new Date().toISOString(), msg);
    db.pragma('wal_checkpoint(TRUNCATE)');
    process.exit(2);
  }

  // Guard 2: ratio — mass 404s/Cancelleds from a buggy API won't raise fetchErrors
  // (those are "clean" HTTP responses), so the error-count guard won't fire.
  // Example: API outage returns 404 for everything → all 80 blocks marked for deletion.
  // At 50% threshold: if more than half of inspected bookings are marked for deletion,
  // something is likely wrong. Real-world mass cancellations (e.g. hotel closure) are
  // rare and should be applied consciously with --force-large-delete after manual review.
  if (!FORCE_LARGE_DELETE && toInspect.size >= RATIO_GUARD_MIN_SAMPLE) {
    const deleteRatio = bnToDelete.length / toInspect.size;
    if (deleteRatio > MAX_DELETE_RATIO) {
      const pct = Math.round(deleteRatio * 100);
      const msg = (
        `SAFETY ABORT (ratio guard): ${bnToDelete.length} of ${toInspect.size} inspected bookings ` +
        `(${pct}%) are marked for deletion — exceeds threshold of ${Math.round(MAX_DELETE_RATIO * 100)}%. ` +
        `This is unusual and may indicate a buggy/degraded API returning mass 404s or Cancelleds. ` +
        `Review the DELETE list in dry-run output, then re-run with --force-large-delete if correct. ` +
        `To adjust threshold: RECONCILE_MAX_DELETE_RATIO env var (current: ${MAX_DELETE_RATIO}).`
      );
      console.error(`\n${msg}\n`);
      db.prepare(`
        INSERT INTO sync_log (source, last_sync, status, message)
        VALUES ('travelline-reconcile', ?, 'aborted', ?)
      `).run(new Date().toISOString(), msg);
      db.pragma('wal_checkpoint(TRUNCATE)');
      process.exit(2);
    }
  }

  // ── Stale count (for reporting) ────────────────────────────────────────────

  const staleCount = db.prepare(
    `SELECT COUNT(*) as cnt FROM blocked_dates WHERE source = 'travelline' AND end_date < ?`
  ).get(today).cnt;

  // ── Report ─────────────────────────────────────────────────────────────────

  console.log('\n' + '='.repeat(80));
  console.log('RECONCILIATION PLAN');
  console.log('='.repeat(80));
  console.log(`Current future blocks (DB):       ${currentRows.length} rows / ${currentByBN.size} bookings`);
  console.log(`Inspected:                         ${toInspect.size} bookings`);
  console.log(`Fetch errors (blocks preserved):   ${fetchErrors}`);
  console.log('---');
  console.log(`DELETE (cancelled/not-found):      ${bnToDelete.length} bookings`);
  console.log(`INSERT (missed by incremental):    ${bnToInsert.length} bookings`);
  console.log(`UPDATE (dates/room changed):       ${bnToUpdate.length} bookings`);
  console.log(`PRESERVED (unmapped stays):        ${bnPreserved.length} bookings`);
  console.log(`Unchanged:                         ${unchanged} bookings`);
  console.log(`Stale cleanup (end_date < today):  ${staleCount} rows`);

  if (bnToDelete.length) {
    console.log('\nWill DELETE (freed dates):');
    for (const { bn, dbRows } of bnToDelete) {
      for (const r of dbRows) {
        console.log(`  ${bn}  ${r.apartment_id}  ${r.start_date} — ${r.end_date}`);
      }
    }
  }

  if (bnToInsert.length) {
    console.log('\nWill INSERT (missed bookings):');
    for (const { bn, targetBlocks } of bnToInsert) {
      for (const b of targetBlocks) {
        console.log(`  ${bn}  ${b.apartment_id}  ${b.start_date} — ${b.end_date}`);
      }
    }
  }

  if (bnToUpdate.length) {
    console.log('\nWill UPDATE (dates/room changed):');
    for (const { bn, dbRows, targetBlocks } of bnToUpdate) {
      const old = dbRows.map(r => `${r.apartment_id} ${r.start_date}–${r.end_date}`).join(', ');
      const nw  = targetBlocks.map(b => `${b.apartment_id} ${b.start_date}–${b.end_date}`).join(', ');
      console.log(`  ${bn}:  [${old}]  →  [${nw}]`);
    }
  }

  if (bnPreserved.length) {
    console.log('\nPRESERVED (unmapped stays — not touched):');
    for (const { bn, dbRows } of bnPreserved) {
      const rows = dbRows.map(r => `${r.apartment_id} ${r.start_date}–${r.end_date}`).join(', ');
      console.log(`  ${bn}: [${rows}]`);
    }
  }

  if (DRY_RUN) {
    console.log('\n[DRY-RUN] No changes applied. Run with --apply to execute.\n');
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES ('travelline-reconcile', ?, 'dry-run', ?)
    `).run(
      new Date().toISOString(),
      `DryRun: del=${bnToDelete.length}, ins=${bnToInsert.length}, upd=${bnToUpdate.length}, preserved=${bnPreserved.length}, stale=${staleCount}, errors=${fetchErrors}`
    );
    db.pragma('wal_checkpoint(TRUNCATE)');
    return;
  }

  // ── Apply (single transaction) ────────────────────────────────────────────

  console.log('\nApplying changes (transaction)...');

  const doApply = db.transaction(() => {
    let deleted = 0, inserted = 0, updated = 0, staleDeleted = 0;

    const deleteById = db.prepare('DELETE FROM blocked_dates WHERE id = ?');
    const insertRow  = db.prepare(`
      INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
      VALUES (?, ?, ?, 'travelline', ?)
    `);

    for (const { dbRows } of bnToDelete) {
      for (const row of dbRows) { deleteById.run(row.id); deleted++; }
    }

    for (const { bn, targetBlocks } of bnToInsert) {
      for (const b of targetBlocks) { insertRow.run(b.apartment_id, b.start_date, b.end_date, bn); inserted++; }
    }

    for (const { bn, dbRows, targetBlocks } of bnToUpdate) {
      for (const row of dbRows) { deleteById.run(row.id); }
      for (const b of targetBlocks) { insertRow.run(b.apartment_id, b.start_date, b.end_date, bn); updated++; }
    }

    // Stale cleanup
    const staleResult = db.prepare(
      `DELETE FROM blocked_dates WHERE source = 'travelline' AND end_date < ?`
    ).run(today);
    staleDeleted = staleResult.changes;

    return { deleted, inserted, updated, staleDeleted };
  });

  const result = doApply();
  console.log(`  Deleted (freed):   ${result.deleted}`);
  console.log(`  Inserted (missed): ${result.inserted}`);
  console.log(`  Updated:           ${result.updated}`);
  console.log(`  Stale cleaned:     ${result.staleDeleted}`);

  db.pragma('wal_checkpoint(TRUNCATE)');
  db.prepare(`
    INSERT INTO sync_log (source, last_sync, status, message)
    VALUES ('travelline-reconcile', ?, 'success', ?)
  `).run(
    new Date().toISOString(),
    `Applied: del=${result.deleted}, ins=${result.inserted}, upd=${result.updated}, preserved=${bnPreserved.length}, stale=${result.staleDeleted}, errors=${fetchErrors}`
  );

  // Алерт о незамапленных типах номеров — дедуп: не чаще раза в 24 ч на ID
  if (unmappedRoomTypeIds.size > 0) {
    const allIds = Array.from(unmappedRoomTypeIds).sort();
    console.error(`\nНезамапленные roomTypeId за прогон: ${allIds.join(', ')}`);
    const state = loadAlertedState();
    const { toAlert, updatedState } = filterNewForAlert(allIds, state);
    if (toAlert.length > 0) {
      const text = [
        '⚠️ <b>Travelline-реконсиляция: незамапленные типы номеров</b>',
        '',
        `За прогон встретились roomTypeId без маппинга (${toAlert.length} шт.):`,
        `<code>${toAlert.join(', ')}</code>`,
        '',
        'Брони по этим номерам <b>не учтены</b> — они могут показываться свободными на сайте.',
        'Добавь их в <code>scripts/travelline-room-mapping.js</code>.',
      ].join('\n');
      await sendTelegramAlert(text);
      saveAlertedState(updatedState);
    } else {
      console.log('Дедуп: все незамапленные roomTypeId уже были в алерте за последние 24ч.');
    }
  }

  console.log('\nReconciliation complete.\n');
}

// ── Stale-only cleanup (when DB has no future blocks and no --recent-days) ────

function applyStaleCleanup(today, dryRun) {
  const staleCount = db.prepare(
    `SELECT COUNT(*) as cnt FROM blocked_dates WHERE source = 'travelline' AND end_date < ?`
  ).get(today).cnt;

  console.log(`Stale rows (end_date < today, source=travelline): ${staleCount}`);

  if (dryRun) {
    console.log('[DRY-RUN] Would delete stale rows. Run with --apply.');
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES ('travelline-reconcile', ?, 'dry-run', ?)
    `).run(new Date().toISOString(), `DryRun: stale=${staleCount} (no future blocks to verify)`);
  } else {
    const r = db.prepare(
      `DELETE FROM blocked_dates WHERE source = 'travelline' AND end_date < ?`
    ).run(today);
    console.log(`Stale cleaned: ${r.changes}`);
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES ('travelline-reconcile', ?, 'success', ?)
    `).run(new Date().toISOString(), `StaleOnly: ${r.changes} rows removed`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

reconcile().catch(err => {
  console.error('\nRECONCILIATION FAILED:', err.message || err);
  try {
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES ('travelline-reconcile', ?, 'error', ?)
    `).run(new Date().toISOString(), String(err.message || err));
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (_) { /* ignore secondary failure */ }
  process.exit(1);
});
