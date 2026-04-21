'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useHeader } from '@/components/HeaderContext';
import './apartment.css';

// ===== FEATURE ICONS (inline SVG, no external deps) =====
const S = 15;
const SW = 2;
const IC: React.FC<React.SVGProps<SVGSVGElement>> = (p) => (
  <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
);

const icons: Record<string, React.ReactElement> = {
  wifi:        <IC><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></IC>,
  fridge:      <IC><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="9" y1="6" x2="9" y2="8"/><line x1="9" y1="14" x2="9" y2="16"/></IC>,
  snow:        <IC><line x1="12" y1="2" x2="12" y2="22"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="m7 7-5 5 5 5"/><path d="m17 7 5 5-5 5"/></IC>,
  wind:        <IC><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></IC>,
  home:        <IC><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IC>,
  kitchen:     <IC><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></IC>,
  microwave:   <IC><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M7 12h10"/><path d="M17 6V4"/><circle cx="17" cy="10" r="1"/></IC>,
  flame:       <IC><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></IC>,
  shower:      <IC><path d="M4 4h1"/><path d="M4 8h1"/><path d="M4 12h1"/><path d="M4 16h1"/><path d="M8 4h1"/><path d="M12 4a8 8 0 0 1 8 8v8H4v-8a8 8 0 0 1 8-8"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/></IC>,
  coffee:      <IC><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></IC>,
  thermo:      <IC><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></IC>,
  slippers:    <IC><path d="M2 12C2 8.13 5.13 5 9 5h4c1.1 0 2 .9 2 2v2h1a3 3 0 0 1 3 3v4H5a3 3 0 0 1-3-3v-1z"/><path d="M5 19v2"/><path d="M19 19v2"/></IC>,
  tv:          <IC><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></IC>,
  lock:        <IC><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IC>,
  washer:      <IC><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><path d="M7 6h.01M11 6h2"/></IC>,
  car:         <IC><path d="M19 17H5a2 2 0 0 1-2-2V9l2.5-5h9L17 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></IC>,
  bath:        <IC><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></IC>,
  bed:         <IC><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></IC>,
  robe:        <IC><path d="M7 2l-4 7h4l-2 13 9-11H9l4-9z"/></IC>,
  desk:        <IC><rect x="2" y="14" width="20" height="2" rx="1"/><path d="M7 14v4"/><path d="M17 14v4"/><path d="M9 14V8a3 3 0 0 1 6 0v6"/></IC>,
  paw:         <IC><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></IC>,
  utensils:    <IC><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></IC>,
  kettle:      <IC><path d="M19 9H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/><path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><path d="M9 9V6"/></IC>,
  iron:        <IC><path d="m6 20 6-6"/><path d="M10.5 10.5 17 4l3 3-6.5 6.5"/><path d="M2 13c0 1.66 1.34 3 3 3h10l4-4H5c-1.66 0-3 1.34-3 1z"/></IC>,
  towel:       <IC><path d="M9 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="6" rx="1"/></IC>,
  wardrobe:    <IC><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M12 3v18"/><path d="M8 12h1"/><path d="M15 12h1"/></IC>,
  pin:         <IC><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></IC>,
  outdoor:     <IC><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></IC>,
  cosmetics:   <IC><path d="M9 3h6l1 7H8L9 3z"/><path d="M8 10c0 5 4 9 4 9s4-4 4-9"/><line x1="12" y1="19" x2="12" y2="22"/></IC>,
  table:       <IC><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></IC>,
  dishwasher:  <IC><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><circle cx="8" cy="6" r="1"/><circle cx="16" cy="6" r="1"/><path d="M8 14h8M8 17h5"/></IC>,
  oven:        <IC><rect x="3" y="4" width="18" height="17" rx="2"/><rect x="7" y="9" width="10" height="8" rx="1"/><line x1="7" y1="4" x2="7" y2="2"/><line x1="17" y1="4" x2="17" y2="2"/><circle cx="8.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="6.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></IC>,
  sofa:        <IC><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 11a2 2 0 0 1 4 0v2H2v-2z"/><path d="M22 11a2 2 0 0 0-4 0v2h4v-2z"/><path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/><line x1="6" y1="19" x2="6" y2="21"/><line x1="18" y1="19" x2="18" y2="21"/></IC>,
  lounger:     <IC><path d="M2 17h20"/><path d="M6 17V10l-4 7"/><path d="M6 10h12a2 2 0 0 1 2 2v5"/><line x1="6" y1="17" x2="6" y2="20"/><line x1="18" y1="17" x2="18" y2="20"/></IC>,
  walk:        <IC><circle cx="12" cy="4" r="2"/><path d="M9.5 8.5L8 20"/><path d="M14.5 8.5L16 20"/><path d="M7 12h10"/></IC>,
  baby:        <IC><rect x="2" y="10" width="20" height="11" rx="2"/><line x1="6" y1="10" x2="6" y2="4"/><line x1="12" y1="10" x2="12" y2="4"/><line x1="18" y1="10" x2="18" y2="4"/><circle cx="12" cy="16" r="2"/></IC>,
  trekking:    <IC><line x1="7" y1="22" x2="12" y2="2"/><line x1="17" y1="22" x2="12" y2="2"/><line x1="9" y1="13" x2="15" y2="13"/></IC>,
};

