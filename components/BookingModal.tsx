'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ===== exports ===== */

export type DateRange = {
  from: Date;
  to: Date;
};

export type Meals = 'none' | 'breakfast' | 'breakfast_dinner';

export type BookingResult = {
  apartment: {
    id: string;
    title: string;
  };
  range: DateRange;
  guests: number;
  meals: Meals;
  totalPrice: number;
  guest: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
};

/* ===== props ===== */

type Props = {
  apartment: {
    id: string;
    title: string;
    price_base?: number; // Добавляем цену из базы
  };
  initialRange: DateRange | null;
  initialGuests: number;
  onClose: () => void;
  onConfirm: (data: BookingResult) => void;
};

/* ===== helpers ===== */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getNights(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY));
}

// Исправлено: используем реальную цену из базы
function calculatePrice(params: {
  from: Date;
  to: Date;
  guests: number;
  meals: Meals;
  basePricePerNight: number; // Добавляем цену из пропсов
}) {
  const { from, to, guests, meals, basePricePerNight } = params;
  const nights = getNights(from, to);
  const baseTotal = basePricePerNight * nights;

  let mealPerGuest = 0;
  if (meals === 'breakfast') mealPerGuest = 1000;
  if (meals === 'breakfast_dinner') mealPerGuest = 2000;

  const mealsTotal = mealPerGuest * guests * nights;

  return {
    nights,
    basePerNight: basePricePerNight,
    baseTotal,
    mealsTotal,
    total: baseTotal + mealsTotal,
  };
}

/* ===== utils ===== */

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const numbers = digits.replace(/^7|^8/, '').slice(0, 10);
  const parts = [
    numbers.slice(0, 3),
    numbers.slice(3, 6),
    numbers.slice(6, 8),
    numbers.slice(8, 10),
  ];

  let result = '+7';
  if (parts[0]) result += ` (${parts[0]})`;
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += ` ${parts[2]}`;
  if (parts[3]) result += ` ${parts[3]}`;
  return result;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/* ===== component ===== */

