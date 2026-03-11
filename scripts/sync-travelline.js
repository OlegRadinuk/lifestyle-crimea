#!/usr/bin/env node

// scripts/sync-travelline.js
const Database = require('better-sqlite3');
const path = require('path');

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const TRAVELLINE_CLIENT_ID = 'api_connection_cd609_643b0e0b30';
const TRAVELLINE_CLIENT_SECRET = 'ohuU3N07mqvSEdHufhpktuqdlXCV5A5I';
const TRAVELLINE_PROPERTY_ID = '37777';

// Лимиты: не более 1 запроса в секунду (60 в минуту)
const REQUEST_DELAY_MS = 1000;
const MAX_PAGES = 50; // ограничим, чтобы не уйти в бесконечность

let token = null;
let tokenExpiry = 0;

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getToken() {
  if (token && Date.now() < tokenExpiry) {
    console.log('🔑 Using cached token');
    return token;
  }

  console.log('\n🔑 Getting new token...');
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
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // 14 минут
  console.log('✅ New token obtained');
  return token;
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const wait = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        console.log(`⏳ Rate limited, waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`⏳ Network error, retry ${i + 1}/${retries}...`);
      await sleep(5000);
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================
// ПОЛУЧЕНИЕ ВСЕХ СТРАНИЦ БРОНЕЙ
// ============================================
async function getAllBookingSummaries() {
  const token = await getToken();
  let continueToken = null;
  let page = 0;
  let allSummaries = [];

  do {
    page++;
    const url = new URL(`https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`);
    url.searchParams.set('count', '1000'); // максимум на страницу
    if (continueToken) {
      url.searchParams.set('continueToken', continueToken);
    }

    console.log(`\n📄 Fetching page ${page}...`);
    const response = await fetchWithRetry(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.status}`);
    }

    const data = await response.json();
    const summaries = data.bookingSummaries || [];
    allSummaries.push(...summaries);
    console.log(`   +${summaries.length} bookings (total: ${allSummaries.length})`);

    continueToken = data.continueToken;
    if (!continueToken) break;
    if (page >= MAX_PAGES) {
      console.log(`⚠️ Reached max pages (${MAX_PAGES}), stopping.`);
      break;
    }
  } while (continueToken);

  return allSummaries;
}

