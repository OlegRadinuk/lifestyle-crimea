'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from './ImageUploader';
import ImageGallery from './ImageGallery';
import ImageCropper from './ImageCropper';
import RedeployButton from './RedeployButton';

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
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [showRedeploy, setShowRedeploy] = useState(false);

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
    window.dispatchEvent(new CustomEvent('apartment-images-updated'));
    setShowRedeploy(true);
  };

  const handleDelete = (imageId: number) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    window.dispatchEvent(new CustomEvent('apartment-images-updated'));
    setShowRedeploy(true);
  };

  const handleSort = async (sortedImages: Image[]) => {
    setImages(sortedImages);
    
    try {
      await fetch(`/api/admin/apartments/${apartmentId}/images/sort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: sortedImages.map(img => img.id) }),
      });
      window.dispatchEvent(new CustomEvent('apartment-images-updated'));
      setShowRedeploy(true);
    } catch (error) {
      console.error('Error saving sort order:', error);
    }
  };

  const handleEdit = (image: Image) => {
    setEditingImage(image);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!editingImage) return;

    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped.webp');

    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newImage = await res.json();
        
        // Можно либо добавить как новое, либо заменить существующее
        // Пока добавляем как новое
        setImages(prev => [...prev, { ...newImage, sort_order: prev.length + 1 }]);
        
        setEditingImage(null);
        setShowRedeploy(true);
        window.dispatchEvent(new CustomEvent('apartment-images-updated'));
      } else {
        alert('Ошибка при сохранении обрезанного фото');
      }
    } catch (error) {
      console.error('Crop upload error:', error);
      alert('Ошибка при загрузке обрезанного фото');
    }
  };

  const handleCropCancel = () => {
    setEditingImage(null);
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

      {/* Кнопка редеплоя появляется только когда нужно */}
      {showRedeploy && (
        <RedeployButton apartmentId={apartmentId} />
      )}

      <div className="admin-card">
        <h2>Загрузить новые фото</h2>
        <ImageUploader apartmentId={apartmentId} onUpload={handleUpload} />
      </div>

      <div className="admin-card">
        <h2>Галерея</h2>
        <p className="gallery-hint">
          Перетаскивайте фото для изменения порядка. Первое фото будет главным.
          {images.length > 0 && ' Нажмите на ✂️ чтобы обрезать фото.'}
        </p>
        <ImageGallery 
          images={images} 
          onDelete={handleDelete}
          onSort={handleSort}
          onEdit={handleEdit}
        />
      </div>

      {/* Модалка обрезки */}
      {editingImage && (
        <ImageCropper
          imageUrl={editingImage.url}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}