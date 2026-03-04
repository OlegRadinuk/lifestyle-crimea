import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const formData = await request.formData();
    
    const updates: string[] = [];
    const values: any[] = [];

    const fields = [
      'title', 'short_description', 'description', 'max_guests',
      'area', 'price_base', 'view', 'has_terrace', 'is_active'
    ];

    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null) {
        updates.push(`${field} = ?`);
        
        if (field === 'has_terrace' || field === 'is_active') {
          values.push(value === 'on' ? 1 : 0);
        } else if (field === 'max_guests' || field === 'area' || field === 'price_base') {
          values.push(Number(value));
        } else {
          values.push(value);
        }
      }
    });

    // Особенности (features) приходят как массив
    const features = formData.getAll('features[]');
    updates.push('features = ?');
    values.push(JSON.stringify(features));

    // Изображения (пока заглушка)
    updates.push('images = ?');
    values.push(JSON.stringify([]));

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE apartments SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating apartment:', error);
    return NextResponse.json({ error: 'Failed to update apartment' }, { status: 500 });
  }
}