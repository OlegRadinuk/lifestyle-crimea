import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

type PageProps = {
  params: Promise<{ id: string }>;
};

// Server Action для обновления статуса
async function updateStatus(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  
  const stmt = db.prepare(`
    UPDATE bookings 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(status, id);
  
  revalidatePath(`/admin/bookings/${id}`);
}

// Server Action для обновления предоплаты
async function updatePrepaid(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string;
  const prepaid_amount = Number(formData.get('prepaid_amount'));
  const total_price = Number(formData.get('total_price'));
  
  const prepaid_status = prepaid_amount > 0 
    ? (prepaid_amount === total_price ? 'full' : 'partial') 
    : 'none';
  
  const stmt = db.prepare(`
    UPDATE bookings 
    SET prepaid_amount = ?, prepaid_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(prepaid_amount, prepaid_status, id);
  
  revalidatePath(`/admin/bookings/${id}`);
}

// Server Action для обновления заметок
async function updateNotes(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string;
  const manager_notes = formData.get('notes') as string;
  
  const stmt = db.prepare(`
    UPDATE bookings 
    SET manager_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(manager_notes, id);
  
  revalidatePath(`/admin/bookings/${id}`);
}

export default async function BookingPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    redirect('/admin/bookings');
  }

  // Получаем данные брони
  const booking = db.prepare(`
    SELECT b.*, a.title as apartment_title 
    FROM bookings b
    JOIN apartments a ON b.apartment_id = a.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!booking) {
    notFound();
  }

  // Преобразуем BigInt в Number
  const formattedBooking = {
    id: booking.id,
    apartment_title: booking.apartment_title,
    guest_name: booking.guest_name,
    guest_phone: booking.guest_phone,
    guest_email: booking.guest_email,
    check_in: booking.check_in,
    check_out: booking.check_out,
    guests_count: booking.guests_count,
    total_price: Number(booking.total_price),
    status: booking.status,
    prepaid_amount: Number(booking.prepaid_amount || 0),
    prepaid_status: booking.prepaid_status || 'none',
    source: booking.source,
    created_at: booking.created_at,
    manager_notes: booking.manager_notes || '',
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Бронь #{formattedBooking.id.slice(0, 8)}</h1>
        <Link href="/admin/bookings" className="admin-button">← Назад</Link>
      </div>

      <div className="booking-detail-grid">
        {/* Основная информация */}
        <div className="admin-card">
          <h2>Информация о брони</h2>

          <div className="info-row">
            <span className="info-label">Апартамент:</span>
            <span className="info-value">{formattedBooking.apartment_title}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Гость:</span>
            <span className="info-value">{formattedBooking.guest_name}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Телефон:</span>
            <span className="info-value">{formattedBooking.guest_phone}</span>
          </div>

          {formattedBooking.guest_email && (
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{formattedBooking.guest_email}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Даты:</span>
            <span className="info-value">
              {new Date(formattedBooking.check_in).toLocaleDateString()} — {new Date(formattedBooking.check_out).toLocaleDateString()}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Гостей:</span>
            <span className="info-value">{formattedBooking.guests_count}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Сумма:</span>
            <span className="info-value">{formattedBooking.total_price.toLocaleString()} ₽</span>
          </div>

          <div className="info-row">
            <span className="info-label">Источник:</span>
            <span className="info-value">{formattedBooking.source === 'website' ? 'Сайт' : 'Ручное'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Дата брони:</span>
            <span className="info-value">{new Date(formattedBooking.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Управление статусом */}
        <div className="admin-card">
          <h2>Статус брони</h2>

          <form action={updateStatus} className="status-buttons">
            <input type="hidden" name="id" value={formattedBooking.id} />
            
            <button 
              type="submit" 
              name="status" 
              value="pending"
              className={`status-btn ${formattedBooking.status === 'pending' ? 'active' : ''}`}
            >
              🟡 Ожидает
            </button>
            
            <button 
              type="submit" 
              name="status" 
              value="confirmed"
              className={`status-btn ${formattedBooking.status === 'confirmed' ? 'active' : ''}`}
            >
              🟢 Подтверждена
            </button>
            
            <button 
              type="submit" 
              name="status" 
              value="cancelled"
              className={`status-btn ${formattedBooking.status === 'cancelled' ? 'active' : ''}`}
            >
              🔴 Отменена
            </button>
          </form>

          <h2 style={{ marginTop: '30px' }}>Предоплата</h2>
          <form action={updatePrepaid} className="prepaid-section">
            <input type="hidden" name="id" value={formattedBooking.id} />
            <input type="hidden" name="total_price" value={formattedBooking.total_price} />
            
            <input
              type="number"
              name="prepaid_amount"
              defaultValue={formattedBooking.prepaid_amount}
              placeholder="Сумма предоплаты"
            />
            <button type="submit" className="admin-button primary">
              Сохранить
            </button>
          </form>
          
          <div className="prepaid-status">
            Статус: {
              formattedBooking.prepaid_status === 'full' ? '💳 Оплачено полностью' :
              formattedBooking.prepaid_status === 'partial' ? '💰 Частичная предоплата' :
              '⏳ Без предоплаты'
            }
          </div>
        </div>

        {/* Заметки менеджера */}
        <div className="admin-card full-width">
          <h2>Заметки</h2>
          <form action={updateNotes}>
            <input type="hidden" name="id" value={formattedBooking.id} />
            
            <textarea
              name="notes"
              defaultValue={formattedBooking.manager_notes}
              rows={5}
              placeholder="Внутренние заметки по брони..."
            />
            <button type="submit" className="admin-button primary" style={{ marginTop: '10px' }}>
              Сохранить заметки
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .booking-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .admin-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .admin-card.full-width {
          grid-column: span 2;
        }
        .admin-card h2 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1a2634;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #eef2f6;
        }
        .info-label {
          width: 120px;
          color: #64748b;
        }
        .info-value {
          flex: 1;
          color: #1e293b;
          font-weight: 500;
        }
        .status-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .status-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .status-btn.active {
          border-color: #139ab6;
          background: #e6f7ff;
        }
        .prepaid-section {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .prepaid-section input {
          flex: 1;
          padding: 10px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
        }
        .prepaid-status {
          color: #64748b;
          font-size: 14px;
        }
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}