# Life Style Crimea — лаунч сайта апартаментов

Сайт-каталог апартаментов с системой онлайн-бронирования и закрытой админкой. Интеграция с Telegram-ботом для уведомлений о новых бронированиях, синхронизация календарей через iCalendar.

**Домен:** lovelifestyle.ru

## Стек

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Runtime:** Node.js
- **DB:** SQLite 3 (better-sqlite3)
- **TypeScript:** 5 (strict mode)
- **UI:** React 19, Tailwind CSS
- **Анимация:** Framer Motion, Three.js
- **Календарь:** react-big-calendar
- **Уведомления:** Telegram Bot API
- **Синхронизация:** node-cron, node-ical, ical.js

## Требования

- Node.js ≥ 20
- npm или yarn
- SQLite ≥ 3 (встроен в better-sqlite3)

## Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repo-url>
cd life-style-crimea
npm install
```

### 2. Переменные окружения

Скопируй шаблон и заполни значения:

```bash
cp .env.local.example .env.local
```

**Обязательные переменные:**

```env
# Аутентификация админки
ADMIN_SECRET="ваш-секретный-ключ-для-hmac-токенов"

# Telegram-уведомления
TELEGRAM_BOT_TOKEN="123456789:ABCDefGHIjKLmNOpqrSTuVwxyz123456"
TELEGRAM_CHAT_ID="123456789"

# Защита крон-эндпоинтов
CRON_SECRET="ваш-крон-секрет"

# Шифрование Server Actions (Next.js)
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="<автоматически или сгенерируй: openssl enc -aes-256-cbc -md sha256 -S -P -pass pass:secret>"
```

### 3. Инициализация БД и создание админа

```bash
npm run dev
```

Откройся: http://localhost:3000/admin/setup

На странице `/admin/setup` создай первого администратора (email + пароль).

### 4. Залив первых данных

В админке (`/admin`) заполни:
1. **Апартаменты** — добавь объекты, загрузи фото, выбери вид, цену
2. **Сезонные цены** (опционально) — переопредели цены на конкретные периоды
3. **iCalendar-источники** (опционально) — синхронизируй с Airbnb, Booking.com и т.д.
4. **Telegram-настройки** — введи токен бота и ID чата для уведомлений

## Структура проекта

```
life-style-crimea/
├── app/
│   ├── admin/
│   │   ├── setup/page.tsx          # Страница регистрации первого админа
│   │   ├── login/page.tsx          # Вход в админку
│   │   ├── apartments/             # CRUD апартаментов
│   │   ├── bookings/               # Управление бронированиями
│   │   ├── calendar/               # Календарь занятости
│   │   └── settings/               # Настройки (Telegram и т.д.)
│   ├── api/
│   │   ├── admin/                  # Защищённые эндпоинты
│   │   │   ├── setup/              # Регистрация админа
│   │   │   ├── login/              # Авторизация
│   │   │   ├── apartments/         # CRUD + сезоны
│   │   │   └── users/              # Управление юзерами
│   │   ├── bookings/               # Публичный API бронирований
│   │   ├── apartments/             # Публичный каталог
│   │   ├── cron/sync-ics/          # Синхронизация календарей (автоматич.)
│   │   ├── telegram/               # Настройка Telegram-уведомлений
│   │   └── blocked-bookings/       # Проверка занятости
│   ├── page.tsx                    # Главная (публичный сайт)
│   └── layout.tsx                  # Корневой layout
├── lib/
│   ├── db.ts                       # Инициализация и функции БД
│   ├── admin-auth.ts               # Хеширование паролей, HMAC-токены
│   ├── telegram.ts                 # API для Telegram-уведомлений
│   ├── ics-sync.ts                 # Синхронизация iCalendar
│   └── [...]                       # Утилиты
├── public/
│   ├── images/                     # Изображения апартаментов
│   ├── video/                      # Видео фоны
│   └── [...]
├── data.sqlite                     # БД (создаётся автоматически)
├── ecosystem.config.js             # PM2 конфиг для прода
├── next.config.ts                  # Оптимизация изображений, headers
├── tsconfig.json                   # TypeScript strict mode
└── package.json
```

## Команды

```bash
# Запуск dev-сервера (с hot reload)
npm run dev

# Prod-сборка
npm run build

# Запуск prod-сервера
npm start

# Линтинг (ESLint)
npm run lint

# Бэкап БД
npm run db:backup

