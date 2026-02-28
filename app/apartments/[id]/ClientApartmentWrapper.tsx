'use client';

import { useEffect } from 'react';
import { APARTMENTS } from '@/data/apartments';
import { useApartment } from '@/components/ApartmentContext';
import ApartmentHero from './ApartmentHero';

type Props = {
  apartment: typeof APARTMENTS[0];
};

export default function ClientApartmentWrapper({ apartment }: Props) {
  const { setCurrentApartmentIndex } = useApartment();

  useEffect(() => {
    const index = APARTMENTS.findIndex(a => a.id === apartment.id);
    if (index !== -1) {
      setCurrentApartmentIndex(index);
    }
  }, [apartment.id, setCurrentApartmentIndex]);

  return <ApartmentHero apartment={apartment} />;
}