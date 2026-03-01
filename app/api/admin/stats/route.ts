import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Общая статистика
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as { count: number };
    const confirmedBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('confirmed') as { count: number };
    const pendingBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('pending') as { count: number };
    const cancelledBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('cancelled') as { count: number };
    
    const upcomingBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE check_in > date('now') AND status = 'confirmed'
    `).get() as { count: number };
    
    const totalRevenue = db.prepare(`
      SELECT SUM(total_price) as sum FROM bookings 
      WHERE status = 'confirmed'
    `).get() as { sum: number };
    
    const apartmentsCount = db.prepare('SELECT COUNT(*) as count FROM apartments').get() as { count: number };
    const activeSources = db.prepare('SELECT COUNT(*) as count FROM ics_sources WHERE is_active = 1').get() as { count: number };

    return NextResponse.json({
      totalBookings: totalBookings.count,
      confirmedBookings: confirmedBookings.count,
      pendingBookings: pendingBookings.count,
      cancelledBookings: cancelledBookings.count,
      upcomingBookings: upcomingBookings.count,
      totalRevenue: totalRevenue.sum || 0,
      apartmentsCount: apartmentsCount.count,
      activeSources: activeSources.count,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}