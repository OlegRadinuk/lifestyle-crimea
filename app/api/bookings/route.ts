import { NextResponse } from 'next/server';
import { bookingService, logService } from '@/lib/db';
import { APARTMENTS } from '@/data/apartments';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  let apartmentId: string | undefined;
  
  try {
    const body = await request.json();
    apartmentId = body.apartmentId;
    
    const { checkIn, checkOut, guestsCount, guestName, guestPhone, guestEmail } = body;

    if (!apartmentId || !checkIn || !checkOut || !guestsCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apartment = APARTMENTS.find(a => a.id === apartmentId);
    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    if (guestsCount > apartment.maxGuests) {
      return NextResponse.json({ error: `Maximum ${apartment.maxGuests} guests allowed` }, { status: 400 });
    }

    const isAvailable = bookingService.checkAvailability(apartmentId, checkIn, checkOut);
    if (!isAvailable) {
      return NextResponse.json({ error: 'Dates are not available' }, { status: 409 });
    }

    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = apartment.priceBase * nights;

    const booking = bookingService.createBooking({
      apartmentId,
      guestName,
      guestPhone,
      guestEmail,
      checkIn,
      checkOut,
      guestsCount,
      totalPrice,
    });

    // Логируем успешное создание брони
    logService.addSyncLog({
      sourceName: 'website',
      apartmentId,
      action: 'export',
      status: 'success',
      eventsCount: 1,
      durationMs: 0,
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Логируем ошибку (apartmentId может быть undefined)
    logService.addSyncLog({
      sourceName: 'website',
      apartmentId: apartmentId, // используем переменную из внешней области
      action: 'export',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      durationMs: 0,
    });

    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}