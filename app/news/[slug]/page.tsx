import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { newsService } from '@/lib/db';
import { safeNewsHtml } from '../sanitize';
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

function absUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_OG;
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
    return <div className="news-article__body" dangerouslySetInnerHTML={{ __html: safe }} />;
  }
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="news-article__body">
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
    <div className="news-page news-page--article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema]) }}
      />

      <article className="news-article">
        <nav className="news-article__crumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/news">Новости</Link>
        </nav>

        <header className="news-article__header">
          {item.published_at && (
            <time className="news-article__date" dateTime={item.published_at}>
              {formatDate(item.published_at)}
            </time>
          )}
          <h1 className="news-article__title">{item.title}</h1>
          {item.excerpt && <p className="news-article__lead">{item.excerpt}</p>}
        </header>

        {item.cover_image && (
          <div className="news-article__cover">
            <Image
              src={item.cover_image}
              alt={item.title}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="news-article__cover-img"
            />
          </div>
        )}

        {renderContent(item.content)}

        <footer className="news-article__footer">
          <Link href="/news" className="news-article__back">← Все новости</Link>
          <Link href="/apartments" className="news-article__cta">Посмотреть апартаменты</Link>
        </footer>
      </article>
    </div>
  );
}
