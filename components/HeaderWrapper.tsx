'use client';

import { useState } from 'react';
import HeaderWithSuspense from './HeaderWithSuspense';
import BurgerMenu from './BurgerMenu';

export default function HeaderWrapper() {
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <>
      <HeaderWithSuspense onBurgerClick={() => setBurgerOpen(true)} />
      <BurgerMenu
        isOpen={burgerOpen}
        onClose={() => setBurgerOpen(false)}
      />
    </>
  );
}