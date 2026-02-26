import { NextResponse } from 'next/server';
import { icsService, externalBookingService, logService } from '@/lib/db';
import { fetchIcs } from '@/lib/ics/parser';
import type { IcsSource } from '@/lib/types';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sourceName, apartmentId } = body;

    let sources = icsService.getActiveSources() as IcsSource[];
    if (sourceName) {
      sources = sources.filter(s => s.source_name === sourceName);
    }
    if (apartmentId) {
      sources = sources.filter(s => s.apartment_id === apartmentId);
    }

    const results = [];
    for (const source of sources) {
      const sourceStart = Date.now();
      try {
        const events = await fetchIcs(source.ics_url);
        const externalBookings = events.map(event => ({
          apartmentId: source.apartment_id,
          sourceName: source.source_name,
          externalId: event.uid,
          checkIn: event.start,
          checkOut: event.end,
          rawData: JSON.stringify(event),
        }));

        externalBookingService.addExternalBookings(externalBookings);
        icsService.updateSyncStatus(source.id, 'success');
        const duration = Date.now() - sourceStart;

        logService.addSyncLog({
          sourceName: source.source_name,
          apartmentId: source.apartment_id,
          action: 'import',
          status: 'success',
          eventsCount: externalBookings.length,
          durationMs: duration,
        });

        results.push({
          source: source.source_name,
          apartmentId: source.apartment_id,
          status: 'success',
          events: externalBookings.length,
          duration,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const duration = Date.now() - sourceStart;
        icsService.updateSyncStatus(source.id, 'error', errorMessage);
        logService.addSyncLog({
          sourceName: source.source_name,
          apartmentId: source.apartment_id,
          action: 'import',
          status: 'error',
          errorMessage,
          durationMs: duration,
        });
        results.push({
          source: source.source_name,
          apartmentId: source.apartment_id,
          status: 'error',
          error: errorMessage,
          duration,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Синхронизировано ${results.length} источников`,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    return NextResponse.json({ error: 'Ошибка синхронизации' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sources = icsService.getActiveSources() as IcsSource[];
    const logs = logService.getLastSync(20);
    return NextResponse.json({ sources, lastSyncs: logs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}
