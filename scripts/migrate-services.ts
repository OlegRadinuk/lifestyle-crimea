// scripts/migrate-services.ts
// Идемпотентная миграция таблицы пунктов страницы «Услуги».
// Безопасно запускать многократно (локально и на проде при деплое):
// создаёт таблицу/индекс только если их нет.
//
// Запуск: npx tsx scripts/migrate-services.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data.sqlite');
console.log('🛎  Running service_items migration...');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.log('📁 Database file does not exist, it will be created');
}

const db = new Database(dbPath);

try {
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS service_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_service_items_cat_order ON service_items(category, sort_order);
  `);

  // На случай старой формы таблицы — досоздаём недостающие колонки.
  const cols = (db.prepare('PRAGMA table_info(service_items)').all() as { name: string }[]).map((c) => c.name);
  const ensureCol = (name: string, ddl: string) => {
    if (!cols.includes(name)) {
      try { db.exec(`ALTER TABLE service_items ADD COLUMN ${ddl}`); console.log(`  + added column ${name}`); } catch { /* race-safe */ }
    }
  };
  ensureCol('icon', 'icon TEXT');
  ensureCol('sort_order', 'sort_order INTEGER NOT NULL DEFAULT 0');
  ensureCol('is_active', 'is_active INTEGER NOT NULL DEFAULT 1');

  const count = (db.prepare('SELECT COUNT(*) as c FROM service_items').get() as { c: number }).c;
  console.log(`✅ service_items table ready. Rows: ${count}`);
} catch (error) {
  console.error('❌ service_items migration failed:', error);
  process.exitCode = 1;
} finally {
  db.close();
}
