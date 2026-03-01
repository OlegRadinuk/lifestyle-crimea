import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchAndParseICS } from '@/lib/ics-parser';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 Promise
) {
  const startTime = Date.now();
  const { id } = await params; // 👈 await

  try {
    // Получаем источник
    const source = db.prepare(`
      SELECT * FROM ics_sources WHERE id = ?
    `).get(id) as any;

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Синхронизируем
    const result = await fetchAndParseICS(
      id,
      source.ics_url,
      source.apartment_id,
      source.source_name
    );

    // Обновляем статус
    db.prepare(`
      UPDATE ics_sources 
      SET last_sync = CURRENT_TIMESTAMP, 
          sync_status = ?,
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run('success', null, id);

    // Логируем
    db.prepare(`
      INSERT INTO sync_logs (id, source_name, apartment_id, action, status, events_count, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      source.source_name,
      source.apartment_id,
      'import',
      'success',
      result.count,
      Date.now() - startTime
    );

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    // Логируем ошибку
    db.prepare(`
      UPDATE ics_sources 
      SET sync_status = ?, error_message = ?
      WHERE id = ?
    `).run('error', error.message, id);

    db.prepare(`
      INSERT INTO sync_logs (id, source_name, action, status, error_message, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'unknown',
      'import',
      'error',
      error.message,
      Date.now() - startTime
    );

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}