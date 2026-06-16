import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { newsService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import { NewsCreateSchema } from './schema';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 120;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

// Конвертация загруженного файла в webp по образцу hero-slides
async function saveCoverImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/') || IMAGE_EXTS.includes(fileExt);
  if (!isImage) {
    throw new Error('Неподдерживаемый тип файла. Разрешены JPG, PNG, WEBP, HEIC.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Файл слишком большой. Максимум ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

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

  // OG-карточка любит 1200×630; ограничиваем ширину до 1600 для качества
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

// GET /api/admin/news — список всех новостей
export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    return NextResponse.json(newsService.getAll());
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST /api/admin/news — создать новость (JSON или multipart с cover-файлом)
export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};
    let coverUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('cover') as File | null;
      if (file && typeof file === 'object' && file.size > 0) {
        coverUrl = await saveCoverImage(file);
      }
      const str = (v: FormDataEntryValue | null): string | undefined =>
        typeof v === 'string' ? v : undefined;
      payload = {
        title: str(form.get('title')),
        slug: str(form.get('slug')) || undefined,
        excerpt: str(form.get('excerpt')),
        content: str(form.get('content')),
        is_published: form.get('is_published') === 'true' || form.get('is_published') === '1',
        is_featured: form.get('is_featured') === 'true' || form.get('is_featured') === '1',
      };
      // cover_image формируется сервером (coverUrl) — пользовательское значение игнорируем.
    } else {
      payload = await request.json();
    }

    const parsed = NewsCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ error: msg || 'Некорректные данные', issues: parsed.error.issues }, { status: 400 });
    }
    const v = parsed.data;

    const created = newsService.create({
      title: v.title.trim(),
      slug: v.slug || undefined,
      excerpt: v.excerpt ?? null,
      content: v.content ?? null,
      // В multipart cover задаётся только сервером; в JSON допускаем лишь /images/news/*.
      cover_image: coverUrl ?? (v.cover_image ? v.cover_image : null),
      is_published: Boolean(v.is_published),
      is_featured: Boolean(v.is_featured),
      sort_order: v.sort_order,
      published_at: v.published_at ?? null,
    });

    revalidatePath('/news');
    revalidatePath(`/news/${created.slug}`);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    const message = error instanceof Error ? error.message : 'Failed to create news';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
