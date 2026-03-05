'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ApartmentClient } from '@/lib/types';

interface ApartmentDetailsProps {
  apartment: ApartmentClient;
}

export default function ApartmentDetails({ apartment }: ApartmentDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const images = apartment.images?.length ? apartment.images : ['/images/placeholder.jpg'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/apartments" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Назад к списку
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Галерея */}
        <div>
          <div className="relative h-96 mb-4 rounded-lg overflow-hidden">
            <Image
              src={images[selectedImage]}
              alt={apartment.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 rounded-md overflow-hidden ${
                    selectedImage === idx ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <Image src={img} alt={`${apartment.title} ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Информация */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{apartment.title}</h1>
          
          <div className="mb-6">
            <p className="text-gray-600">{apartment.short_description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Макс. гостей</div>
              <div className="text-xl font-semibold">{apartment.max_guests} чел.</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Площадь</div>
              <div className="text-xl font-semibold">{apartment.area || '—'} м²</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Вид</div>
              <div className="text-xl font-semibold">{apartment.view || '—'}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Терраса</div>
              <div className="text-xl font-semibold">{apartment.has_terrace ? 'Есть' : 'Нет'}</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Описание</h2>
            <div className="text-gray-700 whitespace-pre-wrap">{apartment.description}</div>
          </div>

          {apartment.features?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Особенности</h2>
              <ul className="grid grid-cols-2 gap-2">
                {apartment.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-700">
                    <span className="mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-2xl font-bold">{apartment.price_base} ₽</span>
                <span className="text-gray-500">/ночь</span>
              </div>
              <Link
                href={`/booking/${apartment.id}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Забронировать
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}