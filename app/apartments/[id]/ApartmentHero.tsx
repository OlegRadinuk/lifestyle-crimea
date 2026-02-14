'use client';

import { useEffect, useState } from 'react';
import { useHeader } from '@/components/HeaderContext';
import type { Apartment } from '@/data/apartments';

type Props = {
  apartment: Apartment;
};

export default function ApartmentHero({ apartment }: Props) {
  const { register, unregister } = useHeader();

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  /* HEADER MODE */
  useEffect(() => {
    const id = 'apartment-hero';
    register(id, { mode: 'apartment', priority: 2 });
    return () => unregister(id);
  }, [register, unregister]);

  /* AUTOPLAY */
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % apartment.images.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [paused, apartment.images.length]);

  return (
    <section
      className="hero-section apartment-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* SLIDER */}
      <div className="hero-slider">
        {apartment.images.map((img, index) => (
          <div
            key={index}
            className={`hero-slide ${index === active ? 'active' : ''}`}
          >
            <div
              className="hero-slide-bg"
              style={{ backgroundImage: `url(${img})` }}
            />
          </div>
        ))}
      </div>

      {/* OVERLAY */}
      <div className="panorama-overlay" />

      {/* SVG FRAME */}
      <svg
        className="hero-frame-svg"
        viewBox="0 0 1900 1300"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M 0 0
            H 1900
            V 580
            L 1865 650
            L 1900 720
            V 1300
            H 0
            V 720
            L 35 650
            L 0 580
            Z
          "
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1"
        />
      </svg>

      {/* INFO — КЛАССЫ ИЗ PANORAMA */}
      <div className="panorama-info">
        <div className="panorama-info-inner animate-in">
          <span className="panorama-info-eyebrow">
            Lifestyle · Luxury
          </span>

          <h2 className="panorama-info-title">
            {apartment.title}
          </h2>

          <p className="panorama-info-description">
            {apartment.description}
          </p>

          <ul className="panorama-info-meta">
            <li>До {apartment.maxGuests} гостей</li>
            <li>{apartment.area} м²</li>
            {apartment.features.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ARROWS — КЛАССЫ ИЗ HERO */}
      <button
        className="hero-arrow hero-arrow--left"
        onClick={() =>
          setActive(prev =>
            prev === 0 ? apartment.images.length - 1 : prev - 1
          )
        }
      >
        ‹
      </button>

      <button
        className="hero-arrow hero-arrow--right"
        onClick={() =>
          setActive(prev => (prev + 1) % apartment.images.length)
        }
      >
        ›
      </button>

      {/* TIMELINE */}
      <div className="hero-timeline">
        {apartment.images.map((_, index) => (
          <button
            key={index}
            className={`hero-timeline-item ${index === active ? 'active' : ''}`}
            onClick={() => setActive(index)}
          >
            {String(index + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
    </section>
  );
}
