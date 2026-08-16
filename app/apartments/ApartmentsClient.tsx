'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import BookingModal from '@/components/BookingModal';
import Footer from '@/components/Footer';
import { ApartmentClient, ApartmentSeason, LongTermTermClient } from '@/lib/types';
import './apartments.css';

/**
 * Цена за ночь на СЕГОДНЯ — то, что гость реально заплатит, если заедет сейчас.
 *
 * `price_base` для витрины не годится: это базовая ставка карточки, а поверх неё
 * менеджер выставляет сезоны (`apartment_pricing_seasons`). В июле 2026 база
 * показывала «от 3 700 ₽», тогда как сезон стоил 6 500–10 000: гость видел одну
 * цену в списке, выбирал даты — и она почти удваивалась.
 *
 * Берём сезон, который действует сегодня; если такого нет (дыра в календаре) —
 * честно падаем на базовую ставку.
 */
function currentNightlyPrice(
  seasons: ApartmentSeason[] | undefined,
  basePrice: number,
): number {
  if (!seasons || seasons.length === 0) return basePrice;
  const today = new Date();
  const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const s = seasons.find((s) => d >= s.date_from && d <= s.date_to);
  return s ? s.price_per_night : basePrice;
}

function calcSeasonalTotal(
  seasons: ApartmentSeason[] | undefined,
  hotDealEnabled: boolean | undefined,
  hotDealDiscount: number | undefined,
  hotDealFrom: string | null | undefined,
  hotDealTo: string | null | undefined,
  basePrice: number,
  checkInStr: string,
  checkOutStr: string,
): number {
  const cur = new Date(checkInStr + 'T00:00:00Z');
  const end = new Date(checkOutStr + 'T00:00:00Z');
  let total = 0;
  while (cur < end) {
    const d = cur.toISOString().split('T')[0];
    let price = basePrice;
    if (seasons && seasons.length > 0) {
      const s = seasons.find(s => d >= s.date_from && d <= s.date_to);
      if (s) price = s.price_per_night;
    }
    if (hotDealEnabled && hotDealDiscount) {
      const inRange = !hotDealFrom || !hotDealTo || (d >= hotDealFrom && d <= hotDealTo);
      if (inRange) price = Math.round(price * (1 - hotDealDiscount / 100));
    }
    total += price;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return total;
}

type RentalMode = 'daily' | 'long';

/** «3 месяца» / «Год» — берём подпись менеджера, иначе склоняем сами. */
function termTitle(term: LongTermTermClient): string {
  if (term.label) return term.label;
  const m = term.months;
  return `${m} ${getDeclension(m, 'месяц', 'месяца', 'месяцев')}`;
}

/** Для срока в один месяц «при аренде на месяц» звучит тавтологией — говорим «помесячно». */
function termPhrase(term: LongTermTermClient): string {
  if (term.months === 1) return 'помесячно';
  return `при аренде на ${termTitle(term).toLowerCase()}`;
}

interface ApartmentsClientProps {
  initialApartments: ApartmentClient[];
  longTermMinDays: number;
  longTermTerms: LongTermTermClient[];
}

export default function ApartmentsClient({
  initialApartments,
  longTermMinDays,
  longTermTerms,
}: ApartmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSearch, search: contextSearch } = useSearch();
  const { register, unregister } = useHeader();
  const { open } = usePhotoModal();

  // Состояние формы поиска
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [children, setChildren] = useState(0);
  const [formError, setFormError] = useState('');

  // Режим аренды: посуточно (по умолчанию) или долгосрочно
  const [rentalMode, setRentalMode] = useState<RentalMode>('daily');
  const isLongMode = rentalMode === 'long';

  // Выбранный срок долгосрочной аренды — общий для всего списка
  const [selectedTermId, setSelectedTermId] = useState<string>(longTermTerms[0]?.id ?? '');
  const selectedTerm = longTermTerms.find(t => t.id === selectedTermId) ?? longTermTerms[0] ?? null;

  // Цена апартамента за месяц при выбранном сроке. 0 = на этот срок не сдаётся.
  const priceForTerm = (apt: ApartmentClient, termId: string | undefined): number =>
    termId ? (apt.long_term_prices?.[termId] ?? 0) : 0;

  // Состояние апартаментов и доступности
  const [allApartments] = useState(initialApartments);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Состояние модалки бронирования
  const [bookingApartment, setBookingApartment] = useState<{
    id: string;
    title: string;
    price_base?: number;
    long_term_price?: number;
  } | null>(null);
  const [bookingMode, setBookingMode] = useState<RentalMode>('daily');
  const [bookingPriceOverride, setBookingPriceOverride] = useState<number | undefined>(undefined);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Инициализация из URL или контекста
  useEffect(() => {
    let urlCheckIn: string | null = null;
    let urlCheckOut: string | null = null;
    let urlGuests: string | null = null;
    let urlChildren: string | null = null;

    try {
      urlCheckIn = searchParams?.get('checkIn') || null;
      urlCheckOut = searchParams?.get('checkOut') || null;
      urlGuests = searchParams?.get('guests') || null;
      urlChildren = searchParams?.get('children') || null;
    } catch {
    }

    if (urlCheckIn && urlCheckOut && urlGuests) {
      setCheckIn(urlCheckIn);
      setCheckOut(urlCheckOut);
      setGuests(parseInt(urlGuests));
      setChildren(urlChildren ? parseInt(urlChildren) : 0);
    } else if (contextSearch) {
      setCheckIn(contextSearch.checkIn);
      setCheckOut(contextSearch.checkOut);
      setGuests(contextSearch.guests);
      setChildren(contextSearch.children ?? 0);
    }
  }, [searchParams, contextSearch]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    register('apartments-page', {
      mode: 'dark',
      priority: 20,
    });
    return () => unregister('apartments-page');
  }, [register, unregister]);

  // Проверка доступности
  const checkAvailability = useCallback(async () => {
    if (!checkIn || !checkOut) return;

    setCheckingAvailability(true);
    const available = new Set<string>();

    // Фильтруем по количеству гостей и детей
    // Студии с 3+ спальными местами принимают до 2 детей до 6 лет бесплатно
    const apartmentsToCheck = allApartments.filter(apt =>
      apt.max_guests >= guests && (children === 0 || apt.max_guests >= 3)
    );
    
    
    await Promise.all(
      apartmentsToCheck.map(async (apt) => {
        try {
          const response = await fetch(
            `/api/availability-travelline/${apt.id}?checkIn=${checkIn}&checkOut=${checkOut}&t=${Date.now()}`
          );
          const data = await response.json();
          if (data.isAvailable === true) {
            available.add(apt.id);
          }
        } catch (error) {
          console.error(`Error checking ${apt.id}:`, error);
        }
      })
    );

    setAvailableIds(available);
    setCheckingAvailability(false);
  }, [checkIn, checkOut, guests, children, allApartments]);

  // Запускаем проверку при изменении дат или количества гостей
  useEffect(() => {
    if (checkIn && checkOut) {
      checkAvailability();
    } else {
      setAvailableIds(new Set());
    }
  }, [checkIn, checkOut, guests, children, checkAvailability]);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      setFormError('Пожалуйста, выберите даты заезда и выезда');
      return;
    }
    
    if (guests < 1) {
      setFormError('Пожалуйста, укажите количество гостей');
      return;
    }

    setFormError('');

    // Обновляем URL и контекст
    const params = new URLSearchParams();
    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);
    params.set('guests', guests.toString());
    params.set('children', children.toString());
    router.push(`/apartments?${params.toString()}`);
    setSearch({ checkIn, checkOut, guests, children });

    // Скролл к результатам на мобилке
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setTimeout(() => {
        document.getElementById('ap-results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const handleBookingClick = async (apartment: ApartmentClient) => {
    if (!checkIn || !checkOut) {
      alert('Пожалуйста, выберите даты');
      return;
    }

    setCheckingId(apartment.id);

    try {
      const response = await fetch(
        `/api/availability-travelline/${apartment.id}?checkIn=${checkIn}&checkOut=${checkOut}&t=${Date.now()}`
      );
      const data = await response.json();

      if (data.isAvailable === true) {
        const priceOverride = calcSeasonalTotal(
          apartment.seasons,
          apartment.hot_deal_enabled,
          apartment.hot_deal_discount,
          apartment.hot_deal_date_from,
          apartment.hot_deal_date_to,
          apartment.price_base,
          checkIn,
          checkOut,
        );
        setBookingApartment({
          id: apartment.id,
          title: apartment.title,
          price_base: apartment.price_base,
        });
        setBookingMode('daily');
        setBookingPriceOverride(priceOverride > 0 ? priceOverride : undefined);
        setBookingOpen(true);
      } else {
        alert('Эти даты уже заняты. Пожалуйста, выберите другие даты.');
        setAvailableIds(prev => {
          const next = new Set(prev);
          next.delete(apartment.id);
          return next;
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Ошибка при проверке доступности');
    } finally {
      setCheckingId(null);
    }
  };

  // Долгосрочная аренда: заявка без календаря — сроки и условия менеджер обсуждает лично
  const handleLongTermClick = (apartment: ApartmentClient) => {
    setBookingApartment({
      id: apartment.id,
      title: apartment.title,
      price_base: apartment.price_base,
      long_term_price: priceForTerm(apartment, selectedTerm?.id),
    });
    setBookingMode('long');
    setBookingPriceOverride(undefined);
    setBookingOpen(true);
  };

  // Сортируем апартаменты: сначала доступные (по цене), потом недоступные (по цене)
  const sortedApartments = [...allApartments].sort((a, b) => {
    const aAvailable = checkIn && checkOut ? availableIds.has(a.id) : true;
    const bAvailable = checkIn && checkOut ? availableIds.has(b.id) : true;
    
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    // сортируем по той же цене, что видит гость (сезонной), а не по базовой
    return (
      currentNightlyPrice(a.seasons, a.price_base) -
      currentNightlyPrice(b.seasons, b.price_base)
    );
  });

  // В режиме долгосрока даты и доступность не участвуют — цена месячная
  const hasSearchParams = !isLongMode && Boolean(checkIn && checkOut);

  // Студия подходит для детей до 6 лет если max_guests >= 3
  const aptFitsChildren = (apt: ApartmentClient) =>
    children === 0 || apt.max_guests >= 3;

  // Сдаётся надолго = тумблер включён И есть цена хотя бы на один срок
  const isLongTermApt = (apt: ApartmentClient) =>
    Boolean(apt.long_term_enabled) &&
    longTermTerms.some(t => priceForTerm(apt, t.id) > 0);

  const longTermCount = allApartments.filter(isLongTermApt).length;

  // Сколько апартаментов доступно на каждом сроке — цифра в кнопке срока
  const countByTerm = (termId: string) =>
    allApartments.filter(apt => apt.long_term_enabled && priceForTerm(apt, termId) > 0).length;

  // Фильтруем по количеству гостей и детей для отображения
  const displayedApartments = isLongMode
    ? sortedApartments
        .filter(apt => apt.long_term_enabled && priceForTerm(apt, selectedTerm?.id) > 0)
        .sort((a, b) => priceForTerm(a, selectedTerm?.id) - priceForTerm(b, selectedTerm?.id))
    : sortedApartments.filter(apt =>
        (!hasSearchParams || apt.max_guests >= guests) && aptFitsChildren(apt)
      );

  const availableCount = Array.from(availableIds).filter(id => {
    const apt = allApartments.find(a => a.id === id);
    return apt && apt.max_guests >= guests && aptFitsChildren(apt);
  }).length;
  
  const totalCount = displayedApartments.length;

  return (
    <>
      <section className="ap-page">
        {/* Hero секция с заголовком и описанием */}
        <div className="ap-hero">
          <div className="ap-hero-container">
            <div className="ap-hero-left">
              <div className="ap-hero-brand">Стиль жизни · Алушта</div>
              <h1 className="ap-hero-title">Апартаменты</h1>
            </div>
            <div className="ap-hero-right">
  <p className="ap-hero-description">
    Создано для жизни, наполнено стилем. Наши номера — это автономные апартаменты с уютной кухней, 
    где удобно и готовить, и отдыхать.
  </p>
  <p className="ap-hero-description">
    Мы подготовили сюрприз для эстетов: коллекцию номеров в разных стилях, 
    чтобы вы могли выбрать интерьер, который понравится именно вам.
  </p>
</div>
          </div>
        </div>

        {/* Форма поиска */}
        <div className="ap-search-section">
          <div className="ap-search-container">
            {/* Переключатель режима аренды.
                Пока менеджер не включил долгосрок ни одному апартаменту, вкладка
                вела бы гостя в пустой список — поэтому её просто нет. */}
            {longTermCount > 0 && (
            <div className="ap-mode-switch" role="tablist" aria-label="Тип аренды">
              <span
                className="ap-mode-switch__thumb"
                style={{ transform: isLongMode ? 'translateX(100%)' : 'translateX(0)' }}
                aria-hidden="true"
              />
              <button
                type="button"
                role="tab"
                aria-selected={!isLongMode}
                className={`ap-mode-switch__btn${!isLongMode ? ' is-active' : ''}`}
                onClick={() => setRentalMode('daily')}
              >
                Посуточно
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isLongMode}
                className={`ap-mode-switch__btn${isLongMode ? ' is-active' : ''}`}
                onClick={() => setRentalMode('long')}
              >
                Долгосрочно
                <span className="ap-mode-switch__count">{longTermCount}</span>
              </button>
            </div>
            )}

            {isLongMode ? (
              <div className="ap-long-block">
                {/* Сосиска сроков: цена в карточках пересчитывается под выбранный */}
                {longTermTerms.length > 0 && (
                  <div className="ap-term-switch" role="tablist" aria-label="Срок аренды">
                    {longTermTerms.map(term => {
                      const count = countByTerm(term.id);
                      const isActive = term.id === selectedTerm?.id;
                      return (
                        <button
                          key={term.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          disabled={count === 0}
                          title={count === 0 ? 'На этот срок пока нет предложений' : undefined}
                          className={`ap-term-switch__btn${isActive ? ' is-active' : ''}`}
                          onClick={() => setSelectedTermId(term.id)}
                        >
                          {termTitle(term)}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="ap-long-hint">
                  <p className="ap-long-hint__title">
                    {selectedTerm
                      ? (selectedTerm.months === 1
                          ? 'Цена за месяц проживания'
                          : `Цена за месяц при аренде на ${termTitle(selectedTerm).toLowerCase()}`)
                      : `Аренда от ${longTermMinDays} суток — цена указана за месяц`}
                  </p>
                  <p className="ap-long-hint__text">
                    Чем дольше срок, тем ниже месячная плата. Мебель, техника и уборка включены;
                    депозит и порядок оплаты менеджер согласует лично — оставьте заявку.
                  </p>
                </div>
              </div>
            ) : (
            <div className="ap-search-form">
              <div className="ap-search-field">
                <label>Заезд</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="ap-search-field">
                <label>Выезд</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="ap-search-field">
                <label>Взрослые</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'гость' : 'гостей'}</option>
                  ))}
                </select>
              </div>
              <div className="ap-search-field">
                <label>Дети до 6 лет</label>
                <select value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                  <option value={0}>Без детей</option>
                  <option value={1}>1 ребёнок</option>
                  <option value={2}>2 ребёнка</option>
                </select>
              </div>
              <button className="ap-search-btn" onClick={handleSearch}>
                Найти
              </button>
            </div>
            )}
            {!isLongMode && formError && <div className="ap-search-error">{formError}</div>}
          </div>
        </div>

        {/* Результаты - только счетчик */}
        <div id="ap-results-anchor" className="ap-results">
          <div className="ap-results-header">
            <span>
              {isLongMode ? (
                `Сдаются надолго: ${displayedApartments.length} ${getDeclension(displayedApartments.length, 'апартамент', 'апартамента', 'апартаментов')}`
              ) : hasSearchParams ? (
                checkingAvailability
                  ? 'Проверяем доступность...'
                  : `Найдено: ${availableCount} ${getDeclension(availableCount, 'доступный апартамент', 'доступных апартамента', 'доступных апартаментов')}`
              ) : (
                `Все апартаменты (${allApartments.length})`
              )}
            </span>
          </div>
        </div>

        {/* Список апартаментов */}
        {checkingAvailability && hasSearchParams ? (
          <div className="ap-loading">Загрузка доступных апартаментов...</div>
        ) : (
          <div className="ap-list">
            {displayedApartments.length === 0 && isLongMode ? (
              <div className="ap-empty">
                <p>Сейчас нет апартаментов, сдающихся на длительный срок</p>
                <p>Позвоните нам — подберём вариант под ваш срок и бюджет</p>
              </div>
            ) : displayedApartments.length === 0 && hasSearchParams ? (
              <div className="ap-empty">
                <p>Нет апартаментов, подходящих под выбранные параметры</p>
                <p>Попробуйте изменить даты или количество гостей</p>
              </div>
            ) : (
              displayedApartments.map((apartment, index) => {
                const isAvailable = !hasSearchParams || availableIds.has(apartment.id);
                const apartmentUrl = `/apartments/${apartment.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
                
                return (
                  <article
                    key={apartment.id}
                    className={`ap-list-card card-appear ${!isAvailable ? 'unavailable' : ''}`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="ap-list-image">
                      <img
                        src={apartment.images?.[0] || '/images/placeholder.svg'}
                        alt={apartment.title}
                      />
                      <button
                        className="ap-list-gallery-btn"
                        onClick={() => open(apartment.images || ['/images/placeholder.svg'], 0)}
                      >
                        Смотреть фото
                      </button>
                      {apartment.hot_deal_enabled && !isLongMode && (
                        <div className="hot-deal-badge">🔥 Скидка {apartment.hot_deal_discount}%</div>
                      )}
                      {isLongMode && (
                        <div className="long-term-badge">Длительный срок</div>
                      )}
                      {!isAvailable && hasSearchParams && (
                        <div className="unavailable-badge">Нет мест</div>
                      )}
                    </div>
                    <div className="ap-list-content">
                      <div className="ap-list-header">
                        <h2>{apartment.title}</h2>
                        <span className="ap-list-guests">
                          до {apartment.max_guests} гостей
                        </span>
                      </div>

                      {apartment.max_guests >= 3 && (
                        <div className="ap-children-badge">
                          Дети до 6 лет — бесплатно
                        </div>
                      )}

                      <p className="ap-list-description">{apartment.short_description}</p>

                      {apartment.features && apartment.features.length > 0 && (
                        <ul className="ap-list-features">
                          {apartment.features.slice(0, 3).map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                          {apartment.features.length > 3 && (
                            <li>+{apartment.features.length - 3}</li>
                          )}
                        </ul>
                      )}

                      <div className="ap-list-footer">
                        {(() => {
                          if (isLongMode) {
                            const monthly = priceForTerm(apartment, selectedTerm?.id);
                            return (
                              <div className="ap-list-price ap-list-price--long">
                                <span className="long-price-value">
                                  {monthly.toLocaleString('ru-RU')} ₽
                                  <span className="long-price-unit"> / мес</span>
                                </span>
                                <span className="long-price-note">
                                  {apartment.long_term_note
                                    || (selectedTerm ? termPhrase(selectedTerm) : `от ${longTermMinDays} суток`)}
                                </span>
                              </div>
                            );
                          }
                          if (hasSearchParams && checkIn && checkOut) {
                            const total = calcSeasonalTotal(
                              apartment.seasons,
                              apartment.hot_deal_enabled,
                              apartment.hot_deal_discount,
                              apartment.hot_deal_date_from,
                              apartment.hot_deal_date_to,
                              apartment.price_base,
                              checkIn,
                              checkOut,
                            );
                            const nights = Math.round((new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86400000);
                            const perNight = nights > 0 ? Math.round(total / nights) : apartment.price_base;
                            return (
                              <div className="ap-list-price">
                                {total.toLocaleString('ru-RU')} ₽
                                <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: 4 }}>/ {nights} ночей</span>
                              </div>
                            );
                          }
                          const nightly = currentNightlyPrice(apartment.seasons, apartment.price_base);
                          if (apartment.hot_deal_enabled) {
                            return (
                              <div className="ap-list-price">
                                <span className="price-original">{nightly.toLocaleString('ru-RU')} ₽</span>
                                <span className="price-discounted">
                                  {Math.round(nightly * (1 - (apartment.hot_deal_discount ?? 10) / 100)).toLocaleString('ru-RU')} ₽ / ночь
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="ap-list-price">
                              от {nightly.toLocaleString('ru-RU')} ₽ / ночь
                            </div>
                          );
                        })()}

                        <div className="ap-list-actions">
                          <Link href={apartmentUrl} className="btn-outline">
                            Подробнее
                          </Link>

                          {isLongMode ? (
                            <button
                              className="btn-primary"
                              onClick={() => handleLongTermClick(apartment)}
                            >
                              Оставить заявку
                            </button>
                          ) : !hasSearchParams ? (
                            <Link href={`/apartments/${apartment.id}`} className="btn-primary">
                              Выбрать даты
                            </Link>
                          ) : isAvailable ? (
                            <button
                              className="btn-primary"
                              onClick={() => handleBookingClick(apartment)}
                              disabled={checkingId === apartment.id}
                            >
                              {checkingId === apartment.id ? 'Проверка...' : 'Забронировать'}
                            </button>
                          ) : (
                            <button className="btn-unavailable" disabled>
                              Недоступно
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        <Footer isMobile={isMobile} />
      </section>

      {bookingOpen && bookingApartment && (bookingMode === 'long' || (checkIn && checkOut)) && (
        <BookingModal
          apartment={bookingApartment}
          mode={bookingMode}
          longTermMinDays={longTermMinDays}
          longTermTermId={selectedTerm?.id}
          longTermMonths={selectedTerm?.months}
          priceOverride={bookingPriceOverride}
          initialRange={
            checkIn && checkOut
              ? {
                  from: new Date(checkIn + 'T00:00:00Z'),
                  to: new Date(checkOut + 'T00:00:00Z'),
                }
              : null
          }
          initialGuests={guests}
          onClose={() => setBookingOpen(false)}
          onConfirm={() => {
            setBookingOpen(false);
            window.dispatchEvent(new CustomEvent('booking-completed'));
            if (bookingMode === 'daily') checkAvailability();
          }}
        />
      )}
    </>
  );
}

// Вспомогательная функция для склонения
function getDeclension(number: number, one: string, two: string, five: string): string {
  const n = Math.abs(number);
  const n10 = n % 10;
  const n100 = n % 100;
  
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return two;
  return five;
}