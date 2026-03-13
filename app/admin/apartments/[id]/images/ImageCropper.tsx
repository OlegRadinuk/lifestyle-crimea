'use client';

import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Устанавливаем размер canvas равным размеру обрезки
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Рисуем обрезанное изображение
    ctx.drawImage(
      image,
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Конвертируем в blob
    return new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
        },
        'image/webp',
        0.9 // качество 90%
      );
    });
  };

  const handleCropComplete = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      onCrop(croppedBlob);
    }
  };

  return (
    <div className="cropper-modal">
      <div className="cropper-overlay" onClick={onCancel} />
      
      <div className="cropper-container">
        <h3>Обрезка изображения</h3>
        
        <div className="cropper-content">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={16 / 9} // Соотношение сторон 16:9 (можно изменить)
          >
            <img
              src={imageUrl}
              onLoad={onImageLoad}
              alt="Crop preview"
              style={{ maxHeight: '60vh', maxWidth: '100%' }}
            />
          </ReactCrop>

          {/* Превысо обрезанного изображения */}
          {completedCrop && (
            <div className="cropper-preview">
              <h4>Предпросмотр:</h4>
              <canvas
                ref={previewCanvasRef}
                width={completedCrop.width}
                height={completedCrop.height}
                style={{
                  width: Math.round(completedCrop.width / 4),
                  height: Math.round(completedCrop.height / 4),
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
          )}
        </div>

        <div className="cropper-actions">
          <button className="cropper-button cancel" onClick={onCancel}>
            Отмена
          </button>
          <button 
            className="cropper-button apply" 
            onClick={handleCropComplete}
            disabled={!completedCrop}
          >
            Применить обрезку
          </button>
        </div>
      </div>

      <style jsx>{`
        .cropper-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .cropper-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
        }
        
        .cropper-container {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          z-index: 1001;
        }
        
        .cropper-container h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #1a2634;
        }
        
        .cropper-content {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        
        .cropper-preview {
          flex-shrink: 0;
          width: 200px;
        }
        
        .cropper-preview h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #64748b;
        }
        
        .cropper-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        .cropper-button {
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .cropper-button.cancel {
          background: #f1f5f9;
          color: #475569;
        }
        
        .cropper-button.cancel:hover {
          background: #e2e8f0;
        }
        
        .cropper-button.apply {
          background: #139ab6;
          color: white;
        }
        
        .cropper-button.apply:hover:not(:disabled) {
          background: #0f7a91;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
        }
        
        .cropper-button.apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .cropper-content {
            flex-direction: column;
          }
          
          .cropper-preview {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
