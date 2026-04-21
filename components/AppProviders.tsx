'use client';

import { ApartmentProvider } from '@/components/ApartmentContext';
import { SearchProvider } from '@/components/SearchContext';
import { HeaderProvider } from '@/components/HeaderContext';
import { PhotoModalProvider } from '@/components/photo-modal/PhotoModalContext';
import HeaderConditional from '@/components/HeaderConditional';
import { ModalProvider } from '@/components/ModalProvider';
import CookieBanner from '@/components/CookieBanner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ApartmentProvider>
      <SearchProvider>
        <HeaderProvider>
          <PhotoModalProvider>
            {children}
            <HeaderConditional />
            <ModalProvider />
            <CookieBanner />
          </PhotoModalProvider>
        </HeaderProvider>
      </SearchProvider>
    </ApartmentProvider>
  );
}
