import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://lovelifestyle.ru'
  
  // Статические страницы
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/apartments`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]

  // Динамические страницы апартаментов из БД
  const apartments = db.prepare(`
    SELECT id, updated_at FROM apartments WHERE is_active = 1
  `).all() as { id: string; updated_at: string }[]

  const apartmentPages = apartments.map((apt) => ({
    url: `${baseUrl}/apartments/${apt.id}`,
    lastModified: new Date(apt.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...apartmentPages]
}
