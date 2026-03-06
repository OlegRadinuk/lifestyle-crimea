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
console.log('📂 Database path:', dbPath);
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
    const text = await response.text();
    throw new Error(`Auth failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('✅ Token obtained');
  return token;
}

async function getBookingsList() {
  const token = await getToken();
  console.log('\n📡 Fetching bookings list...');
  
  const response = await fetch(
    `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch bookings: ${response.status} - ${text}`);
  }

  const data = await response.json();
  console.log(`📊 Total bookings in response: ${data.bookingSummaries?.length || 0}`);
  return data.bookingSummaries || [];
}

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
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================
async function syncBookings() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TRAVELLINE SYNC STARTED');
  console.log('='.repeat(70));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  let savedCount = 0;
  let processedCount = 0;

  try {
    // Получаем список бронирований
    const bookings = await getBookingsList();
    
    if (bookings.length === 0) {
      console.log('\n❌ No bookings found!');
      return;
    }

    console.log(`\n📋 Processing first 20 bookings...\n`);

    // Обрабатываем первые 20
    for (let i = 0; i < Math.min(20, bookings.length); i++) {
      const summary = bookings[i];
      processedCount++;
      
      console.log('-'.repeat(50));
      console.log(`📌 Booking #${i+1}: ${summary.number}`);
      console.log(`   Modified: ${summary.modifiedDateTime}`);

      try {
        const booking = await getBookingDetails(summary.number);
        
        console.log(`   Status: ${booking.status}`);
        console.log(`   Created: ${booking.createdDateTime}`);
        
        // Сохраняем все, кроме отменённых
        if (booking.status !== 'Cancelled') {
          console.log(`   ✅ Active booking`);
          
          for (let j = 0; j < booking.roomStays.length; j++) {
            const roomStay = booking.roomStays[j];
            const roomTypeId = roomStay.roomType?.id;
            const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];
            
            console.log(`   🏨 Room ${j+1}: ID ${roomTypeId}`);
            console.log(`      Maps to: ${apartmentId || '❌ NOT MAPPED'}`);
            
            // ИСПРАВЛЕНО: берём даты из stayDates
            const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
            const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
            
            console.log(`      Check in: ${checkIn}`);
            console.log(`      Check out: ${checkOut}`);
            
            if (apartmentId && checkIn && checkOut) {
              // Проверяем, не сохраняли ли уже
              const existing = db.prepare('SELECT id FROM blocked_dates WHERE booking_number = ?').get(booking.number);
              
              if (!existing) {
                db.prepare(`
                  INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
                  VALUES (?, ?, ?, ?, ?)
                `).run(apartmentId, checkIn, checkOut, 'travelline', booking.number);
                
                console.log(`      ✅ SAVED: ${apartmentId} (${checkIn} - ${checkOut})`);
                savedCount++;
              } else {
                console.log(`      ⏩ Already exists in DB`);
              }
            }
          }
        } else {
          console.log(`   ❌ Cancelled booking - skipped`);
        }
      } catch (error) {
        console.log(`   ❌ Error getting details: ${error.message}`);
      }
    }

    // Логируем результат
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES (?, ?, ?, ?)
    `).run(
      'travelline', 
      new Date().toISOString(), 
      'success', 
      `Processed ${processedCount} bookings, saved ${savedCount} blocked dates`
    );

    console.log('\n' + '='.repeat(70));
    console.log(`✅ SYNC COMPLETED`);
    console.log(`📊 Processed: ${processedCount} bookings`);
    console.log(`💾 Saved: ${savedCount} blocked dates`);
    console.log('='.repeat(70));

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
