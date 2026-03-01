import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchAndParseICS } from '@/lib/ics-parser';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const startTime = Date.now();
  const results = [];

  // Проверяем авторизацию (можно добавить секретный ключ)
  // if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    // Получаем все активные источники
    const sources = db.prepare(`
      SELECT * FROM ics_sources WHERE is_active = 1
    `).all() as any[];

    for (const source of sources) {
      try {
        const result = await fetchAndParseICS(
          source.id,
          source.ics_url,
          source.apartment_id,
          source.source_name
        );

        // Обновляем статус
        db.prepare(`
          UPDATE ics_sources 
          SET last_sync = CURRENT_TIMESTAMP, 
              sync_status = ?,
              error_message = NULL
          WHERE id = ?
        `).run('success', source.id);

        results.push({
          source: source.source_name,
          status: 'success',
          count: result.count,
        });
      } catch (error: any) {
        db.prepare(`
          UPDATE ics_sources 
          SET sync_status = ?, error_message = ?
          WHERE id = ?
        `).run('error', error.message, source.id);

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