import { db } from '../lib/db';
import { APARTMENTS } from '../data/apartments';

function syncApartments() {
  console.log('🔄 Синхронизация апартаментов...\n');
  
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const apt of APARTMENTS) {
    try {
      // Проверяем, есть ли уже такой апартамент
      const existing = db.prepare('SELECT id FROM apartments WHERE id = ?').get(apt.id);
      
      if (!existing) {
        // Вставляем новый
        const stmt = db.prepare(`
          INSERT INTO apartments (
            id, title, short_description, description, max_guests,
            area, price_base, view, has_terrace, features, images, is_active,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          apt.id,
          apt.title,
          apt.short_description || null,
          apt.description || null,
          apt.max_guests,              // ИСПРАВЛЕНО
          apt.area || null,
          apt.price_base,               // ИСПРАВЛЕНО
          apt.view || 'sea',
          apt.has_terrace ? 1 : 0,      // ИСПРАВЛЕНО
          JSON.stringify(apt.features || []),
          JSON.stringify(apt.images || []),
          apt.is_active ? 1 : 0,        // ДОБАВЛЕНО
          new Date().toISOString(),
          new Date().toISOString()
        );
        
        console.log(`✅ Добавлен: ${apt.title} (${apt.id})`);
        added++;
      } else {
        console.log(`⏩ Уже существует: ${apt.title}`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Ошибка с ${apt.title}:`, error);
      errors++;
    }
  }
  
  console.log('\n📊 Статистика синхронизации:');
  console.log(`✅ Добавлено: ${added}`);
  console.log(`⏩ Пропущено: ${skipped}`);
  console.log(`❌ Ошибок: ${errors}`);
  console.log('🎉 Синхронизация завершена!');
}

syncApartments();