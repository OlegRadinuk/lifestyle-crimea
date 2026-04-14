'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import {
  Wifi, Refrigerator, Snowflake, Wind, Home, UtensilsCrossed,
  Microwave, Flame, ShowerHead, Coffee, Thermometer, Footprints,
  Tv, Lock, WashingMachine, Car, Bath, type LucideIcon,
} from 'lucide-react';
import './apartment.css';

// ===== FEATURE ICONS (Lucide) =====
const FEATURE_ICON_MAP: Array<{ match: RegExp; Icon: LucideIcon }> = [
  { match: /интернет|wi-?fi/i,        Icon: Wifi },
  { match: /холодильник/i,            Icon: Refrigerator },
  { match: /кондиционер/i,            Icon: Snowflake },
  { match: /фен/i,                    Icon: Wind },
  { match: /балкон|терраса/i,         Icon: Home },
  { match: /кухн/i,                   Icon: UtensilsCrossed },
  { match: /микроволновк/i,           Icon: Microwave },
  { match: /плит/i,                   Icon: Flame },
  { match: /душ/i,                    Icon: ShowerHead },
  { match: /кофе/i,                   Icon: Coffee },
  { match: /подогрев/i,               Icon: Thermometer },
  { match: /тапочк/i,                 Icon: Footprints },
  { match: /телевизор|^тв$/i,         Icon: Tv },
  { match: /сейф/i,                   Icon: Lock },
  { match: /стиральн/i,               Icon: WashingMachine },
  { match: /парковк/i,                Icon: Car },
  { match: /джакузи|ванн/i,           Icon: Bath },
];

function FeatureIcon({ name }: { name: string }) {
  const entry = FEATURE_ICON_MAP.find(({ match }) => match.test(name));
  const Icon = entry?.Icon ?? Wind; // Wind — нейтральная иконка по умолчанию
  return <Icon size={15} strokeWidth={2} aria-hidden="true" />;
}

type Props = {
  apartment: {
    id: string;
    title: string;
    shortDescription: string;
    description: string;
    maxGuests: number;
    area: number;
    priceBase: number;
    view: string;
    hasTerrace: boolean;
    features: string[];
    images: string[];
    isActive?: boolean;
  };
  loading?: boolean;
};

