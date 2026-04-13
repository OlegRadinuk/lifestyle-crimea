import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

// GET /api/admin/hero-slides
export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

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

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/');
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Неподдерживаемый тип файла: ${file.type}. Разрешены изображения (JPG, PNG, WEBP, HEIC) и видео (MP4, WEBM)` },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const limitMB = maxSize / 1024 / 1024;
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${limitMB}MB для ${isVideo ? 'видео' : 'изображений'}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let mediaUrl: string;
    let mediaType: 'image' | 'video';

    if (isVideo) {
      // Видео: сохраняем как есть, определяем расширение
      const uploadDir = path.join(process.cwd(), 'public/video/hero');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = file.type === 'video/webm' ? 'webm' : file.type === 'video/ogg' ? 'ogv' : 'mp4';
      const filename = `hero_${Date.now()}.${ext}`;
      const outputPath = path.join(uploadDir, filename);

      fs.writeFileSync(outputPath, buffer);
      mediaUrl = `/video/hero/${filename}`;
      mediaType = 'video';

      console.log(`🎬 Hero video saved: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${filename}`);
    } else {
      // Изображение: обрабатываем через sharp
      const uploadDir = path.join(process.cwd(), 'public/images/hero');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `hero_${Date.now()}.webp`;
      const outputPath = path.join(uploadDir, filename);

      let metadata: Awaited<ReturnType<typeof sharp.prototype.metadata>>;
      try {
        metadata = await sharp(buffer).metadata();
      } catch (sharpErr) {
        console.error('Sharp cannot read file metadata:', sharpErr);
        return NextResponse.json(
          { error: 'Не удалось прочитать изображение. Убедитесь что файл не повреждён и является корректным изображением.' },
          { status: 400 }
        );
      }

      let width = metadata.width ?? 1920;
      let height = metadata.height ?? 1080;

      if (width > 1920) {
        height = Math.round((height * 1920) / width);
        width = 1920;
      }

      let processedBuffer: Buffer;
      try {
        processedBuffer = await sharp(buffer)
          .resize(width, height, { fit: 'cover', position: 'center' })
          .webp({ quality: 85, effort: 6, smartSubsample: true })
          .toBuffer() as Buffer;

        const originalMB = (buffer.length / 1024 / 1024).toFixed(2);
        const newMB = (processedBuffer.length / 1024 / 1024).toFixed(2);
        console.log(`📸 Hero image: ${originalMB}MB → ${newMB}MB (${metadata.width}x${metadata.height} → ${width}x${height})`);

        // Если всё ещё >3MB — снижаем качество
        if (processedBuffer.length > 3 * 1024 * 1024) {
          console.log('⚠️ Image still >3MB, reducing quality to 75%');
          processedBuffer = await sharp(buffer)
            .resize(width, height, { fit: 'cover', position: 'center' })
            .webp({ quality: 75, effort: 6 })
            .toBuffer() as Buffer;
        }
      } catch (sharpErr) {
        console.error('Sharp processing failed:', sharpErr);
        return NextResponse.json(
          { error: 'Ошибка обработки изображения. Попробуйте другой формат (JPG или PNG).' },
          { status: 400 }
        );
      }

      fs.writeFileSync(outputPath, processedBuffer);
      mediaUrl = `/images/hero/${filename}`;
      mediaType = 'image';
    }

    // Получаем максимальный sort_order
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
