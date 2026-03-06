// scripts/update-room-mapping.js
// Запуск: node scripts/update-room-mapping.js

const { travellineService } = require('../lib/travelline');

async function generateMapping() {
  console.log('🔍 Fetching room types from Travelline...');
  
  try {
    const roomTypes = await travellineService.getRoomTypes();
    
    console.log(`\n📋 Found ${roomTypes.length} room types`);
    console.log('\n=== ROOM TYPE MAPPING ===');
    console.log('Добавь это в lib/travelline.ts в объект ROOM_TYPE_MAPPING:\n');
    
    roomTypes.forEach((rt, index) => {
      // Очищаем название от лишнего
      const cleanName = rt.name
        .replace(/Дизайнерская студия /g, '')
        .replace(/в Алуште.*$/g, '')
        .trim();
      
      console.log(`  // ${cleanName}`);
      console.log(`  '${rt.id}': 'TODO', // нужно сопоставить с ID из apartments.ts`);
      
      if (index < 5) {
        console.log(`  // Пример названия: ${rt.name.substring(0, 60)}...\n`);
      }
    });
    
    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Скопируй эти ID в lib/travelline.ts');
    console.log('2. Для каждого ID укажи соответствующий apartment_id из apartments.ts');
    console.log('3. Например: \'244430\': \'ls-art-crystal-blue\',\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateMapping();