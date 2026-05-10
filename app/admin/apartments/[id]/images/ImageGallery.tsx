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
  const touchDragIdx = useRef<number | null>(null);

  // === Desktop HTML5 drag — только на handle ===
  const handleDragStart = (index: number) => setDraggedItem(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverItem(index);
  };
  const handleDrop = (index: number) => {
    if (draggedItem !== null) performMove(draggedItem, index);
    setDraggedItem(null);
    setDraggedOverItem(null);
  };
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // === Mobile touch drag — только на handle ===
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchDragIdx.current = index;
    setDraggedItem(index);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIdx.current === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = el?.closest('[data-gallery-idx]') as HTMLElement | null;
    if (card) {
      const idx = parseInt(card.dataset.galleryIdx ?? '-1', 10);
      if (idx >= 0 && idx !== touchDragIdx.current) setDraggedOverItem(idx);
    }
  };
  const handleTouchEnd = () => {
    if (touchDragIdx.current !== null && draggedOverItem !== null) {
      performMove(touchDragIdx.current, draggedOverItem);
    }
    touchDragIdx.current = null;
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // === Кнопки ← → ===
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

  // === Удаление ===
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
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12 }}>
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p style={{ margin: 0, fontSize: 14 }}>Фотографии пока не добавлены</p>
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
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
          >
            {/* Номер */}
            <div className="image-badge">{index + 1}</div>

            {/* Drag handle — ТОЛЬКО здесь touch/drag события */}
            <div
              className="drag-handle"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              title="Перетащить"
            >
              ⠿
            </div>

            {/* Фото */}
            <div className="image-container">
              <Image src={image.url} alt="" fill sizes="160px" className="object-cover" />
            </div>

            {/* Кнопки — обычные onClick, никаких touch-конфликтов */}
            <div className="image-controls">
              <div className="move-btns">
                <button
                  type="button"
                  className="ctrl-btn"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  title="Левее"
                >‹</button>
                <button
                  type="button"
                  className="ctrl-btn"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === images.length - 1}
                  title="Правее"
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
        }

        .gallery-item {
          position: relative;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
          /* НЕТ overflow:hidden — не режем кнопки */
        }

        .gallery-item.dragging { opacity: 0.4; }

        .gallery-item.drag-over {
          border-color: #139ab6;
          box-shadow: 0 0 0 3px rgba(19, 154, 182, 0.25);
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

        .drag-handle {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 2;
          background: rgba(0,0,0,0.4);
          color: #fff;
          font-size: 14px;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          touch-action: none;
          user-select: none;
        }

        .drag-handle:active { cursor: grabbing; }

        .image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
          border-radius: 8px 8px 0 0;
        }

        .image-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px;
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 8px 8px;
          gap: 4px;
        }

        .move-btns, .action-btns {
          display: flex;
          gap: 3px;
        }

        .ctrl-btn {
          min-width: 34px;
          min-height: 34px;
          border: 1px solid #d0d9e2;
          border-radius: 6px;
          background: white;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        .ctrl-btn:disabled { opacity: 0.3; cursor: default; }
        .ctrl-btn:not(:disabled):active { background: #e2e8f0; }

        .ctrl-btn.del {
          color: #dc2626;
          border-color: #fca5a5;
          background: #fff5f5;
          font-size: 14px;
          font-weight: 700;
        }

        .ctrl-btn.del:active { background: #fee2e2; }

        .ctrl-btn.edit { color: #0891b2; border-color: #bae6fd; }
        .ctrl-btn.edit:active { background: #e0f2fe; }

        @media (max-width: 480px) {
          .image-gallery {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 10px;
          }
          .ctrl-btn {
            min-width: 38px;
            min-height: 38px;
          }
        }
      `}</style>
    </div>
  );
}
