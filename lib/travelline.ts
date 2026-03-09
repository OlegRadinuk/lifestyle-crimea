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
      stayDates?: {
        arrivalDateTime?: string;
        departureDateTime?: string;
      };
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
  '278023': 'ls-space',
  '243734': 'ls-coffee-ice-cream',
  '263391': 'ls-summer-emotions',
  '330325': 'ls-black-strong',
  '274922': 'ls-deep-music',
  '348222': 'ls-dream-vacation',
  '279273': 'ls-econom-studio',
  '277347': 'ls-family-comfort',
  '272228': 'ls-in-the-moment',
  '345796': 'ls-lux-flower-kiss',
  '289889': 'ls-relax-time',
  '269778': 'ls-sweet-summer',
  '243739': 'ls-lux-sweet-caramel',
  '274610': 'ls-steel-love',
  '244430': 'ls-art-crystal-blue',
  '243321': 'ls-art-olive',
  '265649': 'ls-blue-curacao',
  '244425': 'ls-blueberry',
  '269609': 'ls-cool-lemonade',
  '243319': 'ls-green',
  '291460': 'ls-hi-tech-emotion',
  '291417': 'ls-hi-tech-relax',
  '272288': 'ls-lux-only-you',
  '373007': 'ls-lux-fly-sky',
  '348227': 'ls-lux-beautiful-days',
  '361602': 'ls-lux-fly-mood',
  '337183': 'ls-lux-sun-rays',
  '348223': 'ls-lux-sunny-mood',
  '373006': 'ls-lux-fly-blue-light',
  '337185': 'ls-lux-sunshine',
  '278010': 'ls-diamond-green',
  '348218': 'ls-mountain-retreat',
  '264854': 'ls-wine-and-sunset',
  '264995': 'ls-lux-white-sands',
  '244426': 'ls-lux-orange',
  '243517': 'ls-lux-soft-blue',
  '363094': 'ls-lux-fly-birds',
  '280610': 'ls-deep-forest',
  '281311': 'ls-flowers-tea',
};

class TravellineService {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;
  private propertyId: string;
  private baseUrlContent = 'https://partner.tlintegration.com/api/content';
  private baseUrlReservation = 'https://partner.tlintegration.com/api/read-reservation';
  private rateLimitDelay = 1000;

  constructor() {
    this.clientId = process.env.TRAVELLINE_CLIENT_ID || '';
    this.clientSecret = process.env.TRAVELLINE_CLIENT_SECRET || '';
    this.propertyId = process.env.TRAVELLINE_PROPERTY_ID || '';
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    console.log('\n🔑 Getting new token...');
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
    console.log('✅ Token obtained');
    return this.token;
  }

