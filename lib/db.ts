// lib/db.ts
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const DEFAULT_HOT_DEAL_DISCOUNT = 10;

// С какого срока проживание считается долгосрочным. Менеджер меняет в админке,
// это лишь запасное значение, если строки в app_settings ещё нет.
export const DEFAULT_LONG_TERM_MIN_DAYS = 30;

// Типы
export interface Apartment {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  breakfast_price: number;
  view: string;
  has_terrace: number;
  is_active: number;
  sort_order: number;
  features: string | null;
  images: string | null;
  deleted_at: string | null;
  hot_deal_enabled: number;
  hot_deal_discount: number;
  hot_deal_date_from: string | null;
  hot_deal_date_to: string | null;
  lunch_price: number;
  dinner_price: number;
  custom_meal_price: number;
  custom_meal_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApartmentPricingSeason {
  id: string;
  apartment_id: string;
  name: string;
  date_from: string;
  date_to: string;
  price_per_night: number;
  sort_order: number;
}

export interface Booking {
  id: string;
  apartment_id: string;
  apartment_title?: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  source: string;
  external_id: string | null;
  comment: string | null;
  manager_notes: string | null;
  prepaid_amount: number | null;
  prepaid_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalBooking {
  id: string;
  apartment_id: string;
  source_name: string;
  external_id: string | null;
  check_in: string;
  check_out: string;
  raw_data: string | null;
  imported_at: string;
}

export interface IcsSource {
  id: string;
  apartment_id: string;
  source_name: string;
  ics_url: string;
  is_active: number;
  last_sync: string | null;
  sync_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  source_name: string;
  apartment_id: string | null;
  action: string;
  status: string;
  events_count: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface BlockedDate {
  start: string;
  end: string;
  source: string;
}

export interface News {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  is_published: number;
  is_featured: number;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = 'apartment' | 'service' | 'infrastructure';

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  title: string;
  icon: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Путь к базе данных
const dbPath = path.join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

// Включаем внешние ключи и WAL
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Функция для проверки и обновления структуры таблиц
function ensureDatabaseStructure() {
  console.log('🔧 Checking database structure...');

  try {
    // Создаем таблицы если их нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS apartments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        short_description TEXT,
        description TEXT,
        max_guests INTEGER NOT NULL,
        area INTEGER,
        price_base INTEGER NOT NULL,
        view TEXT DEFAULT 'sea',
        has_terrace INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        features TEXT DEFAULT '[]',
        images TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        external_id TEXT,
        comment TEXT,
        manager_notes TEXT,
        prepaid_amount INTEGER DEFAULT 0,
        prepaid_status TEXT DEFAULT 'not_required',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
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
        notification_type TEXT NOT NULL,
        status TEXT NOT NULL,
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
    `);

    // Создаем таблицу hero_slides если нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        media_type TEXT NOT NULL DEFAULT 'image',
        title TEXT,
        subtitle TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создаём таблицу новостей если нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT,
        cover_image TEXT,
        is_published INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
      CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at);
    `);

    // Создаём таблицу пунктов страницы «Услуги» если нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS service_items (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        icon TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_service_items_cat_order ON service_items(category, sort_order);
    `);

    // Создаем таблицу сезонных цен
    db.exec(`
      CREATE TABLE IF NOT EXISTS apartment_pricing_seasons (
        id TEXT PRIMARY KEY,
        apartment_id TEXT NOT NULL,
        name TEXT NOT NULL,
        date_from TEXT NOT NULL,
        date_to TEXT NOT NULL,
        price_per_night INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
      );
    `);

    // Глобальные шаблоны сезонов (общие даты, цена — в апартаменте)
    db.exec(`
      CREATE TABLE IF NOT EXISTS season_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date_from TEXT NOT NULL,
        date_to TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
    `);

    // Миграция: привязка сезона апартамента к шаблону
    try { db.exec("ALTER TABLE apartment_pricing_seasons ADD COLUMN template_id TEXT REFERENCES season_templates(id) ON DELETE SET NULL"); } catch {}

    // Миграция: цена парковки в сезонном шаблоне
    try { db.exec("ALTER TABLE season_templates ADD COLUMN parking_price INTEGER DEFAULT NULL"); } catch {}

    // Миграция: колонки согласия на ПД в bookings
    try { db.exec("ALTER TABLE bookings ADD COLUMN pd_consent_at TEXT"); } catch {}
    try { db.exec("ALTER TABLE bookings ADD COLUMN pd_consent_ip TEXT"); } catch {}
    try { db.exec("ALTER TABLE bookings ADD COLUMN pd_consent_version TEXT"); } catch {}

    // Создаём таблицу apartment_images если нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS apartment_images (
        id TEXT PRIMARY KEY,
        apartment_id TEXT NOT NULL,
        url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (apartment_id) REFERENCES apartments(id)
      );
    `);

