// scripts/sync-travelline.js
// Скрипт для синхронизации бронирований с Travelline
// Запуск: node scripts/sync-travelline.js

const { travellineService } = require('../lib/travelline');

async function run() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Travelline sync...');
  console.log('='.repeat(60));

  try {
    const count = await travellineService.syncBookings();
    console.log('\n✅ Sync completed successfully!');
    console.log(`📊 Blocked dates saved: ${count}`);
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

run();