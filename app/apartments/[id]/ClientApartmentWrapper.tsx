'use client';

import { useEffect, useState } from 'react';
import { useApartment } from '@/components/ApartmentContext';
import ApartmentHero from './ApartmentHero';
import { Apartment } from '@/data/apartments';

type Props = {
  apartment: Apartment;
};

export default function ClientApartmentWrapper({ apartment }: Props) {
  const { setCurrentApartmentIndex, panoramas } = useApartment();
  const [price, setPrice] = useState(apartment.priceBase);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  // Загружаем актуальную цену и статус из БД
  useEffect(() => {
    const fetchApartmentData = async () => {
      try {
        const res = await fetch(`/api/apartments/${apartment.id}`);
        if (res.ok) {
          const data = await res.json();
          setPrice(data.price_base);
          setIsActive(data.is_active);
        }
      } catch (error) {
        console.error('Error fetching apartment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentData();
  }, [apartment.id]);

  // Находим индекс в массиве панорам для контекста
  useEffect(() => {
    const index = panoramas?.findIndex(p => p.id === apartment.id) ?? -1;
    if (index !== -1) {
      setCurrentApartmentIndex(index);
    }
  }, [apartment.id, setCurrentApartmentIndex, panoramas]);

  // Создаем объект с актуальной ценой
  const apartmentWithPrice = {
    ...apartment,
    priceBase: price,
    isActive: isActive
  };

  return <ApartmentHero apartment={apartmentWithPrice} loading={loading} />;
}