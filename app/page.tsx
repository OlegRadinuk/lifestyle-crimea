'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import { LoadingScreen } from '@/components/LoadingScreen';
import JsonLd from '@/components/JsonLd';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mountKey, setMountKey] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // При каждом возврате на страницу пересоздаём ключ для принудительного сброса компонентов
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setMountKey(Date.now());
      }
    };
    
    // Также при загрузке страницы сбрасываем
    setMountKey(Date.now());
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Schema.org разметка для отеля
  const hotelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: 'Life Style Crimea',
    alternateName: 'Стиль Жизни с любовью',
    description: 'Премиальные апартаменты в Алуште с видом на море. 38 дизайнерских номеров с балконами, полностью укомплектованы. Бронирование онлайн.',
    url: 'https://lovelifestyle.ru',
    logo: 'https://lovelifestyle.ru/logo.png',
    image: 'https://lovelifestyle.ru/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Алушта',
      addressRegion: 'Крым',
      addressCountry: 'RU',
      streetAddress: 'Западная ул., 4',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '44.6630',
      longitude: '34.4001',
    },
    telephone: '+7 (978) 582-86-93',
    email: 'info@lovelifestyle.ru',
    priceRange: 'от 5 000 ₽',
    starRating: {
      '@type': 'Rating',
      ratingValue: '4.9',
      bestRating: '5',
      ratingCount: '127',
    },
    amenities: [
      'Бесплатный Wi-Fi',
      'Кондиционер',
      'Парковка',
      'Кухня',
      'Балкон',
      'Телевизор',
      'Сейф',
      'Халаты и тапочки',
    ],
    checkinTime: '14:00',
    checkoutTime: '12:00',
    numberOfRooms: '38',
    acceptsReservations: 'https://lovelifestyle.ru/apartments',
    sameAs: [
      'https://www.instagram.com/lifestylecrimea',
      'https://t.me/lifestylecrimea',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
    },
  };

  return (
    <>
      <JsonLd data={hotelJsonLd} />
      
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <div 
        ref={containerRef}
        className={`main-container ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* Сцена 1 - Hero */}
        <section className="scene scene--hero">
          <Hero key={`hero-${mountKey}`} />
        </section>

        {/* Спейсер между Hero и Panorama (только на десктопе) */}
        {!isMobile && <div className="scene-spacer" />}

        {/* Сцена 2 - Panorama */}
        <section className="scene scene--panorama">
          <PanoramaViewer key={`panorama-${mountKey}`} />
        </section>

        {/* Спейсер между Panorama и Reviews (только на десктопе) */}
        {!isMobile && <div className="scene-spacer" />}

        {/* Сцена 3 - Отзывы + Футер */}
        <section className="scene scene--reviews-footer">
          <Reviews key={`reviews-${mountKey}`} />
        </section>
      </div>
    </>
  );
}