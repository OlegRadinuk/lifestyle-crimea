import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import ServicesHeaderMode from './ServicesHeaderMode';
import {
  IconBalcony,
  IconShower,
  IconTv,
  IconAc,
  IconFridge,
  IconKettle,
  IconInduction,
  IconCoffee,
  IconWifi,
  IconPlus,
  IconBreakfast,
  IconFullBoard,
  IconExcursion,
  IconCleaning,
  IconIron,
  IconLaundry,
  IconTransfer,
  IconTaxi,
  IconSeaWalk,
  IconLounge,
  IconBbq,
  IconSport,
  IconPlayground,
  IconParking,
  IconStore,
  IconCosmetics,
  IconPool,
  IconGazebo,
  IconPhone,
  IconArrowRight,
} from './icons';
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

interface AmenityItem {
  icon: (props: { className?: string }) => React.ReactElement;
  text: string;
}

const inApartment: AmenityItem[] = [
  { icon: IconBalcony, text: 'Балкон для созерцаний' },
  { icon: IconShower, text: 'Душевая кабина или ванна' },
  { icon: IconTv, text: 'Смарт-ТВ — личный портал в мир историй' },
  { icon: IconAc, text: 'Кондиционер — прохлада и свежесть' },
  { icon: IconFridge, text: 'Холодильник' },
  { icon: IconKettle, text: 'Чайник' },
  { icon: IconInduction, text: 'Индукционная плита — сердце кухни' },
  { icon: IconCoffee, text: 'Кофеварка — свежесваренный кофе' },
  { icon: IconWifi, text: 'Интернет / Wi-Fi' },
  { icon: IconPlus, text: 'И другое для лучшего отдыха' },
];

const services: AmenityItem[] = [
  { icon: IconBreakfast, text: 'Вкуснейшие завтраки в кофейне' },
  { icon: IconFullBoard, text: 'Полный пансион с природными бонусами' },
  { icon: IconExcursion, text: 'Экскурсии как приключения' },
  { icon: IconCleaning, text: 'Уборка, химчистка, озонация' },
  { icon: IconIron, text: 'Глажка' },
  { icon: IconLaundry, text: 'Прачечная' },
  { icon: IconTransfer, text: 'Трансфер' },
  { icon: IconTaxi, text: 'Такси' },
];

const infrastructure: AmenityItem[] = [
  { icon: IconSeaWalk, text: 'Апартаменты в лёгкой прогулке от моря' },
  { icon: IconLounge, text: 'Зоны отдыха и лаундж' },
  { icon: IconBbq, text: 'Мангальная зона для барбекю' },
  { icon: IconSport, text: 'Открытая спортплощадка' },
  { icon: IconPlayground, text: 'Детская площадка' },
  { icon: IconParking, text: 'Подземный паркинг' },
  { icon: IconStore, text: 'Кофейня «Эндорфин»' },
  { icon: IconStore, text: 'Продуктовый магазин «Прованс»' },
  { icon: IconCosmetics, text: 'Магазин крымской косметики «Дом Изобилия»' },
  { icon: IconPool, text: 'Открытый бассейн' },
  { icon: IconGazebo, text: 'Беседки для чтения' },
];

function AmenityColumn({ title, items }: { title: string; items: AmenityItem[] }) {
  return (
    <div className="sv-column-card">
      <h3 className="sv-column-title">{title}</h3>
      <div className="sv-column-divider" />
      <ul className="sv-item-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li className="sv-item" key={item.text}>
              <Icon className="sv-item-icon" />
              <span className="sv-item-text">{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ServicesPage() {
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
          amenityFeature: [...inApartment, ...services, ...infrastructure].map((item) => ({
            '@type': 'LocationFeatureSpecification',
            name: item.text,
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
      <JsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <section className="sv-hero">
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
          <p className="sv-hero-eyebrow">Услуги</p>
          <h1 className="sv-hero-title">
            Апартаменты LS — ваш уголок у моря, где <strong>стиль жизни</strong> встречается с поэзией
          </h1>
          <p className="sv-hero-lead">
            Здесь вы найдёте не просто апартаменты, а целый образ жизни: утончённый сервис, услуги
            для идеального отдыха и все условия, чтобы почувствовать себя на своём месте.
          </p>
        </div>
      </section>

      {/* ===== ТРИ КОЛОНКИ ===== */}
      <section className="sv-section">
        <p className="sv-eyebrow">Что вас окружает</p>
        <h2 className="sv-section-title">Всё для отдыха — в апартаментах, в сервисе и вокруг</h2>

        <div className="sv-columns">
          <AmenityColumn title="В апартаментах" items={inApartment} />
          <AmenityColumn title="Услуги" items={services} />
          <AmenityColumn title="Инфраструктура" items={infrastructure} />
        </div>
      </section>

      {/* ===== ФИНАЛЬНЫЙ CTA ===== */}
      <section className="sv-final-cta">
        <div className="sv-final-cta-card">
          <h2>Желаете узнать больше о комплексе?</h2>
          <p>
            Расскажем о концепции комплекса, линейках апартаментов и инвестиционных возможностях.
          </p>
          <div className="sv-final-cta-actions">
            <Link href="/concept" className="sv-btn-primary">
              Уникальный концепт
              <IconArrowRight />
            </Link>
            <a href={PHONE_FREE_TEL} className="sv-btn-outline">
              <IconPhone />
              {PHONE_FREE}
            </a>
            <a href={PHONE_MAIN_TEL} className="sv-btn-outline">
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
