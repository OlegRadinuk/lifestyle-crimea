import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const images = db.prepare(`
      SELECT * FROM apartment_images 
      WHERE apartment_id = ? 
      ORDER BY sort_order
    `).all(id);

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Создаём уникальное имя файла
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Убеждаемся, что папка существует
    const uploadDir = path.join(process.cwd(), 'public/images/apartments', id);
    await mkdir(uploadDir, { recursive: true });
    
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);
    
    // Сохраняем файл
    await writeFile(filepath, buffer);
    
    // Получаем следующий порядковый номер
    const maxSort = db.prepare(`
      SELECT MAX(sort_order) as max FROM apartment_images WHERE apartment_id = ?
    `).get(id) as { max: number };
    
    const sortOrder = (maxSort.max || 0) + 1;
    
    // Сохраняем в БД
    const imageUrl = `/images/apartments/${id}/${filename}`;
    
    const stmt = db.prepare(`
      INSERT INTO apartment_images (apartment_id, url, sort_order)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(id, imageUrl, sortOrder);
    
    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid,
      url: imageUrl 
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}