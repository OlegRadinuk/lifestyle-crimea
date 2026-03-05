// scripts/init-apartments.ts
import { db } from '../lib/db';
import { APARTMENTS } from '../data/apartments';

function initApartments() {
  console.log('🏢 Инициализация апартаментов в базе данных...\n');

  // Очищаем таблицу
  db.exec('DELETE FROM apartments');

  const insertStmt = db.prepare(`
    INSERT INTO apartments (
      id, title, max_guests, price_base, short_description, description, 
      area, view, has_terrace, features, images, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let success = 0;
  for (const apt of APARTMENTS) {
    try {
      // ИСПРАВЛЕНО: используем правильные названия полей
      insertStmt.run(
        apt.id,
        apt.title,
        apt.max_guests,      // было maxGuests
        apt.price_base,      // было priceBase
        apt.short_description || null,
        apt.description || null,
        apt.area || null,
        apt.view || 'sea',
        apt.has_terrace ? 1 : 0,
        JSON.stringify(apt.features || []),
        JSON.stringify(apt.images || []),
        apt.is_active ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );
      console.log(`✅ ${apt.title} (${apt.id})`);
      success++;
    } catch (error) {
      console.error(`❌ ${apt.title}:`, error);
    }
  }
  console.log(`\n📊 Добавлено: ${success} апартаментов`);
}

initApartments();