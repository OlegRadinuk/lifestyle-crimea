// app/api/availability/[id]/route.ts
import { NextResponse } from 'next/server';
import { bookingService, externalBookingService } from '@/lib/db';
import type { BlockedDate } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const { apartmentId } = await params;
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    // Если переданы даты — проверяем доступность
    if (checkIn && checkOut) {
      // Используем исправленный метод с правильной логикой
      const isAvailable = bookingService.checkAvailability(apartmentId, checkIn, checkOut);
      
      console.log(`📅 API: Проверка доступности ${apartmentId} с ${checkIn} по ${checkOut}: ${isAvailable ? '✅ свободно' : '❌ занято'}`);
      
      return NextResponse.json({ 
        apartmentId, 
        checkIn, 
        checkOut, 
        isAvailable 
      });
    }

    // Получаем заблокированные даты из ОБОИХ источников
    const externalBlocked = externalBookingService.getBlockedDates(apartmentId);
    
    // Получаем бронирования из нашей БД
    const dbBookings = bookingService.getBookingsByApartment(apartmentId);
    const bookingBlocked: BlockedDate[] = dbBookings.map(booking => ({
      start: booking.check_in,
      end: booking.check_out,
      source: 'booking'
    }));

    // Объединяем
    const allBlockedDates = [...externalBlocked, ...bookingBlocked];
    
    console.log(`📅 API: Возвращаем ${allBlockedDates.length} заблокированных дат для ${apartmentId}`);

    return NextResponse.json({ 
      apartmentId, 
      blockedDates: allBlockedDates 
    });
    
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' }, 
      { status: 500 }
    );
  }
}