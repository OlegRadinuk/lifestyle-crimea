import ical from 'node-ical';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

// Типы для событий ICS
interface IcsEvent {
  type: string;
  uid?: string;
  start: Date;
  end: Date;
  summary?: string;
  description?: string;
}

export async function fetchAndParseICS(
  sourceId: string,
  url: string,
  apartmentId: string,
  sourceName: string
): Promise<{ count: number }> {
  try {
    // Скачиваем и парсим ICS
    const events = await ical.async.fromURL(url);
    
    const bookings: Array<{
      apartmentId: string;
      sourceName: string;
      externalId: string | null;
      checkIn: string;
      checkOut: string;
      rawData: string;
    }> = [];
    
    const now = new Date();
    
    for (const key in events) {
      const event = events[key] as IcsEvent;
      if (event.type === 'VEVENT') {
        // Приводим даты к формату YYYY-MM-DD
        const start = new Date(event.start);
        const end = new Date(event.end);
        
        const checkIn = start.toISOString().split('T')[0];
        const checkOut = end.toISOString().split('T')[0];
        
        // Не добавляем старые брони
        if (new Date(checkOut) < now) continue;
        
        bookings.push({
          apartmentId,
          sourceName,
          externalId: event.uid || null,
          checkIn,
          checkOut,
          rawData: JSON.stringify(event),
        });
      }
    }

    // Сохраняем в БД
    if (bookings.length > 0) {
      // Удаляем старые брони этого источника (которые уже закончились)
      db.prepare(`
        DELETE FROM external_bookings 
        WHERE apartment_id = ? AND source_name = ? AND check_out < date('now')
      `).run(apartmentId, sourceName);

      // Вставляем новые
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO external_bookings 
          (id, apartment_id, source_name, external_id, check_in, check_out, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Транзакция с правильной типизацией
      const transaction = db.transaction((items: typeof bookings) => {
        for (const b of items) {
          const id = uuidv4();
          insertStmt.run(
            id,
            b.apartmentId,
            b.sourceName,
            b.externalId,
            b.checkIn,
            b.checkOut,
            b.rawData
          );
        }
      });

      transaction(bookings);
    }

    return { count: bookings.length };
  } catch (error) {
    console.error('ICS parsing error:', error);
    throw error;
  }
}