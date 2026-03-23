'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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
  const [dragActive, setDragActive] = useState(false);
  const [editedSlides, setEditedSlides] = useState<Record<number, { title: string; subtitle: string }>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    const res = await fetch('/api/admin/hero-slides');
    const data = await res.json();
    setSlides(data);
    // Инициализируем editedSlides
    const edits: Record<number, { title: string; subtitle: string }> = {};
    data.forEach((slide: HeroSlide) => {
      edits[slide.id] = {
        title: slide.title || '',
        subtitle: slide.subtitle || '',
      };
    });
    setEditedSlides(edits);
    setLoading(false);
  };

  const handleTitleChange = (id: number, title: string) => {
    setEditedSlides(prev => ({
      ...prev,
      [id]: { ...prev[id], title }
    }));
  };

  const handleSubtitleChange = (id: number, subtitle: string) => {
    setEditedSlides(prev => ({
      ...prev,
      [id]: { ...prev[id], subtitle }
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const promises = Object.entries(editedSlides).map(async ([idStr, data]) => {
      const id = parseInt(idStr);
      const originalSlide = slides.find(s => s.id === id);
      
      if (originalSlide?.title !== data.title || originalSlide?.subtitle !== data.subtitle) {
        await fetch(`/api/admin/hero-slides/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title || null,
            subtitle: data.subtitle || null,
          }),
        });
      }
    });
    
    await Promise.all(promises);
    await fetchSlides();
    setSaving(false);
    alert('Все изменения сохранены');
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Файл слишком большой (макс 20MB)');
      return false;
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
        await fetchSlides();
        return true;
      } else {
        const error = await res.json();
        alert(error.error || 'Ошибка загрузки');
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag-n-drop для загрузки
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await handleFileUpload(file);
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

  const deleteSlide = async (id: number) => {
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

  // Drag-n-drop для сортировки
  const handleSortDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleSortDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedItem, 1);
    newSlides.splice(index, 0, removed);
    
    setSlides(newSlides);
    setDraggedItem(index);
  };

  const handleSortDragEnd = async () => {
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
        <div className="card-header">
          <h2>Добавить новый слайд</h2>
        </div>
        
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="hero-upload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="hero-upload" className="upload-label">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3>
              {uploading 
                ? 'Обработка и загрузка...' 
                : dragActive 
                  ? 'Отпустите файл для загрузки' 
                  : 'Нажмите или перетащите изображение'
              }
            </h3>
            <p>Поддерживаются JPG, PNG, WEBP (до 12MB)</p>
            <p className="upload-hint">
              Автоматическое сжатие в WebP
            </p>
          </label>
        </div>
        
        {uploading && (
          <div className="upload-progress">
            <div className="spinner"></div>
            <span>Загрузка и оптимизация...</span>
          </div>
        )}
      </div>

      <div className="admin-card">
        <div className="card-header">
          <h2>Слайды ({slides.length})</h2>
          <button 
            onClick={handleSaveAll} 
            className="save-all-btn"
            disabled={saving}
          >
            {saving ? 'Сохранение...' : '💾 Сохранить все изменения'}
          </button>
        </div>
        <p className="gallery-hint">💡 Перетаскивайте слайды для изменения порядка</p>
        
        <div className="slides-list">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide-item ${draggedItem === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleSortDragStart(index)}
              onDragOver={(e) => handleSortDragOver(e, index)}
              onDragEnd={handleSortDragEnd}
            >
              <div className="drag-handle">⋮⋮</div>
              <div className="slide-image">
                <img src={slide.image_url} alt="" />
              </div>
              <div className="slide-info">
                <input
                  type="text"
                  value={editedSlides[slide.id]?.title || ''}
                  onChange={(e) => handleTitleChange(slide.id, e.target.value)}
                  placeholder="Заголовок (оставьте пустым для стандартного 'Стиль Жизни')"
                  className="slide-title-input"
                />
                <input
                  type="text"
                  value={editedSlides[slide.id]?.subtitle || ''}
                  onChange={(e) => handleSubtitleChange(slide.id, e.target.value)}
                  placeholder="Подзаголовок"
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
                  onClick={() => deleteSlide(slide.id)}
                  className="delete-btn"
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {slides.length === 0 && (
          <div className="empty-state">
            <p>Нет слайдов. Загрузите первый слайд выше!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .card-header h2 {
          margin: 0;
          font-size: 18px;
          color: #1a2634;
        }
        
        .save-all-btn {
          padding: 8px 20px;
          background: linear-gradient(135deg, #139ab6, #1fb3cf);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .save-all-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
        }
        
        .save-all-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          transition: all 0.3s;
          background: #fafbfc;
        }
        
        .upload-area.drag-active {
          border-color: #139ab6;
          background: #e6f7ff;
          transform: scale(1.02);
        }
        
        .upload-area.uploading {
          opacity: 0.6;
          pointer-events: none;
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
          margin: 4px 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .upload-hint {
          font-size: 12px !important;
          color: #139ab6 !important;
          margin-top: 8px !important;
        }
        
        .upload-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
          padding: 12px;
          background: #f0f9ff;
          border-radius: 8px;
          color: #0369a1;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-top-color: #139ab6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .gallery-hint {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 20px;
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
          padding: 12px 16px;
          background: #f8fafc;
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
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .drag-handle {
          font-size: 24px;
          color: #94a3b8;
          cursor: grab;
          user-select: none;
          width: 32px;
          text-align: center;
        }
        
        .slide-image {
          width: 120px;
          height: 68px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
          flex-shrink: 0;
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
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        
        .slide-title-input:focus,
        .slide-subtitle-input:focus {
          outline: none;
          border-color: #139ab6;
        }
        
        .slide-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .status-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
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
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .delete-btn:hover {
          background: #ffcdd2;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}