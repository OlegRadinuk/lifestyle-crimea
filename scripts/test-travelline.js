// scripts/test-travelline.js
// Финальный тест с правильным URL для Reservation API

const TRAVELLINE_CLIENT_ID = 'api_connection_cd609_643b0e0b30';
const TRAVELLINE_CLIENT_SECRET = 'ohuU3N07mqvSEdHufhpktuqdlXCV5A5I';
const TRAVELLINE_PROPERTY_ID = '37777';

// --- ПОЛУЧЕНИЕ ТОКЕНА ---
async function getToken() {
  console.log('🔑 Getting token...');
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
    throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Token obtained');
  return data.access_token;
}

// --- ТЕСТ CONTENT API (для проверки токена) ---
async function testContentApi() {
  console.log('\n📋 TEST 1: CONTENT API - Property Info');
  console.log('-'.repeat(40));

  const token = await getToken();
  const url = `https://partner.tlintegration.com/api/content/v1/properties/${TRAVELLINE_PROPERTY_ID}`;
  console.log(`📡 GET ${url}`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Content API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  console.log('✅ Property Info:');
  console.log(`  Name: ${data.name}`);
  console.log(`  Currency: ${data.currency}`);
  console.log(`  Room types: ${data.roomTypes?.length || 0}`);
  
  return data;
}

// --- ТЕСТ RESERVATION API (НОВЫЙ URL) ---
async function testReservationApi() {
  console.log('\n📋 TEST 2: RESERVATION API - Bookings');
  console.log('-'.repeat(40));

  const token = await getToken();
  // ИСПОЛЬЗУЕМ НОВЫЙ ПРАВИЛЬНЫЙ URL
  const url = `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`;
  console.log(`📡 GET ${url}`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  const text = await response.text();
  console.log(`   Response preview: ${text.substring(0, 200)}`);
  
  if (response.ok) {
    try {
      const data = JSON.parse(text);
      console.log('\n✅ SUCCESS! Bookings received:');
      console.log(`  Continue token: ${data.continueToken}`);
      console.log(`  Has more data: ${data.hasMoreData}`);
      console.log(`  Bookings count: ${data.bookingSummaries?.length || 0}`);
      
      if (data.bookingSummaries?.length > 0) {
        console.log('\n  📅 First 3 bookings:');
        data.bookingSummaries.slice(0, 3).forEach((b, i) => {
          console.log(`    ${i+1}. ${b.number} (modified: ${b.modifiedDateTime})`);
        });
      }
      return data;
    } catch (e) {
      console.log('❌ Response is not JSON:', e.message);
    }
  } else {
    console.log('❌ Reservation API failed with status', response.status);
  }
}

// --- ЗАПУСК ---
async function run() {
  console.log('='.repeat(60));
  console.log('🚀 Travelline API Final Test');
  console.log('='.repeat(60));
  console.log(`Property ID: ${TRAVELLINE_PROPERTY_ID}`);
  console.log(`Client ID: ${TRAVELLINE_CLIENT_ID}`);
  console.log('='.repeat(60));

  try {
    // Тест Content API (должен работать)
    await testContentApi();

    // Тест Reservation API с новым URL
    await testReservationApi();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests completed');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

run();