# Восстановление из бэкапа
npm run db:restore
```

## База данных

### Автоматическая инициализация

При первом запуске (`npm run dev`) функция `ensureDatabaseStructure()` в `lib/db.ts` создаёт таблицы:
- `apartments` — объекты для сдачи
- `bookings` — бронирования с сайта
- `apartment_pricing_seasons` — сезонные цены
- `ics_sources` — источники для синхронизации (Airbnb, Booking и т.д.)
- `external_bookings` — импортированные бронирования
- `admin_users` — пользователи админки
- `telegram_settings` — настройки Telegram-бота
- `notification_logs` — лог уведомлений
- `sync_logs` — лог синхронизаций календарей
- `hero_slides` — слайды на главной

### Файл БД

SQLite файл хранится в корне:
```bash
data.sqlite      # Основная БД
data.sqlite-wal  # Write-Ahead Log (для параллельного доступа)
data.sqlite-shm  # Shared memory
```

Используется WAL mode для параллельного чтения/записи.

## Админка

### Доступ

```
URL: https://lovelifestyle.ru/admin
```

### Функционал

**Апартаменты**
- Создание, редактирование, удаление
- Загрузка галереи (max 20 фото)
- Редактирование цен, описания, удобств
- Сортировка
- Мягкое удаление (`deleted_at`)

**Бронирования**
- Просмотр всех заявок с сайта
- Статусы: `pending`, `confirmed`, `cancelled`
- Фильтр по апартаменту, дате, статусу
- Экспорт в CSV

**Календарь**
- Визуализация занятости на month view
- Блокированные даты из iCalendar-синхронизации
- Внесение блокировок вручную

**Настройки**
- Telegram-уведомления (enable/disable, смена токена)
- Управление администраторами (добавить, удалить)
- Экспорт токенов для внешних систем

## Авторизация

### Админка

Сессия: HMAC-токен с подписью (`lib/admin-auth.ts`).
- Создание: `/admin/setup` → первый админ
- Вход: `/admin/login`
- Токен хранится в cookie `admin_session`
- TTL сессии: 7 дней (по умолчанию)

### API

Защита через `Authorization: Bearer <token>` заголовок или cookie для админ-эндпоинтов.

## Синхронизация календарей (iCalendar)

### Как работает

1. В админке (`/admin/settings`) добавляешь URL iCalendar-календаря (напр., от Airbnb или Booking.com)
2. Крон-задача каждый час вызывает `/api/cron/sync-ics` (защищена `CRON_SECRET`)
3. Парсятся события (check-in/check-out) и записываются в `external_bookings`
4. При проверке доступности апартамента система учитывает оба источника

### Источники

Поддерживаются: Airbnb, Booking.com, Google Calendar (любой стандартный iCalendar URL).

### Крон-задача

```bash
# Настроена в lib/cron.ts на каждый час
0 * * * *  # каждый час в 00 минут
```

При деплое (PM2) крон работает автоматически на prod.

## Telegram-уведомления

### Настройка

1. Создай Telegram-бота через BotFather: /newbot
2. Скопируй API token
3. Узнай ID чата (добавь бота в группу/канал, отправь сообщение, парсни /getUpdates)
4. Введи в админке `/admin/settings` → Telegram

### Что отправляется

При новом бронировании с сайта:
```
🏠 Новое бронирование!

Апартамент: Studio Sea View
Гость: Иван Петров
📱 +7 999 123 45 67
📧 ivan@example.com

📅 Check-in: 2026-05-15
📅 Check-out: 2026-05-20
👥 Гостей: 2
💰 Сумма: 25,000₽

Статус: ⏳ На подтверждении
```

Уведомления логируются в таблице `notification_logs` для отладки.

## 152-ФЗ (защита персданных)

Проект соответствует закону о защите персданных:

- **Cookie-баннер** — информирует о cookie + Яндекс.Метрика
- **/privacy** — Политика обработки персданных
- **Форма бронирования** — чекбокс согласия на обработку данных
- **Безопасность** — HTTPS, Strict-Transport-Security, CSP headers
- **Telegram** — уведомления отправляются только после подтверждения

## Деплой

### Локально

```bash
npm run build
npm start
# Сервер на :3000
```

### На прод (PM2 + Nginx)

1. **Зависимости:**
   ```bash
   npm install -g pm2
   ```

2. **Запуск:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

3. **Nginx (reverse proxy):**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name lovelifestyle.ru;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Переменные:**
   ```bash
   export NODE_ENV=production
   export ADMIN_SECRET="..."
   export TELEGRAM_BOT_TOKEN="..."
   # И остальные...
   ```

5. **Логи:**
   ```bash
   pm2 logs lovelifestyle
   ```

## Отладка

### Логирование БД

В `lib/db.ts` включены логи миграций:
```bash
npm run dev  # Увидишь "🔧 Checking database structure..."
```

### SQLite Browser

Открой `data.sqlite` любым SQLite-браузером (напр., DB Browser for SQLite):
```bash
# macOS
brew install db-browser-for-sqlite
# Ubuntu
sudo apt install sqlitebrowser
```

### Telegram API

Тестирование отправки:
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"<CHAT_ID>","text":"test"}'
```

### Logs PM2

```bash
pm2 logs lovelifestyle --lines 100
pm2 save
```

## Типичные задачи

### Добавить новый апартамент

1. Откройся /admin
2. Апартаменты → Добавить
3. Заполни: название, описание, макс гостей, цену, вид, терраса
4. Загрузи фото (drag-and-drop)
5. Сохрани

### Отключить апартамент от бронирования

Апартамент → Параметры → Деактивировать. На сайте не будет видно в поиске, но история сохранится.

### Импортировать бронирования из Airbnb

1. В Airbnb скопируй URL iCalendar-календаря (Calendar settings → Export)
2. В админке: Настройки → Добавить iCalendar-источник
3. Укажи апартамент, URL, название источника ("Airbnb", "Booking" и т.д.)
4. Сохрани
5. Крон автоматически синхронизирует через час (или кликни "Синхронизировать сейчас")

### Поменять пароль админа

Прямо в админке: Настройки → Админы → выбери юзера → Сменить пароль.

## Контакты и поддержка

- **Разработка:** radinukoleg@gmail.com
- **Сайт:** lovelifestyle.ru
- **GitHub:** [ссылка на репозиторий, если открыт]
