'use client';

import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { PANORAMAS } from '@/data/panoramas';

type Panorama = {
  id: string;
  title: string;
  image: string;
  maxGuests: number;
  meta: string[];
};

type ApartmentFromDB = {
  id: string;
  title: string;
};

type ApartmentContextType = {
  // Для панорам (старый функционал)
  currentApartmentIndex: number;
  setCurrentApartmentIndex: (i: number) => void;
  currentApartment: Panorama | null;
  panoramas: Panorama[];
  loading: boolean;
  
  // ДЛЯ АПАРТАМЕНТОВ ИЗ БД
  currentDBApartment: ApartmentFromDB | null;
  setCurrentDBApartment: (apt: ApartmentFromDB | null) => void; // ЭТО ДОБАВЛЯЕМ
  
  // Для совместимости
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
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние для апартаментов из БД
  const [currentDBApartment, setCurrentDBApartment] = useState<ApartmentFromDB | null>(null);

  // Загружаем панорамы из БД
  useEffect(() => {
    const fetchPanoramas = async () => {
      try {
        const res = await fetch('/api/panoramas');
        const data = await res.json();
        
        if (data && data.length > 0) {
          setPanoramas(data);
        } else {
          setPanoramas(PANORAMAS);
        }
      } catch (error) {
        console.error('Error loading panoramas:', error);
        setPanoramas(PANORAMAS);
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
        // Для панорам
        currentApartmentIndex,
        setCurrentApartmentIndex,
        currentApartment,
        panoramas,
        loading,
        
        // Для апартаментов из БД
        currentDBApartment,
        setCurrentDBApartment, // ЭТО ДОБАВЛЯЕМ
        
        // Общее
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
    throw new Error('useApartment must be used inside ApartmentProvider');
  }
  return ctx;
}