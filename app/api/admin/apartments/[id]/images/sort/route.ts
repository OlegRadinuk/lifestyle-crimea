import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { images } = await request.json();

    console.log('🔄 Sorting images for apartment:', id);
    console.log('📋 New order:', images);

    // Начинаем транзакцию
    const transaction = db.transaction((imageIds: number[]) => {
      imageIds.forEach((imageId, index) => {
        db.prepare(`
          UPDATE apartment_images 
          SET sort_order = ? 
          WHERE id = ? AND apartment_id = ?
        `).run(index + 1, imageId, id);
      });
    });

    // Выполняем транзакцию
    transaction(images);

    console.log('✅ Sort order updated successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Sort order updated' 
    });

  } catch (error) {
    console.error('❌ Error updating sort order:', error);
    return NextResponse.json(
      { error: 'Failed to update sort order' },
      { status: 500 }
    );
  }
}
