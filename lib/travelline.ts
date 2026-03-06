import { db } from './db';

type TravellineTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type TravellineBookingSummary = {
  number: string;
  modifiedDateTime: string;
};

type TravellineBookingsResponse = {
  continueToken?: string;
  hasMoreData: boolean;
  bookingSummaries: TravellineBookingSummary[];
};

type TravellineBookingDetails = {
  booking: {
    number: string;
    status: 'Confirmed' | 'Cancelled' | 'Unconfirmed';
    roomStays: Array<{
      roomType: {
        id: string;
      };
      arrivalDateTime: string;
      departureDateTime: string;
      adults: number;
      children?: number;
    }>;
    customer?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

class TravellineService {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;
  private propertyId: string;

  constructor() {
    this.clientId = process.env.TRAVELLINE_CLIENT_ID || '';
    this.clientSecret = process.env.TRAVELLINE_CLIENT_SECRET || '';
    this.propertyId = process.env.TRAVELLINE_PROPERTY_ID || '';
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch('https://partner.tlintegration.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    const data = await response.json() as TravellineTokenResponse;
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.token;
  }

  async getRoomTypes() {
    const token = await this.getToken();
    const response = await fetch(
      `https://partner.tlintegration.com/content/v1/properties/${this.propertyId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      console.error(`Failed to fetch property data: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.roomTypes || [];
  }

  async syncBookings() {
    console.log('🔄 Starting Travelline sync...');
    
    const token = await this.getToken();
    let continueToken: string | undefined;
    let hasMore = true;
    let syncedCount = 0;
    let page = 0;

    while (hasMore && page < 10) {
      page++;
      const url = new URL(`https://partner.tlintegration.com/reservation/v1/properties/${this.propertyId}/bookings`);
      
      if (continueToken) {
        url.searchParams.set('continueToken', continueToken);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error(`Travelline API error: ${response.status}`);
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const wait = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          console.log(`Rate limited, waiting ${wait}ms...`);
          await new Promise(resolve => setTimeout(resolve, wait));
          continue;
        }
        break;
      }

      const data = await response.json() as TravellineBookingsResponse;
      
      for (const summary of data.bookingSummaries) {
        try {
          await this.processBooking(summary.number);
          syncedCount++;
        } catch (error) {
          console.error(`Error processing booking ${summary.number}:`, error);
        }
      }

      continueToken = data.continueToken;
      hasMore = data.hasMoreData;
    }

    // Записываем время синхронизации
    db.prepare(`
      INSERT INTO sync_log (source, last_sync, status, message)
      VALUES (?, ?, ?, ?)
    `).run('travelline', new Date().toISOString(), 'success', `Synced ${syncedCount} bookings`);

    console.log(`✅ Travelline sync completed: ${syncedCount} bookings`);
    return syncedCount;
  }

  private async processBooking(bookingNumber: string) {
    const token = await this.getToken();
    
    const response = await fetch(
      `https://partner.tlintegration.com/reservation/v1/properties/${this.propertyId}/bookings/${bookingNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) return;

    const data = await response.json() as TravellineBookingDetails;
    const booking = data.booking;

    if (booking.status !== 'Confirmed') return;

    for (const roomStay of booking.roomStays) {
      // Пока используем заглушку - потом заменим на реальный маппинг
      const apartmentId = null; // TODO: roomType.id → apartment_id

      console.log(`📅 Booking ${bookingNumber}:`, {
        roomTypeId: roomStay.roomType.id,
        checkIn: roomStay.arrivalDateTime.split('T')[0],
        checkOut: roomStay.departureDateTime.split('T')[0],
        adults: roomStay.adults,
        children: roomStay.children || 0,
      });
    }
  }
}

export const travellineService = new TravellineService();