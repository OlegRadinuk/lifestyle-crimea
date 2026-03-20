'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useSearchParamsFromUrl() {
  const searchParams = useSearchParams();
  
  return useMemo(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    
    if (checkIn && checkOut && guests) {
      const parsedGuests = parseInt(guests, 10);
      if (!isNaN(parsedGuests) && parsedGuests > 0 && parsedGuests <= 5) {
        return {
          checkIn,
          checkOut,
          guests: parsedGuests,
        };
      }
    }
    
    return null;
  }, [searchParams]);
}