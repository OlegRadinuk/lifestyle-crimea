import { NextResponse } from 'next/server';
import { longTermService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

type Params = { params: Promise<{ id: string }> };

/** Сроки + цена апартамента под каждый (null = не сдаём на этот срок). */
export async function GET(request: Request, { params }: Params) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const prices = longTermService.pricesForApartment(id);

    return NextResponse.json(
      longTermService.listAllTerms().map(term => ({
        ...term,
        price_per_month: prices[term.id] ?? null,
      }))
    );
  } catch (error) {
    console.error('Error reading long-term prices:', error);
    return NextResponse.json({ error: 'Не удалось получить цены' }, { status: 500 });
  }
}

/** Цена 0 или пустая строка = убрать срок у этого апартамента. */
export async function POST(request: Request, { params }: Params) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const data = await request.json();

    if (!data.termId) {
      return NextResponse.json({ error: 'Не указан срок' }, { status: 400 });
    }

    const price = Math.round(Number(data.price) || 0);
    if (price < 0 || price > 100_000_000) {
      return NextResponse.json({ error: 'Некорректная цена' }, { status: 400 });
    }

    longTermService.setPrice(id, String(data.termId), price);

    return NextResponse.json({ success: true, prices: longTermService.pricesForApartment(id) });
  } catch (error) {
    console.error('Error saving long-term price:', error);
    return NextResponse.json({ error: 'Не удалось сохранить цену' }, { status: 500 });
  }
}
