'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

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

export type BookingMode = 'daily' | 'long';

type Props = {
  apartment: {
    id: string;
    title: string;
    price_base?: number;
    long_term_price?: number;
  };
  initialRange: DateRange | null;
  initialGuests: number;
  onClose: () => void;
  onConfirm: (data: BookingResult) => void;
  priceOverride?: number; // предрассчитанная итоговая сумма (с сезоном/скидкой)
  mode?: BookingMode; // 'long' = заявка на длительную аренду, без расчёта по ночам
  longTermMinDays?: number;
  longTermTermId?: string; // срок, выбранный «сосиской» в каталоге
  longTermMonths?: number;
};

/* ===== helpers ===== */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getNights(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY));
}

function calculatePrice(params: {
  from: Date;
  to: Date;
  guests: number;
  meals: Meals;
  basePricePerNight: number;
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
  priceOverride,
  mode = 'daily',
  longTermMinDays = 30,
  longTermTermId,
  longTermMonths,
}: Props) {
  const router = useRouter();
  const isLong = mode === 'long';
  const [dates] = useState<DateRange | null>(initialRange);
  const [guests, setGuests] = useState(initialGuests);
  const [meals, setMeals] = useState<Meals>('none');
  const [pdConsent, setPdConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Поля режима долгосрочной аренды. Срок предзаполнен тем, что гость выбрал
  // «сосиской» в каталоге, но в форме его ещё можно поправить.
  const [moveInDate, setMoveInDate] = useState('');
  const [months, setMonths] = useState(longTermMonths ?? 3);
  const [longComment, setLongComment] = useState('');
  const [moveInError, setMoveInError] = useState('');

  const basePrice = apartment.price_base || 8000;
  const monthlyPrice = apartment.long_term_price || 0;

  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '+7',
    email: '',
  });

  const price = useMemo(() => {
    if (!dates) return null;
    const nights = getNights(dates.from, dates.to);
    let mealPerGuest = 0;
    if (meals === 'breakfast') mealPerGuest = 1000;
    if (meals === 'breakfast_dinner') mealPerGuest = 2000;
    const mealsTotal = mealPerGuest * guests * nights;
    // Если есть предрассчитанная цена из календаря (с сезоном/скидкой) — используем её
    if (priceOverride !== undefined) {
      return {
        nights,
        basePerNight: Math.round(priceOverride / nights),
        baseTotal: priceOverride,
        mealsTotal,
        total: priceOverride + mealsTotal,
      };
    }
    return calculatePrice({
      from: dates.from,
      to: dates.to,
      guests,
      meals,
      basePricePerNight: basePrice,
    });
  }, [dates, guests, meals, basePrice, priceOverride]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      setMounted(false);
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
      setPhoneError('Укажите телефон для связи');
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!dates || !price) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const checkInStr = `${dates.from.getFullYear()}-${String(dates.from.getMonth() + 1).padStart(2, '0')}-${String(dates.from.getDate()).padStart(2, '0')}`;
      const checkOutStr = `${dates.to.getFullYear()}-${String(dates.to.getMonth() + 1).padStart(2, '0')}-${String(dates.to.getDate()).padStart(2, '0')}`;

      const checkResponse = await fetch(
        `/api/availability-travelline/${apartment.id}?checkIn=${checkInStr}&checkOut=${checkOutStr}`
      );
      const checkData = await checkResponse.json();

      if (!checkData.isAvailable) {
        alert('К сожалению, эти даты уже заняты.');
        setIsSubmitting(false);
        return;
      }

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
          pdConsentAt: new Date().toISOString(),
          pdConsentVersion: '2026-04-21',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Ошибка при бронировании');
        setIsSubmitting(false);
        return;
      }

      // Уведомление в Telegram отправляет сервер в /api/bookings.
      // Раньше оно уходило отсюда и упиралось в админ-авторизацию (401) —
      // ошибка гасилась в catch, и заявки с сайта не доходили до менеджера.

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

  const handleLongTermSubmit = async () => {
    if (!guestInfo.firstName.trim()) {
      alert('Введите имя');
      return;
    }
    if (guestInfo.phone.replace(/\D/g, '').length < 10) {
      setPhoneError('Укажите телефон для связи');
      return;
    }
    if (!moveInDate) {
      setMoveInError('Укажите желаемую дату заезда');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings/long-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: apartment.id,
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          guestPhone: guestInfo.phone,
          guestEmail: guestInfo.email || null,
          moveInDate,
          months,
          termId: longTermTermId,
          guestsCount: guests,
          comment: longComment,
          pdConsentAt: new Date().toISOString(),
          pdConsentVersion: '2026-04-21',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Не удалось отправить заявку');
        setIsSubmitting(false);
        return;
      }

      onConfirm({
        apartment,
        range: dates ?? { from: new Date(moveInDate), to: new Date(moveInDate) },
        guests,
        meals: 'none',
        totalPrice: data.request?.estimatedTotal ?? 0,
        guest: guestInfo,
      });

      alert('✅ Заявка отправлена! Менеджер свяжется с вами в ближайшее время.');
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error sending long-term request:', error);
      alert('❌ Ошибка при отправке заявки.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        <div className="booking-modal__header">
          <h2>{isLong ? 'Заявка на длительную аренду' : 'Бронирование'}</h2>
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
              {isLong ? (
                monthlyPrice > 0 && (
                  <p className="booking-price-info">
                    {monthlyPrice.toLocaleString('ru-RU')} ₽/мес · от {longTermMinDays} суток
                  </p>
                )
              ) : (
                apartment.price_base && (
                  <p className="booking-price-info">Базовая цена: {apartment.price_base.toLocaleString('ru-RU')} ₽/ночь</p>
                )
              )}
            </section>

            {isLong ? (
              <section>
                <h3>Когда и на сколько</h3>
                <div className="long-fields">
                  <div>
                    <label className="long-label" htmlFor="lt-movein">Желаемая дата заезда *</label>
                    <input
                      id="lt-movein"
                      type="date"
                      value={moveInDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        setMoveInDate(e.target.value);
                        setMoveInError('');
                      }}
                      disabled={isSubmitting}
                      style={moveInError ? { borderColor: '#c62828' } : undefined}
                      aria-describedby={moveInError ? 'movein-error' : undefined}
                    />
                    {moveInError && (
                      <p id="movein-error" className="field-error" aria-live="polite">
                        {moveInError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="long-label" htmlFor="lt-months">Срок аренды *</label>
                    <select
                      id="lt-months"
                      className="meals-select"
                      value={months}
                      onChange={e => setMonths(Number(e.target.value))}
                      disabled={isSubmitting}
                    >
                      {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map(m => (
                        <option key={m} value={m}>
                          {m} {m === 1 ? 'месяц' : m < 5 ? 'месяца' : 'месяцев'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <h3>Даты проживания</h3>
                {dates && (
                  <p className="booking-dates">
                    {formatDate(dates.from)} — {formatDate(dates.to)}
                  </p>
                )}
              </section>
            )}

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

            {!isLong && (
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
            )}

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
                <div>
                  <input
                    placeholder="+7 (999) 123 45 67 *"
                    value={guestInfo.phone}
                    onChange={e => {
                      setGuestInfo({ ...guestInfo, phone: formatPhone(e.target.value) });
                      setPhoneError('');
                    }}
                    disabled={isSubmitting}
                    required
                    aria-describedby={phoneError ? 'phone-error' : undefined}
                    style={phoneError ? { borderColor: '#c62828' } : undefined}
                  />
                  {phoneError && (
                    <p id="phone-error" className="field-error" aria-live="polite">
                      {phoneError}
                    </p>
                  )}
                </div>
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

              {isLong && (
                <textarea
                  className="long-comment"
                  placeholder="Комментарий: кто будет жить, нужна ли парковка, животные, пожелания по срокам…"
                  value={longComment}
                  onChange={e => setLongComment(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  maxLength={1000}
                />
              )}
            </section>
          </div>

          <div className="booking-modal__right">
            {isLong ? (
              <>
                {monthlyPrice > 0 ? (
                  <>
                    <div className="price-row">
                      <span>
                        {monthlyPrice.toLocaleString('ru-RU')} ₽ × {months}{' '}
                        {months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}
                      </span>
                      <span>{(monthlyPrice * months).toLocaleString('ru-RU')} ₽</span>
                    </div>

                    <div className="price-divider" />

                    <div className="price-total">
                      <span>Ориентировочно</span>
                      <strong>{(monthlyPrice * months).toLocaleString('ru-RU')} ₽</strong>
                    </div>
                  </>
                ) : (
                  <div className="price-empty">Цену уточнит менеджер</div>
                )}

                <div className="price-notice">
                  * Это не бронирование, а заявка. Депозит, коммунальные платежи и порядок
                  оплаты менеджер согласует с вами лично. Минимальный срок — {longTermMinDays} суток.
                </div>
              </>
            ) : !price ? (
              <div className="price-empty">Нет данных для расчёта</div>
            ) : (
              <>
                <div className="price-row">
                  <span>
                    {price.basePerNight.toLocaleString('ru-RU')} ₽ × {price.nights}{' '}
                    {price.nights === 1
                      ? 'ночь'
                      : price.nights <= 4
                      ? 'ночи'
                      : 'ночей'}
                  </span>
                  <span>{price.baseTotal.toLocaleString('ru-RU')} ₽</span>
                </div>

                {meals !== 'none' && (
                  <div className="price-row">
                    <span>
                      Питание (
                      {meals === 'breakfast' ? 'завтрак' : 'завтрак + ужин'})
                    </span>
                    <span>{price.mealsTotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}

                <div className="price-divider" />

                <div className="price-total">
                  <span>Итого</span>
                  <strong>{price.total.toLocaleString('ru-RU')} ₽</strong>
                </div>

                <div className="price-notice">
                  * Оплата при заезде наличными или картой
                </div>
              </>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '13px',
                color: '#555',
                lineHeight: '1.5',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              <input
                type="checkbox"
                checked={pdConsent}
                onChange={e => setPdConsent(e.target.checked)}
                disabled={isSubmitting}
                style={{ marginTop: '3px', flexShrink: 0, accentColor: '#139AB6' }}
              />
              <span>
                Я согласен на{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#139AB6', textDecoration: 'underline' }}
                  onClick={e => e.stopPropagation()}
                >
                  обработку персональных данных
                </a>
              </span>
            </label>

            <button
              className="confirm-booking"
              disabled={isSubmitting || !pdConsent || (!isLong && !price)}
              onClick={isLong ? handleLongTermSubmit : handleConfirm}
            >
              {isSubmitting ? (
                <span className="loading-spinner">⏳ Отправляем...</span>
              ) : isLong ? (
                'Отправить заявку'
              ) : (
                'Подтвердить бронирование'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  
  return createPortal(modalContent, document.body);
}