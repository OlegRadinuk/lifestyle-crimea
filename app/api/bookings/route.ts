import { NextRequest, NextResponse } from 'next/server';
import { bookingService, logService } from '@/lib/db';
import { notifyTelegram } from '@/lib/telegram-notify';
import { APARTMENTS } from '@/data/apartments';
import { v4 as uuidv4 } from 'uuid';

function formatRuDate(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export async function POST(request: NextRequest) {
  let apartmentId: string | undefined;

  try {
    const body = await request.json();
    apartmentId = body.apartmentId;

    const { checkIn, checkOut, guestsCount, guestName, guestPhone, guestEmail, pdConsentAt, pdConsentVersion } = body;

    if (!apartmentId || !checkIn || !checkOut || !guestsCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apartment = APARTMENTS.find(a => a.id === apartmentId);
    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    // ИСПРАВЛЕНО: maxGuests → max_guests
    if (guestsCount > apartment.max_guests) {
      return NextResponse.json({ error: `Maximum ${apartment.max_guests} guests allowed` }, { status: 400 });
    }

    const isAvailable = bookingService.checkAvailability(apartmentId, checkIn, checkOut);
    if (!isAvailable) {
      return NextResponse.json({ error: 'Dates are not available' }, { status: 409 });
    }

    // ИСПРАВЛЕНО: priceBase → price_base
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = apartment.price_base * nights;

    const pdConsentIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    const booking = bookingService.createBooking({
      apartmentId,
      guestName,
      guestPhone,
      guestEmail,
      checkIn,
      checkOut,
      guestsCount,
      totalPrice,
      pdConsentAt: pdConsentAt || null,
      pdConsentIp,
      pdConsentVersion: pdConsentVersion || null,
    });

    // Логируем успешное создание брони
    logService.addSyncLog({
      sourceName: 'website',
      apartmentId,
      action: 'export',
      status: 'success',
      eventsCount: 1,
      durationMs: 0,
    });

    // Уведомление менеджеру — на сервере. Из браузера гостя оно упиралось
    // в админ-авторизацию /api/telegram/send и молча терялось.
    await notifyTelegram(
      `🔔 <b>Новое бронирование!</b>\n\n` +
        `🏠 <b>Апартамент:</b> ${apartment.title}\n` +
        `📅 <b>Даты:</b> ${formatRuDate(checkIn)} — ${formatRuDate(checkOut)}\n` +
        `🌙 <b>Ночей:</b> ${nights}\n` +
        `👥 <b>Гостей:</b> ${guestsCount}\n` +
        `💰 <b>Сумма:</b> ${totalPrice.toLocaleString('ru-RU')} ₽\n\n` +
        `👤 <b>Гость:</b> ${guestName || '—'}\n` +
        `📞 <b>Телефон:</b> ${guestPhone || '—'}\n` +
        (guestEmail ? `📧 <b>Email:</b> ${guestEmail}\n` : '') +
        `\n🆔 <b>ID брони:</b> ${booking.id}`,
      { bookingId: booking.id, type: 'new_booking' }
    );

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Логируем ошибку
    logService.addSyncLog({
      sourceName: 'website',
      apartmentId: apartmentId,
      action: 'export',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      durationMs: 0,
    });

    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}