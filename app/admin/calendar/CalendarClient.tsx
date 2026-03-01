'use client';

import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/ru';

// Настройка локали
moment.locale('ru');
const localizer = momentLocalizer(moment);

type Booking = {
  id: string;
  apartment_title: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
  status: string;
};

export default function CalendarClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings?status=confirmed');
      const data = await res.json();
      
      const calendarEvents = data.map((booking: Booking) => ({
        id: booking.id,
        title: `${booking.apartment_title} - ${booking.guest_name}`,
        start: new Date(booking.check_in),
        end: new Date(booking.check_out),
        resource: booking,
        status: booking.status,
      }));
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const res = await fetch(`/api/admin/bookings/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in: start.toISOString().split('T')[0],
          check_out: end.toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        setEvents(prev => 
          prev.map(e => 
            e.id === event.id 
              ? { ...e, start, end }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Ошибка при переносе брони');
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
    await handleEventDrop({ event, start, end });
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#139ab6'; // синий по умолчанию
    
    if (event.status === 'pending') backgroundColor = '#ff9800'; // оранжевый
    if (event.status === 'cancelled') backgroundColor = '#f44336'; // красный
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  if (loading) return <div className="admin-loading">Загрузка календаря...</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="admin-title">Календарь бронирований</h1>
        <div className="calendar-legend">
          <span className="legend-item confirmed">🟢 Подтверждено</span>
          <span className="legend-item pending">🟡 Ожидает</span>
          <span className="legend-item cancelled">🔴 Отменено</span>
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          selectable
          popup
          views={['month', 'week', 'day']}
          defaultView="month"
          messages={{
            next: 'След',
            previous: 'Пред',
            today: 'Сегодня',
            month: 'Месяц',
            week: 'Неделя',
            day: 'День',
            date: 'Дата',
            time: 'Время',
            event: 'Событие',
            noEventsInRange: 'Нет событий в этом диапазоне',
          }}
        />
      </div>

      {/* Модалка с деталями брони */}
      {selectedEvent && (
        <div className="event-modal" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Детали брони</h3>
            <p><strong>Апартамент:</strong> {selectedEvent.resource.apartment_title}</p>
            <p><strong>Гость:</strong> {selectedEvent.resource.guest_name}</p>
            <p><strong>Заезд:</strong> {selectedEvent.start.toLocaleDateString()}</p>
            <p><strong>Выезд:</strong> {selectedEvent.end.toLocaleDateString()}</p>
            <p><strong>Статус:</strong> {
              selectedEvent.status === 'confirmed' ? '🟢 Подтверждено' :
              selectedEvent.status === 'pending' ? '🟡 Ожидает' : '🔴 Отменено'
            }</p>
            <div className="modal-actions">
              <a href={`/admin/bookings/${selectedEvent.id}`} className="admin-button">
                Открыть бронь
              </a>
              <button onClick={() => setSelectedEvent(null)} className="admin-button">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          padding: 20px;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .calendar-legend {
          display: flex;
          gap: 20px;
        }
        .legend-item {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
        }
        .calendar-wrapper {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .event-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .event-modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
        }
        .event-modal-content h3 {
          margin-bottom: 20px;
          color: #1a2634;
        }
        .event-modal-content p {
          margin: 10px 0;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}