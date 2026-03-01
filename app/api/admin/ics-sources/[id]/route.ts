import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const source = db.prepare(`
      SELECT s.*, a.title as apartment_title 
      FROM ics_sources s
      JOIN apartments a ON s.apartment_id = a.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Преобразуем BigInt
    const formattedSource = {
      id: source.id,
      apartment_id: source.apartment_id,
      source_name: source.source_name,
      ics_url: source.ics_url,
      is_active: Number(source.is_active),
      last_sync: source.last_sync,
      sync_status: source.sync_status,
      error_message: source.error_message,
      created_at: source.created_at,
      updated_at: source.updated_at,
      apartment_title: source.apartment_title
    };

    return NextResponse.json(formattedSource);
  } catch (error) {
    console.error('Error in GET /api/admin/ics-sources/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch source' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const data = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (data.ics_url !== undefined) {
      updates.push('ics_url = ?');
      values.push(data.ics_url);
    }

    if (data.source_name !== undefined) {
      updates.push('source_name = ?');
      values.push(data.source_name);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `UPDATE ics_sources SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);

    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/ics-sources/[id]:', error);
    return NextResponse.json({ error: 'Failed to update ICS source' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    db.prepare('DELETE FROM ics_sources WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/ics-sources/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}