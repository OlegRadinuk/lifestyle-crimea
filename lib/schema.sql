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