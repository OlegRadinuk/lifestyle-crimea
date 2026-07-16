import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { newsService } from '@/lib/db';
import { safeNewsHtml } from '../sanitize';
import NewsHeaderMode from '../NewsHeaderMode';
import '../news.css';

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ISR: страница новости пере-генерируется раз в час
export const revalidate = 3600;

const SITE = 'https://lovelifestyle.ru';
const FALLBACK_OG = `${SITE}/og-image.jpg`;

// Пре-генерируем все опубликованные новости при сборке
export async function generateStaticParams() {
  try {
    return newsService.getPublished().map((n) => ({ slug: n.slug }));
  } catch {
    return [];
  }
}

/**
 * Абсолютный URL картинки для превью ссылки.
 *
 * WebP отсеиваем осознанно: Telegram, WhatsApp и VK не показывают его в карточке
 * ссылки — превью приходит пустым. Обложки новостей грузятся через админку и
 * почти всегда webp, поэтому для таких отдаём брендовый JPEG. Как только у
 * новости будет jpg/png-обложка — она подхватится сама.
 */
function absUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_OG;
  if (/\.webp($|\?)/i.test(url)) return FALLBACK_OG;
  return url.startsWith('http') ? url : `${SITE}${url}`;
}

function clamp(text: string, max = 155): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = newsService.getPublishedBySlug(slug);

  if (!item) {
    return { title: 'Новость не найдена', robots: { index: false, follow: false } };
  }

  const description = clamp(item.excerpt || (item.content ? item.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : item.title));
  const ogImage = absUrl(item.cover_image);
  const url = `${SITE}/news/${item.slug}`;

  return {
    title: item.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: item.title,
      description,
      url,
      siteName: 'Life Style Crimea',
      locale: 'ru_RU',
      type: 'article',
      publishedTime: item.published_at || undefined,
      modifiedTime: item.updated_at || undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: item.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': 160 },
  };
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Рендер контента. Контент создаёт только авторизованный админ.
// Если в тексте есть HTML-теги — рендерим как HTML, иначе разбиваем на абзацы.
function renderContent(content: string | null) {
  if (!content) return null;
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (looksLikeHtml) {
    // Санитизируем по строгому whitelist перед вставкой (защита от XSS).
    const safe = safeNewsHtml(content);
    return <div className="np-article-text" dangerouslySetInnerHTML={{ __html: safe }} />;
  }
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="np-article-text">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const item = newsService.getPublishedBySlug(slug);

  if (!item) notFound();

  const url = `${SITE}/news/${item.slug}`;
  const ogImage = absUrl(item.cover_image);
  const description = clamp(item.excerpt || item.title, 300);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description,
    image: [ogImage],
    datePublished: item.published_at || item.created_at,
    dateModified: item.updated_at || item.published_at || item.created_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    author: { '@type': 'Organization', name: 'Life Style Crimea', url: SITE },
    publisher: {
      '@type': 'Organization',
      name: 'Life Style Crimea',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/og-image.jpg` },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Новости', item: `${SITE}/news` },
      { '@type': 'ListItem', position: 3, name: item.title, item: url },
    ],
  };

  return (
    <div className="np-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema]) }}
      />

      {/* Фиксирует режим хедера — убирает форму бронирования */}
      <NewsHeaderMode />

      {/* ── ГЕРОЙ СТАТЬИ ── */}
      {item.cover_image ? (
        <header className="np-article-hero">
          <div className="np-article-hero-media">
            <Image
              src={item.cover_image}
              alt={item.title}
              fill
              priority
              sizes="100vw"
            />
          </div>

          {/* Хлебные крошки поверх изображения */}
          <div className="np-article-crumbs-overlay">
            <nav className="np-article-crumbs" aria-label="Хлебные крошки">
              <Link href="/">Главная</Link>
              <span aria-hidden="true">/</span>
              <Link href="/news">Новости</Link>
            </nav>
          </div>

          <div className="np-article-hero-inner">
            <p className="np-article-hero-eyebrow">
              {item.is_featured ? 'Специальное предложение' : 'Новость'}
              {item.published_at && (
                <>&nbsp;·&nbsp;<time dateTime={item.published_at}>{formatDate(item.published_at)}</time></>
              )}
            </p>
            <h1 className="np-article-hero-title">{item.title}</h1>
          </div>
        </header>
      ) : (
        /* Без обложки — компактный хедер со светлым фоном */
        <header className="np-article-header-simple">
          <nav className="np-article-crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span aria-hidden="true">/</span>
            <Link href="/news">Новости</Link>
          </nav>
          <p className="np-article-hero-eyebrow" style={{ marginTop: '24px', color: '#139ab6' }}>
            {item.is_featured ? 'Специальное предложение' : 'Новость'}
          </p>
          <h1 className="np-article-hero-title" style={{ color: '#0d1b22' }}>{item.title}</h1>
          {item.published_at && (
            <time
              dateTime={item.published_at}
              style={{ display: 'block', marginTop: '16px', color: '#139ab6', fontSize: '13px', fontWeight: 500 }}
            >
              {formatDate(item.published_at)}
            </time>
          )}
        </header>
      )}

      {/* ── EDITORIAL КОНТЕНТ ── */}
      <article className="np-article-body">
        {item.excerpt && item.cover_image && (
          <p className="np-article-lead">{item.excerpt}</p>
        )}

        {renderContent(item.content)}

        <footer className="np-article-footer">
          <Link href="/news" className="np-article-back">
            <span>←</span> Все новости
          </Link>
          <Link
            href="/apartments"
            className="np-btn-primary"
            style={{ fontSize: '14px', padding: '12px 26px' }}
          >
            Смотреть апартаменты
          </Link>
        </footer>
      </article>
    </div>
  );
}
