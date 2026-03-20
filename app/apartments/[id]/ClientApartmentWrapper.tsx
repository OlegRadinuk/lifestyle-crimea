// app/apartments/[id]/ClientApartmentWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParamsFromUrl } from '@/hooks/useSearchParamsFromUrl';
import { useHeader } from '@/components/HeaderContext';
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
  const { setCurrentDBApartment, panoramas } = useApartment();
  const { setSearchParams, searchParams: headerSearchParams } = useHeader();
  const searchParamsFromUrl = useSearchParamsFromUrl();
  
  const [price, setPrice] = useState(apartment.price_base);
  const [isActive, setIsActive] = useState(apartment.is_active !== false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState(apartment.images);

  // Логируем для отладки
  useEffect(() => {
    console.log('🔍 [ClientApartmentWrapper] searchParamsFromUrl:', searchParamsFromUrl);
    console.log('🔍 [ClientApartmentWrapper] headerSearchParams before set:', headerSearchParams);
  }, [searchParamsFromUrl, headerSearchParams]);

  // Передаем параметры поиска в контекст хедера
  useEffect(() => {
    if (searchParamsFromUrl) {
      console.log('📝 [ClientApartmentWrapper] Setting searchParams in header:', searchParamsFromUrl);
      setSearchParams(searchParamsFromUrl);
    }
    
    return () => {
      console.log('🧹 [ClientApartmentWrapper] Clearing searchParams');
      setSearchParams(null);
    };
  }, [searchParamsFromUrl, setSearchParams]);

  // ... остальной код без изменений

  // Загружаем актуальные данные из API
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

    const handleImagesUpdated = () => {
      fetchApartmentData();
    };

    window.addEventListener('apartment-images-updated', handleImagesUpdated);
    return () => window.removeEventListener('apartment-images-updated', handleImagesUpdated);
  }, [apartment.id]);

  // УСТАНАВЛИВАЕМ ТЕКУЩИЙ АПАРТАМЕНТ В КОНТЕКСТ
  useEffect(() => {
    console.log('🏠 Setting current DB apartment:', apartment.id, apartment.title);
    setCurrentDBApartment({
      id: apartment.id,
      title: apartment.title
    });
    
    return () => {
      console.log('🧹 Clearing current DB apartment');
      setCurrentDBApartment(null);
    };
  }, [apartment.id, apartment.title, setCurrentDBApartment]);

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