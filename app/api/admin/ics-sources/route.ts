import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { fetchAndParseICS } from '@/lib/ics-parser';

// GET /api/admin/ics-sources - список всех источников
export async function GET() {
  try {
    const sources = db.prepare(`
      SELECT s.*, a.title as apartment_title
      FROM ics_sources s
      JOIN apartments a ON s.apartment_id = a.id
      ORDER BY a.title, s.source_name
    `).all();

    // Преобразуем BigInt в Number
    const formattedSources = (sources as any[]).map(source => ({
      ...source,
      is_active: Number(source.is_active),
      // добавляем преобразование для других числовых полей, если есть
    }));

    return NextResponse.json(formattedSources);
  } catch (error) {
    console.error('Error in GET /api/admin/ics-sources:', error);
    return NextResponse.json({ error: 'Failed to fetch ICS sources' }, { status: 500 });
  }
}

// POST /api/admin/ics-sources - создать новый источник
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO ics_sources (id, apartment_id, source_name, ics_url, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.apartment_id, data.source_name, data.ics_url, 1);

    // Сразу пробуем синхронизировать
    try {
      await fetchAndParseICS(id, data.ics_url, data.apartment_id, data.source_name);
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error in POST /api/admin/ics-sources:', error);
    return NextResponse.json({ error: 'Failed to add ICS source' }, { status: 500 });
  }
}