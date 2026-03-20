'use client';

import { useEffect, useState } from 'react';
import { useApartment } from '@/components/ApartmentContext';
import ApartmentHero from './ApartmentHero';
import JsonLd from '@/components/JsonLd';

type Props = {
  apartment: {
    id: string;
    title: string;
    short_description: string | null;
    description: string | null;
    max_guests: number;
    area: number | null;
    price_base: number;
    view: string;
    has_terrace: boolean;
    features: string[];
    images: string[];
    is_active: boolean;
  };
};

export default function ClientApartmentWrapper({ apartment }: Props) {
  const { setCurrentApartmentIndex, panoramas } = useApartment();
  const [price, setPrice] = useState(apartment.price_base);
  const [isActive, setIsActive] = useState(apartment.is_active !== false);
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

  // Преобразуем в формат, который ожидает ApartmentHero
  const apartmentForHero = {
    id: apartment.id,
    title: apartment.title,
    shortDescription: apartment.short_description || '',
    description: apartment.description || '',
    maxGuests: apartment.max_guests,
    area: apartment.area ?? 0,
    priceBase: price,
    view: apartment.view,
    hasTerrace: apartment.has_terrace,
    features: apartment.features,
    images: apartment.images,
    isActive: isActive,
  };

  // Формируем данные для JSON-LD микроразметки
  const getViewText = (view: string): string => {
    const views: Record<string, string> = {
      sea: 'на море',
      mountain: 'на горы',
      city: 'на город',
      garden: 'во двор',
      mixed: 'на море и горы',
      forest: 'на лес',
    };
    return views[view] || 'на море';
  };

  const viewText = getViewText(apartment.view);
  const featuresList = apartment.features || [];
  const topFeatures = featuresList.slice(0, 5).join(', ');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${apartment.title} | Апартаменты в Алуште`,
    description: apartment.short_description || `${apartment.title} — стильные апартаменты в Алуште с видом ${viewText}. ${apartment.area || ''} м², до ${apartment.max_guests} гостей. Балкон, кондиционер, кухня.`,
    image: apartment.images?.[0] || '/images/placeholder.jpg',
    brand: {
      '@type': 'Brand',
      name: 'Life Style Crimea',
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'RUB',
      availability: isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: price,
        priceCurrency: 'RUB',
        unitCode: 'DAY',
        unitText: 'ночь',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Площадь',
        value: apartment.area ? `${apartment.area} м²` : 'не указано',
      },
      {
        '@type': 'PropertyValue',
        name: 'Максимум гостей',
        value: apartment.max_guests,
      },
      {
        '@type': 'PropertyValue',
        name: 'Вид',
        value: viewText,
      },
      {
        '@type': 'PropertyValue',
        name: 'Балкон',
        value: apartment.has_terrace ? 'есть' : 'нет',
      },
      ...(topFeatures
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Оснащение',
              value: topFeatures,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <ApartmentHero apartment={apartmentForHero} loading={loading} />
    </>
  );
}