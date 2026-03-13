import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    
    console.log('🗑️ Deleting image:', imageId);

    // Получаем информацию об изображении из БД
    const image = db.prepare(`
      SELECT * FROM apartment_images WHERE id = ?
    `).get(imageId) as { id: number; url: string; apartment_id: string } | undefined;

    if (!image) {
      console.log('❌ Image not found:', imageId);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    console.log('📸 Image found:', image);

    // Удаляем физический файл
    try {
      // Извлекаем путь из URL (убираем ведущий слеш)
      const filePath = image.url.startsWith('/') 
        ? image.url.substring(1) 
        : image.url;
      
      const fullPath = path.join(process.cwd(), 'public', filePath);
      console.log('🗂️ Deleting file:', fullPath);
      
      await unlink(fullPath);
      console.log('✅ File deleted successfully');
    } catch (fileError) {
      // Если файл не найден - просто логируем, но продолжаем удаление из БД
      console.log('⚠️ File not found or error deleting:', fileError);
    }

    // Удаляем запись из БД
    db.prepare('DELETE FROM apartment_images WHERE id = ?').run(imageId);
    console.log('✅ Database record deleted');

    // Получаем оставшиеся изображения для перенумерации sort_order
    const remainingImages = db.prepare(`
      SELECT id FROM apartment_images 
      WHERE apartment_id = ? 
      ORDER BY sort_order
    `).all(image.apartment_id) as { id: number }[];

    // Обновляем порядок сортировки (делаем последовательным)
    remainingImages.forEach((img, index) => {
      db.prepare(`
        UPDATE apartment_images 
        SET sort_order = ? 
        WHERE id = ?
      `).run(index + 1, img.id);
    });

    console.log('✅ Sort order updated');

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
