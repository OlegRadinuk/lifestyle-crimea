import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

console.log('🔄 Running migrations...');

// Добавляем поля для бронирований, если их нет
try {
  db.exec(`
    ALTER TABLE bookings ADD COLUMN manager_notes TEXT;
  `);
  console.log('✅ Added manager_notes column');
} catch (e) {
  console.log('ℹ️ manager_notes column already exists');
}

try {
  db.exec(`
    ALTER TABLE bookings ADD COLUMN prepaid_amount INTEGER DEFAULT 0;
  `);
  console.log('✅ Added prepaid_amount column');
} catch (e) {
  console.log('ℹ️ prepaid_amount column already exists');
}

try {
  db.exec(`
    ALTER TABLE bookings ADD COLUMN prepaid_status TEXT DEFAULT 'not_required';
  `);
  console.log('✅ Added prepaid_status column');
} catch (e) {
  console.log('ℹ️ prepaid_status column already exists');
}

try {
  db.exec(`
    ALTER TABLE bookings ADD COLUMN comment TEXT;
  `);
  console.log('✅ Added comment column');
} catch (e) {
  console.log('ℹ️ comment column already exists');
}

// Создаем таблицу для истории, если её нет
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_history (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Created booking_history table');
} catch (e) {
  console.log('ℹ️ booking_history table already exists');
}

console.log('✅ Migrations complete!');