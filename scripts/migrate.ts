import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

console.log('🔄 Running full migration...');

// Добавляем все недостающие колонки в apartments
const apartmentColumns = [
  { name: 'short_description', type: 'TEXT' },
  { name: 'description', type: 'TEXT' },
  { name: 'area', type: 'INTEGER' },
  { name: 'view', type: "TEXT DEFAULT 'sea'" },
  { name: 'has_terrace', type: 'INTEGER DEFAULT 0' },
  { name: 'is_active', type: 'INTEGER DEFAULT 1' },
  { name: 'features', type: 'TEXT' },
  { name: 'images', type: 'TEXT' },
];

// Проверяем существующие колонки
const tableInfo = db.prepare("PRAGMA table_info(apartments)").all() as any[];
const existingColumns = tableInfo.map(col => col.name);

console.log('Existing columns:', existingColumns);

// Добавляем колонки
apartmentColumns.forEach(col => {
  if (!existingColumns.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE apartments ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Added column: ${col.name}`);
    } catch (e) {
      console.log(`❌ Failed to add ${col.name}:`, e);
    }
  } else {
    console.log(`ℹ️ Column ${col.name} already exists`);
  }
});

// Добавляем колонки в bookings
const bookingColumns = [
  { name: 'manager_notes', type: 'TEXT' },
  { name: 'prepaid_amount', type: 'INTEGER DEFAULT 0' },
  { name: 'prepaid_status', type: "TEXT DEFAULT 'not_required'" },
  { name: 'comment', type: 'TEXT' },
];

bookingColumns.forEach(col => {
  if (!existingColumns.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Added column to bookings: ${col.name}`);
    } catch (e) {
      console.log(`❌ Failed to add ${col.name} to bookings:`, e);
    }
  }
});

console.log('✅ Full migration complete!');