const FEATURE_ICON_MAP: Array<{ match: RegExp; key: keyof typeof icons }> = [
  { match: /посудомоечн/i,                              key: 'dishwasher' },
  { match: /духовой|духовка|вытяжк/i,                   key: 'oven' },
  { match: /диван|раскладн.кресло/i,                    key: 'sofa' },
  { match: /шезлонг/i,                                  key: 'lounger' },
  { match: /расстояние|до моря|от моря/i,               key: 'walk' },
  { match: /манеж/i,                                    key: 'baby' },
  { match: /треккинг|палки для/i,                       key: 'trekking' },
  { match: /надувн/i,                                   key: 'outdoor' },
  { match: /раскладушка/i,                              key: 'bed' },
  { match: /матрас/i,                                   key: 'bed' },
  { match: /кровать|queen|king|двуспальн|односпальн/i,  key: 'bed' },
  { match: /халат/i,                                    key: 'robe' },
  { match: /компьютерн.стол|рабочее место|письменный/i, key: 'desk' },
  { match: /животн|питомец|лапа/i,                      key: 'paw' },
  { match: /посуда|столовые прибор/i,                   key: 'utensils' },
  { match: /чайник/i,                                   key: 'kettle' },
  { match: /утюг|гладильн/i,                            key: 'iron' },
  { match: /полотенц/i,                                 key: 'towel' },
  { match: /гардеробная|гардероб|шкаф/i,                key: 'wardrobe' },
  { match: /кресло.кокон|садовая мебель/i,              key: 'outdoor' },
  { match: /косметик/i,                                 key: 'cosmetics' },
  { match: /стол|обеденн|консольн/i,                    key: 'table' },
  { match: /сушилка/i,                                  key: 'washer' },
  { match: /постельн/i,                                 key: 'towel' },
  { match: /wi-?fi|вай.фай|интернет/i,                  key: 'wifi' },
  { match: /варочн|индукцион/i,                         key: 'flame' },
  { match: /ванная|ванн.комнат|собственная ванн/i,      key: 'bath' },
  { match: /^ванна$|джакузи/i,                          key: 'bath' },
  { match: /душевая|душ\b/i,                            key: 'shower' },
  { match: /холодильник/i,                              key: 'fridge' },
  { match: /кондиционер/i,                              key: 'snow' },
  { match: /фен/i,                                      key: 'wind' },
  { match: /балкон|лоджия|терраса/i,                    key: 'home' },
  { match: /кухн/i,                                     key: 'kitchen' },
  { match: /микроволновк|микроволновая/i,               key: 'microwave' },
  { match: /плит/i,                                     key: 'flame' },
  { match: /кофе/i,                                     key: 'coffee' },
  { match: /подогрев/i,                                 key: 'thermo' },
  { match: /тапочк/i,                                   key: 'slippers' },
  { match: /телевизор|smart.tv|^тв$/i,                  key: 'tv' },
  { match: /сейф/i,                                     key: 'lock' },
  { match: /стиральн/i,                                 key: 'washer' },
  { match: /парковк/i,                                  key: 'car' },
];

function FeatureIcon({ name }: { name: string }) {
  const entry = FEATURE_ICON_MAP.find(({ match }) => match.test(name));
  return icons[entry?.key ?? 'home'] ?? icons.home;
}

function renderDescription(text: string) {
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} style={{ marginBottom: '0.9em' }}>
      {para.split('\n').map((line, j, arr) => (
        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
      ))}
    </p>
  ));
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const FEATURES_VISIBLE = 18;

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

  const PhotoArrows = () => {
    if (!hasImages || apartment.images.length < 2) return null;
    return (
      <>
        <button className="apt-photo-arrow apt-photo-arrow--left" onClick={(e) => { e.stopPropagation(); goToPrev(); }} aria-label="Предыдущее фото">‹</button>
        <button className="apt-photo-arrow apt-photo-arrow--right" onClick={(e) => { e.stopPropagation(); goToNext(); }} aria-label="Следующее фото">›</button>
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
              <div className="apt-desc-scroll">
                {renderDescription(apartment.description || '')}
              </div>
            </div>
          </div>

          {/* Правая колонка — только фото */}
          <div className="apt-col-right">
            <div className={`apt-photo${!hasImages ? ' apt-photo--empty' : ''}`}>
              {hasImages && (
                <img
                  src={apartment.images[activeIndex]}
                  alt={apartment.title}
                />
              )}
              <PhotoArrows />
              {/* Горизонтальная навигация внутри фото */}
              {hasImages && apartment.images.length > 1 && (
                <div className="apt-photo-nav">
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
          </div>

          {/* Панель особенностей — на всю ширину (grid-column: 1/-1) */}
          {apartment.features?.length > 0 && (
            <div className="apt-features-panel">
              <div className="apt-features-panel__header">
                <span className="apt-features-eyebrow">Особенности</span>
                {apartment.features.length > FEATURES_VISIBLE && (
                  <button
                    className="apt-features-toggle"
                    onClick={() => setFeaturesExpanded(e => !e)}
                  >
                    {featuresExpanded ? 'Свернуть' : `Все (${apartment.features.length}) →`}
                  </button>
                )}
              </div>
              <div className="apt-features-grid">
                {(featuresExpanded ? apartment.features : apartment.features.slice(0, FEATURES_VISIBLE)).map((feature, i) => (
                  <div key={i} className="apt-feature-card">
                    <span className="apt-feature-card__icon"><FeatureIcon name={feature} /></span>
                    <span className="apt-feature-card__label">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!loading && !isActive && (
          <div className="panorama-unavailable-message">
            <span className="unavailable-text">Апартамент временно недоступен для бронирования</span>
          </div>
        )}
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