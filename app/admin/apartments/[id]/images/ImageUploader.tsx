'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  apartmentId: string;
  onUpload: (image: { id: number; url: string }) => void;
}

// Функция для сжатия изображения
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        // Создаем canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Если изображение слишком большое, уменьшаем
        const MAX_SIZE = 1920; // Максимальный размер по большей стороне
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Рисуем изображение
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в WebP с качеством 85%
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }
            
            // Создаем новый файл
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
            });
            
            console.log(`📊 Сжатие: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            
            resolve(compressedFile);
          },
          'image/webp',
          0.85 // Качество 85% (отличный баланс)
        );
      };
      
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };
  });
}

export default function ImageUploader({ apartmentId, onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        alert(`Файл ${file.name} не является изображением`);
        continue;
      }
      
      // Проверяем размер (макс 20MB для исходника)
      if (file.size > 20 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс 20MB)`);
        continue;
      }
      
      try {
        // Сжимаем изображение
        console.log(`🖼️ Обработка: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        const compressedFile = await compressImage(file);
        
        // Проверяем размер после сжатия
        if (compressedFile.size > 3 * 1024 * 1024) {
          console.warn(`⚠️ Файл всё ещё больше 3MB: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          // Можно предупредить пользователя, но не блокируем
        }
        
        const formData = new FormData();
        formData.append('file', compressedFile);
        
        const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          onUpload(data);
          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          ref={fileInputRef}
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
          <p className="small">
            🔥 Автоматическое сжатие в WebP (макс 3MB)
            <br />
            <span style={{ fontSize: '11px', opacity: 0.7 }}>
              Качество 85% · Уменьшение до 1920px
            </span>
          </p>
        </label>
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <div className="spinner"></div>
          <span>
            Обработка и загрузка... {uploadProgress.current} из {uploadProgress.total}
          </span>
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
          color: #139ab6;
          font-weight: 500;
          margin-top: 12px;
          line-height: 1.5;
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