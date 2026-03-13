'use client';

import { useState } from 'react';

interface ImageUploaderProps {
  apartmentId: string;
  onUpload: (image: { id: number; url: string }) => void;
}

export default function ImageUploader({ apartmentId, onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        alert(`Файл ${file.name} не является изображением`);
        continue;
      }
      
      if (file.size > 20 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс 20MB)`);
        continue;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          onUpload(data);
        } else {
          const error = await res.json();
          alert(`Ошибка загрузки ${file.name}: ${error.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Ошибка при загрузке ${file.name}`);
      }
    }
    
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="image-uploader">
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files)}
          style={{ display: 'none' }}
        />
        
        <label htmlFor="file-upload" className="upload-label">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h3>Перетащите фото сюда или кликните для выбора</h3>
          <p>Поддерживаются JPG, PNG, WEBP (до 20MB)</p>
          <p className="small">Можно выбрать несколько файлов сразу</p>
        </label>
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <div className="spinner"></div>
          <span>Загрузка...</span>
        </div>
      )}

      <style jsx>{`
        .image-uploader {
          margin: 20px 0;
        }
        
        .upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          background: #f8fafc;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .upload-area:hover {
          border-color: #139ab6;
          background: #f0f9ff;
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
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #1e293b;
        }
        
        .upload-label p {
          margin: 4px 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .upload-label p.small {
          font-size: 13px;
          color: #64748b;
          margin-top: 12px;
        }
        
        .upload-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 20px;
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
      `}</style>
    </div>
  );
}
