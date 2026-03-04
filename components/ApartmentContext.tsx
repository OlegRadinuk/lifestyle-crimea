'use client';

import { createContext, useContext, useState, useMemo, useEffect } from 'react';

type Panorama = {
  id: string;
  title: string;
  image: string;
  maxGuests: number;
  meta: string[];
};

type ApartmentContextType = {
  currentApartmentIndex: number;
  setCurrentApartmentIndex: (i: number) => void;
  currentApartment: Panorama | null;
  showApartmentBooking: boolean;
  setShowApartmentBooking: (v: boolean) => void;
  panoramas: Panorama[];
  loading: boolean;
};

const ApartmentContext = createContext<ApartmentContextType | null>(null);

export function ApartmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentApartmentIndex, setCurrentApartmentIndex] = useState(0);
  const [showApartmentBooking, setShowApartmentBooking] = useState(false);
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем панорамы из БД
  useEffect(() => {
    const fetchPanoramas = async () => {
      try {
        const res = await fetch('/api/panoramas');
        const data = await res.json();
        setPanoramas(data);
      } catch (error) {
        console.error('Error loading panoramas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPanoramas();
  }, []);

  const currentApartment = useMemo(
    () => panoramas[currentApartmentIndex] ?? null,
    [currentApartmentIndex, panoramas]
  );

  return (
    <ApartmentContext.Provider
      value={{
        currentApartmentIndex,
        setCurrentApartmentIndex,
        currentApartment,
        showApartmentBooking,
        setShowApartmentBooking,
        panoramas,
        loading,
      }}
    >
      {children}
    </ApartmentContext.Provider>
  );
}

export function useApartment() {
  const ctx = useContext(ApartmentContext);
  if (!ctx) {
    throw new Error('useApartment must be used inside ApartmentProvider');
  }
  return ctx;
}