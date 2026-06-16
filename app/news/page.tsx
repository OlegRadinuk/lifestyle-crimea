import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { newsService, type News } from '@/lib/db';
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

function NewsCard({ item, featured = false }: { item: News; featured?: boolean }) {
  return (
    <Link href={`/news/${item.slug}`} className={`news-card${featured ? ' news-card--featured' : ''}`}>
      <div className="news-card__media">
        {item.cover_image ? (
          <Image
            src={item.cover_image}
            alt={item.title}
            fill
            sizes={featured ? '(max-width: 768px) 100vw, 33vw' : '(max-width: 768px) 100vw, 50vw'}
            className="news-card__img"
          />
        ) : (
          <div className="news-card__placeholder" aria-hidden="true">
            <span>Life Style</span>
          </div>
        )}
      </div>
      <div className="news-card__body">
        {item.published_at && <time className="news-card__date">{formatDate(item.published_at)}</time>}
        <h3 className="news-card__title">{item.title}</h3>
        {item.excerpt && <p className="news-card__excerpt">{item.excerpt}</p>}
        <span className="news-card__more">Читать далее</span>
      </div>
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

  // Первые 3 — верхние «окошки». Featured-флаг уже поднимает их вверх в сортировке.
  const top = all.slice(0, 3);
  const rest = all.slice(3);

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
    <div className="news-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <header className="news-hero">
        <div className="news-hero__inner">
          <p className="news-hero__eyebrow">Апарт-отель «Стиль Жизни» · Алушта</p>
          <h1 className="news-hero__title">Новости и предложения</h1>
          <p className="news-hero__subtitle">
            Лето у моря, выгодные цены и события апарт-отеля. Здесь мы делимся самым тёплым и важным.
          </p>
        </div>
      </header>

      <main className="news-content">
        {all.length === 0 ? (
          <div className="news-empty">
            <h2>Пока новостей нет</h2>
            <p>Мы готовим для вас свежие предложения. Загляните чуть позже.</p>
            <Link href="/apartments" className="news-empty__cta">Смотреть апартаменты</Link>
          </div>
        ) : (
          <>
            {top.length > 0 && (
              <section className="news-featured" aria-label="Свежие новости">
                <div className="news-featured__grid">
                  {top.map((item) => (
                    <NewsCard key={item.id} item={item} featured />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="news-rest" aria-label="Все новости">
                <h2 className="news-rest__heading">Все новости</h2>
                <div className="news-rest__list">
                  {rest.map((item) => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
