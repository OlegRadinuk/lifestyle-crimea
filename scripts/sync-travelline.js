#!/usr/bin/env node

// scripts/sync-travelline.js
const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: false });

const { ROOM_TYPE_MAPPING, isParking, maskSecrets } = require('./travelline-room-mapping');

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const TRAVELLINE_CLIENT_ID = process.env.TRAVELLINE_CLIENT_ID;
const TRAVELLINE_CLIENT_SECRET = process.env.TRAVELLINE_CLIENT_SECRET;
const TRAVELLINE_PROPERTY_ID = process.env.TRAVELLINE_PROPERTY_ID;

if (!TRAVELLINE_CLIENT_ID || !TRAVELLINE_CLIENT_SECRET || !TRAVELLINE_PROPERTY_ID) {
  console.error('❌ TRAVELLINE_* не заданы в .env (TRAVELLINE_CLIENT_ID, TRAVELLINE_CLIENT_SECRET, TRAVELLINE_PROPERTY_ID)');
  process.exit(1);
}

const REQUEST_DELAY_MS = 500;        // 0.5 сек между запросами
const MAX_PAGES_PER_RUN = 5;         // 5 страниц за запуск
const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

// ============================================
// ПОДКЛЮЧЕНИЕ К БД
// ============================================
const db = new Database(DB_PATH);

