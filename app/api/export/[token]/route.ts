import { NextResponse } from 'next/server';
import { getApartmentByToken, bookingService } from '@/lib/db';
import { generateIcs } from '@/lib/ics/parser';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const apartmentId = getApartmentByToken(token);

    if (!apartmentId) {
      return new NextResponse('Invalid token', { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const bookings = bookingService.getBookingsForExport(apartmentId, today);
    const icsContent = generateIcs(bookings);

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="apartment-${apartmentId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating ICS:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
