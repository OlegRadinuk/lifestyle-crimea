import { NextRequest, NextResponse } from 'next/server';
import { travellineService } from '@/lib/travelline';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

export async function GET(request: NextRequest) {
  return POST(request);
}
