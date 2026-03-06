const { db } = require('../lib/db');

class TravellineService {
  constructor() {
    this.token = null;
    this.tokenExpiry = 0;
    this.clientId = process.env.TRAVELLINE_CLIENT_ID || '';
    this.clientSecret = process.env.TRAVELLINE_CLIENT_SECRET || '';
    this.propertyId = process.env.TRAVELLINE_PROPERTY_ID || '37777';
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    console.log('🔑 Getting new token...');
    
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
      throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    console.log('✅ Token obtained');
    return this.token;
  }

  async syncBookings() {
    console.log('🔄 Starting Travelline sync...');
    console.log(`Property ID: ${this.propertyId}`);
    
    try {
      const token = await this.getToken();
      let continueToken = undefined;
      let hasMore = true;
      let syncedCount = 0;
      let page = 0;

      while (hasMore && page < 5) { // Ограничим 5 страницами для теста
        page++;
        const url = new URL(`https://partner.tlintegration.com/reservation/v1/properties/${this.propertyId}/bookings`);
        
        if (continueToken) {
          url.searchParams.set('continueToken', continueToken);
        }

        console.log(`📡 Requesting page ${page}...`);
        
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.error(`❌ API error: ${response.status} ${response.statusText}`);
          const text = await response.text();
          console.error('Response:', text);
          break;
        }

        const data = await response.json();
        console.log(`📊 Got ${data.bookingSummaries?.length || 0} bookings`);

        for (const summary of data.bookingSummaries || []) {
          syncedCount++;
          console.log(`  📅 Booking #${syncedCount}: ${summary.number} (modified: ${summary.modifiedDateTime})`);
        }

        continueToken = data.continueToken;
        hasMore = data.hasMoreData;
      }

      console.log(`✅ Sync completed: ${syncedCount} bookings found`);
      return syncedCount;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }
}

async function run() {
  console.log('='.repeat(50));
  console.log('🚀 Travelline Sync Started at', new Date().toISOString());
  console.log('='.repeat(50));
  
  const service = new TravellineService();
  
  try {
    const count = await service.syncBookings();
    console.log('='.repeat(50));
    console.log(`✅ SUCCESS: ${count} bookings processed`);
    console.log('='.repeat(50));
    process.exit(0);
  } catch (error) {
    console.error('='.repeat(50));
    console.error('❌ FAILED:', error);
    console.error('='.repeat(50));
    process.exit(1);
  }
}

// Проверяем наличие переменных окружения
console.log('📋 Environment check:');
console.log(`TRAVELLINE_CLIENT_ID: ${process.env.TRAVELLINE_CLIENT_ID ? '✅ set' : '❌ missing'}`);
console.log(`TRAVELLINE_CLIENT_SECRET: ${process.env.TRAVELLINE_CLIENT_SECRET ? '✅ set' : '❌ missing'}`);
console.log(`TRAVELLINE_PROPERTY_ID: ${process.env.TRAVELLINE_PROPERTY_ID || '37777 (default)'}`);

run();
