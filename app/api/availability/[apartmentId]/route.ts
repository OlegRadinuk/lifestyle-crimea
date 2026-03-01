import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingService, externalBookingService } from '@/lib/db';

// GET /api/availability/[apartmentId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ apartmentId: string }> } // 👈 apartmentId, а не id
) {
  try {
    const { apartmentId } = await params; // 👈 apartmentId
    const { searchParams } = new URL(request.url);
    
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    // Если переданы конкретные даты - проверяем доступность
    if (checkIn && checkOut) {
      const isAvailable = bookingService.checkAvailability(apartmentId, checkIn, checkOut);
      return NextResponse.json({
        apartmentId,
        checkIn,
        checkOut,
        isAvailable,
      });
    }

    // Иначе возвращаем все заблокированные даты
    const bookings = bookingService.getBookingsByApartment(apartmentId);
    const external = externalBookingService.getBlockedDates(apartmentId);

    const blockedDates = [
      ...bookings.map(b => ({
        start: b.check_in,
        end: b.check_out,
        source: 'booking',
      })),
      ...external,
    ];

    return NextResponse.json({
      apartmentId,
      blockedDates,
    });
  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}