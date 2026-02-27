// lib/db.ts
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { BlockedDate, Booking, ExternalBooking, IcsSource, SyncLog } from './types';

// Путь к базе данных
const dbPath = path.join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

// Включаем внешние ключи и WAL
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Инициализация таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS apartments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    max_guests INTEGER NOT NULL,
    price_base INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ics_sources (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    ics_url TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_sync DATETIME,
    sync_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    UNIQUE(apartment_id, source_name)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',
    source TEXT DEFAULT 'website',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS external_bookings (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    external_id TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    raw_data TEXT,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS export_tokens (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sync_logs (
    id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    apartment_id TEXT,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    events_count INTEGER,
    error_message TEXT,
    duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблицы для Telegram бота
  CREATE TABLE IF NOT EXISTS telegram_settings (
    id TEXT PRIMARY KEY,
    bot_token TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    notification_type TEXT NOT NULL, -- 'new_booking', 'cancellation', 'reminder'
    status TEXT NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS booking_comments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_by TEXT DEFAULT 'manager',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  );

  -- Индексы для быстрого поиска
  CREATE INDEX IF NOT EXISTS idx_external_bookings_dates ON external_bookings(check_in, check_out);
  CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
  CREATE INDEX IF NOT EXISTS idx_export_tokens_token ON export_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_booking_comments_booking ON booking_comments(booking_id);
  CREATE INDEX IF NOT EXISTS idx_notification_logs_booking ON notification_logs(booking_id);
`);

// Сервис для работы с бронированиями
export const bookingService = {
checkAvailability: (apartmentId: string, checkIn: string, checkOut: string): boolean => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT check_in, check_out FROM bookings 
      WHERE apartment_id = ? AND status = 'confirmed'
      AND (
        -- Проверка на ПЕРЕСЕЧЕНИЕ, а не на полное вхождение
        check_in < ? AND check_out > ?
      )
      UNION ALL
      SELECT check_in, check_out FROM external_bookings 
      WHERE apartment_id = ? 
      AND (
        check_in < ? AND check_out > ?
      )
    )
  `);
  
  const result = stmt.get(
    apartmentId, checkOut, checkIn,  // для bookings
    apartmentId, checkOut, checkIn   // для external_bookings
  ) as { count: number };
  
  return result.count === 0;
},

  createBooking: (data: {
    apartmentId: string;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    totalPrice: number;
  }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, apartment_id, guest_name, guest_phone, guest_email,
        check_in, check_out, guests_count, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.apartmentId,
      data.guestName || null,
      data.guestPhone || null,
      data.guestEmail || null,
      data.checkIn,
      data.checkOut,
      data.guestsCount,
      data.totalPrice
    );
    return { id, ...data };
  },

  getBookingsForExport: (apartmentId: string, fromDate?: string): Pick<Booking, 'check_in' | 'check_out'>[] => {
    let query = `
      SELECT check_in, check_out FROM bookings 
      WHERE apartment_id = ? AND status = 'confirmed'
    `;
    const params: any[] = [apartmentId];
    if (fromDate) {
      query += ` AND check_out >= ?`;
      params.push(fromDate);
    }
    query += ` ORDER BY check_in ASC`;
    const stmt = db.prepare(query);
    return stmt.all(...params) as Pick<Booking, 'check_in' | 'check_out'>[];
  },

  getBookingById: (id: string) => {
    const stmt = db.prepare(`
      SELECT b.*, a.title as apartment_title 
      FROM bookings b
      JOIN apartments a ON b.apartment_id = a.id
      WHERE b.id = ?
    `);
    return stmt.get(id);
  },

  updateBookingStatus: (id: string, status: 'confirmed' | 'cancelled' | 'pending') => {
    const stmt = db.prepare(`
      UPDATE bookings 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  },

  // 🔥 НОВЫЙ МЕТОД: Получить все бронирования (для календаря)
  getAllBookings: (): Booking[] => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM bookings 
        WHERE status = 'confirmed' OR status IS NULL
        ORDER BY check_in ASC
      `);
      return stmt.all() as Booking[];
    } catch (error) {
      console.error('Error getting all bookings:', error);
      return [];
    }
  },

  // 🔥 НОВЫЙ МЕТОД: Получить бронирования по апартаменту
  getBookingsByApartment: (apartmentId: string): Booking[] => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM bookings 
        WHERE apartment_id = ? 
        AND (status = 'confirmed' OR status IS NULL)
        ORDER BY check_in ASC
      `);
      return stmt.all(apartmentId) as Booking[];
    } catch (error) {
      console.error(`Error getting bookings for apartment ${apartmentId}:`, error);
      return [];
    }
  },
};

// Сервис для работы с ICS источниками
export const icsService = {
  addSource: (apartmentId: string, sourceName: string, icsUrl: string) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO ics_sources (id, apartment_id, source_name, ics_url)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, apartmentId, sourceName, icsUrl);
    return { id, apartmentId, sourceName, icsUrl };
  },

  getActiveSources: (): IcsSource[] => {
    const stmt = db.prepare(`
      SELECT * FROM ics_sources 
      WHERE is_active = 1 
      ORDER BY apartment_id, source_name
    `);
    return stmt.all() as IcsSource[];
  },

  updateSyncStatus: (sourceId: string, status: 'success' | 'error', errorMessage?: string) => {
    const stmt = db.prepare(`
      UPDATE ics_sources 
      SET last_sync = CURRENT_TIMESTAMP, 
          sync_status = ?,
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, errorMessage || null, sourceId);
  },
};