// ============================================
// ПОЛУЧЕНИЕ ДЕТАЛЕЙ БРОНИ
// ============================================
async function getBookingDetails(bookingNumber) {
  const token = await getToken();
  const response = await fetchWithRetry(
    `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings/${bookingNumber}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.booking;
}

// ============================================
// МАППИНГ ID КОМНАТ (ваш существующий)
// ============================================
const ROOM_TYPE_MAPPING = {
  '278023': 'ls-space',
  '243734': 'ls-coffee-ice-cream',
  '263391': 'ls-summer-emotions',
  '330325': 'ls-black-strong',
  '274922': 'ls-deep-music',
  '348222': 'ls-dream-vacation',
  '279273': 'ls-econom-studio',
  '277347': 'ls-family-comfort',
  '272228': 'ls-in-the-moment',
  '345796': 'ls-lux-flower-kiss',
  '289889': 'ls-relax-time',
  '269778': 'ls-sweet-summer',
  '243739': 'ls-lux-sweet-caramel',
  '274610': 'ls-steel-love',
  '244430': 'ls-art-crystal-blue',
  '243321': 'ls-art-olive',
  '265649': 'ls-blue-curacao',
  '244425': 'ls-blueberry',
  '269609': 'ls-cool-lemonade',
  '243319': 'ls-green',
  '291460': 'ls-hi-tech-emotion',
  '291417': 'ls-hi-tech-relax',
  '272288': 'ls-lux-only-you',
  '373007': 'ls-lux-fly-sky',
  '348227': 'ls-lux-beautiful-days',
  '361602': 'ls-lux-fly-mood',
  '337183': 'ls-lux-sun-rays',
  '348223': 'ls-lux-sunny-mood',
  '373006': 'ls-lux-fly-blue-light',
  '337185': 'ls-lux-sunshine',
  '278010': 'ls-diamond-green',
  '348218': 'ls-mountain-retreat',
  '264854': 'ls-wine-and-sunset',
  '264995': 'ls-lux-white-sands',
  '244426': 'ls-lux-orange',
  '243517': 'ls-lux-soft-blue',
  '363094': 'ls-lux-fly-birds',
  '280610': 'ls-deep-forest',
  '281311': 'ls-flowers-tea',
};

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================
async function syncBookings() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TRAVELLINE FULL SYNC (FUTURE-ONLY)');
  console.log('='.repeat(70));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));

  const stats = {
    totalSummaries: 0,
    processed: 0,
    saved: 0,
    cancelled: 0,
    skippedPast: 0,
    noMapping: 0,
    errors: 0,
  };

  try {
    // 1. Получаем ВСЕ summaries (с пагинацией)
    const summaries = await getAllBookingSummaries();
    stats.totalSummaries = summaries.length;
    console.log(`\n📊 Total booking summaries fetched: ${stats.totalSummaries}`);

    // 2. Обрабатываем каждую бронь с задержкой
    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      stats.processed++;

      process.stdout.write(`\n[${i + 1}/${summaries.length}] ${summary.number}... `);

      try {
        // Задержка перед каждым запросом деталей (кроме первого, но можно всегда)
        if (i > 0) await sleep(REQUEST_DELAY_MS);

        const booking = await getBookingDetails(summary.number);

        // Обработка отменённых
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

        // Проверяем будущие даты заезда
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let hasFuture = false;

        for (const roomStay of booking.roomStays || []) {
          const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
          if (!checkIn) continue;

          const checkInDate = new Date(checkIn);
          checkInDate.setHours(0, 0, 0, 0);
          if (checkInDate < today) {
            // прошлая дата – пропускаем это roomStay, но может быть несколько roomStay?
            continue;
          }

          hasFuture = true; // есть хотя бы один будущий roomStay

          const roomTypeId = roomStay.roomType?.id;
          const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];

          if (!apartmentId) {
            console.log(`\n   ⚠️ No mapping for roomType ${roomTypeId}`);
            stats.noMapping++;
            continue;
          }

          const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
          if (!checkOut) continue;

          // Удаляем старую запись (если была)
          db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(summary.number);

          // Вставляем новую
          db.prepare(`
            INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
            VALUES (?, ?, ?, ?, ?)
          `).run(apartmentId, checkIn, checkOut, 'travelline', summary.number);

          console.log(`✅ Saved: ${apartmentId} (${checkIn} - ${checkOut})`);
          stats.saved++;
        }

        if (!hasFuture) {
          console.log('⏭️  Past dates');
          stats.skippedPast++;
        }

      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        stats.errors++;
      }
    }

    // 3. Итог
    console.log('\n' + '='.repeat(70));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(70));
    console.log(`📋 Total summaries:      ${stats.totalSummaries}`);
    console.log(`✅ Processed:            ${stats.processed}`);
    console.log(`📅 Future bookings saved: ${stats.saved}`);
    console.log(`❌ Cancelled:            ${stats.cancelled}`);
    console.log(`⏭️  Skipped (past dates): ${stats.skippedPast}`);
    console.log(`⚠️ No mapping:           ${stats.noMapping}`);
    console.log(`💥 Errors:               ${stats.errors}`);
    console.log('='.repeat(70));

    // Логируем успех
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES (?, ?, ?, ?)
    `).run(
      'travelline',
      new Date().toISOString(),
      'success',
      `Future:${stats.saved}, Cancelled:${stats.cancelled}, Errors:${stats.errors}`
    );

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error);
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES (?, ?, ?, ?)
    `).run(
      'travelline',
      new Date().toISOString(),
      'error',
      error.message
    );
  }
}

// Запуск
syncBookings();