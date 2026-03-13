'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Image {
  id: number;
  url: string;
  sort_order: number;
}

interface ImageGalleryProps {
  images: Image[];
  onDelete: (imageId: number) => void;
  onSort: (images: Image[]) => void;
}

export default function ImageGallery({ images, onDelete, onSort }: ImageGalleryProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (index: number) => {
    setDraggedOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && draggedOverItem !== null && draggedItem !== draggedOverItem) {
      const newImages = [...images];
      const [removed] = newImages.splice(draggedItem, 1);
      newImages.splice(draggedOverItem, 0, removed);
      
      // Обновляем порядок
      const updated = newImages.map((img, idx) => ({
        ...img,
        sort_order: idx + 1
      }));
      
      onSort(updated);
    }
    
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Удалить фото?')) return;
    
    try {
      const res = await fetch(`/api/admin/apartments/images/${imageId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        onDelete(imageId);
      } else {
        alert('Ошибка при удалении');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (!images.length) {
    return (
      <div className="gallery-empty">
        <i className="fas fa-images"></i>
        <p>Фотографии пока не добавлены</p>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`gallery-item ${draggedItem === index ? 'dragging' : ''} ${
            draggedOverItem === index ? 'drag-over' : ''
          }`}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => {
            e.preventDefault();
            handleDragOver(index);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="image-container">
            <Image
              src={image.url}
              alt=""
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
          <div className="image-overlay">
            <div className="drag-handle">
              <i className="fas fa-grip-vertical"></i>
            </div>
            <button
              onClick={() => handleDelete(image.id)}
              className="delete-btn"
              title="Удалить"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}