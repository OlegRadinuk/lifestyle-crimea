// scripts/migrate-news.ts
// Идемпотентная миграция таблицы новостей. Безопасно запускать многократно
// (локально и на проде при деплое): создаёт таблицу/индексы только если их нет.
//
// Запуск: npx tsx scripts/migrate-news.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data.sqlite');
console.log('🗞  Running news migration...');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.log('📁 Database file does not exist, it will be created');
}

const db = new Database(dbPath);

try {
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      cover_image TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
    CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at);
  `);

  // На случай, если таблица существовала в более старой форме — досоздаём колонки.
  const cols = (db.prepare('PRAGMA table_info(news)').all() as { name: string }[]).map((c) => c.name);
  const ensureCol = (name: string, ddl: string) => {
    if (!cols.includes(name)) {
      try { db.exec(`ALTER TABLE news ADD COLUMN ${ddl}`); console.log(`  + added column ${name}`); } catch { /* race-safe */ }
    }
  };
  ensureCol('excerpt', 'excerpt TEXT');
  ensureCol('content', 'content TEXT');
  ensureCol('cover_image', 'cover_image TEXT');
  ensureCol('is_published', 'is_published INTEGER NOT NULL DEFAULT 0');
  ensureCol('is_featured', 'is_featured INTEGER NOT NULL DEFAULT 0');
  ensureCol('sort_order', 'sort_order INTEGER NOT NULL DEFAULT 0');
  ensureCol('published_at', 'published_at DATETIME');

  const count = (db.prepare('SELECT COUNT(*) as c FROM news').get() as { c: number }).c;
  console.log(`✅ news table ready. Rows: ${count}`);
} catch (error) {
  console.error('❌ news migration failed:', error);
  process.exitCode = 1;
} finally {
  db.close();
}
