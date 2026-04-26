import { NextResponse } from 'next/server';
import { z } from 'zod';
import { seasonTemplateService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

// GET /api/admin/parking-price
// Возвращает все сезонные шаблоны с полем parking_price
export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const templates = seasonTemplateService.getAll();
  return NextResponse.json(
    templates.map(({ id, name, date_from, date_to, sort_order, parking_price }) => ({
      id,
      name,
      date_from,
      date_to,
      sort_order,
      parking_price,
    }))
  );
}

const ParkingPriceSchema = z.object({
  templateId: z.string().min(1, 'templateId is required'),
  price: z
    .number()
    .int('price must be an integer')
    .nonnegative('price must be >= 0')
    .nullable(),
});

// POST /api/admin/parking-price
// Body: { templateId: string, price: number | null }
// Устанавливает цену парковки для конкретного сезонного шаблона
export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ParkingPriceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const { templateId, price } = parsed.data;

  try {
    seasonTemplateService.updateParkingPrice(templateId, price);
    return NextResponse.json({ success: true, templateId, parking_price: price });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[parking-price] updateParkingPrice error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
