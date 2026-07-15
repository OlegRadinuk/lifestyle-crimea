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
    SELECT id, created_at FROM apartments WHERE is_active = 1
  `).all() as { id: string; created_at: string }[];

  const apartmentPages: MetadataRoute.Sitemap = apartments.map((apt) => ({
    url: `${baseUrl}/apartments/${apt.id}`,
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