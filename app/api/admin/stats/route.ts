import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stats = {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      upcomingBookings: 0,
      totalRevenue: 0,
      apartmentsCount: 0,
      activeSources: 0,
    };

    // Запросы к БД
    stats.totalBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings').get() as any)?.count || 0;
    stats.confirmedBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('confirmed') as any)?.count || 0;
    stats.pendingBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('pending') as any)?.count || 0;
    stats.cancelledBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('cancelled') as any)?.count || 0;
    
    // ✅ ИСПРАВЛЕНО: date('now') в одинарных кавычках
    stats.upcomingBookings = (db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE check_in > date('now') AND status = 'confirmed'
    `).get() as any)?.count || 0;
    
    stats.totalRevenue = (db.prepare('SELECT SUM(total_price) as sum FROM bookings WHERE status = "confirmed"').get() as any)?.sum || 0;
    stats.apartmentsCount = (db.prepare('SELECT COUNT(*) as count FROM apartments').get() as any)?.count || 0;
    stats.activeSources = (db.prepare('SELECT COUNT(*) as count FROM ics_sources WHERE is_active = 1').get() as any)?.count || 0;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}