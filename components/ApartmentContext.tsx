'use client';

import { createContext, useContext, useState, useMemo, useEffect } from 'react';

type Panorama = {
  id: string;
  title: string;
  image: string; // путь к изображению
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
        
        // Преобразуем данные, добавляя полный путь к изображению
        const formattedPanoramas = data.map((p: any) => ({
          ...p,
          // Используем существующие файлы из public/panoramas
          image: `/panoramas/${p.image}` // предполагаем, что в БД хранится имя файла
        }));
        
        setPanoramas(formattedPanoramas);
      } catch (error) {
        console.error('Error loading panoramas:', error);
        
        // Фallback для разработки - используем файлы из директории
        const fallbackPanoramas = [
          { id: '1', title: 'LS Lux Sunshine', image: '/panoramas/LS-Lux-Sunshine.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '2', title: 'LS Lux Soft Blue', image: '/panoramas/LS-Lux-Soft-Blue.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '3', title: 'LS Lux Sun Rays', image: '/panoramas/LS-Lux-Sun-Rays.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '4', title: 'LS Lux Fly Birds', image: '/panoramas/LS-Lux-Fly-Birds.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '5', title: 'LS Lux Sunny Mood', image: '/panoramas/LS-Lux-Sunny-Mood.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '6', title: 'LS Lux Fly Mood', image: '/panoramas/LS-Lux-Fly-Mood.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '7', title: 'LS Lux Fly Sky', image: '/panoramas/LS-Lux-Fly-Sky.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '8', title: 'LS Lux Beautiful Days', image: '/panoramas/LS-Lux-Beautiful-Days.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '9', title: 'LS Art Crystal Blue', image: '/panoramas/LS-Art-Crystal-Blue.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '10', title: 'LS Art Dream Vacation', image: '/panoramas/LS-Art-Dream-Vacation.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '11', title: 'LS Art Flower Kiss', image: '/panoramas/LS-Art-Flower-Kiss.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '12', title: 'LS Art Only You', image: '/panoramas/LS-Art-Only-You.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
          { id: '13', title: 'LS Art Sweet Caramel', image: '/panoramas/LS-Art-Sweet-Caramel.webp', maxGuests: 4, meta: ['Вид на море', 'Премиум'] },
        ];
        setPanoramas(fallbackPanoramas);
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