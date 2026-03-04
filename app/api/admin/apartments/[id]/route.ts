import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const formData = await request.formData();
    
    // Сначала проверяем, существует ли запись
    const exists = db.prepare('SELECT id FROM apartments WHERE id = ?').get(id);
    if (!exists) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }
    
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
          // Для чекбоксов: если value === 'on' или true
          values.push(value === 'on' || value === 'true' ? 1 : 0);
        } else if (field === 'max_guests' || field === 'area' || field === 'price_base') {
          // Для числовых полей
          const numValue = Number(value);
          values.push(isNaN(numValue) ? null : numValue);
        } else {
          // Приводим к строке, так как это текстовые поля
          values.push(value.toString());
        }
      }
    });

    // Особенности (features) приходят как массив
    const features = formData.getAll('features[]');
    if (features.length > 0) {
      updates.push('features = ?');
      // Фильтруем пустые строки и приводим каждый элемент к строке
      const validFeatures = features
        .map(f => f.toString())
        .filter(f => f.trim() !== '');
      values.push(JSON.stringify(validFeatures));
    }

    // Изображения (пока заглушка)
    updates.push('images = ?');
    values.push(JSON.stringify([]));

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    if (updates.length === 1) { // Только updated_at
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const query = `UPDATE apartments SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating apartment:', error);
    return NextResponse.json({ 
      error: 'Failed to update apartment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}