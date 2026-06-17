-- lib/schema.sql
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
    features TEXT,
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Новости и предложения
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

-- Пункты страницы «Услуги» (управляются из админки)
CREATE TABLE IF NOT EXISTS service_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,           -- 'apartment' | 'service' | 'infrastructure'
    title TEXT NOT NULL,
    icon TEXT,                        -- ключ иконки из набора app/services/icons.tsx
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_items_cat_order ON service_items(category, sort_order);