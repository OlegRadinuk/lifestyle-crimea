import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://lovelifestyle.ru';

  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/apartments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      /* Гео-посадочная. «профессорский уголок алушта» — 1 792 показа в месяц
         по Вордстату, больше всего кластера «снять жильё в алуште». Приоритет
         как у каталога: это вторая точка входа по коммерческим запросам. */
      url: `${baseUrl}/professorskiy-ugolok`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      /* «отель алушта с бассейном» — 511 показов и самый дешёвый заметный
         клик в Директе (51 ₽). Коммерческая посадка; /services остаётся
         информационной страницей про сервис, чтобы они не бодались. */
      url: `${baseUrl}/zhile-s-basseynom`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      /* «частный сектор алушта» — 379 показов, клик 24 ₽, самый дешёвый в
         ядре. Страница честно сравнивает, а не притворяется частным сектором. */
      url: `${baseUrl}/chastnyy-sektor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      /* Прямая ссылка на чат с Софией — расшаривается в Instagram, WhatsApp,
         на визитке. Раньше стояла noindex как «страница только для прямых
         переходов», потом решили индексировать и её тоже — вреда нет, а по
         брендовому запросу лишний URL в выдаче не помешает. */
      url: `${baseUrl}/sofia`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      // Аквазона (бассейны, детские, джакузи) живёт здесь — коммерческий запрос
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/concept`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // Динамические страницы апартаментов
  // Используем created_at — у каждого апартамента уникальная дата создания
  // Это даёт Яндексу честный сигнал о том, что страницы разные (не batch-спам)
  const apartments = db.prepare(`
    SELECT id, slug, created_at FROM apartments WHERE is_active = 1
  `).all() as { id: string; slug: string | null; created_at: string }[];

  const apartmentPages: MetadataRoute.Sitemap = apartments.map((apt) => ({
    url: `${baseUrl}/apartments/${apt.slug || apt.id}`,
    lastModified: new Date(apt.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Динамические страницы новостей (только опубликованные)
  let newsPages: MetadataRoute.Sitemap = [];
  try {
    const news = db.prepare(`
      SELECT slug, COALESCE(updated_at, published_at, created_at) AS last_mod
      FROM news WHERE is_published = 1
    `).all() as { slug: string; last_mod: string }[];

    newsPages = news.map((n) => ({
      url: `${baseUrl}/news/${n.slug}`,
      lastModified: new Date(n.last_mod),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch {
    newsPages = [];
  }

  return [...staticPages, ...apartmentPages, ...newsPages];
}