// scripts/seed-services.mjs
// Идемпотентный сид пунктов страницы «Услуги».
// Кладёт ТОЛЬКО реальные пункты как редактируемые черновики:
//   - apartment      — реальные удобства в апартаментах
//   - infrastructure — реальная инфраструктура комплекса (из брифа клиента)
//   - service        — НЕ сидится (менеджер сам добавит реальные услуги)
//
// Идемпотентность: пункт не дублируется, если в этой же категории уже есть
// запись с тем же title. Существующие записи не трогаются (можно редактировать).
//
// Запуск: node scripts/seed-services.mjs
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const dbPath = path.join(process.cwd(), 'data.sqlite');
console.log('🌱 Seeding service_items...');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Гарантируем наличие таблицы (на случай запуска до миграции)
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

// Только реальные пункты. service — пусто намеренно.
const seed = {
  apartment: [
    { title: 'Балкон для созерцаний', icon: 'balcony' },
    { title: 'Душевая кабина или ванна', icon: 'shower' },
    { title: 'Смарт-ТВ', icon: 'tv' },
    { title: 'Кондиционер', icon: 'ac' },
    { title: 'Холодильник', icon: 'fridge' },
    { title: 'Чайник', icon: 'kettle' },
    { title: 'Индукционная плита', icon: 'induction' },
    { title: 'Кофеварка', icon: 'coffee' },
    { title: 'Интернет / Wi-Fi', icon: 'wifi' },
  ],
  infrastructure: [
    { title: 'Апартаменты в лёгкой прогулке от моря', icon: 'sea-walk' },
    { title: 'Зоны отдыха и лаундж', icon: 'lounge' },
    { title: 'Мангальная зона', icon: 'bbq' },
    { title: 'Открытая спортплощадка', icon: 'sport' },
    { title: 'Детская площадка', icon: 'playground' },
    { title: 'Подземный паркинг', icon: 'parking' },
    { title: 'Кофейня «Эндорфин»', icon: 'store' },
    { title: 'Магазин «Прованс»', icon: 'store' },
    { title: 'Магазин косметики «Дом Изобилия»', icon: 'cosmetics' },
    { title: 'Открытый бассейн', icon: 'pool' },
    { title: 'Беседки для чтения', icon: 'gazebo' },
  ],
  // service: намеренно пусто — менеджер добавит реальные услуги сам.
};

const existsStmt = db.prepare('SELECT id FROM service_items WHERE category = ? AND title = ?');
const insertStmt = db.prepare(`
  INSERT INTO service_items (id, category, title, icon, sort_order, is_active)
  VALUES (?, ?, ?, ?, ?, 1)
`);

let inserted = 0;
let skipped = 0;

const tx = db.transaction(() => {
  for (const [category, items] of Object.entries(seed)) {
    items.forEach((item, index) => {
      const existing = existsStmt.get(category, item.title);
      if (existing) {
        skipped += 1;
        return;
      }
      insertStmt.run(randomUUID(), category, item.title, item.icon ?? null, index + 1);
      inserted += 1;
    });
  }
});

tx();

const total = db.prepare('SELECT COUNT(*) as c FROM service_items').get().c;
console.log(`✅ Seed done. Inserted: ${inserted}, skipped (already present): ${skipped}. Total rows: ${total}`);
console.log('ℹ️  Категория "service" намеренно пуста — добавьте реальные услуги в админке.');

db.close();
