import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

// Увеличиваем timeout роута до 120 секунд (обработка видео/больших фото)
export const maxDuration = 120;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'];
const VIDEO_EXTS = ['mp4', 'webm', 'ogv', 'ogg', 'mov'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;   // 20MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;  // 200MB

// GET /api/admin/hero-slides
export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const slides = db.prepare('SELECT * FROM hero_slides ORDER BY sort_order ASC').all();
    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}

// POST /api/admin/hero-slides — загрузить новый слайд (фото или видео)
export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;

    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/') || IMAGE_EXTS.includes(fileExt);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/') || VIDEO_EXTS.includes(fileExt);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Неподдерживаемый тип файла: ${file.type || fileExt || 'неизвестно'}. Разрешены JPG, PNG, WEBP, HEIC и видео MP4, WEBM, MOV` },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let mediaUrl: string;
    let mediaType: 'image' | 'video';

    if (isVideo) {
      const uploadDir = path.join(process.cwd(), 'public/video/hero');
      if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

      const outExt = fileExt === 'webm' ? 'webm'
        : (fileExt === 'ogv' || fileExt === 'ogg') ? 'ogv'
        : fileExt === 'mov' ? 'mov'
        : 'mp4';
      const filename = `hero_${Date.now()}.${outExt}`;
      const outputPath = path.join(uploadDir, filename);

      await writeFile(outputPath, buffer);
      mediaUrl = `/video/hero/${filename}`;
      mediaType = 'video';
      console.log(`🎬 Video saved: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${filename}`);

    } else {
      const uploadDir = path.join(process.cwd(), 'public/images/hero');
      if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

      const filename = `hero_${Date.now()}.webp`;
      const outputPath = path.join(uploadDir, filename);

      // Читаем метаданные
      let metadata: Awaited<ReturnType<typeof sharp.prototype.metadata>>;
      try {
        metadata = await sharp(buffer).metadata();
      } catch (err) {
        console.error('Sharp metadata error:', err);
        return NextResponse.json(
          { error: 'Не удалось прочитать изображение. Проверьте что файл не повреждён.' },
          { status: 400 }
        );
      }

      // Ограничиваем до 1920px по ширине
      let width = metadata.width ?? 1920;
      let height = metadata.height ?? 1080;
      if (width > 1920) {
        height = Math.round((height * 1920) / width);
        width = 1920;
      }

      // Один проход sharp: effort 3 (быстро, качество хорошее)
      // При больших файлах quality 75 сразу — не нужен второй проход
      const quality = buffer.length > 5 * 1024 * 1024 ? 75 : 82;
      let processedBuffer: Buffer;
      try {
        processedBuffer = await sharp(buffer)
          .rotate() // авто-ориентация по EXIF (исправляет повёрнутые iPhone фото)
          .resize(width, height, { fit: 'cover', position: 'center' })
          .webp({ quality, effort: 3 })
          .toBuffer() as Buffer;

        console.log(`📸 Image: ${(buffer.length / 1024 / 1024).toFixed(2)}MB → ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      } catch (err) {
        console.error('Sharp processing error:', err);
        return NextResponse.json(
          { error: 'Ошибка обработки изображения. Попробуйте JPG или PNG.' },
          { status: 400 }
        );
      }

      await writeFile(outputPath, processedBuffer);
      mediaUrl = `/images/hero/${filename}`;
      mediaType = 'image';
    }

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM hero_slides').get() as { max: number };
    const sortOrder = (maxOrder.max || 0) + 1;

    const result = db.prepare(`
      INSERT INTO hero_slides (image_url, media_type, title, subtitle, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(mediaUrl, mediaType, title || null, subtitle || null, sortOrder);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      image_url: mediaUrl,
      media_type: mediaType,
      sort_order: sortOrder,
    });

  } catch (error) {
    console.error('Error uploading hero slide:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке файла' }, { status: 500 });
  }
}
