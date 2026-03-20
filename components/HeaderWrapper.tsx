'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import BurgerMenu from './BurgerMenu';

// Динамический импорт Header без SSR
const Header = dynamic(() => import('./Header'), {
  ssr: false,
  loading: () => <div className="header-placeholder" style={{ height: '80px' }} />
});

export default function HeaderWrapper() {
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <>
      <Header onBurgerClick={() => setBurgerOpen(true)} />
      <BurgerMenu
        isOpen={burgerOpen}
        onClose={() => setBurgerOpen(false)}
      />
    </>
  );
}