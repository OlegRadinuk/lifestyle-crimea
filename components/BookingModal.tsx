'use client';

import { useEffect, useMemo, useState } from 'react';

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
  };
  initialRange: DateRange | null;
  initialGuests: number;
  onClose: () => void;
  onConfirm: (data: BookingResult) => void;
};

/* ===== helpers ===== */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getNights(from: Date, to: Date) {
  return Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
  );
}

function getSeasonPrice(date: Date) {
  const month = date.getMonth() + 1;

  if (month >= 6 && month <= 9) return 15000;
  if (month === 5 || month === 10) return 11000;
  return 8000;
}

function calculatePrice(params: {
  from: Date;
  to: Date;
  guests: number;
  meals: Meals;
}) {
  const { from, to, guests, meals } = params;

  const nights = getNights(from, to);
  const basePerNight = getSeasonPrice(from);
  const baseTotal = basePerNight * nights;

  let mealPerGuest = 0;
  if (meals === 'breakfast') mealPerGuest = 1000;
  if (meals === 'breakfast_dinner') mealPerGuest = 2000;

  const mealsTotal = mealPerGuest * guests * nights;

  return {
    nights,
    basePerNight,
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
  const [dates] = useState<DateRange | null>(initialRange);
  const [guests, setGuests] = useState(initialGuests);
  const [meals, setMeals] = useState<Meals>('none');

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
    });
  }, [dates, guests, meals]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleConfirm = () => {
    if (!dates || !price) return;

    onConfirm({
      apartment,
      range: dates,
      guests,
      meals,
      totalPrice: price.total,
      guest: guestInfo,
    });
  };

  return (
  <div
    className="booking-modal-overlay"
    onClick={onClose}
  >
    <div
      className="booking-modal"
      onClick={e => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="booking-modal__header">
        <h2>Бронирование</h2>
        <button onClick={onClose} className="booking-modal__close">
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div className="booking-modal__content">
          <div className="booking-modal__left">
            <section>
              <h3>Апартамент</h3>
              <p className="booking-apartment-title">{apartment.title}</p>
            </section>

            <section>
              <h3>Даты проживания</h3>
              {dates && (
                <p>{formatDate(dates.from)} — {formatDate(dates.to)}</p>
              )}
            </section>

            <section>
  <h3>Гости</h3>

  <div className="counter">
    <button
      onClick={() => setGuests(g => Math.max(1, g - 1))}
      disabled={guests <= 1}
    >
      −
    </button>

    <span>{guests}</span>

    <button
      onClick={() => setGuests(g => Math.min(4, g + 1))}
      disabled={guests >= 4}
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
                  placeholder="Имя"
                  value={guestInfo.firstName}
                  onChange={e => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                />
                <input
                  placeholder="Фамилия"
                  value={guestInfo.lastName}
                  onChange={e => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                />
                <input
                  placeholder="+7 (999) 123 45 67"
                  value={guestInfo.phone}
                  onChange={e => setGuestInfo({ ...guestInfo, phone: formatPhone(e.target.value) })}
                />
                <input
                  placeholder="Email"
                  value={guestInfo.email}
                  onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })}
                />
              </div>
            </section>
          </div>

          <div className="booking-modal__right">
  {!price ? (
    <div>Нет данных для расчёта</div>
  ) : (
    <>
      <div className="price-row">
        <span>
          {price.basePerNight.toLocaleString()} ₽ × {price.nights} ночей
        </span>
        <span>{price.baseTotal.toLocaleString()} ₽</span>
      </div>

      {meals !== 'none' && (
        <div className="price-row">
          <span>
            Питание ({meals === 'breakfast' ? 'завтрак' : 'завтрак + ужин'})
          </span>
          <span>{price.mealsTotal.toLocaleString()} ₽</span>
        </div>
      )}

      <div className="price-divider" />

      <div className="price-total">
        <span>Итого</span>
        <strong>{price.total.toLocaleString()} ₽</strong>
      </div>
    </>
  )}

  <button
    className="confirm-booking"
    disabled={!price}
    onClick={handleConfirm}
  >
    Подтвердить бронирование
  </button>
</div>
        </div>
      </div>
    </div>
  );
}
