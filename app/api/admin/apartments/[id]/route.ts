import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Проверяем Content-Type
    const contentType = request.headers.get('content-type') || '';
    
    let data: any;
    
    if (contentType.includes('application/json')) {
      // Если пришел JSON
      data = await request.json();
    } else {
      // Если пришел FormData
      const formData = await request.formData();
      data = Object.fromEntries(formData);
      
      // Обрабатываем features отдельно
      const features = formData.getAll('features[]');
      if (features.length > 0) {
        data.features = features.map(f => f.toString()).filter(f => f.trim() !== '');
      }
    }
    
    // Проверяем существование записи
    const exists = db.prepare('SELECT id FROM apartments WHERE id = ?').get(id);
    if (!exists) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }
    
    const updates: string[] = [];
    const values: any[] = [];

    const fields = [
      'title', 'short_description', 'description', 'max_guests',
      'area', 'price_base', 'view', 'has_terrace', 'is_active', 'features'
    ];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        
        if (field === 'has_terrace' || field === 'is_active') {
          // Для булевых полей
          values.push(data[field] === true || data[field] === 'true' || data[field] === 'on' ? 1 : 0);
        } else if (field === 'max_guests' || field === 'area' || field === 'price_base') {
          // Для числовых полей
          const numValue = Number(data[field]);
          values.push(isNaN(numValue) ? null : numValue);
        } else if (field === 'features') {
          // Для массива особенностей
          values.push(JSON.stringify(data[field] || []));
        } else {
          // Для текстовых полей
          values.push(data[field] || null);
        }
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

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