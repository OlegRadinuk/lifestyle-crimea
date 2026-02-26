// scripts/init-apartments.ts
import { db } from '../lib/db';
import { APARTMENTS } from '../data/apartments';

function initApartments() {
  console.log('🏢 Инициализация апартаментов в базе данных...\n');

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO apartments (id, title, max_guests, price_base)
    VALUES (?, ?, ?, ?)
  `);

  let success = 0;
  for (const apt of APARTMENTS) {
    try {
      insertStmt.run(apt.id, apt.title, apt.maxGuests, apt.priceBase);
      console.log(`✅ ${apt.title} (${apt.id})`);
      success++;
    } catch (error) {
      console.error(`❌ ${apt.title}:`, error);
    }
  }
  console.log(`\n📊 Добавлено: ${success} апартаментов`);
}

initApartments();
