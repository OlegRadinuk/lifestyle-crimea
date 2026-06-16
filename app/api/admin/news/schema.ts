import { z } from 'zod';

// cover_image: либо пусто/undefined, либо строка строго из нашей папчи новостей.
// Не даём подсунуть произвольный путь/URL через JSON-режим.
const coverImage = z
  .union([
    z.literal(''),
    z.string().startsWith('/images/news/', 'cover_image должен начинаться с /images/news/'),
  ])
  .optional()
  .nullable();

// Базовые поля. В PATCH все опциональны (partial), в POST title обязателен.
const baseShape = {
  title: z.string().min(1, 'Заголовок обязателен').max(300, 'Заголовок ≤ 300 символов'),
  slug: z.string().max(200, 'slug ≤ 200 символов').optional(),
  excerpt: z.string().max(1000, 'Анонс ≤ 1000 символов').nullable().optional(),
  content: z.string().max(200000, 'Контент ≤ 200000 символов').nullable().optional(),
  cover_image: coverImage,
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  published_at: z.string().nullable().optional(),
};

// POST — создание новости (title обязателен).
export const NewsCreateSchema = z.object(baseShape).strict();

// PATCH — частичное обновление (все поля опциональны, включая title).
export const NewsUpdateSchema = z
  .object({
    ...baseShape,
    title: z.string().min(1, 'Заголовок не может быть пустым').max(300, 'Заголовок ≤ 300 символов').optional(),
  })
  .strict();

export type NewsCreateInput = z.infer<typeof NewsCreateSchema>;
export type NewsUpdateInput = z.infer<typeof NewsUpdateSchema>;
