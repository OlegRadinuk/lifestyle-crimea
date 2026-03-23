'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type HeroSlide = {
  id: number;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_active: number;
};

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    const res = await fetch('/api/admin/hero-slides');
    const data = await res.json();
    setSlides(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchSlides();
      } else {
        const error = await res.json();
        alert(error.error || 'Ошибка загрузки');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    const res = await fetch(`/api/admin/hero-slides/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    
    if (res.ok) {
      fetchSlides();
    }
  };

  const deleteSlide = async (id: number, imageUrl: string) => {
    if (!confirm('Удалить этот слайд?')) return;
    
    const res = await fetch(`/api/admin/hero-slides/${id}`, {
      method: 'DELETE',
    });
    
    if (res.ok) {
      fetchSlides();
    } else {
      alert('Ошибка при удалении');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedItem === null) return;
    
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedItem, 1);
    newSlides.splice(index, 0, removed);
    
    setSlides(newSlides);
    setDraggedItem(index);
  };

  const handleDragEnd = async () => {
    if (draggedItem === null) return;
    
    const ids = slides.map(slide => slide.id);
    await fetch('/api/admin/hero-slides/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    
    setDraggedItem(null);
    fetchSlides();
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Слайды главной страницы</h1>
        <Link href="/admin" className="admin-button">← Назад</Link>
      </div>

      <div className="admin-card">
        <h2>Добавить новый слайд</h2>
        <div className="upload-area">
          <input
            type="file"
            id="hero-upload"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="hero-upload" className="upload-label">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3>{uploading ? 'Загрузка...' : 'Нажмите или перетащите изображение'}</h3>
            <p>Рекомендуемый размер: 1920x1080px (формат JPG, PNG, WEBP)</p>
          </label>
        </div>
      </div>

      <div className="admin-card">
        <h2>Слайды ({slides.length})</h2>
        <p className="gallery-hint">Перетаскивайте слайды для изменения порядка</p>
        
        <div className="slides-list">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide-item ${draggedItem === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => {
                e.preventDefault();
                handleDragOver(index);
              }}
              onDragEnd={handleDragEnd}
            >
              <div className="slide-image">
                <img src={slide.image_url} alt="" />
              </div>
              <div className="slide-info">
                <input
                  type="text"
                  value={slide.title || ''}
                  onChange={async (e) => {
                    await fetch(`/api/admin/hero-slides/${slide.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: e.target.value }),
                    });
                    fetchSlides();
                  }}
                  placeholder="Заголовок (опционально)"
                  className="slide-title-input"
                />
                <input
                  type="text"
                  value={slide.subtitle || ''}
                  onChange={async (e) => {
                    await fetch(`/api/admin/hero-slides/${slide.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subtitle: e.target.value }),
                    });
                    fetchSlides();
                  }}
                  placeholder="Подзаголовок (опционально)"
                  className="slide-subtitle-input"
                />
              </div>
              <div className="slide-actions">
                <button
                  onClick={() => toggleActive(slide.id, !!slide.is_active)}
                  className={`status-btn ${slide.is_active ? 'active' : 'inactive'}`}
                >
                  {slide.is_active ? '🟢 Активен' : '⚪ Неактивен'}
                </button>
                <button
                  onClick={() => deleteSlide(slide.id, slide.image_url)}
                  className="delete-btn"
                >
                  🗑️ Удалить
                </button>
              </div>
              <div className="drag-handle">⋮⋮</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .upload-area:hover {
          border-color: #139ab6;
          background: #f0f9ff;
        }
        
        .upload-label {
          display: block;
          cursor: pointer;
        }
        
        .upload-label svg {
          margin-bottom: 16px;
          color: #64748b;
        }
        
        .upload-label h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #1e293b;
        }
        
        .upload-label p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .slides-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .slide-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          cursor: grab;
        }
        
        .slide-item.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }
        
        .slide-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .slide-image {
          width: 120px;
          height: 68px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
        }
        
        .slide-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .slide-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .slide-title-input,
        .slide-subtitle-input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .slide-actions {
          display: flex;
          gap: 8px;
        }
        
        .status-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          border: none;
        }
        
        .status-btn.active {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .status-btn.inactive {
          background: #f5f5f5;
          color: #757575;
        }
        
        .delete-btn {
          padding: 8px 16px;
          background: #fee2e2;
          color: #c62828;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .drag-handle {
          font-size: 24px;
          color: #94a3b8;
          cursor: grab;
          user-select: none;
          width: 32px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}