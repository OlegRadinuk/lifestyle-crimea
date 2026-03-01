import { db } from '../lib/db';
import { APARTMENTS } from '../data/apartments';
import { v4 as uuidv4 } from 'uuid';

function syncApartments() {
  console.log('🔄 Синхронизация апартаментов...');
  
  for (const apt of APARTMENTS) {
    // Проверяем, есть ли уже такой апартамент
    const existing = db.prepare('SELECT id FROM apartments WHERE id = ?').get(apt.id);
    
    if (!existing) {
      // Вставляем новый
      const stmt = db.prepare(`
        INSERT INTO apartments (
          id, title, short_description, description, max_guests,
          area, price_base, view, has_terrace, features, images, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        apt.id,
        apt.title,
        apt.shortDescription,
        apt.description,
        apt.maxGuests,
        apt.area || null,
        apt.priceBase,
        apt.view || 'sea',
        apt.hasTerrace ? 1 : 0,
        JSON.stringify(apt.features || []),
        JSON.stringify(apt.images || []),
        1 // is_active
      );
      
      console.log(`✅ Добавлен: ${apt.title}`);
    } else {
      console.log(`⏩ Уже существует: ${apt.title}`);
    }
  }
  
  console.log('🎉 Синхронизация завершена!');
}

syncApartments();