export default function ApartmentHero({ apartment, loading = false }: Props) {
  const { register, unregister } = useHeader();
  const { open } = usePhotoModal();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Определяем мобилку
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // HEADER MODE - увеличиваем приоритет до 100
  useEffect(() => {
    const id = 'apartment-hero';
    register(id, { mode: 'apartment', priority: 100 });
    return () => {
      unregister(id);
    };
  }, [register, unregister]);

  const goToNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % apartment.images.length);
  }, [apartment.images.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex(prev => prev === 0 ? apartment.images.length - 1 : prev - 1);
  }, [apartment.images.length]);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // AUTOPLAY
  useEffect(() => {
    if (paused || !apartment.images?.length || isMobile) return;

    const timer = setInterval(() => {
      goToNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [paused, apartment.images.length, goToNext, isMobile]);

  // Свайп
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) {
      setPaused(false);
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - endX;
    const diffY = touchStartY.current - endY;
    const minSwipe = 50;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipe) {
      if (diffX > 0) goToNext();
      else goToPrev();
    } else if (Math.abs(diffY) > minSwipe) {
      if (diffY > 0) goToNext();
      else goToPrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => setPaused(false), 2000);
  };

  const hasImages = apartment.images?.length > 0;

  const isActive = apartment.isActive !== false;

  const SliderArrows = () => {
    if (isMobile || !hasImages || apartment.images.length < 2) return null;
    return (
      <>
        <button className="hero-arrow hero-arrow--left" onClick={goToPrev}>‹</button>
        <button className="hero-arrow hero-arrow--right" onClick={goToNext}>›</button>
      </>
    );
  };

  // ЧИСТЫЙ ТАЙМЛАЙН — без анимаций, только inline-стили
  const Timeline = () => {
    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      right: isMobile ? '20px' : '60px',
      bottom: isMobile ? '120px' : '60px',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '8px' : '14px',
      pointerEvents: 'auto',
      zIndex: 100,
    };

    const getItemStyle = (index: number): React.CSSProperties => {
      const isActiveItem = index === activeIndex;
      return {
        background: 'none',
        border: 'none',
        fontSize: isMobile ? '14px' : '15.5px',
        letterSpacing: '0.18em',
        color: isActiveItem ? '#139AB6' : 'rgba(255, 255, 255, 0.5)',
        cursor: 'pointer',
        padding: '4px 0',
        fontWeight: isActiveItem ? 500 : 400,
        transform: isActiveItem ? 'scale(1.1)' : 'scale(1)',
        transition: 'color 0.2s ease, transform 0.2s ease',
        textAlign: isMobile ? 'right' : 'left',
      };
    };

    return (
      <div style={containerStyle}>
        {apartment.images.map((_, index) => (
          <button
            key={index}
            style={getItemStyle(index)}
            onClick={() => goToSlide(index)}
            onMouseEnter={(e) => {
              if (!isMobile && index !== activeIndex) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile && index !== activeIndex) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
    );
  };

  // Десктоп
  if (!isMobile) {
    return (
      <section
        className="apartment-hero desktop"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Размытый фоновый слайдер */}
        <div className="hero-slider">
          {apartment.images.map((img, index) => (
            <div
              key={index}
              className={`hero-slide ${index === activeIndex ? 'active' : ''}`}
              style={{ display: index === activeIndex ? 'block' : 'none' }}
            >
              <div className="hero-slide-bg hero-slide-bg--blur" style={{ backgroundImage: `url(${img})` }} />
            </div>
          ))}
          <div className="hero-slide-background" />
        </div>

        <div className="panorama-overlay" />

        {/* Основной split-layout */}
        <div className="apt-content-grid">
          {/* Левая колонка */}
          <div className="apt-col-left">
            <div className="apt-panel apt-panel-title">
              <span className="apt-eyebrow">Lifestyle · Luxury</span>
              <h1 className="apt-title">{apartment.title}</h1>
              <div className="apt-meta">
                <span>До {apartment.maxGuests} гостей</span>
                <span>{apartment.area} м²</span>
              </div>
            </div>
            <div className="apt-panel apt-panel-desc">
              <p>{apartment.description}</p>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="apt-col-right">
            <div
              className={`apt-photo${!hasImages ? ' apt-photo--empty' : ''}`}
              onClick={() => hasImages ? open(apartment.images, activeIndex) : undefined}
              title={hasImages ? 'Смотреть фото' : undefined}
              style={{ cursor: hasImages ? 'zoom-in' : 'default' }}
            >
              {hasImages && (
                <img
                  src={apartment.images[activeIndex]}
                  alt={apartment.title}
                />
              )}
              {/* Горизонтальная навигация внутри фото */}
              {hasImages && apartment.images.length > 1 && (
                <div className="apt-photo-nav" onClick={e => e.stopPropagation()}>
                  {apartment.images.map((_, index) => (
                    <button
                      key={index}
                      className={`apt-photo-nav-btn${index === activeIndex ? ' active' : ''}`}
                      onClick={() => goToSlide(index)}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {apartment.features?.length > 0 && (
              <div className="apt-features-panel">
                <span className="apt-features-eyebrow">Особенности</span>
                <ul className="apt-features-list">
                  {apartment.features.map((feature, i) => (
                    <li key={i}>
                      <span className="apt-feature-icon"><FeatureIcon name={feature} /></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {!loading && !isActive && (
          <div className="panorama-unavailable-message">
            <span className="unavailable-text">Апартамент временно недоступен для бронирования</span>
          </div>
        )}

        <SliderArrows />
      </section>
    );
  }

  // Мобилка
  return (
    <section
      className="apartment-hero mobile"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slider">
        {apartment.images.map((img, index) => (
          <div
            key={index}
            className={`hero-slide ${index === activeIndex ? 'active' : ''}`}
            style={{ display: index === activeIndex ? 'block' : 'none' }}
          >
            <div className="hero-slide-bg" style={{ backgroundImage: `url(${img})` }} />
          </div>
        ))}
        <div className="hero-slide-background" />
      </div>

      <div className="panorama-overlay mobile" />

      <div className="apartment-info-mobile">
        <div className="apartment-info-header">
          <span className="apartment-info-eyebrow">Lifestyle · Luxury</span>
          <h2 className="apartment-info-title">{apartment.title}</h2>
        </div>

        <p className="apartment-info-description">{apartment.description}</p>

        <div className="apartment-features-mobile">
          <div className="feature-chip">До {apartment.maxGuests} гостей</div>
          <div className="feature-chip">{apartment.area} м²</div>
          {apartment.features?.slice(0, 3).map((item, i) => (
            <div className="feature-chip" key={i}>{item}</div>
          ))}
        </div>

        {!loading && !isActive && (
          <div className="panorama-unavailable-message mobile">
            <span className="unavailable-text">Апартамент временно недоступен</span>
          </div>
        )}
      </div>

      <Timeline />
    </section>
  );
}