'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';

import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import Footer from '@/components/Footer';

export default function HomePage() {

  return (
    <main className="frame">
      <section className="layer layer--hero">
        <Hero />
      </section>

      <div className="layer-spacer" />

      <section className="layer layer--apartments">
        <PanoramaViewer />
      </section>

      <div className="layer-spacer" />

      <section className="layer layer--reviews">
        <Reviews />
        <Footer />
      </section>
    </main>
  );
}
