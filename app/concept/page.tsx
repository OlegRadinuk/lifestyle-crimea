import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import ConceptHeaderMode from './ConceptHeaderMode';
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
    cta: 'Готовы превратить идею в прибыльный объект? Обсудите с нами ваш проект и узнайте о наших кейсах — сделаем следующий шаг вместе. Мы уже готовы начать!',
  },
  {
    name: 'LS-ART+',
    cta: 'Готовы превратить идею в прибыльный объект? Обсудите с нами ваш проект и узнайте о наших кейсах — сделаем следующий шаг вместе. Мы уже готовы начать!',
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
      <JsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <section className="cp-hero">
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
          <p className="cp-hero-eyebrow">Уникальный концепт</p>
          <h1 className="cp-hero-title">
            Инвестируйте в <strong>недвижимость</strong> на Южном Берегу Крыма
          </h1>
          <p className="cp-hero-lead">
            Мы предлагаем готовые инвестиционные проекты в гостиничной сфере, превращая обычную
            недвижимость в высокодоходный актив. Наша команда создаёт эксклюзивные концептуальные
            решения, разрабатывает дизайн-проекты и полностью реализует комплексные ремонты. Под
            профессиональным управлением наших специалистов недвижимость начинает приносить
            стабильную прибыль инвесторам. Мы берём на себя полный цикл управления объектами — от
            небольших апартаментов до мини-отелей и баз отдыха.
          </p>
          <div className="cp-hero-actions">
            <a href="#ready-projects" className="cp-btn-primary">
              Готовые проекты
              <IconArrowDown />
            </a>
            <a href="#management" className="cp-btn-outline">
              Управление недвижимостью
              <IconArrowDown />
            </a>
          </div>
        </div>
      </section>

      {/* ===== 4 ТЕЗИСА ===== */}
      <section className="cp-section">
        <p className="cp-eyebrow">Почему это работает</p>
        <h2 className="cp-section-title">Четыре опоры нашего подхода к инвестициям</h2>
        <div className="cp-thesis-grid">
          {theses.map((item) => {
            const Icon = item.icon;
            return (
              <div className="cp-thesis-card" key={item.title}>
                <Icon className="cp-thesis-icon" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== ДВЕ ГЛАВНЫЕ СЕКЦИИ — переходы ===== */}
      <section className="cp-section" style={{ paddingTop: 0 }}>
        <div className="cp-pillars">
          <a href="#ready-projects" className="cp-pillar-card cp-pillar-card--a">
            <p className="cp-pillar-eyebrow">Раздел 01</p>
            <h3>Готовые проекты</h3>
            <p>
              Полностью подготовленные объекты для инвестиций — концепция, дизайн, ремонт и
              оснащение. Объект запускается под ключ.
            </p>
            <span className="cp-pillar-link">
              Перейти к линейкам
              <IconArrowDown />
            </span>
          </a>
          <a href="#management" className="cp-pillar-card cp-pillar-card--b">
            <p className="cp-pillar-eyebrow">Раздел 02</p>
            <h3>Управление недвижимостью</h3>
            <p>
              Полный контроль над объектом: бронирование, обслуживание гостей, маркетинг,
              отчётность и повышение доходности.
            </p>
            <span className="cp-pillar-link">
              Узнать подробнее
              <IconArrowDown />
            </span>
          </a>
        </div>
      </section>

      {/* ===== (А) ГОТОВЫЕ ПРОЕКТЫ ===== */}
      <section id="ready-projects" className="cp-section--tinted">
        <div className="cp-section--tinted-inner">
          <p className="cp-eyebrow">01 — Готовые проекты</p>
          <h2 className="cp-section-title">Объекты, готовые приносить прибыль с первого дня</h2>
          <p className="cp-section-text">
            Готовые проекты, созданные специалистами компании Стиль Жизни, — это полностью
            подготовленные объекты для инвестиций. Мы создаём концепцию, разрабатываем дизайн,
            выполняем ремонт и оснащение, формируя недвижимость, которая сразу готова приносить
            прибыль. Инвесторам не нужно участвовать в процессе — объект запускается под ключ.
          </p>

          <div className="cp-lines-grid">
            {lines.map((line) => (
              <article className="cp-line-card" key={line.name}>
                <div className="cp-line-photo">
                  <div className="cp-line-photo-placeholder">
                    <IconBlueprint />
                    <span>Фото кейса {line.name} — добавить</span>
                  </div>
                </div>
                <div className="cp-line-body">
                  <h3 className="cp-line-name">{line.name}</h3>
                  <p className="cp-line-tagline">{line.cta}</p>
                  <a href={PHONE_FREE_TEL} className="cp-btn-outline on-light cp-line-cta">
                    <IconPhone />
                    Контакты для связи
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== (Б) УПРАВЛЕНИЕ НЕДВИЖИМОСТЬЮ ===== */}
      <section id="management" className="cp-section">
        <p className="cp-eyebrow">02 — Управление недвижимостью</p>
        <h2 className="cp-section-title">Работающий бизнес без забот для инвестора</h2>
        <p className="cp-section-text">
          Управление недвижимостью — это полный контроль над объектом: бронирование, обслуживание
          гостей, уборка, маркетинг, отчётность, ремонт и повышение доходности. Мы превращаем
          недвижимость в работающий бизнес, освобождая инвестора от всех забот.
        </p>
        <p className="cp-section-text">
          Гостиничная индустрия — один из самых устойчивых и востребованных рынков: люди
          путешествуют круглый год, поэтому объекты обеспечивают стабильный спрос и высокую
          загрузку. Ежегодный доход — стабильная прибыль, которую инвестор получает каждый год за
          счёт заселения, грамотного ценообразования и профессионального управления.
        </p>
        <p className="cp-section-text">
          Мы работаем с любыми объектами в Алуште, Ялте, Судаке: апартаменты, квартиры, дома,
          мини-отели, виллы и курортные объекты — адаптируем стратегию под каждый формат.
        </p>

        <div className="cp-cities">
          {cities.map((city) => (
            <span className="cp-city-chip" key={city}>
              <IconPin />
              {city}
            </span>
          ))}
        </div>

        <div className="cp-pillar-card cp-pillar-card--b" style={{ marginTop: 36, cursor: 'default' }}>
          <p className="cp-pillar-eyebrow">Форматы объектов</p>
          <h3>Адаптируем стратегию под каждый формат</h3>
          <div className="cp-formats">
            {formats.map((format) => (
              <div className="cp-format-item" key={format}>
                {format}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ФИНАЛЬНЫЙ CTA ===== */}
      <section className="cp-final-cta">
        <div className="cp-final-cta-card">
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
            <a href={PHONE_MAIN_TEL} className="cp-btn-outline">
              <IconPhone />
              {PHONE_MAIN_DISPLAY}
            </a>
          </div>
          <p className="cp-final-cta-note">
            Также смотрите{' '}
            <Link href="/services" style={{ color: '#fff', textDecoration: 'underline' }}>
              услуги резидентам апартаментов
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
