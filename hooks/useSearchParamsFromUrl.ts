'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useSearchParamsFromUrl() {
  const searchParams = useSearchParams();
  
  return useMemo(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    
    console.log('🔍 [useSearchParamsFromUrl] All params:', Object.fromEntries(searchParams.entries()));
    console.log('🔍 [useSearchParamsFromUrl] Extracted:', { checkIn, checkOut, guests });
    
    if (checkIn && checkOut && guests) {
      const parsedGuests = parseInt(guests, 10);
      if (!isNaN(parsedGuests) && parsedGuests > 0 && parsedGuests <= 5) {
        console.log('✅ [useSearchParamsFromUrl] Valid params found!');
        return {
          checkIn,
          checkOut,
          guests: parsedGuests,
        };
      }
    }
    
    console.log('❌ [useSearchParamsFromUrl] No valid params found');
    return null;
  }, [searchParams]);
}