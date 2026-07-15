import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import ServicesHeaderMode from './ServicesHeaderMode';
import ServicesReveal from './ServicesReveal';
import ServicesAquaGallery, { type AquaPhoto } from './ServicesAquaGallery';
import {
  IconPhone,
  IconArrowRight,
  IconArrowDown,
  IconPool,
  IconPoolKids,
  IconJacuzzi,
  IconSunbed,
  IconBar,
  IconSeaMountains,
  IconInfo,
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
  const title = 'Аквазона и услуги — апартаменты с бассейном в Алуште';
  const description =
    'Аквазона апарт-отеля «Стиль Жизни» в Алуште: два больших бассейна круглый год, два детских, джакузи, шезлонги и бар у воды — с видом на море и горы. Плюс завтраки, уборка, трансфер и экскурсии для гостей.';

  return {
    title,
    description,
    keywords:
      'апартаменты с бассейном алушта, отдых с детьми алушта, бассейн алушта круглый год, детский бассейн алушта, аквазона алушта, услуги апартаментов алушта, трансфер алушта',
    alternates: {
      canonical: 'https://lovelifestyle.ru/services',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      url: 'https://lovelifestyle.ru/services',
      siteName: 'Стиль Жизни',
      images: [
        {
          url: 'https://lovelifestyle.ru/images/aqua/pool-loungers.webp',
          width: 1448,
          height: 1086,
          alt: 'Аквазона апарт-отеля «Стиль Жизни» в Алуште — бассейн с шезлонгами',
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

/* Кадры аквазоны от заказчицы (июль 2026). Лежат в git, как и /images/menu/. */
const AQUA_PHOTOS: AquaPhoto[] = [
  {
    src: '/images/aqua/pool-loungers.webp',
    alt: 'Бассейн аквазоны с шезлонгами, зонтами и баром-островом — апарт-отель «Стиль Жизни», Алушта',
    caption: 'Шезлонги и бар у воды',
  },
  {
    src: '/images/aqua/pool-main.webp',
    alt: 'Большой бассейн аквазоны апарт-отеля «Стиль Жизни» в Алуште',
    caption: 'Большой бассейн',
    desktopOnly: true,
  },
  {
    src: '/images/aqua/sea-mountains.webp',
    alt: 'Вид на море и горы одновременно от бассейнов комплекса в Алуште',
    caption: 'Море и горы разом',
  },
];

/* Факты аквазоны — со слов заказчицы. */
const AQUA_FACTS: { Icon: (p: { className?: string }) => React.ReactElement; text: string }[] = [
  { Icon: IconPool, text: 'Два больших бассейна — круглый год' },
  { Icon: IconPoolKids, text: 'Два детских бассейна' },
  { Icon: IconJacuzzi, text: 'Джакузи' },
  { Icon: IconSunbed, text: 'Шезлонги вдоль бассейнов' },
  { Icon: IconBar, text: 'Бар прямо в аквазоне' },
  { Icon: IconSeaMountains, text: 'Вид на море и горы одновременно' },
];

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
          { '@type': 'ListItem', position: 2, name: 'Аквазона и услуги', item: 'https://lovelifestyle.ru/services' },
        ],
      },
      /* FAQ — ровно те вопросы, которые гости задают про бассейн и детей.
         Даёт расширенный сниппет и ловит запросы «есть ли бассейн», «с детьми». */
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Есть ли бассейн в апартаментах в Алуште?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Да. В аквазоне комплекса два больших бассейна, которые работают круглый год, и два детских. Рядом джакузи, шезлонги вдоль воды и бар. Посещение доступно в некоторых категориях апартаментов — уточните у администратора.',
            },
          },
          {
            '@type': 'Question',
            name: 'Работает ли бассейн зимой и не в сезон?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Да, два больших бассейна открыты круглый год, а не только в летний сезон.',
            },
          },
          {
            '@type': 'Question',
            name: 'Подходит ли комплекс для отдыха с детьми?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Да. В аквазоне два отдельных детских бассейна с мелкой водой, а шезлонги стоят рядом — дети плещутся у себя, взрослые отдыхают в нескольких шагах и всё время их видят.',
            },
          },
          {
            '@type': 'Question',
            name: 'Всем ли гостям доступна аквазона?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Посещение аквазоны доступно в некоторых категориях апартаментов. Уточните у администратора при бронировании по телефону 8 800 777 63 08 — подскажем, какие апартаменты подойдут.',
            },
          },
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
          {/* «Что включено» — не ссылка в никуда, а подсказка листать: сам
              список ниже на этой же странице. Стрелка ведёт к нему. */}
          <a href="#amenities" className="sv-hero-scroll">
            <span className="sv-hero-scroll-label">Что включено</span>
            <IconArrowDown className="sv-hero-scroll-icon" />
          </a>
        </div>
      </header>

      {/* ===== АКВАЗОНА — главный аргумент, поэтому сразу после героя ===== */}
      <section id="aqua" className="sv-aqua">
        <div className="sv-aqua-inner">
          <p className="sv-aqua-eyebrow sv-reveal">Аквазона</p>
          <h2 className="sv-aqua-title sv-reveal sv-reveal-delay-1">
            Два больших бассейна — и они работают <strong>круглый год</strong>
          </h2>
          <p className="sv-aqua-lead sv-reveal sv-reveal-delay-1">
            Не один бассейн на весь комплекс, а два — плюс два детских рядом, на расстоянии
            взгляда. Джакузи, шезлонги вдоль воды и бар, до которого не нужно переодеваться.
            А вокруг — море и горы одновременно.
          </p>

          <ServicesAquaGallery photos={AQUA_PHOTOS} />

          <ul className="sv-aqua-facts sv-reveal">
            {AQUA_FACTS.map((fact) => (
              <li className="sv-aqua-fact" key={fact.text}>
                <fact.Icon className="sv-aqua-fact-icon" />
                <span>{fact.text}</span>
              </li>
            ))}
          </ul>

          {/* Доступ зависит от категории апартаментов — говорим прямо, чтобы
              гость не приехал с неверным ожиданием, и уводим на звонок. */}
          <div className="sv-aqua-note sv-reveal">
            <IconInfo className="sv-aqua-note-icon" />
            <div className="sv-aqua-note-body">
              <p className="sv-aqua-note-title">Посещение аквазоны доступно в некоторых категориях апартаментов</p>
              <p className="sv-aqua-note-text">
                Уточните у администратора — подскажем, какие апартаменты подойдут именно вам.
              </p>
              <div className="sv-aqua-note-actions">
                <a href={PHONE_FREE_TEL} className="sv-btn-primary">
                  <IconPhone />
                  {PHONE_FREE}
                </a>
                <Link href="/apartments" className="sv-btn-secondary">
                  Апартаменты
                  <IconArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

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
