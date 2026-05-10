'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: number;
  url: string;
  sort_order: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onDelete: (imageId: number) => void;
  onSort: (images: GalleryImage[]) => void;
  onEdit?: (image: GalleryImage) => void;
}

export default function ImageGallery({ images, onDelete, onSort, onEdit }: ImageGalleryProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<number | null>(null);
  const touchDragIndex = useRef<number | null>(null);

  // === Desktop drag (HTML5) ===
  const handleDragStart = (index: number) => setDraggedItem(index);
  const handleDragOver = (index: number) => setDraggedOverItem(index);
  const handleDragEnd = () => {
    if (draggedItem !== null && draggedOverItem !== null && draggedItem !== draggedOverItem) {
      performMove(draggedItem, draggedOverItem);
    }
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // === Mobile touch drag ===
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchDragIndex.current = index;
    setDraggedItem(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex.current === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const item = el?.closest('[data-gallery-idx]') as HTMLElement | null;
    if (item) {
      const idx = parseInt(item.dataset.galleryIdx ?? '-1', 10);
      if (idx >= 0 && idx !== touchDragIndex.current) setDraggedOverItem(idx);
    }
  };

  const handleTouchEnd = () => {
    if (
      touchDragIndex.current !== null &&
      draggedOverItem !== null &&
      touchDragIndex.current !== draggedOverItem
    ) {
      performMove(touchDragIndex.current, draggedOverItem);
    }
    touchDragIndex.current = null;
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // === Arrow-button reorder (always reliable) ===
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    performMove(fromIndex, toIndex);
  };

  const performMove = (from: number, to: number) => {
    const updated = [...images];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onSort(updated.map((img, idx) => ({ ...img, sort_order: idx + 1 })));
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Удалить фото?')) return;
    try {
      const res = await fetch(`/api/admin/apartments/images/${imageId}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(imageId);
      } else {
        alert('Ошибка при удалении');
      }
    } catch {
      alert('Ошибка при удалении');
    }
  };

  if (!images.length) {
    return (
      <div className="gallery-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>Фотографии пока не добавлены</p>

        <style jsx>{`
          .gallery-empty {
            text-align: center;
            padding: 40px 20px;
            color: #94a3b8;
          }
          .gallery-empty svg { margin-bottom: 12px; }
          .gallery-empty p { margin: 0; font-size: 14px; }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="image-gallery">
        {images.map((image, index) => (
          <div
            key={image.id}
            data-gallery-idx={index}
            className={`gallery-item ${draggedItem === index ? 'dragging' : ''} ${draggedOverItem === index ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => { e.preventDefault(); handleDragOver(index); }}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Номер позиции */}
            <div className="image-badge">{index + 1}</div>

            <div className="image-container">
              <Image src={image.url} alt="" fill sizes="160px" className="object-cover" />
            </div>

            {/* Кнопки управления */}
            <div className="image-controls">
              <div className="move-btns">
                <button
                  type="button"
                  className="ctrl-btn"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  title="Переместить влево"
                >‹</button>
                <button
                  type="button"
                  className="ctrl-btn"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === images.length - 1}
                  title="Переместить вправо"
                >›</button>
              </div>
              <div className="action-btns">
                {onEdit && (
                  <button
                    type="button"
                    className="ctrl-btn edit"
                    onClick={() => onEdit(image)}
                    title="Обрезать"
                  >✂</button>
                )}
                <button
                  type="button"
                  className="ctrl-btn del"
                  onClick={() => handleDelete(image.id)}
                  title="Удалить"
                >✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .image-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          padding-bottom: 8px;
        }

        .gallery-item {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          cursor: grab;
          user-select: none;
          touch-action: none;
          transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }

        .gallery-item:active { cursor: grabbing; }

        .gallery-item.dragging {
          opacity: 0.4;
          transform: scale(0.96);
        }

        .gallery-item.drag-over {
          border-color: #139ab6;
          box-shadow: 0 0 0 3px rgba(19, 154, 182, 0.25);
          transform: scale(1.02);
        }

        .image-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          z-index: 2;
          background: rgba(0,0,0,0.55);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
        }

        .image-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 6px 6px 6px;
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          gap: 4px;
        }

        .move-btns, .action-btns {
          display: flex;
          gap: 3px;
        }

        .ctrl-btn {
          min-width: 32px;
          min-height: 32px;
          border: 1px solid #d0d9e2;
          border-radius: 6px;
          background: white;
          font-size: 15px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: background 0.15s, color 0.15s;
          padding: 0;
        }

        .ctrl-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .ctrl-btn:not(:disabled):hover {
          background: #e2e8f0;
        }

        .ctrl-btn.del {
          color: #dc2626;
          border-color: #fecaca;
        }

        .ctrl-btn.del:hover {
          background: #fee2e2;
        }

        .ctrl-btn.edit {
          color: #0891b2;
          border-color: #bae6fd;
        }

        .ctrl-btn.edit:hover {
          background: #e0f2fe;
        }

        @media (max-width: 480px) {
          .image-gallery {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 10px;
          }

          .ctrl-btn {
            min-width: 36px;
            min-height: 36px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
