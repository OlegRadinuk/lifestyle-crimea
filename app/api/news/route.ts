import { NextResponse } from 'next/server';
import { newsService } from '@/lib/db';

// Публичный список последних опубликованных новостей — для слайдера в бургер-меню.
// Отдаём только безопасные поля (без черновиков и служебных).
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = parseInt(searchParams.get('limit') || '3', 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 10) : 3;

    const items = newsService
      .getPublished()
      .slice(0, limit)
      .map((n) => ({
        slug: n.slug,
        title: n.title,
        excerpt: n.excerpt,
        cover_image: n.cover_image,
      }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/news failed:', error);
    // Не роняем меню — пустой список означает «показать статичную заглушку».
    return NextResponse.json([], { status: 200 });
  }
}