  private async fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const wait = retryAfter ? parseInt(retryAfter) * 1000 : this.rateLimitDelay * (i + 1);
          console.log(`⏳ Rate limited, waiting ${wait}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, wait));
          continue;
        }
        
        return response;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`⏳ Retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }
    throw new Error('Max retries exceeded');
  }

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

  // ============================================
  // ОСНОВНЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ
  // ============================================
  async getAllBookings(lastSyncDate?: Date): Promise<TravellineBookingDetails['booking'][]> {
    const token = await this.getToken();
    let continueToken: string | undefined;
    let hasMore = true;
    let allBookings: TravellineBookingDetails['booking'][] = [];
    let page = 0;
    
    // Ограничиваем количество страниц и броней за раз
    const MAX_PAGES = 3;          // Максимум 3 страницы
    const MAX_BOOKINGS = 100;      // Максимум 100 броней за запуск

    const url = new URL(`${this.baseUrlReservation}/v1/properties/${this.propertyId}/bookings`);
    
    // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: используем lastModification
    if (lastSyncDate) {
      url.searchParams.set('lastModification', lastSyncDate.toISOString());
      console.log(`📅 Запрашиваем брони, изменённые после: ${lastSyncDate.toISOString()}`);
    } else {
      console.log('📅 Первая синхронизация - загружаем все брони');
    }

    while (hasMore && page < MAX_PAGES && allBookings.length < MAX_BOOKINGS) {
      page++;
      
      if (continueToken) {
        url.searchParams.set('continueToken', continueToken);
      }

      console.log(`📄 Страница ${page}...`);
      
      const response = await this.fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json() as TravellineBookingsResponse;
      const summaries = data.bookingSummaries || [];
      
      console.log(`   Получено ${summaries.length} сводок на странице ${page}`);
      
      for (const summary of summaries) {
        if (allBookings.length >= MAX_BOOKINGS) {
          console.log(`   Достигнут лимит в ${MAX_BOOKINGS} броней, останавливаемся`);
          break;
        }
        
        try {
          // Задержка между запросами деталей
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const booking = await this.getBookingDetails(summary.number);
          allBookings.push(booking);
        } catch (error) {
          // ИСПРАВЛЕНО: проверка типа error
          if (error instanceof Error && !error.message.includes('429')) {
            console.log(`   ❌ Error fetching ${summary.number}: ${error.message}`);
          }
        }
      }

      continueToken = data.continueToken;
      hasMore = data.hasMoreData;
    }

    console.log(`✅ Всего получено изменённых броней: ${allBookings.length}`);
    return allBookings;
  }

  async getBookingDetails(bookingNumber: string): Promise<TravellineBookingDetails['booking']> {
    const token = await this.getToken();
    
    const response = await this.fetchWithRetry(
      `${this.baseUrlReservation}/v1/properties/${this.propertyId}/bookings/${bookingNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to get booking ${bookingNumber}: ${response.status}`);
    }

    const data = await response.json() as TravellineBookingDetails;
    return data.booking;
  }

  private saveBlockedDates(apartmentId: string, booking: TravellineBookingDetails['booking']) {
    for (const roomStay of booking.roomStays || []) {
      // Исправлено: даты теперь в stayDates
      const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
      const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
      
      if (!checkIn || !checkOut) continue;
      
      const existing = db.prepare(
        'SELECT id FROM blocked_dates WHERE booking_number = ?'
      ).get(booking.number);

      if (!existing) {
        db.prepare(`
          INSERT INTO blocked_dates (apartment_id, start_date, end_date, source, booking_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(apartmentId, checkIn, checkOut, 'travelline', booking.number);
      }
    }
  }

  async syncBookings() {
    console.log('\n' + '='.repeat(70));
    console.log('🔄 TRAVELLINE SYNC STARTED');
    console.log('='.repeat(70));
    console.log(`Property ID: ${this.propertyId}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('='.repeat(70));

    let stats = {
      total: 0,
      saved: 0,
      cancelled: 0,
      noMapping: 0,
      errors: 0
    };

    const processedBookings = new Set();

    try {
      // Получаем время последней синхронизации
      const lastSync = db.prepare(
        'SELECT last_sync FROM sync_log WHERE source = ? ORDER BY last_sync DESC LIMIT 1'
      ).get('travelline') as { last_sync: string } | undefined;

      const lastSyncDate = lastSync ? new Date(lastSync.last_sync) : undefined;
      console.log(`📅 Last sync: ${lastSyncDate?.toISOString() || 'never'}`);

      // Получаем только изменённые брони
      const bookings = await this.getAllBookings(lastSyncDate);
      stats.total = bookings.length;

      console.log(`\n📋 Обрабатываем ${bookings.length} изменённых броней...\n`);

      for (const booking of bookings) {
        try {
          // Если бронь отменена — удаляем из БД
          if (booking.status === 'Cancelled') {
            const deleted = db.prepare('DELETE FROM blocked_dates WHERE booking_number = ?').run(booking.number);
            if (deleted.changes > 0) {
              console.log(`❌ Cancelled: ${booking.number} (removed from DB)`);
            }
            stats.cancelled++;
            continue;
          }
          
          // Проверяем будущие даты
          const today = new Date().toISOString().split('T')[0];
          let hasFuture = false;
          
          for (const roomStay of booking.roomStays || []) {
            const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
            if (checkIn && checkIn >= today) {
              hasFuture = true;
              break;
            }
          }
          
          if (!hasFuture) continue;
          
          // Обрабатываем комнаты
          for (const roomStay of booking.roomStays || []) {
            const roomTypeId = roomStay.roomType?.id;
            const apartmentId = ROOM_TYPE_MAPPING[roomTypeId];
            
            if (!apartmentId) {
              if (!processedBookings.has(booking.number)) {
                console.log(`⚠️ No mapping for ${booking.number} - roomTypeId: ${roomTypeId}`);
                processedBookings.add(booking.number);
                stats.noMapping++;
              }
              continue;
            }
            
            this.saveBlockedDates(apartmentId, booking);
            
            if (!processedBookings.has(booking.number)) {
              const checkIn = roomStay.stayDates?.arrivalDateTime?.split('T')[0];
              const checkOut = roomStay.stayDates?.departureDateTime?.split('T')[0];
              console.log(`✅ Saved: ${booking.number} (${apartmentId}: ${checkIn} - ${checkOut})`);
              processedBookings.add(booking.number);
              stats.saved++;
            }
          }
        } catch (error) {
          // ИСПРАВЛЕНО: проверка типа error
          if (error instanceof Error && !error.message.includes('429')) {
            console.log(`❌ Error ${booking.number}: ${error.message}`);
          }
          stats.errors++;
        }
      }

      // Логируем результат
      db.prepare(`
        INSERT INTO sync_log (source, last_sync, status, message)
        VALUES (?, ?, ?, ?)
      `).run(
        'travelline', 
        new Date().toISOString(), 
        'success', 
        `Total:${stats.total}, Saved:${stats.saved}, Cancelled:${stats.cancelled}, NoMap:${stats.noMapping}, Errors:${stats.errors}`
      );

      console.log('\n' + '='.repeat(70));
      console.log('📊 SYNC SUMMARY');
      console.log('='.repeat(70));
      console.log(`📋 Total changed bookings: ${stats.total}`);
      console.log(`✅ Saved new:              ${stats.saved}`);
      console.log(`❌ Cancelled:              ${stats.cancelled}`);
      console.log(`⚠️ No mapping:              ${stats.noMapping}`);
      console.log(`💥 Errors:                 ${stats.errors}`);
      console.log('='.repeat(70));

    } catch (error) {
      console.error('\n❌ SYNC FAILED:', error);
      
      // ИСПРАВЛЕНО: для последнего catch тоже
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      db.prepare(`
        INSERT INTO sync_log (source, last_sync, status, message)
        VALUES (?, ?, ?, ?)
      `).run(
        'travelline', 
        new Date().toISOString(), 
        'error', 
        errorMessage
      );
    }
  }
}

export const travellineService = new TravellineService();