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
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert(`Файл ${file.name} не является изображением`);
        continue;
      }
      
      // Проверяем размер (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс 5MB)`);
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
          <i className="fas fa-cloud-upload-alt"></i>
          <h3>Перетащите фото сюда или кликните для выбора</h3>
          <p>Поддерживаются JPG, PNG, WEBP (до 5MB)</p>
          <p className="small">Можно выбрать несколько файлов сразу</p>
        </label>
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <div className="spinner"></div>
          <span>Загрузка...</span>
        </div>
      )}
    </div>
  );
}