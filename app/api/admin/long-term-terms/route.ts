import { NextResponse } from 'next/server';
import { longTermService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

const MAX_MONTHS = 60;

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    return NextResponse.json(longTermService.listAllTerms());
  } catch (error) {
    console.error('Error listing long-term terms:', error);
    return NextResponse.json({ error: 'Не удалось получить сроки' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const data = await request.json();
    const months = Math.round(Number(data.months));

    if (!Number.isFinite(months) || months < 1 || months > MAX_MONTHS) {
      return NextResponse.json(
        { error: `Срок должен быть от 1 до ${MAX_MONTHS} месяцев` },
        { status: 400 }
      );
    }

    const exists = longTermService.listAllTerms().some(t => t.months === months);
    if (exists) {
      return NextResponse.json({ error: `Срок «${months} мес» уже есть` }, { status: 409 });
    }

    const label = typeof data.label === 'string' && data.label.trim()
      ? data.label.trim().slice(0, 40)
      : null;

    return NextResponse.json(longTermService.createTerm(months, label));
  } catch (error) {
    console.error('Error creating long-term term:', error);
    return NextResponse.json({ error: 'Не удалось создать срок' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Не указан срок' }, { status: 400 });

    const removed = longTermService.deleteTerm(String(id));
    if (!removed) return NextResponse.json({ error: 'Срок не найден' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting long-term term:', error);
    return NextResponse.json({ error: 'Не удалось удалить срок' }, { status: 500 });
  }
}