export default function BookingModal({
  apartment,
  initialRange,
  initialGuests,
  onClose,
  onConfirm,
}: Props) {
  const router = useRouter();
  const [dates] = useState<DateRange | null>(initialRange);
  const [guests, setGuests] = useState(initialGuests);
  const [meals, setMeals] = useState<Meals>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Если цена не передана, используем заглушку для обратной совместимости
  const basePrice = apartment.price_base || 8000;

  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '+7',
    email: '',
  });

  const price = useMemo(() => {
    if (!dates) return null;
    return calculatePrice({
      from: dates.from,
      to: dates.to,
      guests,
      meals,
      basePricePerNight: basePrice,
    });
  }, [dates, guests, meals, basePrice]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const validateForm = () => {
    if (!guestInfo.firstName.trim()) {
      alert('Введите имя');
      return false;
    }
    if (!guestInfo.lastName.trim()) {
      alert('Введите фамилию');
      return false;
    }
    if (guestInfo.phone.replace(/\D/g, '').length < 10) {
      alert('Введите корректный номер телефона');
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!dates || !price) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // РУЧНОЕ ФОРМАТИРОВАНИЕ ДАТ С УЧЁТОМ ЛОКАЛЬНОГО ЧАСОВОГО ПОЯСА
      const checkInStr = `${dates.from.getFullYear()}-${String(dates.from.getMonth() + 1).padStart(2, '0')}-${String(dates.from.getDate()).padStart(2, '0')}`;
      const checkOutStr = `${dates.to.getFullYear()}-${String(dates.to.getMonth() + 1).padStart(2, '0')}-${String(dates.to.getDate()).padStart(2, '0')}`;

      // ИСПРАВЛЕНО: используем правильный API для проверки доступности
      const checkResponse = await fetch(
        `/api/availability-travelline/${apartment.id}?checkIn=${checkInStr}&checkOut=${checkOutStr}`
      );
      const checkData = await checkResponse.json();

      if (!checkData.isAvailable) {
        alert('К сожалению, эти даты уже заняты.');
        setIsSubmitting(false);
        return;
      }

      // Создание брони
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apartmentId: apartment.id,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guestsCount: guests,
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          guestPhone: guestInfo.phone,
          guestEmail: guestInfo.email || null,
          totalPrice: price.total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Ошибка при бронировании');
        setIsSubmitting(false);
        return;
      }

      // Telegram уведомление
      try {
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:
              `🔔 <b>Новое бронирование!</b>\n\n` +
              `🏠 <b>Апартамент:</b> ${apartment.title}\n` +
              `📅 <b>Даты:</b> ${formatDate(dates.from)} - ${formatDate(dates.to)}\n` +
              `🌙 <b>Ночей:</b> ${price.nights}\n` +
              `👥 <b>Гостей:</b> ${guests}\n` +
              `🍽 <b>Питание:</b> ${
                meals === 'none'
                  ? 'Без питания'
                  : meals === 'breakfast'
                  ? 'Завтрак'
                  : 'Завтрак + ужин'
              }\n` +
              `💰 <b>Сумма:</b> ${price.total.toLocaleString()} ₽\n\n` +
              `👤 <b>Гость:</b> ${guestInfo.firstName} ${guestInfo.lastName}\n` +
              `📞 <b>Телефон:</b> ${guestInfo.phone}\n` +
              (guestInfo.email ? `📧 <b>Email:</b> ${guestInfo.email}\n\n` : '\n') +
              `🆔 <b>ID брони:</b> ${data.booking.id}`,
            bookingId: data.booking.id,
            type: 'new_booking',
          }),
        });
      } catch (telegramError) {
        console.error('Failed to send telegram notification:', telegramError);
      }

      onConfirm({
        apartment,
        range: dates,
        guests,
        meals,
        totalPrice: price.total,
        guest: guestInfo,
      });

      alert('✅ Бронирование подтверждено!');

      window.dispatchEvent(new CustomEvent('booking-completed', { 
        detail: { 
          apartmentId: apartment.id,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          timestamp: Date.now()
        } 
      }));

      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('❌ Ошибка при бронировании.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        <div className="booking-modal__header">
          <h2>Бронирование</h2>
          <button
            onClick={onClose}
            className="booking-modal__close"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="booking-modal__content">
          <div className="booking-modal__left">
            <section>
              <h3>Апартамент</h3>
              <p className="booking-apartment-title">{apartment.title}</p>
              {apartment.price_base && (
                <p className="booking-price-info">Базовая цена: {apartment.price_base.toLocaleString()} ₽/ночь</p>
              )}
            </section>

            <section>
              <h3>Даты проживания</h3>
              {dates && (
                <p className="booking-dates">
                  {formatDate(dates.from)} — {formatDate(dates.to)}
                </p>
              )}
            </section>

            <section>
              <h3>Гости</h3>
              <div className="counter">
                <button
                  onClick={() => setGuests(g => Math.max(1, g - 1))}
                  disabled={guests <= 1 || isSubmitting}
                >
                  −
                </button>
                <span>{guests}</span>
                <button
                  onClick={() => setGuests(g => Math.min(4, g + 1))}
                  disabled={guests >= 4 || isSubmitting}
                >
                  +
                </button>
              </div>
            </section>

            <section>
              <h3>Питание</h3>
              <select
                className="meals-select"
                value={meals}
                onChange={e => setMeals(e.target.value as Meals)}
                disabled={isSubmitting}
              >
                <option value="none">Без питания</option>
                <option value="breakfast">Завтрак</option>
                <option value="breakfast_dinner">Завтрак + ужин</option>
              </select>
            </section>

            <section>
              <h3>Данные гостя</h3>
              <div className="guest-grid">
                <input
                  placeholder="Имя *"
                  value={guestInfo.firstName}
                  onChange={e =>
                    setGuestInfo({ ...guestInfo, firstName: e.target.value })
                  }
                  disabled={isSubmitting}
                  required
                />
                <input
                  placeholder="Фамилия *"
                  value={guestInfo.lastName}
                  onChange={e =>
                    setGuestInfo({ ...guestInfo, lastName: e.target.value })
                  }
                  disabled={isSubmitting}
                  required
                />
                <input
                  placeholder="+7 (999) 123 45 67 *"
                  value={guestInfo.phone}
                  onChange={e =>
                    setGuestInfo({ ...guestInfo, phone: formatPhone(e.target.value) })
                  }
                  disabled={isSubmitting}
                  required
                />
                <input
                  placeholder="Email (необязательно)"
                  type="email"
                  value={guestInfo.email}
                  onChange={e =>
                    setGuestInfo({ ...guestInfo, email: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </section>
          </div>

          <div className="booking-modal__right">
            {!price ? (
              <div className="price-empty">Нет данных для расчёта</div>
            ) : (
              <>
                <div className="price-row">
                  <span>
                    {price.basePerNight.toLocaleString()} ₽ × {price.nights}{' '}
                    {price.nights === 1
                      ? 'ночь'
                      : price.nights <= 4
                      ? 'ночи'
                      : 'ночей'}
                  </span>
                  <span>{price.baseTotal.toLocaleString()} ₽</span>
                </div>

                {meals !== 'none' && (
                  <div className="price-row">
                    <span>
                      Питание (
                      {meals === 'breakfast' ? 'завтрак' : 'завтрак + ужин'})
                    </span>
                    <span>{price.mealsTotal.toLocaleString()} ₽</span>
                  </div>
                )}

                <div className="price-divider" />

                <div className="price-total">
                  <span>Итого</span>
                  <strong>{price.total.toLocaleString()} ₽</strong>
                </div>

                <div className="price-notice">
                  * Оплата при заезде наличными или картой
                </div>
              </>
            )}

            <button
              className="confirm-booking"
              disabled={!price || isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? (
                <span className="loading-spinner">⏳ Отправляем...</span>
              ) : (
                'Подтвердить бронирование'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}