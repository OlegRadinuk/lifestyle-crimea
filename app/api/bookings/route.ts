import { NextResponse } from 'next/server';
import { bookingService } from '@/lib/db';
import { APARTMENTS } from '@/data/apartments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apartmentId, checkIn, checkOut, guestsCount, guestName, guestPhone, guestEmail } = body;

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

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
