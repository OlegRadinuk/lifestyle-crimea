import { NextResponse } from 'next/server';
import { travellineService } from '@/lib/travelline';

export async function POST() {
  try {
    const count = await travellineService.syncBookings();
    return NextResponse.json({ 
      success: true, 
      synced: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Travelline sync error:', error);
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// GET для ручного запуска через браузер (опционально)
export async function GET() {
  return POST();
}