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
  const apartmentIndex = APARTMENTS.findIndex(a => a.id === apartment.id);

  useEffect(() => {
    if (apartmentIndex !== -1) {
      setCurrentApartmentIndex(apartmentIndex);
    }
  }, [apartmentIndex, setCurrentApartmentIndex]);

  return <ApartmentHero apartment={apartment} />;
}