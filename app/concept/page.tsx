import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import ConceptHeaderMode from './ConceptHeaderMode';
import ConceptReveal from './ConceptReveal';
import {
  IconBlueprint,
  IconHotel,
  IconGrowth,
  IconManage,
  IconPhone,
  IconArrowDown,
  IconPin,
} from './icons';
import './concept.css';

const PHONE_FREE = '8 800 777 63 08';
const PHONE_FREE_TEL = 'tel:88007776308';
const PHONE_MAIN_TEL = 'tel:+79785036363';
const PHONE_MAIN_DISPLAY = '+7 978 503 63 63';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const title = 'Уникальный концепт — инвестиции в недвижимость на ЮБК';
  const description =
    'Готовые инвестиционные проекты в гостиничной сфере на Южном Берегу Крыма: концепция, дизайн, ремонт под ключ и профессиональное управление недвижимостью с ежегодным доходом для инвестора.';

  return {
    title,
    description,
    keywords:
      'инвестиции в недвижимость крым, готовые инвестиционные проекты, управление недвижимостью алушта, апарт-отель инвестиции, мини-отель крым, доходная недвижимость ялта судак',
    alternates: {
      canonical: 'https://lovelifestyle.ru/concept',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      url: 'https://lovelifestyle.ru/concept',
      images: [
        {
          url: '/images/menu/concept.jpg',
          width: 1200,
          height: 630,
          alt: 'Уникальный концепт — Life Style Crimea',
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

const theses = [
  {
    icon: IconBlueprint,
    title: 'Готовые проекты',
    text: 'Не просто дизайн, а полноценный инвестиционный продукт — объект запускается под ключ.',
  },
  {
    icon: IconHotel,
    title: 'Гостиничная индустрия',
    text: 'Востребованность и стабильный спрос — люди путешествуют круглый год.',
  },
  {
    icon: IconGrowth,
    title: 'Ежегодный доход',
    text: 'Фиксируем выгоду для инвестора за счёт грамотного ценообразования и загрузки.',
  },
  {
    icon: IconManage,
    title: 'Управление недвижимостью',
    text: 'Сопровождаем проект после запуска — от бронирований до отчётности.',
  },
];

interface LineItem {
  name: string;
  cta: string;
}

const lines: LineItem[] = [
  {
    name: 'LS-ART',
    cta: 'Готовы превратить идею в прибыльный объект? Обсудите с нами ваш проект и узнайте о наших кейсах — сделаем следующий шаг вместе.',
  },
  {
    name: 'LS-ART+',
    cta: 'Готовы превратить идею в прибыльный объект? Обсудите с нами ваш проект и узнайте о наших кейсах — сделаем следующий шаг вместе.',
  },
  {
    name: 'LS-LUX',
    cta: 'Готовы действовать? Свяжитесь с нами сейчас — и ваш проект уже на старте!',
  },
  {
    name: 'LS-LUX+',
    cta: 'Готовы действовать? Свяжитесь с нами сейчас — и ваш проект уже на старте!',
  },
  {
    name: 'LS-NEO',
    cta: 'Есть идеи? Давайте вместе превратим её в успешный проект — просто позвоните нам!',
  },
  {
    name: 'LS-NEO+',
    cta: 'Готовы действовать? Свяжитесь с нами сейчас — и ваш проект уже на старте!',
  },
  {
    name: 'LS-EXCLUSIVE',
    cta: 'Готовы действовать? Свяжитесь с нами сейчас — и ваш проект уже на старте!',
  },
];

const formats = ['Апартаменты', 'Квартиры', 'Дома', 'Мини-отели', 'Виллы', 'Курортные объекты'];
const cities = ['Алушта', 'Ялта', 'Судак'];

export default function ConceptPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        serviceType: 'Управление инвестиционной недвижимостью',
        provider: {
          '@type': 'Organization',
          name: 'Life Style Crimea',
          url: 'https://lovelifestyle.ru',
          telephone: PHONE_FREE_TEL.replace('tel:', ''),
        },
        areaServed: cities.map((city) => ({ '@type': 'City', name: city })),
        description:
          'Готовые инвестиционные проекты в гостиничной сфере: концепция, дизайн, ремонт под ключ и профессиональное управление недвижимостью.',
        url: 'https://lovelifestyle.ru/concept',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://lovelifestyle.ru' },
          { '@type': 'ListItem', position: 2, name: 'Уникальный концепт', item: 'https://lovelifestyle.ru/concept' },
        ],
      },
    ],
  };

  return (
    <main className="cp-page">
      <ConceptHeaderMode />
      <ConceptReveal />
      <JsonLd data={jsonLd} />

      {/* ===== HERO FULL-BLEED ===== */}
      <header className="cp-hero">
        <div className="cp-hero-media">
          <Image
            src="/images/menu/concept.webp"
            alt="Видовые апартаменты на Южном Берегу Крыма"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="cp-hero-inner">
          <p className="cp-hero-eyebrow">ИНВЕСТИЦИИ · ЮБК</p>
          <h1 className="cp-hero-title">
            Инвестируйте в <strong>недвижимость</strong> на Южном Берегу Крыма
          </h1>
          <p className="cp-hero-subtitle">
            Мы предлагаем готовые инвестиционные проекты в гостиничной сфере, превращая обычную
            недвижимость в высокодоходный актив. Полный цикл — концепция, дизайн, ремонт под ключ
            и профессиональное управление.
          </p>
          <div className="cp-hero-meta">
            <span className="cp-hero-chip">Готовые проекты</span>
            <span className="cp-hero-chip">Управление недвижимостью</span>
            <span className="cp-hero-chip">Алушта · Ялта · Судак</span>
          </div>
          <div className="cp-hero-actions">
            <a href="#ready-projects" className="cp-btn-primary">
              Готовые проекты
              <IconArrowDown />
            </a>
            <a href="#management" className="cp-btn-secondary">
              Управление недвижимостью
              <IconArrowDown />
            </a>
          </div>
        </div>
      </header>

      {/* ===== 4 ТЕЗИСА ===== */}
      <section className="cp-section">
        <p className="cp-eyebrow cp-reveal">Почему это работает</p>
        <h2 className="cp-section-title cp-reveal cp-reveal-delay-1">Четыре опоры нашего подхода к инвестициям</h2>
        <div className="cp-thesis-grid">
          {theses.map((item, i) => {
            const Icon = item.icon;
            const delayClass = i === 0 ? '' : i === 1 ? 'cp-reveal-delay-1' : i === 2 ? 'cp-reveal-delay-2' : 'cp-reveal-delay-3';
            return (
              <div className={`cp-thesis-card cp-reveal ${delayClass}`} key={item.title}>
                <Icon className="cp-thesis-icon" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== (А) ГОТОВЫЕ ПРОЕКТЫ ===== */}
      <section id="ready-projects" className="cp-section--tinted">
        <div className="cp-section--tinted-inner">
          <p className="cp-eyebrow cp-reveal">01 — Готовые проекты</p>
          <h2 className="cp-section-title cp-reveal cp-reveal-delay-1">Объекты, готовые приносить прибыль с первого дня</h2>
          <p className="cp-section-text cp-reveal cp-reveal-delay-2">
            Готовые проекты, созданные специалистами компании Стиль Жизни, — это полностью
            подготовленные объекты для инвестиций. Мы создаём концепцию, разрабатываем дизайн,
            выполняем ремонт и оснащение, формируя недвижимость, которая сразу готова приносить
            прибыль. Инвесторам не нужно участвовать в процессе — объект запускается под ключ.
          </p>

          <div className="cp-lines-grid">
            {lines.map((line, i) => {
              const delayClass = i % 3 === 0 ? '' : i % 3 === 1 ? 'cp-reveal-delay-1' : 'cp-reveal-delay-2';
              return (
                <article className={`cp-line-card cp-reveal ${delayClass}`} key={line.name}>
                  <div className="cp-line-photo">
                    <div className="cp-line-photo-placeholder">
                      <IconBlueprint />
                      <span>{line.name}</span>
                    </div>
                    <div className="cp-line-overlay" />
                    <div className="cp-line-badge">{line.name}</div>
                  </div>
                  <div className="cp-line-body">
                    <p className="cp-line-tagline">{line.cta}</p>
                    <a href={PHONE_FREE_TEL} className="cp-btn-pill">
                      <IconPhone />
                      Контакты для связи
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== (Б) УПРАВЛЕНИЕ НЕДВИЖИМОСТЬЮ ===== */}
      <section id="management" className="cp-management">
        <div className="cp-management-media">
          <Image
            src="/images/menu/concept.webp"
            alt="Управление недвижимостью Life Style Crimea"
            fill
            sizes="100vw"
          />
        </div>
        <div className="cp-management-inner">
          <p className="cp-eyebrow cp-eyebrow--light cp-reveal">02 — Управление недвижимостью</p>
          <h2 className="cp-management-title cp-reveal cp-reveal-delay-1">Работающий бизнес без забот для инвестора</h2>
          <p className="cp-management-text cp-reveal cp-reveal-delay-2">
            Управление недвижимостью — это полный контроль над объектом: бронирование, обслуживание
            гостей, уборка, маркетинг, отчётность, ремонт и повышение доходности. Мы превращаем
            недвижимость в работающий бизнес, освобождая инвестора от всех забот.
          </p>
          <p className="cp-management-text cp-reveal cp-reveal-delay-2">
            Гостиничная индустрия — один из самых устойчивых рынков: люди путешествуют круглый год.
            Ежегодный доход — стабильная прибыль за счёт заселения, грамотного ценообразования и
            профессионального управления.
          </p>
          <p className="cp-management-text cp-reveal cp-reveal-delay-3">
            Мы работаем с любыми объектами в Алуште, Ялте, Судаке: апартаменты, квартиры, дома,
            мини-отели, виллы и курортные объекты — адаптируем стратегию под каждый формат.
          </p>

          <div className="cp-cities cp-reveal cp-reveal-delay-3">
            {cities.map((city) => (
              <span className="cp-city-chip" key={city}>
                <IconPin />
                {city}
              </span>
            ))}
          </div>

          <div className="cp-formats-block cp-reveal">
            <p className="cp-formats-label">Форматы объектов</p>
            <div className="cp-formats">
              {formats.map((format) => (
                <div className="cp-format-item" key={format}>
                  {format}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ФИНАЛЬНЫЙ CTA ===== */}
      <section className="cp-final-cta">
        <div className="cp-final-cta-card cp-reveal">
          <p className="cp-final-eyebrow">Начните сегодня</p>
          <h2>Готовы обсудить ваш инвестиционный проект?</h2>
          <p>
            Расскажите о вашем объекте или идее — подберём концепцию и формат, который начнёт
            приносить доход.
          </p>
          <div className="cp-final-cta-actions">
            <a href={PHONE_FREE_TEL} className="cp-btn-primary">
              <IconPhone />
              {PHONE_FREE} (бесплатно)
            </a>
            <a href={PHONE_MAIN_TEL} className="cp-btn-secondary">
              <IconPhone />
              {PHONE_MAIN_DISPLAY}
            </a>
          </div>
          <p className="cp-final-cta-note">
            Также смотрите{' '}
            <Link href="/services" style={{ color: '#4fd0e8', textDecoration: 'underline' }}>
              услуги резидентам апартаментов
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
