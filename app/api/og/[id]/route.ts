import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Картинка для превью ссылки (Telegram, WhatsApp, VK).
 *
 * Зачем роут, а если просто отдать фото из public: все снимки апартаментов
 * лежат в webp, а webp в превью ссылки не показывают ни Telegram, ни WhatsApp,
 * ни VK — карточка приходит без картинки. На этом уже обжигались, см. коммит
 * 78d6b9b. Поэтому первый кадр апартамента режется в JPEG 1200×630.
 *
 * Результат кладём на диск: снимок меняется редко, а sharp на каждый заход
 * поисковика — лишняя нагрузка. Ключ кеша включает mtime исходника, так что
 * замена фото в админке сама инвалидирует картинку.
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const CACHE_DIR = path.join(process.cwd(), '.og-cache');
const FALLBACK = path.join(process.cwd(), 'public', 'og-image.jpg');

async function serveFallback() {
  try {
    const buf = await fs.readFile(FALLBACK);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/jpeg',
        // короче, чем у настоящей картинки: как появится фото, превью подтянется
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'no image' }, { status: 404 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const row = db.prepare(`
      SELECT url FROM apartment_images
      WHERE apartment_id = ?
      ORDER BY sort_order
      LIMIT 1
    `).get(id) as { url: string } | undefined;

    if (!row?.url) return serveFallback();

    // url в базе — «/images/apartments/<id>/<file>.webp»; за пределы public не пускаем
    const relative = row.url.replace(/^\/+/, '');
    const source = path.join(process.cwd(), 'public', relative);
    const publicRoot = path.join(process.cwd(), 'public');
    if (!source.startsWith(publicRoot)) return serveFallback();

    let stat;
    try {
      stat = await fs.stat(source);
    } catch {
      return serveFallback(); // файла нет, хотя запись в БД осталась
    }

    const cacheKey = `${id}-${Math.round(stat.mtimeMs)}.jpg`;
    const cached = path.join(CACHE_DIR, cacheKey);

    let output: Buffer;
    try {
      output = await fs.readFile(cached);
    } catch {
      output = await sharp(source)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer();

      // кеш — приятный бонус, а не обязательство: не смогли записать, просто отдаём
      try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(cached, output);
      } catch (cacheError) {
        console.error('OG cache write failed:', cacheError);
      }
    }

    return new NextResponse(new Uint8Array(output), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(output.length),
        // ключ кеша содержит mtime, поэтому старый URL можно держать долго
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('OG image error:', error);
    return serveFallback();
  }
}
