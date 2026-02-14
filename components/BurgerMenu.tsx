'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type MenuItemType = 'image' | 'slider' | 'tour' | 'video';

type MenuItem = {
  title: string;
  href: string;
  type: MenuItemType;
  image?: string;
  images?: string[];
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
    image: '/images/menu/home.jpg',
  },
  {
    title: 'Апартаменты',
    href: '/#panorama',
    type: 'slider',
    images: Array.from({ length: 9 }, (_, i) => `/images/apartments/${i + 1}.jpg`),
  },
  {
    title: 'Услуги',
    href: '/services',
    type: 'image',
    image: '/images/menu/services.jpg',
  },
  {
    title: 'Уникальный концепт',
    href: '/concept',
    type: 'image',
    image: '/images/menu/concept.jpg',
  },
  {
    title: 'Виртуальный тур',
    href: '/#panorama',
    type: 'tour',
  },
  {
    title: 'Новости и предложения',
    href: '/news',
    type: 'image',
    image: '/images/menu/news.jpg',
  },
  {
    // ✅ ИСПРАВЛЕНО: перенос через \n, без JSX
    title: 'Дизайн / Ремонт\nот ООО «Стиль Жизни»',
    href: 'https://lifestyle-crimea.ru',
    type: 'image',
    image: '/images/menu/remont.jpg',
  },
];

export default function BurgerMenu({ isOpen, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeItem, setActiveItem] = useState<MenuItem>(menuItems[0]);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideMemory = useRef<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);

  /* синхронизация с роутом */
  useEffect(() => {
    const found = menuItems.find((item) => item.href === pathname);
    if (found) {
      setActiveItem(found);
      setSlideIndex(slideMemory.current[found.title] ?? 0);
    }
  }, [pathname]);

  /* ESC */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  /* автослайд */
  useEffect(() => {
    if (activeItem.type !== 'slider' || !activeItem.images) return;

    const timer = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % activeItem.images!.length;
        slideMemory.current[activeItem.title] = next;
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [activeItem]);

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

  /* touch swipe */
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

  if (!isOpen) return null;

  return (
    <div className="burger-overlay" onClick={onClose}>
      <div className="burger-card" onClick={(e) => e.stopPropagation()}>
        <button className="burger-close" onClick={onClose}>✕</button>

        <div className="burger-layout">
          {/* LEFT */}
          <div className="burger-left">
            <ul className="burger-menu">
              {menuItems.map((item) => (
                <li
                  key={item.title}
                  className={activeItem.title === item.title ? 'active' : ''}
                  onMouseEnter={() => {
                    setActiveItem(item);
                    setSlideIndex(slideMemory.current[item.title] ?? 0);
                  }}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  style={{ whiteSpace: 'pre-line' }}  // ✅ чтобы \n работал
                >
                  {item.title}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="/booking"
              className="burger-booking"
              onClick={onClose}
            >
              Забронировать
            </a>

            {/* CONTACTS */}
            <div className="burger-contacts">
              <a href="tel:+79786964510">+7 (978) 503-63-63</a>
              <a href="tel:88007776308">+7 (978) 696-45-10</a>
              <div className="burger-address">
                Алушта, Западная ул., 4, корп. 3
              </div>
              <div className="burger-time">Круглосуточно</div>
            </div>
          </div>

          {/* RIGHT */}
          <div
            className="burger-preview"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {activeItem.type === 'image' && activeItem.image && (
              <div
                key={activeItem.image}
                className="preview-media fade"
                style={{ backgroundImage: `url(${activeItem.image})` }}
              />
            )}

            {activeItem.type === 'slider' && activeItem.images && (
              <div className="slider">
                <div
                  key={slideIndex}
                  className="preview-media zoom"
                  style={{
                    backgroundImage: `url(${activeItem.images[slideIndex]})`,
                  }}
                />

                <div className="slider-controls">
                  <button onClick={prevSlide}>‹</button>
                  <div className="dots">
                    {activeItem.images.map((_, i) => (
                      <span
                        key={i}
                        className={i === slideIndex ? 'active' : ''}
                        onClick={() => setSlideIndex(i)}
                      />
                    ))}
                  </div>
                  <button onClick={nextSlide}>›</button>
                </div>
              </div>
            )}

            {activeItem.type === 'tour' && (
              <iframe
                className="preview-map fade"
                src="https://yandex.com/map-widget/v1/org/stil_zhizni/82645925123/?ll=34.403625%2C44.665482&panorama%5Bdirection%5D=34.541089%2C-18.156205&panorama%5Bfull%5D=true&panorama%5Bpoint%5D=34.404681%2C44.664908&panorama%5Bspan%5D=113.121974%2C60.000000&z=17.2"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
