'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type MenuItemType = 'image' | 'slider' | 'tour' | 'video';

type OverlayLarge = {
  size: 'large';
  eyebrow?: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
};
type OverlaySmall = { size: 'small'; tagline: string };
type MenuOverlay = OverlayLarge | OverlaySmall;

type MenuItem = {
  title: string;
  href: string;
  type: MenuItemType;
  image?: string;
  images?: string[];
  external?: boolean;
  /** Фирменный цветовой оверлей превью-фото (эмоциональный, но премиальный) */
  tint?: 'sea' | 'emerald' | 'sand' | 'lavender' | 'teal' | 'dusk';
  overlay?: MenuOverlay;
};

type NewsSlide = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const menuItems: MenuItem[] = [
  {
    title: 'Главная',
    href: '/',
    type: 'image',
    // Синий апартамент с картинами (2-й слайд категории «Апартаменты», 1.webp) —
    // по просьбе заказчицы вместо прежнего home.webp
    image: '/images/apartments/1.webp',
    tint: 'sea',
    overlay: {
      size: 'large',
      eyebrow: 'Добро пожаловать',
      headline: 'Мы рады приветствовать вас в апартаментах «Стиль Жизни». Пусть это место станет настоящим островом комфорта, где можно расслабиться, восстановиться и насладиться каждым мгновением.',
      ctaLabel: 'Выбрать апартаменты для отдыха',
      ctaHref: '/apartments',
    },
  },
  {
    title: 'Апартаменты',
    href: '/apartments',
    type: 'slider',
    images: [
      '/images/apartments/8.webp',
      '/images/apartments/1.webp',
      '/images/apartments/2.webp',
      '/images/apartments/3.webp',
      '/images/apartments/4.webp',
      '/images/apartments/5.webp',
      '/images/apartments/6.webp',
      '/images/apartments/7.webp',
      '/images/apartments/9.webp',
      '/images/apartments/10.webp',
      '/images/apartments/11.webp',
      '/images/apartments/12.webp',
    ],
    tint: 'teal',
    overlay: {
      size: 'large',
      eyebrow: 'Найдите своё',
      headline: 'Откройте широкий выбор апартаментов на любой вкус — от уютных студий до стильных премиум-пространств. Найдите тот самый вариант, который идеально подходит именно вам.',
      ctaLabel: 'Выбрать апартаменты',
      ctaHref: '/apartments',
    },
  },
  {
    title: 'Услуги',
    href: '/services',
    type: 'image',
    image: '/images/menu/services.webp',
    tint: 'emerald',
    overlay: {
      size: 'large',
      eyebrow: 'Всё для вашего отдыха',
      headline: 'Погрузитесь в «Стиль Жизни», где каждая услуга — это шаг к идеальному отдыху.',
      ctaLabel: 'Смотреть все услуги',
      ctaHref: '/services',
    },
  },
  {
    title: 'Уникальный концепт',
    href: '/concept',
    type: 'image',
    image: '/images/menu/concept.webp',
    tint: 'lavender',
    overlay: {
      size: 'large',
      eyebrow: 'Для инвесторов',
      headline: 'Откройте мир уверенных вложений с компанией «Стиль Жизни» — когда недвижимость становится вашим новым горизонтом.',
      ctaLabel: 'Сделайте первый шаг',
      ctaHref: '/concept',
    },
  },
  {
    title: 'Виртуальный тур',
    href: '/#panorama',
    type: 'tour',
    overlay: {
      size: 'small',
      tagline: 'Почувствуйте атмосферу — в 360°',
    },
  },
  {
    title: 'Новости и предложения',
    href: '/news',
    type: 'image',
    image: '/images/menu/news.webp',
    tint: 'sand',
    overlay: {
      size: 'large',
      eyebrow: 'Акции и события',
      headline: 'Специальные предложения, сезонные акции и приятные события апарт-отеля — узнавайте о них первыми.',
      ctaLabel: 'Смотреть предложения',
      ctaHref: '/news',
    },
  },
  {
    title: 'Дизайн / Ремонт\nот ООО «Стиль Жизни»',
    href: 'https://lifestyle-crimea.ru',
    type: 'image',
    image: '/images/menu/remont.webp',
    external: true,
    tint: 'dusk',
    overlay: {
      size: 'large',
      eyebrow: 'ООО «Стиль Жизни»',
      headline: 'Дизайн интерьеров и ремонт под ключ — создаём пространство, в котором хочется жить.',
      ctaLabel: 'Перейти на сайт',
      ctaHref: 'https://lifestyle-crimea.ru',
      ctaExternal: true,
    },
  },
];

