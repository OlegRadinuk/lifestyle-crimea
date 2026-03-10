import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Брони с сайта
    const websiteBookings = {
      total: (db.prepare('SELECT COUNT(*) as count FROM bookings').get() as any)?.count || 0,
      confirmed: (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('confirmed') as any)?.count || 0,
      pending: (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('pending') as any)?.count || 0,
      cancelled: (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status = ?').get('cancelled') as any)?.count || 0,
      revenue: (db.prepare('SELECT SUM(total_price) as sum FROM bookings WHERE status = "confirmed"').get() as any)?.sum || 0,
    };

    // Блокированные даты из Travelline
    const travellineBlocked = {
      total: (db.prepare('SELECT COUNT(*) as count FROM blocked_dates').get() as any)?.count || 0,
      future: (db.prepare(`
        SELECT COUNT(*) as count FROM blocked_dates 
        WHERE end_date >= date('now')
      `).get() as any)?.count || 0,
    };

    // Ближайшие заезды (из обоих источников)
    const upcomingBookings = {
      website: db.prepare(`
        SELECT COUNT(*) as count FROM bookings 
        WHERE check_in > date('now') AND status = 'confirmed'
      `).get() as any,
      travelline: db.prepare(`
        SELECT COUNT(*) as count FROM blocked_dates 
        WHERE start_date > date('now')
      `).get() as any,
    };

    const stats = {
      // Общая статистика
      totalBookings: websiteBookings.total + travellineBlocked.total,
      confirmedBookings: websiteBookings.confirmed + travellineBlocked.future,
      pendingBookings: websiteBookings.pending,
      cancelledBookings: websiteBookings.cancelled,
      upcomingBookings: (upcomingBookings.website?.count || 0) + (upcomingBookings.travelline?.count || 0),
      totalRevenue: websiteBookings.revenue,
      
      // Детальная статистика
      apartmentsCount: (db.prepare('SELECT COUNT(*) as count FROM apartments').get() as any)?.count || 0,
      activeSources: (db.prepare('SELECT COUNT(*) as count FROM ics_sources WHERE is_active = 1').get() as any)?.count || 0,
      
      // Разбивка по источникам
      bySource: {
        website: websiteBookings.total,
        travelline: travellineBlocked.total,
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}