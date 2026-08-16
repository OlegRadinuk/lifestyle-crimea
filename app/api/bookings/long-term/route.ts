import { NextRequest, NextResponse } from 'next/server';
import { db, settingsService, logService, longTermService } from '@/lib/db';
import { notifyTelegram } from '@/lib/telegram-notify';
import { v4 as uuidv4 } from 'uuid';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MONTHS = 24;

/**
 * Заявка на длительную аренду.
 * Это лид, а не бронь: статус 'pending' и rental_type 'long_term',
 * поэтому календарь занятости она НЕ блокирует (checkAvailability
 * считает только status='confirmed').
 */
export async function POST(request: NextRequest) {
  let apartmentId: string | undefined;

  try {
    const body = await request.json();
    apartmentId = body.apartmentId;

    const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : '';
    const guestPhone = typeof body.guestPhone === 'string' ? body.guestPhone.trim() : '';
    const guestEmail = typeof body.guestEmail === 'string' ? body.guestEmail.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : '';
    const moveInDate = typeof body.moveInDate === 'string' ? body.moveInDate : '';
    const months = Math.round(Number(body.months));
    const guestsCount = Math.max(1, Math.round(Number(body.guestsCount) || 1));

    if (!apartmentId || !guestName || !guestPhone) {
      return NextResponse.json({ error: 'Укажите имя и телефон' }, { status: 400 });
    }

    if (guestPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Некорректный телефон' }, { status: 400 });
    }

    if (!DATE_RE.test(moveInDate)) {
      return NextResponse.json({ error: 'Укажите желаемую дату заезда' }, { status: 400 });
    }

    if (!Number.isFinite(months) || months < 1 || months > MAX_MONTHS) {
      return NextResponse.json({ error: 'Некорректный срок аренды' }, { status: 400 });
    }

    // Цену берём из БД — она источник истины, менеджер правит её в админке
    const apartment = db.prepare(`
      SELECT id, title, long_term_enabled, long_term_price, max_guests
      FROM apartments
      WHERE id = ? AND is_active = 1 AND deleted_at IS NULL
    `).get(apartmentId) as {
      id: string;
      title: string;
      long_term_enabled: number;
      long_term_price: number;
      max_guests: number;
    } | undefined;

    if (!apartment) {
      return NextResponse.json({ error: 'Апартамент не найден' }, { status: 404 });
    }

    /* Цену берём по выбранному сроку из apartment_long_term_prices — БД источник
       истины, тело запроса на цену не влияет. Если гость прислал срок, которого
       уже нет (менеджер удалил, пока была открыта вкладка), падаем на самую
       дешёвую доступную цену, а не отбиваем заявку. */
    const prices = longTermService.pricesForApartment(apartmentId);
    const available = Object.values(prices).filter(p => p > 0);

    if (!apartment.long_term_enabled || available.length === 0) {
      return NextResponse.json(
        { error: 'Этот апартамент сейчас не сдаётся на длительный срок' },
        { status: 409 }
      );
    }

    const termId = typeof body.termId === 'string' ? body.termId : '';
    const monthlyPrice = prices[termId] > 0 ? prices[termId] : Math.min(...available);

    const minDays = settingsService.getLongTermMinDays();
    const estimatedTotal = monthlyPrice * months;

    // check_out — ориентировочный, только чтобы заявка легла в общую таблицу
    const checkIn = moveInDate;
    const checkOutDate = new Date(`${moveInDate}T00:00:00Z`);
    checkOutDate.setUTCMonth(checkOutDate.getUTCMonth() + months);
    const checkOut = checkOutDate.toISOString().split('T')[0];

    const id = uuidv4();
    const pdConsentIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    db.prepare(`
      INSERT INTO bookings (
        id, apartment_id, guest_name, guest_phone, guest_email,
        check_in, check_out, guests_count, total_price,
        status, source, comment, rental_type, long_term_months,
        pd_consent_at, pd_consent_ip, pd_consent_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'website_long_term', ?, 'long_term', ?, ?, ?, ?)
    `).run(
      id,
      apartmentId,
      guestName,
      guestPhone,
      guestEmail || null,
      checkIn,
      checkOut,
      guestsCount,
      estimatedTotal,
      comment || null,
      months,
      body.pdConsentAt || null,
      pdConsentIp,
      body.pdConsentVersion || null
    );

    logService.addSyncLog({
      sourceName: 'website_long_term',
      apartmentId,
      action: 'export',
      status: 'success',
      eventsCount: 1,
      durationMs: 0,
    });

    // Уведомление менеджеру — на сервере, чтобы заявка не терялась
    await notifyTelegram(
      `🏡 <b>Заявка на длительную аренду</b>\n\n` +
        `🏠 <b>Апартамент:</b> ${apartment.title}\n` +
        `💰 <b>Цена:</b> ${monthlyPrice.toLocaleString('ru-RU')} ₽/мес\n` +
        `📅 <b>Заезд:</b> ${checkIn}\n` +
        `⏳ <b>Срок:</b> ${months} мес. (мин. ${minDays} суток)\n` +
        `👥 <b>Гостей:</b> ${guestsCount}\n` +
        `🧮 <b>Ориентировочно:</b> ${estimatedTotal.toLocaleString('ru-RU')} ₽\n\n` +
        `👤 <b>Гость:</b> ${guestName}\n` +
        `📞 <b>Телефон:</b> ${guestPhone}\n` +
        (guestEmail ? `📧 <b>Email:</b> ${guestEmail}\n` : '') +
        (comment ? `💬 <b>Комментарий:</b> ${comment}\n` : '') +
        `\n🆔 <b>ID заявки:</b> ${id}`,
      { bookingId: id, type: 'long_term_request' }
    );

    return NextResponse.json({
      success: true,
      request: { id, monthlyPrice, months, estimatedTotal, checkIn, checkOut },
    });
  } catch (error) {
    console.error('Error creating long-term request:', error);

    logService.addSyncLog({
      sourceName: 'website_long_term',
      apartmentId,
      action: 'export',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      durationMs: 0,
    });

    return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 500 });
  }
}
