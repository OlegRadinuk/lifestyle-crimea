'use client';

import { useEffect, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { checkIn: string; checkOut: string; guests: number }) => void;
  initialGuests: number;
  today: string;
};

export default function MobileBookingSheet({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialGuests,
  today 
}: Props) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(initialGuests);
  const [error, setError] = useState('');

  // Закрытие по свайпу вниз
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (!checkIn || !checkOut) {
      setError('Выберите даты заезда и выезда');
      return;
    }
    
    onConfirm({ checkIn, checkOut, guests });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="mobile-sheet-overlay"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className="mobile-sheet"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientY)}
        onTouchMove={(e) => setTouchEnd(e.touches[0].clientY)}
        onTouchEnd={() => {
          if (touchStart && touchEnd && touchStart - touchEnd > 100) {
            // свайп вниз
            onClose();
          }
          setTouchStart(null);
          setTouchEnd(null);
        }}
      >
        {/* Handle */}
        <div className="mobile-sheet__handle" />
        
        <h3 className="mobile-sheet__title">Забронировать</h3>
        
        <div className="mobile-sheet__content">
          <div className="mobile-sheet__field">
            <label>Заезд</label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className="mobile-sheet__field">
            <label>Выезд</label>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className="mobile-sheet__field">
            <label>Гости</label>
            <div className="mobile-sheet__guests">
              <button 
                onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                className="guest-btn"
              >−</button>
              <span>{guests}</span>
              <button 
                onClick={() => setGuests(prev => Math.min(6, prev + 1))}
                className="guest-btn"
              >+</button>
            </div>
          </div>

          {error && (
            <div className="mobile-sheet__error">{error}</div>
          )}

          <button 
            className="mobile-sheet__confirm"
            onClick={handleConfirm}
          >
            Выбрать апартаменты
          </button>
        </div>
      </div>
    </>
  );
}