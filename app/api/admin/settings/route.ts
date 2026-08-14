import { NextResponse } from 'next/server';
import { settingsService, DEFAULT_LONG_TERM_MIN_DAYS } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

// Настройки, которые менеджер может править из админки.
// Всё, чего нет в этом списке, через API не меняется.
const EDITABLE = {
  long_term_min_days: {
    parse: (raw: unknown): string | null => {
      const n = Math.round(Number(raw));
      if (!Number.isFinite(n) || n < 1 || n > 365) return null;
      return String(n);
    },
  },
} as const;

type EditableKey = keyof typeof EDITABLE;

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    return NextResponse.json({
      long_term_min_days: settingsService.getLongTermMinDays(),
    });
  } catch (error) {
    console.error('Error reading settings:', error);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const data = await request.json();
    const applied: string[] = [];

    for (const key of Object.keys(EDITABLE) as EditableKey[]) {
      if (data[key] === undefined) continue;
      const value = EDITABLE[key].parse(data[key]);
      if (value === null) {
        return NextResponse.json(
          { error: `Некорректное значение для «${key}»` },
          { status: 400 }
        );
      }
      settingsService.set(key, value);
      applied.push(key);
    }

    if (applied.length === 0) {
      return NextResponse.json({ error: 'Нечего сохранять' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      long_term_min_days: settingsService.getLongTermMinDays(),
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', fallback_min_days: DEFAULT_LONG_TERM_MIN_DAYS },
      { status: 500 }
    );
  }
}
