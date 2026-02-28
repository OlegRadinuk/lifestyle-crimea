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

    if (checkIn && checkOut) {
      const isAvailable = bookingService.checkAvailability(apartmentId, checkIn, checkOut);
      
      console.log(`📅 API Проверка: ${apartmentId} ${checkIn}–${checkOut} = ${isAvailable ? '✅ свободно' : '❌ занято'}`);
      
      return NextResponse.json({ 
        apartmentId, 
        checkIn, 
        checkOut, 
        isAvailable 
      });
    }

    // Получаем заблокированные даты
    const externalBlocked = externalBookingService.getBlockedDates(apartmentId);
    const dbBookings = bookingService.getBookingsByApartment(apartmentId);
    
    const bookingBlocked: BlockedDate[] = dbBookings.map(booking => ({
      start: booking.check_in,
      end: booking.check_out,
      source: 'booking'
    }));

    const allBlockedDates = [...externalBlocked, ...bookingBlocked];
    
    console.log(`📅 API Календарь: ${apartmentId} — ${allBlockedDates.length} заблокированных диапазонов`);
    allBlockedDates.forEach(b => {
      console.log(`   📅 ${b.start} – ${b.end} (${b.source})`);
    });

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