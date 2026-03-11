#!/usr/bin/env node

// scripts/sync-travelline.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const TRAVELLINE_CLIENT_ID = 'api_connection_cd609_643b0e0b30';
const TRAVELLINE_CLIENT_SECRET = 'ohuU3N07mqvSEdHufhpktuqdlXCV5A5I';
const TRAVELLINE_PROPERTY_ID = '37777';

const REQUEST_DELAY_MS = 1000;        // 1 сек между запросами
const MAX_PAGES_PER_RUN = 20;         // 20 страниц за запуск
const STATE_FILE = path.join(__dirname, '..', 'travelline-state.json');
const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

// ============================================
// СОСТОЯНИЕ СИНХРОНИЗАЦИИ
// ============================================
let token = null;
let tokenExpiry = 0;
let syncState = {
  continueToken: null,
  totalProcessed: 0,
  lastRun: null,
  isComplete: false,
  found2026: false,           // Новый флаг - нашли ли уже 2026 год
  first2026Token: null        // Токен первой брони 2026 года
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      console.log(`📊 Loaded state: processed=${state.totalProcessed}, complete=${state.isComplete}, found2026=${state.found2026 || false}`);
      return state;
    }
  } catch (e) {
    console.log('ℹ️ No valid state file, starting fresh');
  }
  return { 
    continueToken: null, 
    totalProcessed: 0, 
    lastRun: null,
    isComplete: false,
    found2026: false,
    first2026Token: null
  };
}

function saveState(state) {
  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ============================================
// РАБОТА С ТОКЕНОМ
// ============================================
async function getToken(force = false) {
  if (!force && token && Date.now() < tokenExpiry - 120000) {
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
// ВСПОМОГАТЕЛЬНЫЕ
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await sleep(REQUEST_DELAY_MS);
      
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        console.log('⚠️ Token expired, refreshing...');
        options.headers.Authorization = `Bearer ${await getToken(true)}`;
        continue;
      }
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const wait = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        console.log(`⏳ Rate limited, waiting ${wait/1000}s...`);
        await sleep(wait);
        continue;
      }
      
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`⏳ Retry ${i+1}/${retries}...`);
      await sleep(10000);
    }
  }
  throw new Error('Max retries exceeded');
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
  
  const data = await response.json();
  return data.booking;
}

// ============================================
// МАППИНГ КОМНАТ
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
  '368602': 'ls-lux-sweet-caramel',
};

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================
async function syncBookings() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TRAVELLINE PRODUCTION SYNC v4.0 (2026 SEEKER)');
  console.log('='.repeat(70));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));

  // Загружаем состояние
  syncState = loadState();
  
  // Если уже нашли 2026 год - начинаем сразу оттуда
  if (syncState.found2026 && syncState.first2026Token) {
    console.log(`🎯 Already found 2026! Starting from token: ${syncState.first2026Token.substring(0, 30)}...`);
    syncState.continueToken = syncState.first2026Token;
    syncState.totalProcessed = 0; // Обнуляем счетчик для 2026
    syncState.isComplete = false;
  }
  // Если синхронизация завершена, но 2026 ещё не нашли - начинаем поиск
  else if (syncState.isComplete && !syncState.found2026) {
    console.log('🔍 Previous sync completed, searching for 2026 bookings...');
    syncState.continueToken = null;
    syncState.totalProcessed = 0;
    syncState.isComplete = false;
  }

  const db = new Database(DB_PATH);
  
  const stats = {
    pageCount: 0,
    totalThisRun: 0,
    saved: 0,
    cancelled: 0,
    skippedPast: 0,
    noMapping: 0,
    errors: 0,
  };

  try {
    await getToken();
    let continueToken = syncState.continueToken;
    let hasMore = true;

    console.log(`\n📡 Continue token: ${continueToken ? continueToken.substring(0, 30) + '...' : 'start'}`);

    while (hasMore && stats.pageCount < MAX_PAGES_PER_RUN) {
      stats.pageCount++;
      
      const url = new URL(`https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`);
      url.searchParams.set('count', '1000');
      
      if (continueToken) {
        url.searchParams.set('continueToken', continueToken);
      }

      console.log(`\n📄 Page ${stats.pageCount} requesting...`);
      
      const response = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      const summaries = data.bookingSummaries || [];
      
      console.log(`   Got ${summaries.length} bookings`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < summaries.length; i++) {
        const summary = summaries[i];
        stats.totalThisRun++;
        const currentNumber = syncState.totalProcessed + stats.totalThisRun;

        process.stdout.write(`\n   [${currentNumber}] ${summary.number}... `);

        // === ВАЖНО: Проверяем, не нашли ли мы 2026 год ===
        if (!syncState.found2026 && summary.number.startsWith('2026')) {
          console.log(`\n   🎉🎉🎉 FOUND FIRST 2026 BOOKING! 🎉🎉🎉`);
          console.log(`   Booking: ${summary.number}`);
          console.log(`   Current token: ${continueToken}`);
          
          // Сохраняем токен первой брони 2026 года
          syncState.found2026 = true;
          syncState.first2026Token = continueToken;
          syncState.continueToken = continueToken;
          syncState.totalProcessed = currentNumber;
          saveState(syncState);
          
          console.log(`   💾 Token saved! Next runs will start from 2026.`);
          
          // Завершаем этот запуск, чтобы не тратить лимиты
          hasMore = false;
          break;
        }

        try {
          const booking = await getBookingDetails(summary.number);

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
              stats.noMapping++;
              continue;
            }

            const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
            if (!checkOut) continue;

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
            stats.skippedPast++;
          }

        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          stats.errors++;
        }

        await sleep(REQUEST_DELAY_MS);
      }

      continueToken = data.continueToken;
      hasMore = data.hasMoreData;

      // Сохраняем прогресс (но не перезаписываем found2026)
      if (!syncState.found2026) {
        syncState.continueToken = continueToken;
        syncState.totalProcessed += summaries.length;
        syncState.isComplete = !hasMore;
        saveState(syncState);
      }
      
      console.log(`\n📊 Progress saved. Total processed: ${syncState.totalProcessed}`);
      
      // Если нашли 2026 - выходим
      if (syncState.found2026) {
        console.log(`\n🎯 Found 2026, stopping this run. Next runs will start from 2026.`);
        break;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RUN SUMMARY');
    console.log('='.repeat(70));
    console.log(`📋 Pages this run:     ${stats.pageCount}`);
    console.log(`📋 Bookings this run:  ${stats.totalThisRun}`);
    console.log(`✅ Saved (future):      ${stats.saved}`);
    console.log(`❌ Cancelled:           ${stats.cancelled}`);
    console.log(`⏭️  Skipped (past):      ${stats.skippedPast}`);
    console.log(`⚠️ No mapping:          ${stats.noMapping}`);
    console.log(`💥 Errors:              ${stats.errors}`);
    console.log('='.repeat(70));
    
    if (syncState.found2026) {
      console.log(`\n🎉🎉🎉 SUCCESS: Found 2026 bookings! Future runs will start from 2026. 🎉🎉🎉`);
    } else if (hasMore) {
      console.log(`\n⏸️  Paused. Next run will continue from token.`);
    } else {
      console.log(`\n🎉 ALL BOOKINGS SYNCED! Total: ${syncState.totalProcessed}`);
    }

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error);
    process.exit(1);
  }
}

// Запуск
syncBookings();