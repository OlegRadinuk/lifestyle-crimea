// scripts/sync-travelline.js
// Запуск: node scripts/sync-travelline.js

const { travellineService } = require('../lib/travelline');

async function run() {
  console.log('='.repeat(60));
  console.log('🚀 Travelline Sync Script Started');
  console.log('='.repeat(60));
  
  try {
    const count = await travellineService.syncBookings();
    console.log(`\n✅ Script completed: ${count} blocked dates saved`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

run();