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
const MAX_PAGES = 50; // Максимум страниц для защиты
const RATE_LIMIT_DELAY = 1000; // 1 секунда между запросами при 429

// ============================================
// МАППИНГ ID КОМНАТ
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
// ПОДКЛЮЧЕНИЕ К БД
// ============================================
const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);

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

async function getToken() {
  if (token && Date.now() < tokenExpiry) return token;

  console.log('\n🔑 Getting token...');
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
  console.log('✅ Token OK');
  return token;
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const wait = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_DELAY * (i + 1);
        console.log(`⏳ Rate limited, waiting ${wait}ms...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`⏳ Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }
  throw new Error('Max retries exceeded');
}

async function getBookingDetails(bookingNumber) {
  const token = await getToken();
  const response = await fetchWithRetry(
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
// ОСНОВНАЯ ФУНКЦИЯ СИНХРОНИЗАЦИИ
// ============================================
async function syncBookings() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TRAVELLINE SYNC STARTED');
  console.log('='.repeat(70));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  let stats = {
    total: 0,
    processed: 0,
    saved: 0,
    cancelled: 0,
    noMapping: 0,
    errors: 0
  };

  const allBookingNumbers = new Set();
  const processedBookings = new Set();

  try {
    const token = await getToken();
    let continueToken = null;
    let page = 0;
    let hasMore = true;

    // ===== СБОР ВСЕХ НОМЕРОВ БРОНЕЙ =====
    console.log('\n📡 Collecting booking numbers...');
    
    while (hasMore && page < MAX_PAGES) {
      page++;
      const url = new URL(`https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`);
      
      if (continueToken) {
        url.searchParams.set('continueToken', continueToken);
      }

      const response = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      
      for (const summary of data.bookingSummaries || []) {
        allBookingNumbers.add(summary.number);
      }

      console.log(`📄 Page ${page}: +${data.bookingSummaries?.length || 0} bookings (total: ${allBookingNumbers.size})`);
      
      continueToken = data.continueToken;
      hasMore = data.hasMoreData;
    }

    stats.total = allBookingNumbers.size;
    console.log(`\n📊 Total unique bookings: ${stats.total}`);

    // ===== ОБРАБОТКА КАЖДОЙ БРОНИ =====
    console.log('\n📋 Processing bookings...');
    
    for (const number of allBookingNumbers) {
      stats.processed++;
      
      try {
        const booking = await getBookingDetails(number);
        
        // Если бронь отменена — удаляем из БД
        if (booking.status === 'Cancelled') {
          const deleted = db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(number);
          if (deleted.changes > 0) {
            console.log(`❌ Cancelled: ${number} (removed from DB)`);
          }
          stats.cancelled++;
          continue;
        }
        
        // Проверяем будущие даты
        const today = new Date().toISOString().split('T')[0];
        let hasFuture = false;
        
        for (const roomStay of booking.roomStays || []) {
          const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
          if (checkIn && checkIn >= today) {
            hasFuture = true;
            break;
          }
        }
        
        if (!hasFuture) continue;
        
        // Обрабатываем комнаты
        for (const roomStay of booking.roomStays || []) {
          const roomTypeId = roomStay.roomType?.id;
          const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];
          const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
          const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
          
          if (!apartmentId) {
            if (!processedBookings.has(number)) {
              console.log(`⚠️ No mapping for ${number} - roomTypeId: ${roomTypeId}`);
              processedBookings.add(number);
              stats.noMapping++;
            }
            continue;
          }
          
          if (checkIn && checkOut) {
            const existing = db.prepare('SELECT id FROM blocked_dates WHERE booking_number = ?').get(number);
            
            if (!existing) {
              db.prepare(`
                INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
                VALUES (?, ?, ?, ?, ?)
              `).run(apartmentId, checkIn, checkOut, 'travelline', number);
              
              if (!processedBookings.has(number)) {
                console.log(`✅ Saved: ${number} (${apartmentId}: ${checkIn} - ${checkOut})`);
                processedBookings.add(number);
                stats.saved++;
              }
            }
          }
        }
      } catch (error) {
        if (!error.message.includes('429')) { // Игнорируем rate limit ошибки
          console.log(`❌ Error ${number}: ${error.message}`);
        }
        stats.errors++;
      }
      
      // Небольшая задержка чтобы не нагружать API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // ===== ИТОГИ =====
    console.log('\n' + '='.repeat(70));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(70));
    console.log(`📋 Total bookings:     ${stats.total}`);
    console.log(`✅ Saved new:          ${stats.saved}`);
    console.log(`❌ Cancelled:          ${stats.cancelled}`);
    console.log(`⚠️ No mapping:         ${stats.noMapping}`);
    console.log(`💥 Errors:             ${stats.errors}`);
    console.log('='.repeat(70));

    // Логируем результат
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES (?, ?, ?, ?)
    `).run(
      'travelline', 
      new Date().toISOString(), 
      'success', 
      `Total:${stats.total}, Saved:${stats.saved}, Cancelled:${stats.cancelled}, NoMap:${stats.noMapping}, Errors:${stats.errors}`
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

// ============================================
// ЗАПУСК
// ============================================
syncBookings();
