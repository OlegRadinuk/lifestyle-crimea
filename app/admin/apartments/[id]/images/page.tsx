'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from './ImageUploader';
import ImageGallery from './ImageGallery';

interface Image {
  id: number;
  url: string;
  sort_order: number;
}

export default function ApartmentImagesPage() {
  const params = useParams();
  const router = useRouter();
  const apartmentId = params.id as string;
  
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [apartmentTitle, setApartmentTitle] = useState('');

  useEffect(() => {
    fetchImages();
    fetchApartment();
  }, [apartmentId]);

  const fetchApartment = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}`);
      const data = await res.json();
      setApartmentTitle(data.title);
    } catch (error) {
      console.error('Error fetching apartment:', error);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}/images`);
      const data = await res.json();
      setImages(data.sort((a: Image, b: Image) => a.sort_order - b.sort_order));
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (newImage: { id: number; url: string }) => {
    setImages(prev => [...prev, { ...newImage, sort_order: prev.length + 1 }]);
    // Сообщаем клиентской части об обновлении фото
    window.dispatchEvent(new CustomEvent('apartment-images-updated'));
  };

  const handleDelete = (imageId: number) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    // Сообщаем клиентской части об обновлении фото
    window.dispatchEvent(new CustomEvent('apartment-images-updated'));
  };

  const handleSort = async (sortedImages: Image[]) => {
    setImages(sortedImages);
    
    // Сохраняем новый порядок
    try {
      await fetch(`/api/admin/apartments/${apartmentId}/images/sort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: sortedImages.map(img => img.id) }),
      });
      // Сообщаем клиентской части об обновлении фото
      window.dispatchEvent(new CustomEvent('apartment-images-updated'));
    } catch (error) {
      console.error('Error saving sort order:', error);
    }
  };

  if (loading) {
    return <div className="admin-loading">Загрузка...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">
          Фотографии: {apartmentTitle}
        </h1>
        <Link href={`/admin/apartments/${apartmentId}`} className="admin-button">
          ← Назад к апартаменту
        </Link>
      </div>

      <div className="admin-card">
        <h2>Загрузить новые фото</h2>
        <ImageUploader apartmentId={apartmentId} onUpload={handleUpload} />
      </div>

      <div className="admin-card">
        <h2>Галерея</h2>
        <p className="gallery-hint">
          Перетаскивайте фото для изменения порядка. Первое фото будет главным.
        </p>
        <ImageGallery 
          images={images} 
          onDelete={handleDelete}
          onSort={handleSort}
        />
      </div>

      {/* Добавляем небольшую подсказку */}
      <div className="admin-note" style={{ marginTop: '20px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', fontSize: '14px', color: '#0369a1' }}>
        ⚡ Изменения сохраняются автоматически и сразу отображаются на сайте
      </div>
    </div>
  );
}