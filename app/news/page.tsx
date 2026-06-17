import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { newsService, type News } from '@/lib/db';
import NewsHeaderMode from './NewsHeaderMode';
import NewsReveal from './NewsReveal';
import './news.css';

// ISR: список новостей пере-генерируется раз в час
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Новости и предложения',
  description:
    'Свежие новости, акции и специальные предложения апарт-отеля «Стиль Жизни» в Алуште. Следите за выгодными ценами на видовые апартаменты у моря.',
  alternates: { canonical: 'https://lovelifestyle.ru/news' },
  openGraph: {
    title: 'Новости и предложения | Life Style Crimea',
    description:
      'Свежие новости, акции и специальные предложения апарт-отеля «Стиль Жизни» в Алуште.',
    url: 'https://lovelifestyle.ru/news',
    siteName: 'Life Style Crimea',
    locale: 'ru_RU',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Новости Life Style Crimea' }],
  },
  robots: { index: true, follow: true },
};

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Кинематографичная карточка featured-блока */
function FeaturedCard({ item, delay, animate }: { item: News; delay?: number; animate?: boolean }) {
  const delayClass = delay === 1 ? 'np-reveal-delay-1' : delay === 2 ? 'np-reveal-delay-2' : delay === 3 ? 'np-reveal-delay-3' : '';
  return (
    <Link href={`/news/${item.slug}`} className={`np-card${animate ? ` np-reveal ${delayClass}` : ''}`}>
      {item.cover_image ? (
        <Image
          src={item.cover_image}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
          className="np-card-img"
        />
      ) : (
        <div className="np-card-placeholder">
          <span>Life Style</span>
        </div>
      )}
      <div className="np-card-overlay" />
      <div className="np-card-body">
        <span className="np-card-eyebrow">
          {item.is_featured ? 'Специальное предложение' : 'Новость'}
        </span>
        <h3 className="np-card-title">{item.title}</h3>
        {item.excerpt && <p className="np-card-excerpt">{item.excerpt}</p>}
        <div className="np-card-footer">
          {item.published_at && (
            <time className="np-card-date" dateTime={item.published_at}>
              {formatDate(item.published_at)}
            </time>
          )}
          <span className="np-card-read">Читать →</span>
        </div>
      </div>
    </Link>
  );
}

/** Строка editorial-ленты */
function ListItem({ item }: { item: News }) {
  return (
    <Link href={`/news/${item.slug}`} className="np-list-item np-reveal">
      <div className="np-list-thumb">
        {item.cover_image ? (
          <Image
            src={item.cover_image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 90px, 160px"
            className="np-list-img"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #c8eef7, #a8ddef)',
            }}
          />
        )}
      </div>
      <div className="np-list-body">
        {item.published_at && (
          <time className="np-list-date" dateTime={item.published_at}>
            {formatDate(item.published_at)}
          </time>
        )}
        <h3 className="np-list-title">{item.title}</h3>
        {item.excerpt && <p className="np-list-excerpt">{item.excerpt}</p>}
      </div>
      <span className="np-list-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

export default function NewsPage() {
  let all: News[] = [];
  try {
    all = newsService.getPublished();
  } catch {
    all = [];
  }

  // Для hero берём первую featured-новость или первую вообще
  const heroItem = all.find((n) => n.is_featured) ?? all[0] ?? null;

  // Остальные новости (без геройской, чтобы не дублировать её в карточках/ленте)
  const others = heroItem ? all.filter((n) => n.id !== heroItem.id) : all;
  // Первые 3 из остальных — кинематографичные карточки с фото-фоном
  const top = others.slice(0, 3);
  const rest = others.slice(3);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Новости и предложения | Life Style Crimea',
    url: 'https://lovelifestyle.ru/news',
    description:
      'Новости, акции и специальные предложения апарт-отеля «Стиль Жизни» в Алуште.',
    isPartOf: { '@type': 'WebSite', name: 'Life Style Crimea', url: 'https://lovelifestyle.ru' },
  };

  return (
    <div className="np-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Фиксирует режим хедера: 'dark', без формы бронирования */}
      <NewsHeaderMode />
      {/* Reveal-анимации при скролле */}
      <NewsReveal />

      {/* ── ГЕРОЙ FULL-BLEED ─────────────────────────────────── */}
      <header className="np-hero">
        <div className="np-hero-media">
          <Image
            src={
              heroItem?.cover_image && heroItem.cover_image.startsWith('/')
                ? heroItem.cover_image
                : '/images/menu/news.webp'
            }
            alt="Новости и предложения Life Style Crimea"
            fill
            priority
            sizes="100vw"
          />
        </div>

        <div className="np-hero-inner">
          <p className="np-hero-eyebrow">Life Style Crimea · Алушта</p>
          <h1 className="np-hero-title">
            {heroItem ? heroItem.title : 'Новости и предложения'}
          </h1>
          <p className="np-hero-subtitle">
            {heroItem?.excerpt ??
              'Лето у моря, выгодные цены и события апарт-отеля. Здесь мы делимся самым важным и тёплым.'}
          </p>

          {heroItem && (
            <div className="np-hero-meta">
              {heroItem.published_at && (
                <span className="np-hero-chip">
                  {formatDate(heroItem.published_at)}
                </span>
              )}
              {heroItem.is_featured ? (
                <span className="np-hero-chip">Специальное предложение</span>
              ) : (
                <span className="np-hero-chip">Новость</span>
              )}
            </div>
          )}

          <div className="np-hero-actions">
            {heroItem ? (
              <>
                <Link href={`/news/${heroItem.slug}`} className="np-btn-primary">
                  Читать статью
                </Link>
                <Link href="/apartments" className="np-btn-secondary">
                  Смотреть апартаменты
                </Link>
              </>
            ) : (
              <Link href="/apartments" className="np-btn-primary">
                Смотреть апартаменты
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── ОСНОВНОЙ КОНТЕНТ ─────────────────────────────────── */}
      <main className="np-content">
        {all.length === 0 ? (
          /* Достойное пустое состояние */
          <div className="np-empty">
            <p className="np-empty-eyebrow">Скоро здесь</p>
            <h2 className="np-empty-title">
              Новости и спецпредложения появятся совсем скоро
            </h2>
            <p className="np-empty-text">
              Мы готовим для вас интересный контент: акции на проживание, события у моря и
              полезные советы для отдыха в Алуште.
            </p>
            <Link href="/apartments" className="np-empty-cta">
              Смотреть апартаменты
            </Link>
          </div>
        ) : (
          <>
            {/* 3 кинематографичные карточки */}
            {top.length > 0 && (
              <section className="np-featured" aria-label="Свежие материалы">
                <p className="np-featured-label">Свежие материалы</p>
                <div className="np-featured-grid">
                  {top.map((item, i) => (
                    <FeaturedCard key={item.id} item={item} delay={i + 1} animate />
                  ))}
                </div>
              </section>
            )}

            {/* Editorial-лента остальных */}
            {rest.length > 0 && (
              <section className="np-rest" aria-label="Все новости">
                <p className="np-rest-label">Все материалы</p>
                <nav className="np-list">
                  {rest.map((item) => (
                    <ListItem key={item.id} item={item} />
                  ))}
                </nav>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
