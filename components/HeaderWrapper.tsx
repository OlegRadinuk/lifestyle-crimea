'use client';

import { useState } from 'react';
import Header from './Header';
import BurgerMenu from './BurgerMenu';

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
