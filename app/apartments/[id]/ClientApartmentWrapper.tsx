'use client';

import { useEffect, useState } from 'react';
import { useApartment } from '@/components/ApartmentContext';
import ApartmentHero from './ApartmentHero';

type Props = {
  apartment: {
    id: string;
    title: string;
    short_description: string;
    description: string;
    max_guests: number;
    area: number;
    price_base: number;
    view: string;
    has_terrace: boolean;
    features: string[];
    images: string[];
    is_active?: boolean;
  };
};

export default function ClientApartmentWrapper({ apartment }: Props) {
  const { setCurrentApartmentIndex, panoramas } = useApartment();
  const [price, setPrice] = useState(apartment.price_base);
  const [isActive, setIsActive] = useState(apartment.is_active !== false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState(apartment.images);

  // Загружаем актуальные данные из API (на случай изменений в админке)
  useEffect(() => {
    const fetchApartmentData = async () => {
      try {
        const res = await fetch(`/api/apartments/${apartment.id}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPrice(data.price_base);
          setIsActive(data.is_active);
          if (data.images && data.images.length > 0) {
            setImages(data.images);
          }
        }
      } catch (error) {
        console.error('Error fetching apartment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentData();

    // Подписываемся на событие обновления фото
    const handleImagesUpdated = () => {
      fetchApartmentData();
    };

    window.addEventListener('apartment-images-updated', handleImagesUpdated);
    return () => window.removeEventListener('apartment-images-updated', handleImagesUpdated);
  }, [apartment.id]);

  // Находим индекс в массиве панорам для контекста
  useEffect(() => {
    const index = panoramas?.findIndex(p => p.id === apartment.id) ?? -1;
    if (index !== -1) {
      setCurrentApartmentIndex(index);
    }
  }, [apartment.id, setCurrentApartmentIndex, panoramas]);

  // Преобразуем в формат, который ожидает ApartmentHero
  const apartmentForHero = {
    id: apartment.id,
    title: apartment.title,
    shortDescription: apartment.short_description,
    description: apartment.description,
    maxGuests: apartment.max_guests,
    area: apartment.area,
    priceBase: price,
    view: apartment.view,
    hasTerrace: apartment.has_terrace,
    features: apartment.features,
    images: images,
    isActive: isActive
  };

  return <ApartmentHero apartment={apartmentForHero} loading={loading} />;
}