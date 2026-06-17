import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import ServicesHeaderMode from './ServicesHeaderMode';
import ServicesReveal from './ServicesReveal';
import {
  IconPhone,
  IconArrowRight,
  resolveServiceIcon,
} from './icons';
import { serviceItemsService, type ServiceCategory } from '@/lib/db';
import './services.css';

const PHONE_FREE = '8 800 777 63 08';
const PHONE_FREE_TEL = 'tel:88007776308';
const PHONE_MAIN_TEL = 'tel:+79785036363';
const PHONE_MAIN_DISPLAY = '+7 978 503 63 63';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const title = 'Услуги — апартаменты LS у моря в Алуште';
  const description =
    'Услуги для гостей апартаментов LS: завтраки и полный пансион, уборка и химчистка, трансфер и такси, экскурсии. Инфраструктура комплекса — бассейн, пляж рядом, кофейня, магазины, паркинг.';

  return {
    title,
    description,
    keywords:
      'услуги апартаментов алушта, апартаменты с завтраком алушта, инфраструктура комплекса life style crimea, трансфер алушта, уборка апартаментов',
    alternates: {
      canonical: 'https://lovelifestyle.ru/services',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      url: 'https://lovelifestyle.ru/services',
      images: [
        {
          url: '/images/menu/services.jpg',
          width: 1200,
          height: 630,
          alt: 'Услуги — Life Style Crimea',
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': 150,
      'max-image-preview': 'large',
    },
  };
}

// Метаданные категорий: заголовок колонки + порядковый эйбрау.
const CATEGORY_META: { key: ServiceCategory; title: string; eyebrow: string }[] = [
  { key: 'apartment', title: 'В апартаментах', eyebrow: '01' },
  { key: 'service', title: 'Услуги', eyebrow: '02' },
  { key: 'infrastructure', title: 'Инфраструктура', eyebrow: '03' },
];

export default function ServicesPage() {
  // Данные из БД (управляются через админку). Категория без активных пунктов
  // не показывается; эйбрау пересчитывается по фактически видимым колонкам.
  const grouped = serviceItemsService.getActiveGrouped();
  const visibleColumns = CATEGORY_META
    .map((meta) => ({ ...meta, items: grouped[meta.key] ?? [] }))
    .filter((col) => col.items.length > 0)
    .map((col, i) => ({ ...col, eyebrow: String(i + 1).padStart(2, '0') }));

  const allItems = CATEGORY_META.flatMap((meta) => grouped[meta.key] ?? []);
  const hasItems = allItems.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        serviceType: 'Сервис для гостей апарт-отеля',
        provider: {
          '@type': 'LodgingBusiness',
          name: 'Life Style Crimea',
          url: 'https://lovelifestyle.ru',
          telephone: PHONE_FREE_TEL.replace('tel:', ''),
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Западная ул., 4, корп. 3',
            addressLocality: 'Алушта',
            addressRegion: 'Республика Крым',
            addressCountry: 'RU',
          },
          amenityFeature: allItems.map((item) => ({
            '@type': 'LocationFeatureSpecification',
            name: item.title,
            value: true,
          })),
        },
        url: 'https://lovelifestyle.ru/services',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://lovelifestyle.ru' },
          { '@type': 'ListItem', position: 2, name: 'Услуги', item: 'https://lovelifestyle.ru/services' },
        ],
      },
    ],
  };

  return (
    <main className="sv-page">
      <ServicesHeaderMode />
      <ServicesReveal />
      <JsonLd data={jsonLd} />

      {/* ===== HERO FULL-BLEED ===== */}
      <header className="sv-hero">
        <div className="sv-hero-media">
          <Image
            src="/images/menu/services.webp"
            alt="Апартаменты LS у моря в Алуште"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="sv-hero-inner">
          <p className="sv-hero-eyebrow">УСЛУГИ И СЕРВИС</p>
          <h1 className="sv-hero-title">
            Апартаменты LS — ваш уголок у моря, где <strong>стиль жизни</strong> встречается с поэзией
          </h1>
          <p className="sv-hero-subtitle">
            Здесь вы найдёте не просто апартаменты, а целый образ жизни: утончённый сервис, услуги
            для идеального отдыха и все условия, чтобы почувствовать себя на своём месте.
          </p>
          <div className="sv-hero-meta">
            <span className="sv-hero-chip">В апартаментах</span>
            <span className="sv-hero-chip">Услуги</span>
            <span className="sv-hero-chip">Инфраструктура</span>
          </div>
          <div className="sv-hero-actions">
            <a href="#amenities" className="sv-btn-primary">
              Что включено
              <IconArrowRight />
            </a>
            <a href={PHONE_FREE_TEL} className="sv-btn-secondary">
              <IconPhone />
              {PHONE_FREE}
            </a>
          </div>
        </div>
      </header>

      {/* ===== БЛОКИ УСЛУГ (из БД) ===== */}
      {hasItems && (
        <section id="amenities" className="sv-section">
          <p className="sv-eyebrow sv-reveal">Что вас окружает</p>
          <h2 className="sv-section-title sv-reveal sv-reveal-delay-1">
            Всё для отдыха — в апартаментах, в сервисе и вокруг
          </h2>

          {/* data-cols управляет числом колонок грида, чтобы 1-2 колонки
              смотрелись ровно, без растянутых дыр. */}
          <div className="sv-columns" data-cols={visibleColumns.length}>
            {visibleColumns.map((col, i) => {
              const delayClass = i === 0 ? '' : i === 1 ? 'sv-reveal-delay-1' : 'sv-reveal-delay-2';
              return (
                <div className={`sv-column-card sv-reveal ${delayClass}`} key={col.key}>
                  <p className="sv-column-eyebrow">{col.eyebrow}</p>
                  <h3 className="sv-column-title">{col.title}</h3>
                  <div className="sv-column-divider" />
                  <ul className="sv-item-list">
                    {col.items.map((item) => {
                      const Icon = resolveServiceIcon(item.icon);
                      return (
                        <li className="sv-item" key={item.id}>
                          <Icon className="sv-item-icon" />
                          <span className="sv-item-text">{item.title}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== ФИНАЛЬНЫЙ CTA ===== */}
      <section className="sv-final-cta">
        <div className="sv-final-cta-card sv-reveal">
          <p className="sv-final-eyebrow">Узнать больше</p>
          <h2>Желаете узнать больше о комплексе?</h2>
          <p>
            Расскажем о концепции комплекса, линейках апартаментов и инвестиционных возможностях.
          </p>
          <div className="sv-final-cta-actions">
            <Link href="/concept" className="sv-btn-cta-primary">
              Уникальный концепт
              <IconArrowRight />
            </Link>
            <a href={PHONE_FREE_TEL} className="sv-btn-cta-secondary">
              <IconPhone />
              {PHONE_FREE}
            </a>
            <a href={PHONE_MAIN_TEL} className="sv-btn-cta-secondary">
              <IconPhone />
              {PHONE_MAIN_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
