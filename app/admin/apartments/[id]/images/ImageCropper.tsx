'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageRef.current) {
      const updateSize = () => {
        setImageSize({
          width: imageRef.current!.naturalWidth,
          height: imageRef.current!.naturalHeight
        });
      };
      
      if (imageRef.current.complete) {
        updateSize();
      } else {
        imageRef.current.onload = updateSize;
      }
    }
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent, type: string, handle?: string) => {
    e.preventDefault();
    if (type === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
    } else if (type === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle || null);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const maxX = rect.width - crop.width;
    const maxY = rect.height - crop.height;

    if (isDragging) {
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setCrop(prev => ({ ...prev, x: newX, y: newY }));
    }
    
    if (isResizing) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setCrop(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = prev.x;
        let newY = prev.y;
        
        if (resizeHandle?.includes('right')) {
          newWidth = Math.min(rect.width - prev.x, Math.max(50, prev.width + dx));
        }
        if (resizeHandle?.includes('bottom')) {
          newHeight = Math.min(rect.height - prev.y, Math.max(50, prev.height + dy));
        }
        if (resizeHandle?.includes('left')) {
          const change = Math.min(prev.x + prev.width - 50, Math.max(-prev.x, dx));
          newWidth = prev.width - change;
          newX = prev.x + change;
        }
        if (resizeHandle?.includes('top')) {
          const change = Math.min(prev.y + prev.height - 50, Math.max(-prev.y, dy));
          newHeight = prev.height - change;
          newY = prev.y + change;
        }
        
        return { x: newX, y: newY, width: newWidth, height: newHeight };
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleCrop = async () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/webp',
      0.92
    );
  };

  return (
    <div className="cropper-modal" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="cropper-overlay" onClick={onCancel} />
      
      <div className="cropper-container" ref={containerRef}>
        <h3>Обрезка изображения</h3>
        
        <div className="cropper-content">
          <div className="image-container">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
              draggable={false}
            />
            
            <div
              className="crop-box"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height
              }}
            >
              <div
                className="crop-drag-handle"
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
              />
              
              <div className="crop-resize-handle top-left" onMouseDown={(e) => handleMouseDown(e, 'resize', 'top-left')} />
              <div className="crop-resize-handle top-right" onMouseDown={(e) => handleMouseDown(e, 'resize', 'top-right')} />
              <div className="crop-resize-handle bottom-left" onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom-left')} />
              <div className="crop-resize-handle bottom-right" onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom-right')} />
              <div className="crop-resize-handle top" onMouseDown={(e) => handleMouseDown(e, 'resize', 'top')} />
              <div className="crop-resize-handle right" onMouseDown={(e) => handleMouseDown(e, 'resize', 'right')} />
              <div className="crop-resize-handle bottom" onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom')} />
              <div className="crop-resize-handle left" onMouseDown={(e) => handleMouseDown(e, 'resize', 'left')} />
            </div>
          </div>
        </div>

        <div className="cropper-actions">
          <button className="cropper-button cancel" onClick={onCancel}>
            Отмена
          </button>
          <button className="cropper-button apply" onClick={handleCrop}>
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
        
        .image-container {
          position: relative;
          display: inline-block;
          user-select: none;
        }
        
        .crop-box {
          position: absolute;
          border: 2px solid #139ab6;
          background: rgba(19, 154, 182, 0.1);
          cursor: move;
        }
        
        .crop-drag-handle {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          cursor: move;
        }
        
        .crop-resize-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border: 2px solid #139ab6;
          border-radius: 6px;
        }
        
        .crop-resize-handle.top-left {
          top: -6px;
          left: -6px;
          cursor: nwse-resize;
        }
        
        .crop-resize-handle.top-right {
          top: -6px;
          right: -6px;
          cursor: nesw-resize;
        }
        
        .crop-resize-handle.bottom-left {
          bottom: -6px;
          left: -6px;
          cursor: nesw-resize;
        }
        
        .crop-resize-handle.bottom-right {
          bottom: -6px;
          right: -6px;
          cursor: nwse-resize;
        }
        
        .crop-resize-handle.top {
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }
        
        .crop-resize-handle.right {
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
        }
        
        .crop-resize-handle.bottom {
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }
        
        .crop-resize-handle.left {
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
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
        
        .cropper-button.apply:hover {
          background: #0f7a91;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
        }
      `}</style>
    </div>
  );
}