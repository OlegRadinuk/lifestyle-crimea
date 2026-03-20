'use client';

import { Suspense } from 'react';
import Header from './Header';

type Props = {
  onBurgerClick: () => void;
};

// Компонент, который использует useSearchParams (отдельный, чтобы обернуть в Suspense)
function HeaderWithSearchParams({ onBurgerClick }: Props) {
  return <Header onBurgerClick={onBurgerClick} />;
}

export default function HeaderWithSuspense(props: Props) {
  return (
    <Suspense fallback={<div className="header-placeholder" style={{ height: '80px' }} />}>
      <HeaderWithSearchParams {...props} />
    </Suspense>
  );
}