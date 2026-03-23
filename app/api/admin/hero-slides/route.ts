import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// GET /api/admin/hero-slides - получить все слайды
export async function GET() {
  try {
    const slides = db.prepare(`
      SELECT * FROM hero_slides ORDER BY sort_order ASC
    `).all();

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}

// POST /api/admin/hero-slides - добавить новый слайд
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Проверяем размер (макс 20MB для исходника)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    // Читаем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Создаем папку если нет
    const uploadDir = path.join(process.cwd(), 'public/images/hero');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Генерируем уникальное имя
    const filename = `hero_${Date.now()}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // Получаем метаданные для оптимизации
    let metadata;
    let processedBuffer: Buffer;
    
    try {
      metadata = await sharp(buffer).metadata();
      
      // Оптимизируем размер (макс 1920px)
      let width = metadata.width || 1920;
      let height = metadata.height || 1080;
      
      if (width > 1920) {
        height = Math.round((height * 1920) / width);
        width = 1920;
      }
      
      // Обрабатываем и сжимаем в WebP
      const sharpInstance = sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({
          quality: 85,
          effort: 6,
          lossless: false,
          nearLossless: false,
          smartSubsample: true
        });
      
      processedBuffer = await sharpInstance.toBuffer() as Buffer;
      
      const originalSize = (buffer.length / 1024 / 1024).toFixed(2);
      const newSize = (processedBuffer.length / 1024 / 1024).toFixed(2);
      console.log(`📸 Hero image: ${originalSize}MB → ${newSize}MB (${metadata.width}x${metadata.height} → ${width}x${height})`);
      
      // Если после сжатия всё ещё больше 3MB — снижаем качество
      if (processedBuffer.length > 3 * 1024 * 1024) {
        console.log(`⚠️ Image still >3MB, reducing quality to 75%`);
        const sharpRetry = sharp(buffer)
          .resize(width, height, { fit: 'cover', position: 'center' })
          .webp({ quality: 75, effort: 6 });
        processedBuffer = await sharpRetry.toBuffer() as Buffer;
      }
      
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError);
      // Если sharp не справился, используем оригинал
      processedBuffer = buffer;
    }

    // Сохраняем обработанный файл
    fs.writeFileSync(outputPath, processedBuffer);
    
    const imageUrl = `/images/hero/${filename}`;
    
    // Получаем максимальный sort_order
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM hero_slides').get() as { max: number };
    const sortOrder = (maxOrder.max || 0) + 1;
    
    // Сохраняем в БД
    const stmt = db.prepare(`
      INSERT INTO hero_slides (image_url, title, subtitle, sort_order, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    
    const result = stmt.run(imageUrl, title || null, subtitle || null, sortOrder);
    
    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid,
      image_url: imageUrl,
      sort_order: sortOrder,
      size: processedBuffer.length
    });
    
  } catch (error) {
    console.error('Error uploading hero slide:', error);
    return NextResponse.json({ error: 'Failed to upload slide' }, { status: 500 });
  }
}