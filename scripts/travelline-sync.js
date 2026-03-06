import { travellineService } from '../lib/travelline';
import { db } from '../lib/db';

async function run() {
  console.log('🔄 Running Travelline sync at', new Date().toISOString());
  
  try {
    const count = await travellineService.syncBookings();
    console.log(`✅ Sync completed: ${count} bookings processed`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    
    try {
      db.prepare(`
        INSERT INTO sync_log (source, last_sync, status, message)
        VALUES (?, ?, ?, ?)
      `).run('travelline', new Date().toISOString(), 'error', error instanceof Error ? error.message : String(error));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
    
    process.exit(1);
  }
}

run();