// Сервис для внешних бронирований
export const externalBookingService = {
  addExternalBookings: (bookings: Array<{
    apartmentId: string;
    sourceName: string;
    externalId?: string;
    checkIn: string;
    checkOut: string;
    rawData?: string;
  }>) => {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO external_bookings 
        (id, apartment_id, source_name, external_id, check_in, check_out, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const deleteOldStmt = db.prepare(`
      DELETE FROM external_bookings 
      WHERE apartment_id = ? AND source_name = ? AND check_out < date('now')
    `);
    const transaction = db.transaction((items: typeof bookings) => {
      for (const b of items) {
        deleteOldStmt.run(b.apartmentId, b.sourceName);
        const id = uuidv4();
        insertStmt.run(
          id,
          b.apartmentId,
          b.sourceName,
          b.externalId || null,
          b.checkIn,
          b.checkOut,
          b.rawData || null
        );
      }
    });
    transaction(bookings);
  },

  getBlockedDates: (apartmentId: string): BlockedDate[] => {
    const stmt = db.prepare(`
      SELECT check_in as start, check_out as end, source_name as source 
      FROM external_bookings 
      WHERE apartment_id = ? AND check_out >= date('now')
      ORDER BY check_in ASC
    `);
    return stmt.all(apartmentId) as BlockedDate[];
  },

  // 🔥 УЛУЧШЕННЫЙ МЕТОД: Получить все заблокированные даты (включая будущие и прошлые)
  getAllBlockedDates: (apartmentId: string): BlockedDate[] => {
    const stmt = db.prepare(`
      SELECT check_in as start, check_out as end, source_name as source 
      FROM external_bookings 
      WHERE apartment_id = ?
      ORDER BY check_in ASC
    `);
    return stmt.all(apartmentId) as BlockedDate[];
  },
};

// Сервис для логов
export const logService = {
  addSyncLog: (data: {
    sourceName: string;
    apartmentId?: string;
    action: 'import' | 'export';
    status: 'success' | 'error';
    eventsCount?: number;
    errorMessage?: string;
    durationMs?: number;
  }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO sync_logs 
        (id, source_name, apartment_id, action, status, events_count, error_message, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.sourceName,
      data.apartmentId || null,
      data.action,
      data.status,
      data.eventsCount || 0,
      data.errorMessage || null,
      data.durationMs || null
    );
  },

  getLastSync: (limit: number = 10): SyncLog[] => {
    const stmt = db.prepare(`
      SELECT * FROM sync_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as SyncLog[];
  },
};

// Сервис для уведомлений (Telegram)
export const notificationService = {
  saveTelegramSettings: (botToken: string, chatId: string) => {
    const id = uuidv4();
    db.prepare('UPDATE telegram_settings SET is_active = 0').run();
    const stmt = db.prepare(`
      INSERT INTO telegram_settings (id, bot_token, chat_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, botToken, chatId);
    return { id, botToken, chatId };
  },

  getActiveTelegramSettings: () => {
    const stmt = db.prepare(`
      SELECT * FROM telegram_settings 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return stmt.get() as { bot_token: string; chat_id: string } | undefined;
  },

  logNotification: (data: {
    bookingId?: string;
    type: 'new_booking' | 'cancellation' | 'reminder';
    status: 'sent' | 'failed';
    errorMessage?: string;
  }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO notification_logs (id, booking_id, notification_type, status, error_message)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.bookingId || null,
      data.type,
      data.status,
      data.errorMessage || null
    );
  },

  addComment: (bookingId: string, comment: string) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO booking_comments (id, booking_id, comment)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, bookingId, comment);
    return { id, bookingId, comment };
  },

  getComments: (bookingId: string) => {
    const stmt = db.prepare(`
      SELECT * FROM booking_comments 
      WHERE booking_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(bookingId);
  },

  getNotificationStats: (days: number = 7) => {
    const stmt = db.prepare(`
      SELECT 
        notification_type,
        status,
        COUNT(*) as count,
        date(created_at) as date
      FROM notification_logs
      WHERE created_at >= date('now', ?)
      GROUP BY date, notification_type, status
      ORDER BY date DESC
    `);
    return stmt.all(`-${days} days`);
  },
};

// Вспомогательные функции для токенов
export function generateExportToken(apartmentId: string): string {
  const token = uuidv4().replace(/-/g, '');
  const stmt = db.prepare(`
    INSERT INTO export_tokens (id, apartment_id, token)
    VALUES (?, ?, ?)
  `);
  stmt.run(uuidv4(), apartmentId, token);
  return token;
}

export function getApartmentByToken(token: string): string | null {
  const stmt = db.prepare(`
    SELECT apartment_id FROM export_tokens 
    WHERE token = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const result = stmt.get(token) as { apartment_id: string } | undefined;
  if (result) {
    db.prepare('UPDATE export_tokens SET last_accessed = CURRENT_TIMESTAMP WHERE token = ?').run(token);
    return result.apartment_id;
  }
  return null;
}

export function getBookingStats(apartmentId?: string) {
  let query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN check_in > date('now') THEN 1 ELSE 0 END) as upcoming,
      SUM(total_price) as revenue
    FROM bookings
  `;
  const params: any[] = [];
  
  if (apartmentId) {
    query += ` WHERE apartment_id = ?`;
    params.push(apartmentId);
  }
  
  const stmt = db.prepare(query);
  return stmt.get(...params);
}

export { db };