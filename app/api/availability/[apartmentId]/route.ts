import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const apartment = db.prepare(`
      SELECT * FROM apartments WHERE id = ?
    `).get(id);

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    return NextResponse.json(apartment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch apartment' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const data = await request.json();
    
    const stmt = db.prepare(`
      UPDATE apartments 
      SET title = ?, max_guests = ?, price_base = ?, 
          description = ?, short_description = ?, area = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.title,
      data.max_guests,
      data.price_base,
      data.description || null,
      data.short_description || null,
      data.area || null,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update apartment' }, { status: 500 });
  }
}