    // Создаём таблицу blocked_dates если нет
    db.exec(`
      CREATE TABLE IF NOT EXISTS blocked_dates (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        apartment_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        source TEXT DEFAULT 'manual',
        booking_number TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Миграция: добавить media_type если таблица уже существует без неё
    const heroColumns = (db.prepare("PRAGMA table_info(hero_slides)").all() as { name: string }[]).map(c => c.name);
    if (!heroColumns.includes('media_type')) {
      db.exec("ALTER TABLE hero_slides ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'");
      console.log('✅ Migrated hero_slides: added media_type column');
    }

    // Миграция: новые колонки apartments (try-catch защищает от параллельного добавления при build)
    const safeAddColumn = (sql: string, label: string) => {
      try { db.exec(sql); console.log(`✅ Migrated apartments: added ${label} column`); } catch { /* already exists */ }
    };
    safeAddColumn("ALTER TABLE apartments ADD COLUMN breakfast_price INTEGER DEFAULT 0", 'breakfast_price');
    const aptColumns = (db.prepare("PRAGMA table_info(apartments)").all() as { name: string }[]).map(c => c.name);
    if (!aptColumns.includes('sort_order')) {
      safeAddColumn("ALTER TABLE apartments ADD COLUMN sort_order INTEGER DEFAULT 0", 'sort_order');
      db.exec(`UPDATE apartments SET sort_order = (SELECT COUNT(*) FROM apartments a2 WHERE a2.title < apartments.title)`);
    }
    safeAddColumn("ALTER TABLE apartments ADD COLUMN deleted_at DATETIME DEFAULT NULL", 'deleted_at');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN hot_deal_enabled INTEGER DEFAULT 0", 'hot_deal_enabled');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN hot_deal_discount INTEGER DEFAULT 10", 'hot_deal_discount');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN lunch_price INTEGER DEFAULT 0", 'lunch_price');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN dinner_price INTEGER DEFAULT 0", 'dinner_price');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN custom_meal_description TEXT DEFAULT NULL", 'custom_meal_description');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN hot_deal_date_from TEXT DEFAULT NULL", 'hot_deal_date_from');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN hot_deal_date_to TEXT DEFAULT NULL", 'hot_deal_date_to');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN custom_meal_price INTEGER DEFAULT 0", 'custom_meal_price');
    // Долгосрочная аренда: тумблер + цена за месяц (0 = не задана)
    safeAddColumn("ALTER TABLE apartments ADD COLUMN long_term_enabled INTEGER DEFAULT 0", 'long_term_enabled');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN long_term_price INTEGER DEFAULT 0", 'long_term_price');
    safeAddColumn("ALTER TABLE apartments ADD COLUMN long_term_note TEXT DEFAULT NULL", 'long_term_note');
    /* Тип жилья для фильтра в каталоге: studio | bedroom | kitchen | duplex.
       NULL = не размечен, такой апартамент попадает только во «Все». */
    safeAddColumn("ALTER TABLE apartments ADD COLUMN category TEXT DEFAULT NULL", 'category');

    // Заявки на долгосрочную аренду отличаются от посуточных броней
    const bookingColumns = (db.prepare("PRAGMA table_info(bookings)").all() as { name: string }[]).map(c => c.name);
    if (!bookingColumns.includes('rental_type')) {
      try { db.exec("ALTER TABLE bookings ADD COLUMN rental_type TEXT DEFAULT 'daily'"); console.log('✅ Migrated bookings: added rental_type column'); } catch { /* already exists */ }
    }
    if (!bookingColumns.includes('long_term_months')) {
      try { db.exec("ALTER TABLE bookings ADD COLUMN long_term_months INTEGER DEFAULT NULL"); console.log('✅ Migrated bookings: added long_term_months column'); } catch { /* already exists */ }
    }
    // Колонка есть в CREATE TABLE, но в базах, созданных до её появления, её нет
    if (!bookingColumns.includes('comment')) {
      try { db.exec("ALTER TABLE bookings ADD COLUMN comment TEXT DEFAULT NULL"); console.log('✅ Migrated bookings: added comment column'); } catch { /* already exists */ }
    }

    // Глобальные настройки сайта (key-value), правятся менеджером из админки
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* Сроки долгосрочной аренды — общие на весь сайт (как season_templates).
       Менеджер задаёт их в Настройках, а цену под каждый срок — в карточке
       апартамента. Гость переключает срок одной «сосиской» над списком,
       и цены во всех карточках пересчитываются. */
    db.exec(`
      CREATE TABLE IF NOT EXISTS long_term_terms (
        id TEXT PRIMARY KEY,
        months INTEGER NOT NULL,
        label TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS apartment_long_term_prices (
        apartment_id TEXT NOT NULL,
        term_id TEXT NOT NULL,
        price_per_month INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (apartment_id, term_id),
        FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES long_term_terms(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_altp_apartment ON apartment_long_term_prices(apartment_id);
    `);

    // Стартовый набор сроков — менеджер потом правит под себя
    const termsCount = (db.prepare('SELECT COUNT(*) c FROM long_term_terms').get() as { c: number }).c;
    if (termsCount === 0) {
      const insTerm = db.prepare('INSERT INTO long_term_terms (id, months, label, sort_order) VALUES (?, ?, ?, ?)');
      [[1, 'Месяц'], [3, '3 месяца'], [6, 'Полгода'], [12, 'Год']].forEach(([m, label], i) => {
        insTerm.run(uuidv4(), m, label, i);
      });
      console.log('✅ Созданы сроки долгосрочной аренды по умолчанию: 1, 3, 6, 12 мес');
    }
    db.prepare(`INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`)
      .run('long_term_min_days', String(DEFAULT_LONG_TERM_MIN_DAYS));

    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );
    `);

    // Создаем индексы
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_external_bookings_dates ON external_bookings(check_in, check_out);
      CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
      CREATE INDEX IF NOT EXISTS idx_export_tokens_token ON export_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_booking_comments_booking ON booking_comments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_notification_logs_booking ON notification_logs(booking_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_apartment ON bookings(apartment_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    `);

    console.log('✅ Database structure is up to date');
  } catch (error) {
    console.error('❌ Error ensuring database structure:', error);
    throw error;
  }
}

// Вызываем проверку структуры
ensureDatabaseStructure();

// Глобальные настройки сайта
export const settingsService = {
  get: (key: string): string | null => {
    try {
      const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
      return row?.value ?? null;
    } catch {
      return null;
    }
  },

  set: (key: string, value: string): void => {
    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, value);
  },

  /** Минимальный срок долгосрочной аренды в сутках. Всегда возвращает валидное число. */
  getLongTermMinDays: (): number => {
    const raw = settingsService.get('long_term_min_days');
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LONG_TERM_MIN_DAYS;
    return Math.round(parsed);
  },
};

export interface LongTermTerm {
  id: string;
  months: number;
  label: string | null;
  sort_order: number;
  is_active: number;
}

// Сроки долгосрочной аренды и цены апартаментов под них
export const longTermService = {
  /** Активные сроки в порядке возрастания — то, что видит гость в «сосиске». */
  listActiveTerms: (): LongTermTerm[] =>
    db.prepare(`
      SELECT id, months, label, sort_order, is_active
      FROM long_term_terms
      WHERE is_active = 1
      ORDER BY sort_order, months
    `).all() as LongTermTerm[],

  /** Все сроки, включая выключенные — для админки. */
  listAllTerms: (): LongTermTerm[] =>
    db.prepare(`
      SELECT id, months, label, sort_order, is_active
      FROM long_term_terms
      ORDER BY sort_order, months
    `).all() as LongTermTerm[],

  createTerm: (months: number, label: string | null): LongTermTerm => {
    const id = uuidv4();
    const next = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM long_term_terms').get() as { n: number }).n;
    db.prepare('INSERT INTO long_term_terms (id, months, label, sort_order) VALUES (?, ?, ?, ?)')
      .run(id, months, label, next);
    return db.prepare('SELECT id, months, label, sort_order, is_active FROM long_term_terms WHERE id = ?').get(id) as LongTermTerm;
  },

  deleteTerm: (id: string): number => {
    // цены под этот срок уходят вместе с ним — ON DELETE CASCADE
    db.prepare('DELETE FROM apartment_long_term_prices WHERE term_id = ?').run(id);
    return db.prepare('DELETE FROM long_term_terms WHERE id = ?').run(id).changes;
  },

  /** Цены апартамента по срокам: { term_id: price_per_month } */
  pricesForApartment: (apartmentId: string): Record<string, number> => {
    const rows = db.prepare(
      'SELECT term_id, price_per_month FROM apartment_long_term_prices WHERE apartment_id = ?'
    ).all(apartmentId) as { term_id: string; price_per_month: number }[];
    return Object.fromEntries(rows.map(r => [r.term_id, Number(r.price_per_month)]));
  },

  /** Цены всех апартаментов разом — чтобы не дёргать БД в цикле по 47 карточкам. */
  allPrices: (): Record<string, Record<string, number>> => {
    const rows = db.prepare(
      'SELECT apartment_id, term_id, price_per_month FROM apartment_long_term_prices'
    ).all() as { apartment_id: string; term_id: string; price_per_month: number }[];
    const out: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      (out[r.apartment_id] ??= {})[r.term_id] = Number(r.price_per_month);
    }
    return out;
  },

  /** Цена 0 или пусто — значит «не сдаём на этот срок», строку убираем. */
  setPrice: (apartmentId: string, termId: string, pricePerMonth: number): void => {
    if (!pricePerMonth || pricePerMonth <= 0) {
      db.prepare('DELETE FROM apartment_long_term_prices WHERE apartment_id = ? AND term_id = ?')
        .run(apartmentId, termId);
      return;
    }
    db.prepare(`
      INSERT INTO apartment_long_term_prices (apartment_id, term_id, price_per_month, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(apartment_id, term_id)
      DO UPDATE SET price_per_month = excluded.price_per_month, updated_at = CURRENT_TIMESTAMP
    `).run(apartmentId, termId, Math.round(pricePerMonth));
  },
};

// Сервис для работы с бронированиями
export const bookingService = {
  checkAvailability: (apartmentId: string, checkIn: string, checkOut: string): boolean => {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT check_in, check_out FROM bookings 
        WHERE apartment_id = ? AND status = 'confirmed'
        AND check_in < ? AND check_out > ?
        UNION ALL
        SELECT check_in, check_out FROM external_bookings 
        WHERE apartment_id = ? 
        AND check_in < ? AND check_out > ?
      )
    `);
    
    const result = stmt.get(
      apartmentId, checkOut, checkIn,
      apartmentId, checkOut, checkIn
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
    pdConsentAt?: string | null;
    pdConsentIp?: string | null;
    pdConsentVersion?: string | null;
  }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, apartment_id, guest_name, guest_phone, guest_email,
        check_in, check_out, guests_count, total_price,
        pd_consent_at, pd_consent_ip, pd_consent_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.totalPrice,
      data.pdConsentAt ?? null,
      data.pdConsentIp ?? null,
      data.pdConsentVersion ?? null
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
      LEFT JOIN apartments a ON b.apartment_id = a.id
      WHERE b.id = ?
    `);
    return stmt.get(id);
  },

  updateBookingStatus: (id: string, status: string) => {
    const stmt = db.prepare(`
      UPDATE bookings 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  },

  getAllBookings: (): Booking[] => {
    const stmt = db.prepare(`
      SELECT * FROM bookings 
      ORDER BY check_in ASC
    `);
    return stmt.all() as Booking[];
  },

  getBookingsByApartment: (apartmentId: string): Booking[] => {
    const stmt = db.prepare(`
      SELECT * FROM bookings
      WHERE apartment_id = ?
      ORDER BY check_in ASC
    `);
    return stmt.all(apartmentId) as Booking[];
  },

  deleteBooking: (id: string | number): boolean => {
    const existing = db.prepare('SELECT id FROM bookings WHERE id = ?').get(String(id));
    if (!existing) return false;
    db.prepare('DELETE FROM bookings WHERE id = ?').run(String(id));
    return true;
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
    type: 'new_booking' | 'cancellation' | 'reminder' | 'long_term_request';
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

// Сервис сезонных цен
export const pricingService = {
  getSeasons: (apartmentId: string): ApartmentPricingSeason[] => {
    return db.prepare(`
      SELECT * FROM apartment_pricing_seasons
      WHERE apartment_id = ?
      ORDER BY sort_order ASC, date_from ASC
    `).all(apartmentId) as ApartmentPricingSeason[];
  },

  upsertSeason: (season: Omit<ApartmentPricingSeason, 'id'> & { id?: string }) => {
    const id = season.id || uuidv4();
    db.prepare(`
      INSERT INTO apartment_pricing_seasons (id, apartment_id, name, date_from, date_to, price_per_night, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        date_from = excluded.date_from,
        date_to = excluded.date_to,
        price_per_night = excluded.price_per_night,
        sort_order = excluded.sort_order
    `).run(id, season.apartment_id, season.name, season.date_from, season.date_to, season.price_per_night, season.sort_order || 0);
    return id;
  },

  deleteSeason: (id: string) => {
    db.prepare('DELETE FROM apartment_pricing_seasons WHERE id = ?').run(id);
  },

  getPriceForDates: (apartmentId: string, checkIn: string, checkOut: string): {
    total: number;
    breakdown: Array<{ date: string; price: number; seasonName?: string; isHotDeal?: boolean }>;
  } => {
    const apartment = db.prepare(
      'SELECT price_base, hot_deal_enabled, hot_deal_discount, hot_deal_date_from, hot_deal_date_to FROM apartments WHERE id = ?'
    ).get(apartmentId) as any;

    if (!apartment) return { total: 0, breakdown: [] };

    const seasons = db.prepare(
      'SELECT * FROM apartment_pricing_seasons WHERE apartment_id = ? ORDER BY sort_order ASC'
    ).all(apartmentId) as ApartmentPricingSeason[];

    const breakdown: Array<{ date: string; price: number; seasonName?: string; isHotDeal?: boolean }> = [];

    // Итерируем по каждой ночи в UTC, чтобы избежать смещения из-за локальной TZ сервера
    const cur = new Date(checkIn + 'T00:00:00Z');
    const end = new Date(checkOut + 'T00:00:00Z');

    while (cur < end) {
      const dateStr = cur.toISOString().split('T')[0]; // "YYYY-MM-DD"

      // Ищем подходящий сезон (сравнение строк YYYY-MM-DD корректно лексикографически)
      const season = seasons.find(s => dateStr >= s.date_from && dateStr <= s.date_to);
      let price = season ? season.price_per_night : apartment.price_base;
      let isHotDeal = false;

      // Применяем hot deal если активен и дата в диапазоне
      if (apartment.hot_deal_enabled) {
        const hasDateRange = apartment.hot_deal_date_from && apartment.hot_deal_date_to;
        const inRange = !hasDateRange || (dateStr >= apartment.hot_deal_date_from && dateStr <= apartment.hot_deal_date_to);
        if (inRange) {
          price = Math.round(price * (1 - (apartment.hot_deal_discount || DEFAULT_HOT_DEAL_DISCOUNT) / 100));
          isHotDeal = true;
        }
      }

      breakdown.push({ date: dateStr, price, seasonName: season?.name, isHotDeal });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const total = breakdown.reduce((sum, d) => sum + d.price, 0);
    return { total, breakdown };
  },
};

// ── Сервис шаблонов сезонов ────────────────────────────────────────────────────
export type SeasonTemplate = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  sort_order: number;
  parking_price: number | null;
};

export const seasonTemplateService = {
  getAll: (): SeasonTemplate[] =>
    db.prepare('SELECT * FROM season_templates ORDER BY sort_order ASC, date_from ASC').all() as SeasonTemplate[],

  upsert: (tpl: Omit<SeasonTemplate, 'id'> & { id?: string }): string => {
    const id = tpl.id || uuidv4();
    db.prepare(`
      INSERT INTO season_templates (id, name, date_from, date_to, sort_order, parking_price)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        date_from = excluded.date_from,
        date_to = excluded.date_to,
        sort_order = excluded.sort_order,
        parking_price = excluded.parking_price
    `).run(id, tpl.name, tpl.date_from, tpl.date_to, tpl.sort_order ?? 0, tpl.parking_price ?? null);
    return id;
  },

  updateParkingPrice: (templateId: string, price: number | null): void => {
    const affected = db.prepare(
      'UPDATE season_templates SET parking_price = ? WHERE id = ?'
    ).run(price, templateId);
    if (affected.changes === 0) {
      throw new Error(`Season template not found: ${templateId}`);
    }
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM season_templates WHERE id = ?').run(id);
  },

  // Получить цены апартамента по шаблонам (JOIN)
  getApartmentPrices: (apartmentId: string): Array<SeasonTemplate & { price_per_night: number | null; season_id: string | null }> => {
    return db.prepare(`
      SELECT t.*, s.price_per_night, s.id as season_id
      FROM season_templates t
      LEFT JOIN apartment_pricing_seasons s
        ON s.template_id = t.id AND s.apartment_id = ?
      ORDER BY t.sort_order ASC, t.date_from ASC
    `).all(apartmentId) as any[];
  },

  // Установить/обновить цену апартамента для шаблона
  setApartmentPrice: (apartmentId: string, templateId: string, price: number): void => {
    const tpl = db.prepare('SELECT * FROM season_templates WHERE id = ?').get(templateId) as SeasonTemplate | undefined;
    if (!tpl) return;
    const existing = db.prepare('SELECT id FROM apartment_pricing_seasons WHERE apartment_id = ? AND template_id = ?').get(apartmentId, templateId) as { id: string } | undefined;
    if (existing) {
      db.prepare('UPDATE apartment_pricing_seasons SET price_per_night = ?, name = ?, date_from = ?, date_to = ?, sort_order = ? WHERE id = ?')
        .run(price, tpl.name, tpl.date_from, tpl.date_to, tpl.sort_order, existing.id);
    } else {
      db.prepare('INSERT INTO apartment_pricing_seasons (id, apartment_id, template_id, name, date_from, date_to, price_per_night, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), apartmentId, templateId, tpl.name, tpl.date_from, tpl.date_to, price, tpl.sort_order);
    }
  },

  // Удалить цену апартамента для шаблона
  removeApartmentPrice: (apartmentId: string, templateId: string): void => {
    db.prepare('DELETE FROM apartment_pricing_seasons WHERE apartment_id = ? AND template_id = ?').run(apartmentId, templateId);
  },
};

// ── Сервис новостей ────────────────────────────────────────────────────────────

// Транслитерация RU → lat + kebab-case для slug
export function slugifyNews(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const base = (input || '')
    .toLowerCase()
    .split('')
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'news';
}

export const newsService = {
  // Уникальный slug: если занят — добавляем суффикс -2, -3 …
  ensureUniqueSlug: (desired: string, excludeId?: string): string => {
    let slug = slugifyNews(desired);
    let candidate = slug;
    let n = 2;
    while (true) {
      const row = db.prepare('SELECT id FROM news WHERE slug = ?').get(candidate) as { id: string } | undefined;
      if (!row || (excludeId && row.id === excludeId)) return candidate;
      candidate = `${slug}-${n++}`;
    }
  },

  // Все новости (для админки)
  getAll: (): News[] =>
    db.prepare('SELECT * FROM news ORDER BY sort_order ASC, COALESCE(published_at, created_at) DESC').all() as News[],

  // Только опубликованные (для публичной части)
  getPublished: (): News[] =>
    db.prepare(`
      SELECT * FROM news
      WHERE is_published = 1
      ORDER BY is_featured DESC, sort_order ASC, COALESCE(published_at, created_at) DESC
    `).all() as News[],

  getById: (id: string): News | undefined =>
    db.prepare('SELECT * FROM news WHERE id = ?').get(id) as News | undefined,

  getBySlug: (slug: string): News | undefined =>
    db.prepare('SELECT * FROM news WHERE slug = ?').get(slug) as News | undefined,

  getPublishedBySlug: (slug: string): News | undefined =>
    db.prepare('SELECT * FROM news WHERE slug = ? AND is_published = 1').get(slug) as News | undefined,

  create: (data: {
    title: string;
    slug?: string;
    excerpt?: string | null;
    content?: string | null;
    cover_image?: string | null;
    is_published?: boolean;
    is_featured?: boolean;
    sort_order?: number;
    published_at?: string | null;
  }): News => {
    const id = uuidv4();
    const slug = newsService.ensureUniqueSlug(data.slug || data.title);
    const isPublished = data.is_published ? 1 : 0;
    const publishedAt = data.published_at ?? (isPublished ? new Date().toISOString() : null);
    const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM news').get() as { m: number | null }).m ?? 0;
    db.prepare(`
      INSERT INTO news (id, slug, title, excerpt, content, cover_image, is_published, is_featured, sort_order, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      slug,
      data.title,
      data.excerpt ?? null,
      data.content ?? null,
      data.cover_image ?? null,
      isPublished,
      data.is_featured ? 1 : 0,
      data.sort_order ?? maxOrder + 1,
      publishedAt
    );
    return newsService.getById(id)!;
  },

  update: (id: string, data: Partial<{
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    cover_image: string | null;
    is_published: boolean;
    is_featured: boolean;
    sort_order: number;
    published_at: string | null;
  }>): News | undefined => {
    const existing = newsService.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.slug !== undefined) {
      updates.push('slug = ?');
      values.push(newsService.ensureUniqueSlug(data.slug, id));
    }
    if (data.excerpt !== undefined) { updates.push('excerpt = ?'); values.push(data.excerpt); }
    if (data.content !== undefined) { updates.push('content = ?'); values.push(data.content); }
    if (data.cover_image !== undefined) { updates.push('cover_image = ?'); values.push(data.cover_image); }
    if (data.is_featured !== undefined) { updates.push('is_featured = ?'); values.push(data.is_featured ? 1 : 0); }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }

    if (data.is_published !== undefined) {
      const newPub = data.is_published ? 1 : 0;
      updates.push('is_published = ?'); values.push(newPub);
      // При первой публикации проставляем дату, если ещё не задана
      if (newPub === 1 && !existing.published_at && data.published_at === undefined) {
        updates.push('published_at = ?'); values.push(new Date().toISOString());
      }
    }
    if (data.published_at !== undefined) { updates.push('published_at = ?'); values.push(data.published_at); }

    if (updates.length === 0) return existing;

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.prepare(`UPDATE news SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return newsService.getById(id);
  },

  delete: (id: string): boolean => {
    const existing = db.prepare('SELECT id FROM news WHERE id = ?').get(id);
    if (!existing) return false;
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
    return true;
  },
};

// ── Сервис пунктов страницы «Услуги» ────────────────────────────────────────────
export const SERVICE_CATEGORIES: ServiceCategory[] = ['apartment', 'service', 'infrastructure'];

export const serviceItemsService = {
  // Все пункты (для админки), упорядочены по категории и порядку
  getAll: (): ServiceItem[] =>
    db.prepare(`
      SELECT * FROM service_items
      ORDER BY category ASC, sort_order ASC, created_at ASC
    `).all() as ServiceItem[],

  // Активные пункты одной категории (для публичной страницы)
  getActiveByCategory: (category: ServiceCategory): ServiceItem[] =>
    db.prepare(`
      SELECT * FROM service_items
      WHERE category = ? AND is_active = 1
      ORDER BY sort_order ASC, created_at ASC
    `).all(category) as ServiceItem[],

  // Активные пункты, сгруппированные по категориям (для публичной страницы)
  getActiveGrouped: (): Record<ServiceCategory, ServiceItem[]> => {
    const rows = db.prepare(`
      SELECT * FROM service_items
      WHERE is_active = 1
      ORDER BY sort_order ASC, created_at ASC
    `).all() as ServiceItem[];
    const grouped: Record<ServiceCategory, ServiceItem[]> = {
      apartment: [],
      service: [],
      infrastructure: [],
    };
    for (const row of rows) {
      if (grouped[row.category as ServiceCategory]) {
        grouped[row.category as ServiceCategory].push(row);
      }
    }
    return grouped;
  },

  getById: (id: string): ServiceItem | undefined =>
    db.prepare('SELECT * FROM service_items WHERE id = ?').get(id) as ServiceItem | undefined,

  create: (data: {
    category: ServiceCategory;
    title: string;
    icon?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }): ServiceItem => {
    const id = uuidv4();
    const maxOrder = (
      db.prepare('SELECT MAX(sort_order) as m FROM service_items WHERE category = ?').get(data.category) as { m: number | null }
    ).m ?? 0;
    db.prepare(`
      INSERT INTO service_items (id, category, title, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.category,
      data.title,
      data.icon ?? null,
      data.sort_order ?? maxOrder + 1,
      data.is_active === false ? 0 : 1
    );
    return serviceItemsService.getById(id)!;
  },

  update: (id: string, data: Partial<{
    category: ServiceCategory;
    title: string;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
  }>): ServiceItem | undefined => {
    const existing = serviceItemsService.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length === 0) return existing;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE service_items SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return serviceItemsService.getById(id);
  },

  delete: (id: string): boolean => {
    const existing = db.prepare('SELECT id FROM service_items WHERE id = ?').get(id);
    if (!existing) return false;
    db.prepare('DELETE FROM service_items WHERE id = ?').run(id);
    return true;
  },
};

export { db };