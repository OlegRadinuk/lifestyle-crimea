import { z } from 'zod';

// Категории строго из трёх допустимых значений.
const category = z.enum(['apartment', 'service', 'infrastructure']);

// icon: ключ иконки из набора. Опционально/nullable, до 64 символов.
// Конкретный ключ может быть неизвестен на сервере — фолбэк делает страница,
// поэтому здесь валидируем только базовую форму строки.
const icon = z
  .union([z.literal(''), z.string().max(64, 'icon ≤ 64 символов')])
  .optional()
  .nullable();

const baseShape = {
  category,
  title: z.string().min(1, 'Название обязательно').max(200, 'Название ≤ 200 символов'),
  icon,
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
};

// POST — создание (category и title обязательны).
export const ServiceItemCreateSchema = z.object(baseShape).strict();

// PATCH — частичное обновление (все поля опциональны).
export const ServiceItemUpdateSchema = z
  .object({
    ...baseShape,
    category: category.optional(),
    title: z.string().min(1, 'Название не может быть пустым').max(200, 'Название ≤ 200 символов').optional(),
  })
  .strict();

export type ServiceItemCreateInput = z.infer<typeof ServiceItemCreateSchema>;
export type ServiceItemUpdateInput = z.infer<typeof ServiceItemUpdateSchema>;
