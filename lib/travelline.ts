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
    createdDateTime: string;
    modifiedDateTime: string;
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
      email?: string;
      phone?: string;
    };
  };
};

// Маппинг ID комнат Travelline на ID наших апартаментов
const ROOM_TYPE_MAPPING: Record<string, string> = {
  // Дизайнерские студии
  '278023': 'ls-space',                    // LS-SPACE
  '243734': 'ls-coffee-ice-cream',          // LS-COFFEE ICE CREAM
  '263391': 'ls-summer-emotions',           // LS-SUMMER EMOTIONS
  '330325': 'ls-black-strong',              // LS-BLACK STRONG
  '274922': 'ls-deep-music',                // LS-DEEP MUSIC
  '348222': 'ls-dream-vacation',            // LS-DREAM VACATION
  '279273': 'ls-econom-studio',             // LS-ECONOM STUDIO
  '277347': 'ls-family-comfort',            // LS-FAMILY COMFORT
  '272228': 'ls-in-the-moment',             // LS-IN THE MOMENT
  '345796': 'ls-lux-flower-kiss',           // LS-LUX-FLOWER KISS
  '289889': 'ls-relax-time',                // LS-RELAX TIME
  '269778': 'ls-sweet-summer',              // LS-SWEET SUMMER
  '243739': 'ls-lux-sweet-caramel',         // LS-LUX-SWEET CARAMEL
  '274610': 'ls-steel-love',                // LS-STEEL LOVE
  '244430': 'ls-art-crystal-blue',          // LS-ART-CRYSTAL BLUE
  '243321': 'ls-art-olive',                 // LS-ART-OLIVE
  '265649': 'ls-blue-curacao',              // LS-BLUE CURACAO
  '244425': 'ls-blueberry',                  // LS-BLUEBERRY
  '269609': 'ls-cool-lemonade',              // LS-COOL LEMONADE
  '243319': 'ls-green',                      // LS-GREEN
  '291460': 'ls-hi-tech-emotion',            // LS-HI-TECH EMOTION
  '291417': 'ls-hi-tech-relax',              // LS-HI-TECH RELAX
  '272288': 'ls-lux-only-you',               // LS-LUX-ONLY YOU
  '373007': 'ls-lux-fly-sky',                // LS-LUX-FLY SKY
  '348227': 'ls-lux-beautiful-days',         // LS-LUX-BEAUTIFUL DAYS
  '361602': 'ls-lux-fly-mood',               // LS-LUX-FLY MOOD
  '337183': 'ls-lux-sun-rays',               // LS-LUX-SUN RAYS
  '348223': 'ls-lux-sunny-mood',             // LS-LUX-SUNNY MOOD
  '373006': 'ls-lux-fly-blue-light',         // LS-LUX-FLY BLUE LIGHT
  '337185': 'ls-lux-sunshine',               // LS-LUX-SUNSHINE

  // Апартаменты с отдельной спальней
  '278010': 'ls-diamond-green',              // LS-DIAMOND GREEN
  '348218': 'ls-mountain-retreat',           // LS-MOUNTAIN RETREAT
  '264854': 'ls-wine-and-sunset',            // LS-WINE AND SUNSET
  '264995': 'ls-lux-white-sands',            // LS-LUX-WHITE SANDS
  '244426': 'ls-lux-orange',                 // LS-LUX-ORANGE
  '243517': 'ls-lux-soft-blue',              // LS-LUX-SOFT BLUE
  '363094': 'ls-lux-fly-birds',              // LS-LUX-FLY BIRDS
  '280610': 'ls-deep-forest',                // LS-DEEP FOREST
  '281311': 'ls-flowers-tea',                // LS-FLOWERS TEA
};

class TravellineService {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;
  private propertyId: string;
  private baseUrlContent = 'https://partner.tlintegration.com/api/content';
  private baseUrlReservation = 'https://partner.tlintegration.com/api/read-reservation';

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

