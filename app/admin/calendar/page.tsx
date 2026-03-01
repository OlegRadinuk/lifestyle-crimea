'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await fetch('/api/admin/bookings?status=confirmed');
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  };

  // Группировка по месяцам
  const bookingsByMonth = bookings.reduce((acc, booking) => {
    const month = booking.check_in.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(booking);
    return acc;
  }, {});

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-title">Календарь занятости</h1>

      {Object.entries(bookingsByMonth).map(([month, monthBookings]: [string, any]) => (
        <div key={month} className="calendar-month">
          <h2>{new Date(month + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
          
          <div className="calendar-grid">
            {monthBookings.map((booking: any) => (
              <Link 
                href={`/admin/bookings/${booking.id}`} 
                key={booking.id}
                className="calendar-booking"
              >
                <div className="booking-dates">
                  {new Date(booking.check_in).getDate()} - {new Date(booking.check_out).getDate()}
                </div>
                <div className="booking-title">{booking.apartment_title}</div>
                <div className="booking-guest">{booking.guest_name}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <style jsx>{`
        .calendar-month {
          margin-bottom: 40px;
        }
        .calendar-month h2 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #1a2634;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        .calendar-booking {
          background: white;
          border-radius: 8px;
          padding: 15px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s;
          border-left: 4px solid #139ab6;
        }
        .calendar-booking:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .booking-dates {
          font-size: 18px;
          font-weight: 600;
          color: #139ab6;
          margin-bottom: 5px;
        }
        .booking-title {
          font-weight: 500;
          margin-bottom: 3px;
        }
        .booking-guest {
          font-size: 13px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}