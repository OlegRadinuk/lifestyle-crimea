'use client';

import { useEffect } from 'react';
import { useApartment } from '@/components/ApartmentContext';
import ApartmentHero from './ApartmentHero';

type Props = {
  apartment: {
    id: string;
    title: string;
    shortDescription: string;
    description: string;
    maxGuests: number;
    area: number;
    priceBase: number;
    view: string;
    hasTerrace: boolean;
    features: string[];
    images: string[];
  };
};

export default function ClientApartmentWrapper({ apartment }: Props) {
  const { setCurrentApartmentIndex } = useApartment();

  // Опционально: можно установить индекс для контекста
  useEffect(() => {
    // Если нужно синхронизировать с панорамами
    // setCurrentApartmentIndex(index);
  }, [apartment.id, setCurrentApartmentIndex]);

  return <ApartmentHero apartment={apartment} />;
}