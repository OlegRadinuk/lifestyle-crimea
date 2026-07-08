import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { checkAdminAuth } from '@/lib/admin-auth';
import { UPLOADS_BASE } from '@/lib/uploads';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

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
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Читаем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Убеждаемся, что папка существует
    const uploadDir = path.join(UPLOADS_BASE, 'images', 'apartments', id);
    await mkdir(uploadDir, { recursive: true });

    const fileUuid = uuidv4();
    const filename = `${fileUuid}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Конвертируем в WebP через sharp (исправляет ориентацию по EXIF, уменьшает до 1920px)
    let processedBuffer: Buffer;
    try {
      const meta = await sharp(buffer).metadata();
      let width = meta.width ?? 1920;
      let height = meta.height ?? 1080;
      if (width > 1920) {
        height = Math.round((height * 1920) / width);
        width = 1920;
      }
      const quality = buffer.length > 5 * 1024 * 1024 ? 75 : 82;
      processedBuffer = await sharp(buffer)
        .rotate()
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 3 })
        .toBuffer() as Buffer;
    } catch (sharpErr) {
      console.error('Sharp processing error:', sharpErr);
      return NextResponse.json(
        { error: 'Не удалось обработать изображение. Проверьте формат файла (JPG, PNG, WEBP, HEIC).' },
        { status: 400 }
      );
    }

    // Сохраняем файл
    await writeFile(filepath, processedBuffer);

    // Проверяем, что файл реально записался на диск
    if (!existsSync(filepath)) {
      throw new Error(`File was not saved to disk: ${filepath}`);
    }

    // Получаем следующий порядковый номер
    const maxSort = db.prepare(`
      SELECT MAX(sort_order) as max FROM apartment_images WHERE apartment_id = ?
    `).get(id) as { max: number };

    const sortOrder = (maxSort.max || 0) + 1;

    // Сохраняем в БД (только после успешной записи файла)
    const imageUrl = `/images/apartments/${id}/${filename}`;

    const stmt = db.prepare(`
      INSERT INTO apartment_images (apartment_id, url, sort_order)
      VALUES (?, ?, ?)
    `);

    let result;
    try {
      result = stmt.run(id, imageUrl, sortOrder);
    } catch (dbErr) {
      try { await unlink(filepath); } catch {}
      throw dbErr;
    }

    console.log(`📸 Image uploaded: ${(processedBuffer.length / 1024).toFixed(0)}KB → ${filepath}`);

    return NextResponse.json({
      success: true,
      id: Number(result.lastInsertRowid),
      url: imageUrl
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}