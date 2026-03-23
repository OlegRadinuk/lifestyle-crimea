'use client';

import { ApartmentProvider } from '@/components/ApartmentContext';
import { SearchProvider } from '@/components/SearchContext';
import { HeaderProvider } from '@/components/HeaderContext';
import { PhotoModalProvider } from '@/components/photo-modal/PhotoModalContext';
import HeaderConditional from '@/components/HeaderConditional';
import { ModalProvider } from '@/components/ModalProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ApartmentProvider>
      <SearchProvider>
        <HeaderProvider>
          <PhotoModalProvider>
            {children}
            <HeaderConditional />
            <ModalProvider />
          </PhotoModalProvider>
        </HeaderProvider>
      </SearchProvider>
    </ApartmentProvider>
  );
}
