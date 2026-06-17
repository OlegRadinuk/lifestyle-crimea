// Локальный демо-контент новостей (для показа). На прод эти записи можно
// применить через админку или этим же скриптом. Тексты guest-safe, без
// сомнительных формулировок про скидки/«осень по цене лета».
import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const db = new Database(path.join(process.cwd(), 'data.sqlite'));

// убрать прежние тестовые рыбные записи
const del = db.prepare("DELETE FROM news WHERE slug LIKE 'test-%'").run();
console.log('Удалено тестовых:', del.changes);

const now = new Date().toISOString();

const items = [
  {
    slug: 'leto-u-morya-2026',
    title: 'Лето у моря в апарт-отеле «Стиль Жизни»',
    excerpt:
      'Видовые апартаменты в Профессорском уголке Алушты ждут гостей. Бронируйте напрямую — без комиссий сервисов.',
    content:
      '<p>Сезон у моря в самом разгаре. Апартаменты «Стиль Жизни» расположены в одном из самых живописных мест Алушты — Профессорском уголке, в нескольких минутах от пляжа.</p>' +
      '<p>Панорамные окна с видом на Чёрное море, дизайнерские интерьеры, кухонная зона, кондиционер и всё необходимое для комфортного отдыха. К вашим услугам — кофейня, бассейн, зоны отдыха и подземный паркинг.</p>' +
      '<p>Забронировать апартаменты можно напрямую — это лучшая цена без комиссий сторонних сервисов. Звоните нашим менеджерам: 8 800 777 63 08 (бесплатно).</p>',
    cover_image: '/images/menu/home.webp',
    is_featured: 1,
    published_at: '2026-06-12',
  },
  {
    slug: 'kofeynya-endorfin',
    title: 'Завтраки и кофе в кофейне «Эндорфин»',
    excerpt:
      'Свежесваренный кофе, домашние завтраки и тёплая атмосфера — в двух шагах от ваших апартаментов.',
    content:
      '<p>На территории комплекса работает уютная кофейня «Эндорфин» — место для душевных встреч и спокойного утра у моря.</p>' +
      '<p>Здесь готовят вкусные завтраки и ароматный кофе, а атмосфера располагает к неспешному отдыху. Загляните за чашкой кофе перед прогулкой к морю.</p>',
    cover_image: '/images/menu/services.webp',
    is_featured: 1,
    published_at: '2026-06-08',
  },
  {
    slug: 'servisy-dlya-otdyha',
    title: 'Сервисы для вашего отдыха',
    excerpt:
      'Трансфер, уборка, прачечная и экскурсии по Крыму — мы позаботились обо всех деталях.',
    content:
      '<p>Чтобы ваш отдых был безупречным, мы предлагаем полный набор сервисов: трансфер и такси, уборку и химчистку, глажку и прачечную.</p>' +
      '<p>А для тех, кто хочет открыть Крым с новой стороны, — авторские экскурсии как настоящие приключения. Подробности уточняйте у менеджеров.</p>',
    cover_image: '/images/menu/apartments.webp',
    is_featured: 1,
    published_at: '2026-06-03',
  },
  {
    slug: 'panoramnye-apartamenty-more',
    title: 'Апартаменты с панорамным видом на море',
    excerpt:
      'Высокие этажи, французские балконы и море прямо перед вами — выбирайте свой вид.',
    content:
      '<p>В нашей коллекции — апартаменты с панорамными окнами и балконами, откуда открывается прямой вид на Чёрное море.</p>' +
      '<p>Высокие этажи дарят ощущение, что море — прямо под балконом. Выберите апартамент по душе в каталоге и забронируйте лучшие даты.</p>',
    cover_image: '/images/menu/tour.webp',
    is_featured: 0,
    published_at: '2026-05-28',
  },
];

const insert = db.prepare(`
  INSERT INTO news (id, slug, title, excerpt, content, cover_image, is_published, is_featured, sort_order, published_at, created_at, updated_at)
  VALUES (@id, @slug, @title, @excerpt, @content, @cover_image, 1, @is_featured, @sort_order, @published_at, @created_at, @updated_at)
  ON CONFLICT(slug) DO UPDATE SET
    title=excluded.title, excerpt=excluded.excerpt, content=excluded.content,
    cover_image=excluded.cover_image, is_featured=excluded.is_featured,
    published_at=excluded.published_at, updated_at=excluded.updated_at
`);

items.forEach((it, i) => {
  insert.run({
    id: randomUUID(),
    ...it,
    sort_order: i,
    created_at: now,
    updated_at: now,
  });
});

const total = db.prepare('SELECT COUNT(*) c FROM news').get().c;
console.log('Демо-новостей в БД:', total);
for (const r of db.prepare('SELECT slug, is_featured, published_at FROM news ORDER BY published_at DESC').all()) {
  console.log(' -', r.slug, '| featured:', r.is_featured, '|', r.published_at);
}
