import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const data = await request.json();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }

    if (data.subtitle !== undefined) {
      updates.push('subtitle = ?');
      values.push(data.subtitle);
    }

    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (data.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(data.sort_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE hero_slides SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating hero slide:', error);
    return NextResponse.json({ error: 'Failed to update slide' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Получаем информацию о слайде
    const slide = db.prepare('SELECT image_url FROM hero_slides WHERE id = ?').get(id) as any;
    
    if (slide) {
      // Удаляем файл
      const filepath = path.join(process.cwd(), 'public', slide.image_url);
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (e) {
        console.log('Error deleting file:', e);
      }
    }
    
    // Удаляем из БД
    db.prepare('DELETE FROM hero_slides WHERE id = ?').run(id);
    
    // Перенумеровываем sort_order
    const remaining = db.prepare('SELECT id FROM hero_slides ORDER BY sort_order').all() as any[];
    remaining.forEach((item: any, index: number) => {
      db.prepare('UPDATE hero_slides SET sort_order = ? WHERE id = ?').run(index + 1, item.id);
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 });
  }
}