// Создаём таблицы если их нет
db.exec(`
  CREATE TABLE IF NOT EXISTS blocked_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    source TEXT DEFAULT 'travelline',
    booking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_blocked_dates_apartment ON blocked_dates(apartment_id);
  CREATE INDEX IF NOT EXISTS idx_blocked_dates_dates ON blocked_dates(start_date, end_date);
  
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

// ============================================
// TRAVELLINE API
// ============================================
let token = null;
let tokenExpiry = 0;

async function getToken(force = false) {
  if (!force && token && Date.now() < tokenExpiry) {
    console.log('🔑 Using cached token (expires in', Math.floor((tokenExpiry - Date.now())/1000), 'seconds)');
    return token;
  }

  console.log('🔑 Getting new token...');
  
  const response = await fetch('https://partner.tlintegration.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: TRAVELLINE_CLIENT_ID,
      client_secret: TRAVELLINE_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    console.error(`❌ Auth failed with status ${response.status}`);
    const text = await response.text();
    console.error('Response:', maskSecrets(text));
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('✅ Token obtained, expires in', data.expires_in, 'seconds');
  return token;
}

// ============================================
// ПОЛУЧЕНИЕ ПОСЛЕДНЕЙ ДАТЫ СИНХРОНИЗАЦИИ
// ============================================
function getLastSyncInfo() {
  const row = db.prepare(`
    SELECT last_sync, continue_token 
    FROM sync_log 
    WHERE source = 'travelline' 
    ORDER BY last_sync DESC LIMIT 1
  `).get();
  
  if (row) {
    console.log('📅 Last sync from DB:', row.last_sync);
    console.log('   Continue token:', row.continue_token ? row.continue_token.substring(0, 30) + '...' : 'none');
    return {
      lastSync: row.last_sync,
      continueToken: row.continue_token
    };
  }
  console.log('📅 No previous sync found');
  return { lastSync: null, continueToken: null };
}

// ============================================
// СОХРАНЕНИЕ ПРОГРЕССА
// ============================================
function saveProgress(continueToken, stats) {
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO sync_log (source, last_sync, continue_token, status, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'travelline',
    now,
    continueToken,
    'success',
    `Modified:${stats.modified}, Saved:${stats.saved}, Cancelled:${stats.cancelled}`
  );
  
  console.log(`\n📊 Progress saved at ${now}`);
  console.log(`   Continue token: ${continueToken ? continueToken.substring(0, 30) + '...' : 'none'}`);
}

// ============================================
// ПОЛУЧЕНИЕ БРОНЕЙ (ТОЛЬКО ИЗМЕНЁННЫЕ)
// ============================================
async function getModifiedBookings(lastSyncDate, continueToken = null) {
  const token = await getToken();
  const url = new URL(`https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`);
  
  // ВАЖНО: НЕЛЬЗЯ использовать lastModification и continueToken вместе
  if (continueToken) {
    // Если есть continueToken - используем только его (продолжаем с того места, где остановились)
    url.searchParams.set('continueToken', continueToken);
    console.log(`   Using continue token: ${continueToken.substring(0, 30)}...`);
  } else if (lastSyncDate) {
    // Если нет continueToken, но есть lastSyncDate - используем его (запрашиваем изменения с даты)
    url.searchParams.set('lastModification', lastSyncDate);
    console.log(`📅 Requesting changes since: ${lastSyncDate}`);
  }

  console.log(`   Full URL: ${url.toString()}`);
  
  const startTime = Date.now();
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  const endTime = Date.now();

  console.log(`   Response status: ${response.status} (${endTime - startTime}ms)`);
  
  if (!response.ok) {
    const text = await response.text();
    console.log(`   ❌ Response body:`, text);
    
    try {
      const errorData = JSON.parse(text);
      console.log('   Error details:', errorData);
    } catch (e) {
      // Не JSON, просто текст
    }
    
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  const count = data.bookingSummaries?.length || 0;
  console.log(`   ✅ Success, received ${count} bookings`);
  
  if (count > 0) {
    console.log(`   First booking: ${data.bookingSummaries[0].number} (${data.bookingSummaries[0].modifiedDateTime})`);
    console.log(`   Last booking: ${data.bookingSummaries[count-1].number} (${data.bookingSummaries[count-1].modifiedDateTime})`);
  }
  
  return data;
}

// ============================================
// ПОЛУЧЕНИЕ ДЕТАЛЕЙ БРОНИ
// ============================================
async function getBookingDetails(bookingNumber) {
  const token = await getToken();
  const url = `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings/${bookingNumber}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get booking ${bookingNumber}: ${response.status}`);
  }
  
  const data = await response.json();
  return data.booking;
}

// ============================================
// ДЕДУПЛИКАЦИЯ АЛЕРТОВ (не чаще 1 раза в 24 ч на roomTypeId)
// ============================================
// Файл состояния лежит в logs/ — он в .gitignore, пишется на сервере юзером deploy.
const ALERTED_STATE_PATH = path.join(__dirname, '..', 'logs', 'travelline-unmapped-alerted.json');
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

function loadAlertedState() {
  try {
    return JSON.parse(fs.readFileSync(ALERTED_STATE_PATH, 'utf8'));
  } catch (_) {
    return {}; // файл отсутствует или повреждён — не критично, синк продолжается
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

/**
 * Из массива id-строк оставляет только те, по которым алерт
 * ещё не отправлялся в последние 24 часа. Обновляет копию state.
 */
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

// ============================================
// ТЕЛЕГРАМ-АЛЕРТЫ (вспомогательные функции)
// ============================================

/** Загружает токен и chat_id: сначала из таблицы telegram_settings, потом из env. */
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

/** Отправляет одно HTML-сообщение в Telegram через прокси (TELEGRAM_API_URL). */
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

// ============================================
// ВАЛИДАЦИЯ МАППИНГА
// ============================================

/**
 * Проверяет, что каждый apartment_id из ROOM_TYPE_MAPPING существует в таблице apartments.
 * Если нет — console.error + деduped алерт в Telegram.
 * Синк НЕ останавливается: возвращает Set невалидных roomTypeId,
 * которые нужно пропускать в основном цикле.
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

  console.error(`\n❌ Маппинг: ${invalidRoomTypeIds.size} apartment_id не найдены в таблице apartments:`);
  missingLines.forEach(({ line }) => console.error('   ' + line));
  console.error('Эти типы номеров будут пропущены. Обнови маппинг или проверь БД.\n');

  // Алерт с дедупом — не спамим чаще раза в 24 ч на ID
  const state = loadAlertedState();
  const { toAlert, updatedState } = filterNewForAlert(Array.from(invalidRoomTypeIds), state);
  if (toAlert.length > 0) {
    const lines = missingLines.filter(({ roomTypeId }) => toAlert.includes(roomTypeId));
    const msg = [
      '❌ <b>Travelline-синк: маппинг сломан!</b>',
      '',
      `Следующие apartment_id из <code>travelline-room-mapping.js</code> не найдены в таблице apartments (${lines.length} шт.):`,
      ...lines.map(({ line }) => `  • ${line}`),
      '',
      'Брони по этим номерам <b>не синкаются</b>. Обнови маппинг или проверь БД.',
    ].join('\n');
    await sendTelegramAlert(msg);
    saveAlertedState(updatedState);
  }

  return invalidRoomTypeIds;
}

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================
async function syncBookings() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 TRAVELLINE INCREMENTAL SYNC v5.2 (FIXED)');
  console.log('='.repeat(80));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Node version: ${process.version}`);
  console.log('='.repeat(80));

  const stats = {
    pageCount: 0,
    totalThisRun: 0,
    saved: 0,
    cancelled: 0,
    modified: 0,
    errors: 0
  };

  // Незамапленные типы номеров за прогон (не парковки) — в конце один алерт
  const unmappedRoomTypeIds = new Set();

  try {
    // Проверяем маппинг — все apartment_id должны существовать в БД
    console.log('\n🗺️  Проверка маппинга...');
    const invalidRoomTypeIds = await validateMapping();
    if (invalidRoomTypeIds.size === 0) {
      console.log(`✅ Маппинг OK (${Object.keys(ROOM_TYPE_MAPPING).length} типов)`);
    } else {
      console.log(`⚠️  Маппинг: ${invalidRoomTypeIds.size} невалидных записей, синк продолжается без них`);
    }

    // Проверяем соединение с Travelline
    console.log('\n🔍 Testing Travelline connection...');
    await getToken();
    console.log('✅ Connection OK');

    // Получаем информацию о последней синхронизации
    const { lastSync, continueToken } = getLastSyncInfo();
    
    if (!lastSync) {
      console.log('📅 First sync - will get recent bookings');
    }

    let currentContinueToken = continueToken;
    let hasMore = true;

    while (hasMore && stats.pageCount < MAX_PAGES_PER_RUN) {
      stats.pageCount++;
      
      console.log(`\n📄 Page ${stats.pageCount}...`);
      
      const data = await getModifiedBookings(lastSync, currentContinueToken);
      const summaries = data.bookingSummaries || [];
      
      if (summaries.length === 0) {
        console.log('   ✅ No changes since last sync');
        // Heartbeat: пишем sync_log даже при 0 изменений, чтобы watchdog видел, что синк жив
        currentContinueToken = data.continueToken || currentContinueToken;
        saveProgress(currentContinueToken, stats);
        break;
      }

      stats.modified += summaries.length;

      for (let i = 0; i < summaries.length; i++) {
        const summary = summaries[i];
        stats.totalThisRun++;
        process.stdout.write(`\n   [${stats.totalThisRun}/${summaries.length}] ${summary.number}... `);

        try {
          const booking = await getBookingDetails(summary.number);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Обрабатываем отменённые брони
          if (booking.status === 'Cancelled') {
            const deleted = db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(summary.number);
            if (deleted.changes > 0) {
              console.log('❌ Cancelled (removed)');
              stats.cancelled++;
            } else {
              console.log('⏭️  Cancelled (not in DB)');
            }
            continue;
          }

          // Собираем будущие стои, затем применяем пакетом
          let hasFuture = false;
          let hadSkipped = false;   // есть незамапленные непарковочные будущие стои
          const staysToInsert = []; // { apartmentId, checkIn, checkOut }

          for (const roomStay of booking.roomStays || []) {
            const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
            if (!checkIn) continue;

            const checkInDate = new Date(checkIn);
            checkInDate.setHours(0, 0, 0, 0);
            if (checkInDate < today) continue;

            hasFuture = true;

            const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
            if (!checkOut) continue;

            const roomTypeId = roomStay.roomType?.id;

            // Парковки — молча пропускаем, не skipped
            if (isParking(roomTypeId, roomStay.roomType)) continue;

            const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];

            if (!apartmentId || invalidRoomTypeIds.has(String(roomTypeId))) {
              // Незамапленный / невалидный непарковочный стой → skipped
              if (!invalidRoomTypeIds.has(String(roomTypeId))) {
                unmappedRoomTypeIds.add(String(roomTypeId));
              }
              hadSkipped = true;
              console.log(`\n      ⚠️ No mapping for roomType ${roomTypeId}`);
              continue;
            }

            staysToInsert.push({ apartmentId, checkIn, checkOut });
          }

          // Применяем все вставки одной транзакцией
          if (staysToInsert.length > 0) {
            if (!hadSkipped) {
              // Все стои известны → DELETE старых + INSERT всех (атомарно)
              db.transaction(() => {
                db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(summary.number);
                const ins = db.prepare(
                  'INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number) VALUES (?, ?, ?, ?, ?)'
                );
                for (const s of staysToInsert) {
                  ins.run(s.apartmentId, s.checkIn, s.checkOut, 'travelline', summary.number);
                }
              })();
              const labels = staysToInsert.map(s => `${s.apartmentId} (${s.checkIn} - ${s.checkOut})`).join(', ');
              console.log(`✅ ${labels}`);
            } else {
              // Есть незамапленные стои → не удаляем существующие блоки,
              // только дописываем замапленные (без дублей, нет уникального индекса)
              const existsSt = db.prepare(
                'SELECT 1 FROM blocked_dates WHERE booking_number = ? AND apartment_id = ? AND start_date = ? AND end_date = ?'
              );
              const insSt = db.prepare(
                'INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number) VALUES (?, ?, ?, ?, ?)'
              );
              let inserted = 0;
              for (const s of staysToInsert) {
                if (!existsSt.get(summary.number, s.apartmentId, s.checkIn, s.checkOut)) {
                  insSt.run(s.apartmentId, s.checkIn, s.checkOut, 'travelline', summary.number);
                  inserted++;
                }
              }
              console.log(`⚠️ partial: ${inserted} блоков сохранено, существующие блоки незамапленных preserved`);
            }
            stats.saved += staysToInsert.length;
          } else if (hasFuture && hadSkipped) {
            console.log('⚠️ все будущие стои незамаплены — существующие блоки preserved');
          }

          if (!hasFuture) {
            console.log('⏭️  Past dates');
          }

        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          stats.errors++;
        }

        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
      }

      currentContinueToken = data.continueToken;
      hasMore = data.hasMoreData;

      // Сохраняем прогресс после каждой страницы
      saveProgress(currentContinueToken, stats);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RUN SUMMARY');
    console.log('='.repeat(80));
    console.log(`📋 Pages:              ${stats.pageCount}`);
    console.log(`📋 Modified bookings:   ${stats.modified}`);
    console.log(`✅ Saved (future):      ${stats.saved}`);
    console.log(`❌ Cancelled:           ${stats.cancelled}`);
    console.log(`💥 Errors:              ${stats.errors}`);
    console.log('='.repeat(80));

    // Force WAL checkpoint to prevent DB corruption from large WAL files
    db.pragma('wal_checkpoint(TRUNCATE)');
    console.log('✅ WAL checkpoint done');

    // Алерт о незамапленных типах номеров — дедуп: не чаще раза в 24 ч на ID
    if (unmappedRoomTypeIds.size > 0) {
      const allIds = Array.from(unmappedRoomTypeIds).sort();
      console.error(`\n⚠️  Незамапленные roomTypeId за прогон: ${allIds.join(', ')}`);
      const state = loadAlertedState();
      const { toAlert, updatedState } = filterNewForAlert(allIds, state);
      if (toAlert.length > 0) {
        const text = [
          '⚠️ <b>Travelline-синк: незамапленные типы номеров</b>',
          '',
          `За прогон встретились roomTypeId без маппинга (${toAlert.length} шт.):`,
          `<code>${toAlert.join(', ')}</code>`,
          '',
          'Брони по этим номерам <b>не сохранены</b> — они могут показываться свободными на сайте.',
          'Добавь их в <code>scripts/travelline-room-mapping.js</code>.',
        ].join('\n');
        await sendTelegramAlert(text);
        saveAlertedState(updatedState);
      } else {
        console.log('Дедуп: все незамапленные roomTypeId уже были в алерте за последние 24ч.');
      }
    }

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error);
    db.pragma('wal_checkpoint(TRUNCATE)');
    process.exit(1);
  }
}

// Запуск
syncBookings();