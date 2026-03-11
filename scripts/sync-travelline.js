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

let token = null;
let tokenExpiry = 0;

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('✅ New token obtained');
  return token;
}

// ============================================
// ПОЛУЧЕНИЕ БРОНЕЙ (ТОЛЬКО БУДУЩИЕ)
// ============================================
async function getFutureBookings() {
  const token = await getToken();
  
  const url = new URL(`https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  url.searchParams.set('arrivalFrom', todayStr);

  console.log(`\n📅 Requesting bookings from ${todayStr}...`);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.status}`);
  }

  const data = await response.json();
  const allBookings = data.bookingSummaries || [];
  
  console.log(`📦 API returned ${allBookings.length} total bookings`);
  
  // ЖЕСТКИЙ ФИЛЬТР - проверяем дату заезда
  const futureBookings = allBookings.filter(summary => {
    // Из номера брони формат: 20240325-37777-260123396
    const parts = summary.number.split('-');
    if (parts.length >= 1 && parts[0].length === 8) {
      const year = parseInt(parts[0].substring(0, 4));
      const month = parseInt(parts[0].substring(4, 6)) - 1;
      const day = parseInt(parts[0].substring(6, 8));
      const bookingDate = new Date(year, month, day);
      
      // Нормализуем даты для сравнения
      bookingDate.setHours(0, 0, 0, 0);
      
      return bookingDate >= today;
    }
    return false;
  });
  
  console.log(`✅ After filtering: ${futureBookings.length} future bookings`);
  return futureBookings;
}

async function getBookingDetails(bookingNumber) {
  const token = await getToken();
  
  const response = await fetch(
    `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings/${bookingNumber}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to get details: ${response.status}`);
  }

  const data = await response.json();
  return data.booking;
}

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
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================
async function syncBookings() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TRAVELLINE SYNC (FUTURE ONLY)');
  console.log('='.repeat(70));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));

  const stats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Получаем ТОЛЬКО будущие брони
    const summaries = await getFutureBookings();
    
    if (summaries.length === 0) {
      console.log('\n✅ No future bookings found');
      return;
    }

    console.log(`\n📋 Processing ${summaries.length} future bookings...`);

    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      stats.total++;
      
      console.log(`\n[${i+1}/${summaries.length}] ${summary.number}...`);

      try {
        const booking = await getBookingDetails(summary.number);

        // Двойная проверка - пропускаем если дата заезда в прошлом
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let isFuture = false;
        for (const roomStay of booking.roomStays || []) {
          const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
          if (checkIn) {
            const checkInDate = new Date(checkIn);
            checkInDate.setHours(0, 0, 0, 0);
            if (checkInDate >= today) {
              isFuture = true;
              break;
            }
          }
        }

        if (!isFuture) {
          console.log(`   ⏭️  Skipping (past dates)`);
          stats.skipped++;
          continue;
        }

        if (booking.status === 'Cancelled') {
          const deleted = db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(summary.number);
          if (deleted.changes > 0) {
            console.log(`   ❌ Cancelled - removed`);
          }
          continue;
        }

        for (const roomStay of booking.roomStays || []) {
          const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
          const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
          
          if (!checkIn || !checkOut) continue;

          const roomTypeId = roomStay.roomType?.id;
          const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];

          if (!apartmentId) {
            console.log(`   ⚠️ No mapping for roomType ${roomTypeId}`);
            continue;
          }

          // Удаляем старую запись если есть
          db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(summary.number);

          // Сохраняем новую
          db.prepare(`
            INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
            VALUES (?, ?, ?, ?, ?)
          `).run(apartmentId, checkIn, checkOut, 'travelline', summary.number);

          console.log(`   ✅ Saved: ${apartmentId} (${checkIn} - ${checkOut})`);
          stats.saved++;
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        stats.errors++;
      }

      // Задержка между запросами
      if (i < summaries.length - 1) {
        await sleep(1000);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(70));
    console.log(`📋 Total future bookings: ${stats.total}`);
    console.log(`✅ Saved:                 ${stats.saved}`);
    console.log(`⏭️  Skipped (past):        ${stats.skipped}`);
    console.log(`💥 Errors:                ${stats.errors}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error);
  }
}

syncBookings();