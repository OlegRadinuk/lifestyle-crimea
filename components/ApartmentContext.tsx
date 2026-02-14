// components/ApartmentContext.tsx
'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { PANORAMAS } from '@/data/panoramas';

type ApartmentContextType = {
  currentApartmentIndex: number;
  setCurrentApartmentIndex: (i: number) => void;

  currentApartment: (typeof PANORAMAS)[number] | null;

  showApartmentBooking: boolean;
  setShowApartmentBooking: (v: boolean) => void;
};

const ApartmentContext = createContext<ApartmentContextType | null>(null);

export function ApartmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentApartmentIndex, setCurrentApartmentIndex] = useState(0);
  const [showApartmentBooking, setShowApartmentBooking] = useState(false);

  const currentApartment = useMemo(
    () => PANORAMAS[currentApartmentIndex] ?? null,
    [currentApartmentIndex]
  );

  return (
    <ApartmentContext.Provider
      value={{
        currentApartmentIndex,
        setCurrentApartmentIndex,
        currentApartment,
        showApartmentBooking,
        setShowApartmentBooking,
      }}
    >
      {children}
    </ApartmentContext.Provider>
  );
}

export function useApartment() {
  const ctx = useContext(ApartmentContext);
  if (!ctx) {
    throw new Error(
      'useApartment must be used inside ApartmentProvider'
    );
  }
  return ctx;
}
