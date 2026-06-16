import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { newsService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import { NewsUpdateSchema } from '../schema';
import sharp from 'sharp';
import fs from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 120;

const NEWS_DIR = path.join(process.cwd(), 'public', 'images', 'news');

/**
 * Безопасно удаляет файл обложки: только если он строго внутри public/images/news.
 * path.basename отрезает любые '..' и директории — защита от path traversal,
 * если в БД попало вредоносное значение cover_image.
 */
function safeUnlinkCover(coverImage: string | null | undefined): void {
  if (!coverImage || !coverImage.startsWith('/images/news/')) return;
  const resolved = path.resolve(NEWS_DIR, path.basename(coverImage));
  if (resolved !== NEWS_DIR && !resolved.startsWith(NEWS_DIR + path.sep)) return;
  try {
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  } catch {
    /* ignore */
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

async function saveCoverImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/') || IMAGE_EXTS.includes(fileExt);
  if (!isImage) throw new Error('Неподдерживаемый тип файла. Разрешены JPG, PNG, WEBP, HEIC.');
  if (file.size > MAX_IMAGE_SIZE) throw new Error(`Файл слишком большой. Максимум ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), 'public/images/news');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const filename = `news_${Date.now()}.webp`;
  const outputPath = path.join(uploadDir, filename);

  let metadata: Awaited<ReturnType<typeof sharp.prototype.metadata>>;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new Error('Не удалось прочитать изображение. Проверьте что файл не повреждён.');
  }

  let width = metadata.width ?? 1600;
  let height = metadata.height ?? 900;
  if (width > 1600) {
    height = Math.round((height * 1600) / width);
    width = 1600;
  }

  const quality = buffer.length > 5 * 1024 * 1024 ? 75 : 82;
  const processed = await sharp(buffer)
    .rotate()
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 3 })
    .toBuffer();

  await writeFile(outputPath, processed);
  return `/images/news/${filename}`;
}

// GET /api/admin/news/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;
  const item = newsService.getById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

// PATCH /api/admin/news/[id] — обновить (JSON или multipart с новым cover)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;

  const existing = newsService.getById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const contentType = request.headers.get('content-type') || '';
    const data: Record<string, unknown> = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('cover') as File | null;
      if (file && typeof file === 'object' && file.size > 0) {
        // Удаляем старую обложку (с защитой от path traversal)
        safeUnlinkCover(existing.cover_image);
        data.cover_image = await saveCoverImage(file);
      }
      const setIf = (key: string, val: FormDataEntryValue | null) => {
        if (typeof val === 'string') data[key] = val;
      };
      setIf('title', form.get('title'));
      setIf('slug', form.get('slug'));
      setIf('excerpt', form.get('excerpt'));
      setIf('content', form.get('content'));
      if (form.get('is_published') !== null) data.is_published = form.get('is_published') === 'true' || form.get('is_published') === '1';
      if (form.get('is_featured') !== null) data.is_featured = form.get('is_featured') === 'true' || form.get('is_featured') === '1';
    } else {
      const body = await request.json();
      Object.assign(data, body);
    }

    const parsed = NewsUpdateSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ error: msg || 'Некорректные данные', issues: parsed.error.issues }, { status: 400 });
    }

    // Если в PATCH (JSON) пришла новая обложка из нашей папки, а старая отличается —
    // удаляем старый файл, чтобы не копить мусор (с защитой от traversal).
    const next = parsed.data;
    if (
      typeof next.cover_image === 'string' &&
      next.cover_image.startsWith('/images/news/') &&
      existing.cover_image &&
      existing.cover_image !== next.cover_image
    ) {
      safeUnlinkCover(existing.cover_image);
    }

    const updated = newsService.update(id, next);

    revalidatePath('/news');
    if (updated?.slug) revalidatePath(`/news/${updated.slug}`);
    // Если slug изменился — старый путь тоже инвалидируем.
    if (existing.slug && updated?.slug && existing.slug !== updated.slug) {
      revalidatePath(`/news/${existing.slug}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating news:', error);
    const message = error instanceof Error ? error.message : 'Failed to update news';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/news/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;

  const existing = newsService.getById(id);
  // Удаление файла обложки с защитой от path traversal
  safeUnlinkCover(existing?.cover_image);

  const ok = newsService.delete(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  revalidatePath('/news');
  if (existing?.slug) revalidatePath(`/news/${existing.slug}`);

  return NextResponse.json({ success: true });
}
