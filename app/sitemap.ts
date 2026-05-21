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

  return [...staticPages, ...apartmentPages];
}