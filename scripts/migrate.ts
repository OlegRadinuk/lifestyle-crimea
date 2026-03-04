import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data.sqlite');
console.log('🔄 Running full migration...');
console.log('Database path:', dbPath);

// Проверяем существует ли файл БД
if (!fs.existsSync(dbPath)) {
  console.log('📁 Database file does not exist, it will be created');
}

const db = new Database(dbPath);

try {
  // Включаем внешние ключи
  db.pragma('foreign_keys = ON');

  // Проверяем структуру apartments
  console.log('\n🏠 Checking apartments table...');
  const apartmentTableInfo = db.prepare("PRAGMA table_info(apartments)").all() as any[];
  const apartmentColumns = apartmentTableInfo.map(col => col.name);
  console.log('Current apartments columns:', apartmentColumns);

  // Добавляем все недостающие колонки в apartments
  const requiredApartmentColumns = [
    { name: 'short_description', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'area', type: 'INTEGER' },
    { name: 'view', type: "TEXT DEFAULT 'sea'" },
    { name: 'has_terrace', type: 'INTEGER DEFAULT 0' },
    { name: 'is_active', type: 'INTEGER DEFAULT 1' },
    { name: 'features', type: 'TEXT DEFAULT \'[]\'' },
    { name: 'images', type: 'TEXT DEFAULT \'[]\'' },
  ];

  requiredApartmentColumns.forEach(col => {
    if (!apartmentColumns.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE apartments ADD COLUMN ${col.name} ${col.type};`);
        console.log(`✅ Added column to apartments: ${col.name}`);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error(`❌ Failed to add ${col.name} to apartments:`, e.message);
        }
      }
    }
  });

  // Проверяем структуру bookings
  console.log('\n📅 Checking bookings table...');
  const bookingTableInfo = db.prepare("PRAGMA table_info(bookings)").all() as any[];
  const bookingColumns = bookingTableInfo.map(col => col.name);
  console.log('Current bookings columns:', bookingColumns);

  // Добавляем колонки в bookings
  const requiredBookingColumns = [
    { name: 'manager_notes', type: 'TEXT' },
    { name: 'prepaid_amount', type: 'INTEGER DEFAULT 0' },
    { name: 'prepaid_status', type: "TEXT DEFAULT 'not_required'" },
    { name: 'comment', type: 'TEXT' },
    { name: 'external_id', type: 'TEXT' },
  ];

  requiredBookingColumns.forEach(col => {
    if (!bookingColumns.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type};`);
        console.log(`✅ Added column to bookings: ${col.name}`);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error(`❌ Failed to add ${col.name} to bookings:`, e.message);
        }
      }
    }
  });

  // Обновляем значения по умолчанию для существующих записей
  console.log('\n🔄 Updating default values...');
  
  db.exec(`
    UPDATE apartments SET 
      features = COALESCE(features, '[]'),
      images = COALESCE(images, '[]'),
      view = COALESCE(view, 'sea'),
      has_terrace = COALESCE(has_terrace, 0),
      is_active = COALESCE(is_active, 1)
    WHERE features IS NULL OR images IS NULL OR view IS NULL;
  `);

  db.exec(`
    UPDATE bookings SET 
      prepaid_amount = COALESCE(prepaid_amount, 0),
      prepaid_status = COALESCE(prepaid_status, 'not_required'),
      manager_notes = COALESCE(manager_notes, '')
    WHERE prepaid_amount IS NULL OR prepaid_status IS NULL;
  `);

  console.log('✅ Migration completed successfully!');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}