export default function BurgerMenu({ isOpen, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideMemory = useRef<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  // Hover-intent: задержка 120мс перед переключением категории,
  // чтобы быстрый проход курсора сквозь пункты не вызывал мерцание
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Последние новости для слайдера в пункте «Новости и предложения»
  const [news, setNews] = useState<NewsSlide[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);

  const baseActiveItem = useMemo(() => {
    const found = menuItems.find((item) => {
      const itemPath = item.href.split('#')[0];
      // Для страницы апартаментов проверяем startsWith
      if (itemPath === '/apartments' && pathname?.startsWith('/apartments')) {
        return true;
      }
      return itemPath === pathname;
    });
    return found ?? menuItems[0];
  }, [pathname]);

  const activeItem = hoveredItem ?? baseActiveItem;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  // Очищаем таймер hover-intent при размонтировании
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Подтягиваем последние новости для слайдера в меню (при первом открытии)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/news?limit=3')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setNews(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Предзагрузка ВСЕХ превью-фото категорий сразу при открытии меню,
  // чтобы при наведении на пункт картинка уже была в кэше (без мерцания/подгрузки).
  useEffect(() => {
    if (!isOpen) return;
    const urls = new Set<string>();
    for (const item of menuItems) {
      if (item.image) urls.add(item.image);
      if (item.images) item.images.forEach((u) => urls.add(u));
    }
    urls.forEach((u) => {
      const img = new window.Image();
      img.src = u;
    });
  }, [isOpen]);

  // При закрытии меню сбрасываем hover-состояние, чтобы следующее открытие
  // стартовало с активной категории текущей страницы, а не с прошлого ховера.
  // ВАЖНО: сбрасываем на закрытии, НЕ при уводе мыши за пределы превью —
  // иначе увод курсора резко «прыгал» на Главную (жалоба заказчицы).
  useEffect(() => {
    if (!isOpen) {
      setHoveredItem(null);
      setSlideIndex(0);
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }
  }, [isOpen]);

  const nextNews = () => {
    if (news.length === 0) return;
    setNewsIndex((prev) => (prev + 1) % news.length);
  };
  const prevNews = () => {
    if (news.length === 0) return;
    setNewsIndex((prev) => (prev === 0 ? news.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (!activeItem.images) return;
    setSlideIndex((prev) => {
      const next = (prev + 1) % activeItem.images!.length;
      slideMemory.current[activeItem.title] = next;
      return next;
    });
  };

  const prevSlide = () => {
    if (!activeItem.images) return;
    setSlideIndex((prev) => {
      const next = prev === 0 ? activeItem.images!.length - 1 : prev - 1;
      slideMemory.current[activeItem.title] = next;
      return next;
    });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const handleNavigation = (item: MenuItem) => {
    if (item.external) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(item.href);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isConcept = activeItem.href.startsWith('/concept');
  const primaryPhone = isConcept
    ? { tel: '+79160200331', display: '+7 916 020 03 31' }
    : { tel: '+79785036363', display: '+7 978 503 63 63' };

  const overlay = activeItem.overlay;
  // В пункте «Новости и предложения» показываем слайдер последних новостей,
  // если они есть; иначе — обычная статичная картинка-заглушка.
  const showNewsSlider = activeItem.href === '/news' && news.length > 0;
  const currentNews = showNewsSlider ? news[Math.min(newsIndex, news.length - 1)] : null;

  return (
    <div className="burger-overlay" onClick={onClose}>
      <div className="burger-card" onClick={(e) => e.stopPropagation()}>
        <button className="burger-close" onClick={onClose} aria-label="Закрыть меню">
          ✕
        </button>

        <div className="burger-layout">
          {/* LEFT */}
          <div className="burger-left">
            <ul className="burger-menu">
              {menuItems.map((item) => (
                <li
                  key={item.title}
                  className={activeItem.title === item.title ? 'active' : ''}
                  onMouseEnter={() => {
                    // Hover-intent: планируем переключение с задержкой 120мс.
                    // Если курсор уйдёт до срабатывания — таймер отменится
                    // и категория не переключится (нет мерцания при быстром проходе).
                    if (hoverTimerRef.current !== null) {
                      clearTimeout(hoverTimerRef.current);
                    }
                    hoverTimerRef.current = setTimeout(() => {
                      setHoveredItem(item);
                      setSlideIndex(slideMemory.current[item.title] ?? 0);
                      hoverTimerRef.current = null;
                    }, 120);
                  }}
                  onMouseLeave={() => {
                    // Отменяем таймер при уходе с пункта до его срабатывания
                    if (hoverTimerRef.current !== null) {
                      clearTimeout(hoverTimerRef.current);
                      hoverTimerRef.current = null;
                    }
                  }}
                  onClick={() => handleNavigation(item)}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {item.title}
                </li>
              ))}
            </ul>

            <div className="burger-divider" />

            <div className="burger-contacts">
              <a href={`tel:${primaryPhone.tel}`}>{primaryPhone.display}</a>
              <a href="tel:+79786964510">+7 978 696 45 10</a>
              <a href="tel:88007776308">8 800 777 63 08 <span className="burger-phone-note">бесплатный</span></a>
              <div className="burger-address">Алушта, Западная ул., 4, корп. 3</div>
              <div className="burger-time">Круглосуточно</div>
            </div>
          </div>

          {/* RIGHT */}
          <div
            className="burger-preview"
            data-tint={activeItem.tint ?? undefined}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {activeItem.type === 'image' && activeItem.image && !showNewsSlider && (
              <div
                key={activeItem.image}
                className="preview-media fade"
                style={{ backgroundImage: `url(${activeItem.image})` }}
              />
            )}

            {/* Слайдер последних новостей и предложений (обложка + заголовок + «Читать») */}
            {showNewsSlider && currentNews && (
              <div className="burger__slider burger__slider--news">
                <div
                  key={currentNews.slug}
                  className="burger__slide fade"
                  style={{
                    backgroundImage: `url(${currentNews.cover_image || '/images/menu/news.webp'})`,
                  }}
                />
                {news.length > 1 && (
                  <>
                    <button
                      className="burger__nav burger__nav--left"
                      onClick={prevNews}
                      aria-label="Предыдущая новость"
                    />
                    <button
                      className="burger__nav burger__nav--right"
                      onClick={nextNews}
                      aria-label="Следующая новость"
                    />
                    <div className="burger__dots">
                      {news.map((_, i) => (
                        <span
                          key={i}
                          className={`burger__dot ${i === newsIndex ? 'active' : ''}`}
                          onClick={() => setNewsIndex(i)}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div
                  key={`${currentNews.slug}--pov`}
                  className="preview-overlay preview-overlay--large"
                >
                  <div className="preview-overlay__inner">
                    <span className="preview-overlay__eyebrow">Новости и предложения</span>
                    <p className="preview-overlay__headline">{currentNews.title}</p>
                    <div className="preview-overlay__actions">
                      <button
                        className="preview-overlay__cta"
                        onClick={() => {
                          router.push(`/news/${currentNews.slug}`);
                          onClose();
                        }}
                      >
                        Подробнее
                      </button>
                      <button
                        className="preview-overlay__cta preview-overlay__cta--ghost"
                        onClick={() => {
                          router.push('/news');
                          onClose();
                        }}
                      >
                        Все новости и предложения
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeItem.type === 'slider' && activeItem.images && (
              <div className="burger__slider">
                <div 
                  className="burger__slide" 
                  style={{ backgroundImage: `url(${activeItem.images[slideIndex]})` }}
                />
                <button 
                  className="burger__nav burger__nav--left" 
                  onClick={prevSlide} 
                  aria-label="Предыдущий слайд"
                />
                <button 
                  className="burger__nav burger__nav--right" 
                  onClick={nextSlide} 
                  aria-label="Следующий слайд"
                />
                <div className="burger__dots">
                  {activeItem.images.map((_, i) => (
                    <span
                      key={i}
                      className={`burger__dot ${i === slideIndex ? 'active' : ''}`}
                      onClick={() => setSlideIndex(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeItem.type === 'tour' && (
              <iframe
                className="preview-map fade"
                src="https://yandex.com/map-widget/v1/?from=mapframe&ll=10.854186%2C49.182076&panorama%5Bdirection%5D=271.779286%2C-0.300532&panorama%5Bfull%5D=true&panorama%5Bpoint%5D=34.404344%2C44.665237&panorama%5Bspan%5D=113.121974%2C60.000000&z=4"
                allowFullScreen
              />
            )}

            {overlay && !showNewsSlider && (
              <div
                key={`${activeItem.title}--pov`}
                className={`preview-overlay preview-overlay--${overlay.size}`}
              >
                <div className="preview-overlay__inner">
                  {overlay.size === 'large' ? (
                    <>
                      {overlay.eyebrow && (
                        <span className="preview-overlay__eyebrow">{overlay.eyebrow}</span>
                      )}
                      <p className="preview-overlay__headline">{overlay.headline}</p>
                      <button
                        className="preview-overlay__cta"
                        onClick={() => {
                          if (overlay.ctaExternal) {
                            window.open(overlay.ctaHref, '_blank', 'noopener,noreferrer');
                          } else {
                            router.push(overlay.ctaHref);
                          }
                          onClose();
                        }}
                      >
                        {overlay.ctaLabel}
                      </button>
                    </>
                  ) : (
                    <p className="preview-overlay__tagline">{overlay.tagline}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}