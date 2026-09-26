import { NextRequest, NextResponse } from 'next/server';
import { db, logService } from '@/lib/db';
import { notifyTelegram } from '@/lib/telegram-notify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Короткая заявка на длительную аренду — без выбора апартамента.
 *
 * Зачем отдельно от /api/bookings/long-term: тот требует apartmentId, точную дату
 * заезда и число месяцев. Для человека, пришедшего по рекламе «от 45 000 ₽ в месяц»,
 * это всё решения, которых он ещё не принял, — и за месяц через ту форму не пришло
 * ни одной заявки при 88 кликах.
 *
 * Здесь обязателен только телефон. Срок и сроки заезда — подсказки менеджеру,
 * свободный текст из фиксированного набора, а не данные для расчёта.
 * Цену не считаем: разговор о цене ведёт менеджер, он же согласует депозит.
 */

/* Допустимые варианты — ровно те, что в форме. Чужое значение не пишем:
   поле уходит менеджеру в Telegram, и туда не должно попадать ничего,
   что прислал клиент в свободной форме. */
const TERMS = ['1 месяц', '2–3 месяца', 'полгода', 'год и дольше', 'ещё не решил'];
const WHENS = ['в этом месяце', 'через 1–2 месяца', 'позже', 'пока просто смотрю'];

const PD_CONSENT_VERSION = '2026-04-21';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const guestName = typeof body.guestName === 'string' ? body.guestName.trim().slice(0, 100) : '';
    const guestPhone = typeof body.guestPhone === 'string' ? body.guestPhone.trim().slice(0, 30) : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : '';

    const termHint = TERMS.includes(body.termHint) ? body.termHint : '';
    const whenHint = WHENS.includes(body.whenHint) ? body.whenHint : '';

    if (guestPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Укажите телефон' }, { status: 400 });
    }

    /* Согласие проверяем на сервере, а не только галочкой в вёрстке: без него
       запись персданных незаконна, а вёрстку можно обойти. */
    if (!body.pdConsentAt) {
      return NextResponse.json(
        { error: 'Нужно согласие на обработку персональных данных' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const pdConsentIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    db.prepare(`
      INSERT INTO long_term_leads (
        id, guest_name, guest_phone, term_hint, when_hint, comment,
        pd_consent_at, pd_consent_ip, pd_consent_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      guestName || null,
      guestPhone,
      termHint || null,
      whenHint || null,
      comment || null,
      body.pdConsentAt,
      pdConsentIp,
      PD_CONSENT_VERSION
    );

    logService.addSyncLog({
      sourceName: 'website_long_lead',
      action: 'export',
      status: 'success',
      eventsCount: 1,
      durationMs: 0,
    });

    /* Уведомление на сервере, а не из браузера: заявка не должна теряться,
       если гость закрыл вкладку сразу после отправки. */
    await notifyTelegram(
      `🏡 <b>Заявка на длительную аренду</b> (короткая форма)\n\n` +
        (guestName ? `👤 <b>Имя:</b> ${guestName}\n` : '') +
        `📞 <b>Телефон:</b> ${guestPhone}\n` +
        (termHint ? `⏳ <b>Срок:</b> ${termHint}\n` : '') +
        (whenHint ? `📅 <b>Когда:</b> ${whenHint}\n` : '') +
        (comment ? `💬 <b>Комментарий:</b> ${comment}\n` : '') +
        `\n⚠️ Апартамент не выбран — подобрать вместе с гостем.\n` +
        `🆔 <b>ID:</b> ${id}`,
      { type: 'long_term_lead' }
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating long-term lead:', error);

    logService.addSyncLog({
      sourceName: 'website_long_lead',
      action: 'export',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      durationMs: 0,
    });

    return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 500 });
  }
}
