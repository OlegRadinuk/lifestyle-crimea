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
  onEdit?: (image: Image) => void; // Добавляем проп для редактирования
}

export default function ImageGallery({ images, onDelete, onSort, onEdit }: ImageGalleryProps) {
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
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <circle cx="9" cy="18" r="1.5" fill="currentColor" />
                <circle cx="15" cy="18" r="1.5" fill="currentColor" />
                <circle cx="9" cy="6" r="1.5" fill="currentColor" />
                <circle cx="15" cy="6" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div className="image-actions">
              {onEdit && (
                <button
                  onClick={() => onEdit(image)}
                  className="edit-btn"
                  title="Обрезать"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 20h12M6 4h12M4 6v12M20 6v12M8 8l8 8M16 8l-8 8" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => handleDelete(image.id)}
                className="delete-btn"
                title="Удалить"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0h10"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}