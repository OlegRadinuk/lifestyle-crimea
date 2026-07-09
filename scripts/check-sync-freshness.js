#!/usr/bin/env node

/**
 * scripts/check-sync-freshness.js
 *
 * Watchdog for the Travelline incremental sync.
 * If the last successful sync is older than SYNC_STALE_HOURS → sends Telegram alert.
 *
 * Telegram credentials are read from:
 *   1. The `telegram_settings` DB table (same source as the web app, is_active=1)
 *   2. Fallback: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars
 *
 * Telegram API proxy: TELEGRAM_API_URL env var (default https://api.telegram.org)
 * On prod: set to https://tg-proxy.radinuko.workers.dev to bypass blocking.
 *
 * USAGE:
 *   node scripts/check-sync-freshness.js
 *
 * CRON: every hour (or every 2h) is enough — adjust SYNC_STALE_HOURS accordingly.
 *   0 * * * *   /usr/bin/node /var/www/lovelifestyle/scripts/check-sync-freshness.js >> /var/www/lovelifestyle/logs/freshness.log 2>&1
 *
 * ENV:
 *   SYNC_STALE_HOURS     — hours before alert fires (default: 6)
 *   TELEGRAM_API_URL     — Telegram API base, e.g. https://tg-proxy.radinuko.workers.dev
 *   TELEGRAM_BOT_TOKEN   — fallback if not in DB
 *   TELEGRAM_CHAT_ID     — fallback if not in DB
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: false });

const DB_PATH         = path.join(__dirname, '..', 'data.sqlite');
const STALE_HOURS     = parseFloat(process.env.SYNC_STALE_HOURS || '6');
const TELEGRAM_BASE   = (process.env.TELEGRAM_API_URL || 'https://api.telegram.org').replace(/\/$/, '');

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHours(h) {
  if (h < 1) return `${Math.round(h * 60)} мин`;
  if (h < 24) return `${h.toFixed(1)} ч`;
  return `${(h / 24).toFixed(1)} д`;
}

function formatDateTime(isoStr) {
  // Format: 2025-07-04 18:30 UTC
  return new Date(isoStr).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

// ── Send Telegram message ─────────────────────────────────────────────────────

async function sendTelegram(botToken, chatId, text) {
  const url = `${TELEGRAM_BASE}/bot${botToken}/sendMessage`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:                  chatId,
      text,
      parse_mode:               'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram API: ${data.description}`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date();
  console.log(`[${now.toISOString()}] check-sync-freshness started (threshold: ${STALE_HOURS}h)`);

  const db = new Database(DB_PATH, { readonly: true });

  // ── 1. Get last successful sync ────────────────────────────────────────────

  // The standalone sync-travelline.js writes to `sync_log` (singular).
  // Filter status = 'success' to ignore aborted/error runs.
  const row = db.prepare(`
    SELECT last_sync FROM sync_log
    WHERE source = 'travelline'
      AND status = 'success'
    ORDER BY last_sync DESC
    LIMIT 1
  `).get();

  let lastSyncISO = null;
  let diffHours   = Infinity;

  if (row) {
    lastSyncISO = row.last_sync;
    diffHours   = (now - new Date(lastSyncISO)) / 1000 / 3600;
    console.log(`Last sync: ${lastSyncISO} (${formatHours(diffHours)} ago)`);
  } else {
    console.log('No successful sync record found in sync_log.');
  }

  if (diffHours <= STALE_HOURS) {
    console.log('Sync is fresh. No alert needed.');
    db.close();
    return;
  }

  // ── 2. Stale — resolve Telegram credentials ────────────────────────────────

  console.log(`Sync is STALE (${formatHours(diffHours)} > ${STALE_HOURS}h). Resolving Telegram credentials...`);

  let botToken = null;
  let chatId   = null;

  // Try DB (telegram_settings table, is_active = 1)
  try {
    const tgRow = db.prepare(`
      SELECT bot_token, chat_id
      FROM telegram_settings
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).get();

    if (tgRow) {
      botToken = tgRow.bot_token;
      chatId   = tgRow.chat_id;
      console.log('Telegram credentials: loaded from DB (telegram_settings)');
    }
  } catch (e) {
    console.warn(`Could not read telegram_settings from DB: ${e.message}`);
  }

  // Fallback to env vars
  if (!botToken || !chatId) {
    botToken = process.env.TELEGRAM_BOT_TOKEN;
    chatId   = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      console.log('Telegram credentials: loaded from env (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)');
    }
  }

  db.close();

  if (!botToken || !chatId) {
    console.error(
      'No Telegram credentials available (not in DB, not in env). ' +
      'Cannot send alert. Configure telegram_settings via the admin panel or set env vars.'
    );
    process.exit(1);
  }

  // ── 3. Build and send alert ────────────────────────────────────────────────

  const sinceText = lastSyncISO
    ? `${formatDateTime(lastSyncISO)} (${formatHours(diffHours)} назад)`
    : 'неизвестно (записей нет)';

  const alertText = [
    '⚠️ <b>Travelline-синк молчит!</b>',
    '',
    `Последний успешный синк: <b>${sinceText}</b>`,
    '',
    'Доступность апартаментов может быть <b>неактуальна</b>.',
    'Возможны ошибки бронирования — клиенты могут забронировать уже занятые даты.',
    '',
    '<b>Действия:</b>',
    '1. Проверь cron: <code>crontab -l | grep travelline</code>',
    '2. Запусти вручную: <code>node /var/www/lovelifestyle/scripts/sync-travelline.js</code>',
    '3. Посмотри лог: <code>tail -50 /var/www/lovelifestyle/logs/travelline-cron.log</code>',
  ].join('\n');

  console.log('Sending Telegram alert...');

  try {
    await sendTelegram(botToken, chatId, alertText);
    console.log('Alert sent successfully.');
  } catch (err) {
    console.error(`Failed to send Telegram alert: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('check-sync-freshness.js crashed:', err.message || err);
  process.exit(1);
});