  // Получить все комнаты из Content API для маппинга
  async getRoomTypes(): Promise<any[]> {
    try {
      const token = await this.getToken();
      const response = await fetch(
        `${this.baseUrlContent}/v1/properties/${this.propertyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch room types: ${response.status}`);
      }

      const data = await response.json();
      return data.roomTypes || [];
    } catch (error) {
      console.error('Error fetching room types:', error);
      return [];
    }
  }

  // Получить все бронирования (с пагинацией)
  async getAllBookings(lastSyncDate?: Date): Promise<TravellineBookingDetails['booking'][]> {
    const token = await this.getToken();
    let continueToken: string | undefined;
    let hasMore = true;
    let allBookings: TravellineBookingDetails['booking'][] = [];
    let page = 0;

    while (hasMore && page < 20) { // Лимит 20 страниц для безопасности
      page++;
      const url = new URL(`${this.baseUrlReservation}/v1/properties/${this.propertyId}/bookings`);
      
      if (continueToken) {
        url.searchParams.set('continueToken', continueToken);
      } else if (lastSyncDate) {
        url.searchParams.set('lastModification', lastSyncDate.toISOString());
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const wait = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          console.log(`Rate limited, waiting ${wait}ms...`);
          await new Promise(resolve => setTimeout(resolve, wait));
          continue;
        }
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json() as TravellineBookingsResponse;
      
      // Получаем детали каждого бронирования
      for (const summary of data.bookingSummaries) {
        try {
          const booking = await this.getBookingDetails(summary.number);
          allBookings.push(booking);
        } catch (error) {
          console.error(`Error fetching booking ${summary.number}:`, error);
        }
      }

      continueToken = data.continueToken;
      hasMore = data.hasMoreData;
    }

    return allBookings;
  }

  // Получить детали конкретного бронирования
  async getBookingDetails(bookingNumber: string): Promise<TravellineBookingDetails['booking']> {
    const token = await this.getToken();
    
    const response = await fetch(
      `${this.baseUrlReservation}/v1/properties/${this.propertyId}/bookings/${bookingNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch booking ${bookingNumber}: ${response.status}`);
    }

    const data = await response.json() as TravellineBookingDetails;
    return data.booking;
  }

  // Сохранить заблокированные даты в БД
  private saveBlockedDates(apartmentId: string, booking: TravellineBookingDetails['booking']) {
    for (const roomStay of booking.roomStays) {
      const checkIn = roomStay.arrivalDateTime.split('T')[0];
      const checkOut = roomStay.departureDateTime.split('T')[0];
      
      // Проверяем, не сохраняли ли уже
      const existing = db.prepare(
        'SELECT id FROM blocked_dates WHERE booking_number = ?'
      ).get(booking.number);

      if (!existing) {
        db.prepare(`
          INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(apartmentId, checkIn, checkOut, 'travelline', booking.number);
        
        console.log(`  ✅ Saved: ${apartmentId} (${checkIn} - ${checkOut})`);
      }
    }
  }

  // Основной метод синхронизации
  async syncBookings() {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 Travelline Sync Started at', new Date().toISOString());
    console.log('='.repeat(60));

    try {
      // Получаем время последней синхронизации
      const lastSync = db.prepare(
        'SELECT last_sync FROM sync_log WHERE source = ? ORDER BY last_sync DESC LIMIT 1'
      ).get('travelline') as { last_sync: string } | undefined;

      const lastSyncDate = lastSync ? new Date(lastSync.last_sync) : undefined;
      console.log(`📅 Last sync: ${lastSyncDate?.toISOString() || 'never'}`);

      // Получаем все бронирования
      console.log('📡 Fetching bookings...');
      const bookings = await this.getAllBookings(lastSyncDate);
      console.log(`📊 Total bookings received: ${bookings.length}`);

      // Фильтруем только подтвержденные
      const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
      console.log(`✅ Confirmed bookings: ${confirmedBookings.length}`);

      // Сохраняем в БД
      let savedCount = 0;
      for (const booking of confirmedBookings) {
        for (const roomStay of booking.roomStays) {
          const apartmentId = ROOM_TYPE_MAPPING[roomStay.roomType.id];
          
          if (apartmentId) {
            this.saveBlockedDates(apartmentId, booking);
            savedCount++;
          } else {
            console.log(`  ⚠️ No mapping for room type: ${roomStay.roomType.id}`);
          }
        }
      }

      // Записываем время синхронизации
      db.prepare(`
        INSERT INTO sync_log (source, last_sync, status, message)
        VALUES (?, ?, ?, ?)
      `).run(
        'travelline', 
        new Date().toISOString(), 
        'success', 
        `Synced ${confirmedBookings.length} bookings, saved ${savedCount} blocked dates`
      );

      console.log('='.repeat(60));
      console.log(`✅ Sync completed: ${savedCount} blocked dates saved`);
      console.log('='.repeat(60));

      return savedCount;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      
      db.prepare(`
        INSERT INTO sync_log (source, last_sync, status, message)
        VALUES (?, ?, ?, ?)
      `).run(
        'travelline', 
        new Date().toISOString(), 
        'error', 
        error instanceof Error ? error.message : String(error)
      );
      
      throw error;
    }
  }
}

export const travellineService = new TravellineService();

// Для CommonJS совместимости
module.exports = { travellineService };