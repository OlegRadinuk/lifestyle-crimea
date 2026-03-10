'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Apartment = {
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

export default function ApartmentsClient({ initialApartments }: { initialApartments: Apartment[] }) {
  const [apartments, setApartments] = useState(initialApartments);
  const [loading, setLoading] = useState(false);

  // Периодически обновляем данные
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/apartments', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setApartments(data);
        }
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoading(false);
      }
    };

    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchApartments, 30000);
    
    // При монтировании тоже обновляем
    fetchApartments();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Наши апартаменты</h1>
      
      {loading && <div className="text-center py-4">Обновление...</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apartments.map((apartment) => (
          <Link 
            key={apartment.id} 
            href={`/apartments/${apartment.id}`}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="relative h-48">
                <Image
                  src={apartment.images[0] || '/images/placeholder.jpg'}
                  alt={apartment.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{apartment.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{apartment.short_description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {apartment.price_base.toLocaleString()} ₽
                  </span>
                  <span className="text-sm text-gray-500">/ночь</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  До {apartment.max_guests} гостей
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}