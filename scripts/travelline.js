// scripts/travelline.js
// УНИВЕРСАЛЬНЫЙ СКРИПТ ДЛЯ TRAVELLINE
// Запуск: node scripts/travelline.js mapping|bookings

const TRAVELLINE_CLIENT_ID = 'api_connection_cd609_643b0e0b30';
const TRAVELLINE_CLIENT_SECRET = 'ohuU3N07mqvSEdHufhpktuqdlXCV5A5I';
const TRAVELLINE_PROPERTY_ID = '37777';

let token = null;
let tokenExpiry = 0;

// --- ПОЛУЧЕНИЕ ТОКЕНА ---
async function getToken() {
  if (token && Date.now() < tokenExpiry) {
    return token;
  }

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
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('✅ Token OK');
  return token;
}

// --- ПОЛУЧЕНИЕ ТИПОВ КОМНАТ ---
async function getRoomTypes() {
  const token = await getToken();
  const response = await fetch(
    `https://partner.tlintegration.com/api/content/v1/properties/${TRAVELLINE_PROPERTY_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to get room types: ${response.status}`);
  }

  const data = await response.json();
  return data.roomTypes || [];
}

// --- ПОЛУЧЕНИЕ БРОНИРОВАНИЙ ---
async function getBookings() {
  const token = await getToken();
  const response = await fetch(
    `https://partner.tlintegration.com/api/read-reservation/v1/properties/${TRAVELLINE_PROPERTY_ID}/bookings`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to get bookings: ${response.status}`);
  }

  return response.json();
}

// --- ПОЛУЧЕНИЕ ДЕТАЛЕЙ БРОНИ ---
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

// --- РЕЖИМ 1: Показать маппинг комнат (ПОЛНЫЙ СПИСОК) ---
async function showMapping() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 РЕЖИМ 1: Получение маппинга комнат');
  console.log('='.repeat(80));

  const roomTypes = await getRoomTypes();
  console.log(`\n📋 Найдено ${roomTypes.length} типов комнат\n`);
  
  console.log('ВСЕ КОМНАТЫ ИЗ TRAVELLINE:\n');
  console.log('ID Travelline | Название');
  console.log('-'.repeat(80));

  roomTypes.forEach((rt, index) => {
    const cleanName = rt.name
      .replace(/Дизайнерская студия /g, '')
      .replace(/Апартаменты с отдельной спальней /g, '')
      .replace(/в Алуште.*$/g, '')
      .trim();
    
    console.log(`${String(index+1).padStart(2)}. ${rt.id.padEnd(12)} | ${cleanName.substring(0, 50)}`);
  });

  console.log('='.repeat(80));
  
  // Поиск наших апартаментов
  console.log('\n🔍 ПОИСК СООТВЕТСТВИЙ:\n');
  
  const ourApartments = [
    { id: 'ls-space', keywords: ['SPACE'] },
    { id: 'ls-coffee-ice-cream', keywords: ['COFFEE', 'ICE CREAM'] },
    { id: 'ls-summer-emotions', keywords: ['SUMMER EMOTIONS'] },
    { id: 'ls-black-strong', keywords: ['BLACK STRONG'] },
    { id: 'ls-deep-music', keywords: ['DEEP MUSIC'] },
    { id: 'ls-dream-vacation', keywords: ['DREAM VACATION'] },
    { id: 'ls-econom-studio', keywords: ['ECONOM'] },
    { id: 'ls-family-comfort', keywords: ['FAMILY COMFORT'] },
    { id: 'ls-in-the-moment', keywords: ['IN THE MOMENT'] },
    { id: 'ls-lux-flower-kiss', keywords: ['FLOWER KISS'] },
    { id: 'ls-relax-time', keywords: ['RELAX TIME'] },
    { id: 'ls-sweet-summer', keywords: ['SWEET SUMMER'] },
    { id: 'ls-comfort-home', keywords: ['COMFORT HOME'] },
    { id: 'ls-lux-sweet-caramel', keywords: ['SWEET CARAMEL'] },
    { id: 'ls-steel-love', keywords: ['STEEL LOVE'] },
    { id: 'ls-art-crystal-blue', keywords: ['CRYSTAL BLUE'] },
    { id: 'ls-art-olive', keywords: ['OLIVE'] },
    { id: 'ls-blue-curacao', keywords: ['BLUE CURACAO'] },
    { id: 'ls-blueberry', keywords: ['BLUEBERRY'] },
    { id: 'ls-cool-lemonade', keywords: ['LEMONADE'] },
    { id: 'ls-green', keywords: ['GREEN'] },
    { id: 'ls-hi-tech-emotion', keywords: ['HI-TECH EMOTION'] },
    { id: 'ls-hi-tech-relax', keywords: ['HI-TECH RELAX'] },
    { id: 'ls-lux-only-you', keywords: ['ONLY YOU'] },
    { id: 'ls-lux-fly-sky', keywords: ['FLY SKY'] },
    { id: 'ls-lux-beautiful-days', keywords: ['BEAUTIFUL DAYS'] },
    { id: 'ls-lux-fly-mood', keywords: ['FLY MOOD'] },
    { id: 'ls-lux-sun-rays', keywords: ['SUN RAYS'] },
    { id: 'ls-lux-sunny-mood', keywords: ['SUNNY MOOD'] },
    { id: 'ls-lux-fly-blue-light', keywords: ['FLY BLUE LIGHT'] },
    { id: 'ls-diamond-green', keywords: ['DIAMOND GREEN'] },
    { id: 'ls-mountain-retreat', keywords: ['MOUNTAIN RETREAT'] },
    { id: 'ls-wine-and-sunset', keywords: ['WINE', 'SUNSET'] },
    { id: 'ls-lux-white-sands', keywords: ['WHITE SANDS'] },
    { id: 'ls-lux-orange', keywords: ['ORANGE'] },
    { id: 'ls-lux-soft-blue', keywords: ['SOFT BLUE'] },
    { id: 'ls-lux-fly-birds', keywords: ['FLY BIRDS'] },
    { id: 'ls-deep-forest', keywords: ['DEEP FOREST'] },
    { id: 'ls-flowers-tea', keywords: ['FLOWERS TEA'] }
  ];

  ourApartments.forEach(apt => {
    console.log(`\n🔹 ${apt.id}:`);
    
    apt.keywords.forEach(keyword => {
      const matches = roomTypes.filter(rt => 
        rt.name.toUpperCase().includes(keyword)
      );
      
      matches.forEach(rt => {
        console.log(`   ➜ ${rt.id} - ${rt.name.substring(0, 60)}`);
      });
    });
  });

  console.log('\n' + '='.repeat(80));
}

// --- РЕЖИМ 2: Показать последние бронирования ---
async function showBookings() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 РЕЖИМ 2: Последние бронирования');
  console.log('='.repeat(80));

  const data = await getBookings();
  console.log(`\n📊 Всего бронирований в ответе: ${data.bookingSummaries?.length || 0}`);
  
  if (data.bookingSummaries?.length > 0) {
    console.log('\n📅 Последние 10 бронирований:\n');
    
    for (let i = 0; i < Math.min(10, data.bookingSummaries.length); i++) {
      const summary = data.bookingSummaries[i];
      console.log(`${i+1}. Номер: ${summary.number}`);
      console.log(`   Изменено: ${summary.modifiedDateTime}`);
      
      // Получаем детали
      try {
        const details = await getBookingDetails(summary.number);
        console.log(`   Статус: ${details.status}`);
        console.log(`   Комнат: ${details.roomStays?.length || 0}`);
        
        details.roomStays?.forEach((rs, idx) => {
          console.log(`   🏨 Комната ${idx+1}: ID ${rs.roomType.id}`);
          console.log(`      Заезд: ${rs.arrivalDateTime?.split('T')[0] || 'нет'}`);
          console.log(`      Выезд: ${rs.departureDateTime?.split('T')[0] || 'нет'}`);
        });
      } catch (e) {
        console.log(`   ❌ Ошибка: ${e.message}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(80));
}

// --- ЗАПУСК ---
async function main() {
  const mode = process.argv[2] || 'help';
  
  if (mode === 'mapping') {
    await showMapping();
  } else if (mode === 'bookings') {
    await showBookings();
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 TRAVELLINE УНИВЕРСАЛЬНЫЙ СКРИПТ');
    console.log('='.repeat(60));
    console.log('\nИспользование:');
    console.log('  node scripts/travelline.js mapping    - показать ВСЕ комнаты и найти соответствия');
    console.log('  node scripts/travelline.js bookings   - показать последние бронирования');
    console.log('');
  }
}

main().catch(console.error);
