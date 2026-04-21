'use client';

import { useEffect, useState } from 'react';
import { useSearchParamsFromUrl } from '@/hooks/useSearchParamsFromUrl';
import { useHeader } from '@/components/HeaderContext';
import { useApartment, Season, HotDeal } from '@/components/ApartmentContext';
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
  const { setCurrentDBApartment } = useApartment();
  const { setSearchParams } = useHeader();
  const searchParamsFromUrl = useSearchParamsFromUrl();

  const [price, setPrice] = useState(apartment.price_base);
  const [isActive, setIsActive] = useState(apartment.is_active !== false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState(apartment.images);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [hotDeal, setHotDeal] = useState<HotDeal | undefined>(undefined);

  // Передаем параметры поиска в контекст хедера
  useEffect(() => {
    if (searchParamsFromUrl) {
      console.log('📅 [Apartment] Setting dates:', searchParamsFromUrl);
      setSearchParams(searchParamsFromUrl);
    }

    return () => {
      setSearchParams(null);
    };
  }, [searchParamsFromUrl, setSearchParams]);

  // Загружаем актуальные данные из API
  useEffect(() => {
    const fetchApartmentData = async () => {
      try {
        const res = await fetch(`/api/apartments/${apartment.id}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          setPrice(data.price_base);
          setIsActive(data.is_active);
          if (data.images && data.images.length > 0) {
            setImages(data.images);
          }
          setSeasons(data.seasons || []);
          if (data.hot_deal_enabled) {
            setHotDeal({
              enabled: true,
              discount: data.hot_deal_discount || 10,
              date_from: data.hot_deal_date_from || null,
              date_to: data.hot_deal_date_to || null,
            });
          } else {
            setHotDeal(undefined);
          }
        }
      } catch (error) {
        console.error('Error fetching apartment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentData();

    const handleImagesUpdated = () => fetchApartmentData();
    window.addEventListener('apartment-images-updated', handleImagesUpdated);
    return () => window.removeEventListener('apartment-images-updated', handleImagesUpdated);
  }, [apartment.id]);

  // Устанавливаем текущий апартамент в контекст
  useEffect(() => {
    setCurrentDBApartment({
      id: apartment.id,
      title: apartment.title,
      price_base: price,
      seasons,
      hotDeal,
    });

    return () => {
      setCurrentDBApartment(null);
    };
  }, [apartment.id, apartment.title, price, seasons, hotDeal, setCurrentDBApartment]);

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
