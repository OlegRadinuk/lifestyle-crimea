import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchIcs } from '@/lib/ics/parser';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const startTime = Date.now();
  const results = [];

  try {
    // Получаем все активные источники
    const sources = db.prepare(`
      SELECT * FROM ics_sources WHERE is_active = 1
    `).all() as any[];

    for (const source of sources) {
      try {
        // Преобразуем BigInt в Number
        const cleanSource = {
          ...source,
          is_active: Number(source.is_active),
        };

        // Получаем события из ICS
        const events = await fetchIcs(source.ics_url);
        
        // Сохраняем в БД
        let importedCount = 0;
        if (events.length > 0) {
          // Удаляем старые брони этого источника
          db.prepare(`
            DELETE FROM external_bookings 
            WHERE apartment_id = ? AND source_name = ? AND check_out < date('now')
          `).run(source.apartment_id, source.source_name);

          // Вставляем новые
          const insertStmt = db.prepare(`
            INSERT INTO external_bookings 
              (id, apartment_id, source_name, external_id, check_in, check_out, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          for (const event of events) {
            const id = uuidv4();
            insertStmt.run(
              id,
              source.apartment_id,
              source.source_name,
              event.uid || null,
              event.start,
              event.end,
              JSON.stringify(event)
            );
            importedCount++;
          }
        }

        // Обновляем статус источника
        db.prepare(`
          UPDATE ics_sources 
          SET last_sync = CURRENT_TIMESTAMP, 
              sync_status = ?,
              error_message = NULL
          WHERE id = ?
        `).run('success', source.id);

        // Логируем успех
        db.prepare(`
          INSERT INTO sync_logs (id, source_name, apartment_id, action, status, events_count, duration_ms)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          source.source_name,
          source.apartment_id,
          'import',
          'success',
          importedCount,
          Date.now() - startTime
        );

        results.push({
          source: source.source_name,
          status: 'success',
          count: importedCount,
        });
      } catch (error: any) {
        console.error(`Error syncing source ${source.id}:`, error);

        // Обновляем статус с ошибкой
        db.prepare(`
          UPDATE ics_sources 
          SET sync_status = ?, error_message = ?
          WHERE id = ?
        `).run('error', error.message, source.id);

        // Логируем ошибку
        db.prepare(`
          INSERT INTO sync_logs (id, source_name, action, status, error_message, duration_ms)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          source.source_name,
          'import',
          'error',
          error.message,
          Date.now() - startTime
        );

        results.push({
          source: source.source_name,
          status: 'error',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      duration: Date.now() - startTime,
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}