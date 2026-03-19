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
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('✅ Token obtained');
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
    return {
      lastSync: row.last_sync,
      continueToken: row.continue_token
    };
  }
  return { lastSync: null, continueToken: null };
}

// ============================================
// СОХРАНЕНИЕ ПРОГРЕССА
// ============================================
function saveProgress(continueToken, stats) {
  db.prepare(`
    INSERT INTO sync_log (source, last_sync, continue_token, status, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'travelline',
    new Date().toISOString(),
    continueToken,
    'success',
    `Modified:${stats.modified}, Saved:${stats.saved}, Cancelled:${stats.cancelled}`
  );
  
  console.log(`\n📊 Progress saved. Continue token: ${continueToken ? continueToken.substring(0, 30) + '...' : 'none'}`);
}

// ============================================
// ПОЛУЧЕНИЕ БРОНЕЙ (ТОЛЬКО ИЗМЕНЁННЫЕ)
// ============================================
async function getModifiedBookings(lastSyncDate, continueToken = null) {
  const token = await getToken();
  const url = new URL(`https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`);
  
  // КЛЮЧЕВОЙ МОМЕНТ: запрашиваем только изменения с последней синхронизации
  if (lastSyncDate) {
    url.searchParams.set('lastModification', lastSyncDate);
    console.log(`📅 Requesting changes since: ${lastSyncDate}`);
  }
  
  if (continueToken) {
    url.searchParams.set('continueToken', continueToken);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

// ============================================
// ПОЛУЧЕНИЕ ДЕТАЛЕЙ БРОНИ
// ============================================
async function getBookingDetails(bookingNumber) {
  const token = await getToken();
  const response = await fetch(
    `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings/${bookingNumber}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get booking ${bookingNumber}: ${response.status}`);
  }
  
  const data = await response.json();
  return data.booking;
}

// ============================================
// МАППИНГ КОМНАТ (без изменений)
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
  console.log('🚀 TRAVELLINE INCREMENTAL SYNC v5.0');
  console.log('='.repeat(70));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));

  const stats = {
    pageCount: 0,
    totalThisRun: 0,
    saved: 0,
    cancelled: 0,
    modified: 0,
    errors: 0
  };

  try {
    await getToken();
    
    // Получаем информацию о последней синхронизации
    const { lastSync, continueToken } = getLastSyncInfo();
    
    if (!lastSync) {
      console.log('📅 First sync - will get recent bookings (last 30 days)');
    }

    let currentContinueToken = continueToken;
    let hasMore = true;

    while (hasMore && stats.pageCount < MAX_PAGES_PER_RUN) {
      stats.pageCount++;
      
      console.log(`\n📄 Page ${stats.pageCount}...`);
      
      const data = await getModifiedBookings(lastSync, currentContinueToken);
      const summaries = data.bookingSummaries || [];
      
      console.log(`   Received ${summaries.length} modified bookings`);

      if (summaries.length === 0) {
        console.log('   ✅ No changes since last sync');
        break;
      }

      stats.modified += summaries.length;

      for (const summary of summaries) {
        stats.totalThisRun++;
        process.stdout.write(`\n   [${stats.totalThisRun}] ${summary.number}... `);

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

          // Проверяем будущие даты
          let hasFuture = false;

          for (const roomStay of booking.roomStays || []) {
            const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
            if (!checkIn) continue;

            const checkInDate = new Date(checkIn);
            checkInDate.setHours(0, 0, 0, 0);
            
            if (checkInDate < today) continue;

            hasFuture = true;

            const roomTypeId = roomStay.roomType?.id;
            const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];

            if (!apartmentId) {
              console.log(`\n      ⚠️ No mapping for roomType ${roomTypeId}`);
              continue;
            }

            const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
            if (!checkOut) continue;

            // Удаляем старую запись и вставляем новую
            db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(summary.number);
            db.prepare(`
              INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
              VALUES (?, ?, ?, ?, ?)
            `).run(apartmentId, checkIn, checkOut, 'travelline', summary.number);

            console.log(`✅ ${apartmentId} (${checkIn} - ${checkOut})`);
            stats.saved++;
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

    console.log('\n' + '='.repeat(70));
    console.log('📊 RUN SUMMARY');
    console.log('='.repeat(70));
    console.log(`📋 Pages:              ${stats.pageCount}`);
    console.log(`📋 Modified bookings:   ${stats.modified}`);
    console.log(`✅ Saved (future):      ${stats.saved}`);
    console.log(`❌ Cancelled:           ${stats.cancelled}`);
    console.log(`💥 Errors:              ${stats.errors}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error);
    process.exit(1);
  }
}

// Запуск
syncBookings();