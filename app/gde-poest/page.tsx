import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import GdePoestHeaderMode from './GdePoestHeaderMode';
import GdePoestReveal from './GdePoestReveal';
import ContactSheet from './ContactSheet';
import BreakfastBtn from './BreakfastBtn';
import {
  IconCoffee,
  IconStore,
  IconBreakfast,
  IconMapPin,
} from './icons';
import './gde-poest.css';

/*
 * Страница — утилита для гостей: менеджер скидывает ссылку в мессенджере.
 * Основной сценарий — превью в Telegram/WhatsApp, а не органический поиск.
 * Поэтому: noindex, но og-теги в полном объёме для шаринга.
 */
export function generateMetadata(): Metadata {
  const title = 'Где поесть рядом со «Стилем Жизни» | Алушта';
  const description =
    'Кофейня «Эндорфин» прямо в комплексе — скидка 5% для гостей. Кафе, рестораны, доставка и магазин рядом с апарт-отелем «Стиль Жизни» в Алуште.';

  return {
    title,
    description,
    keywords:
      'где поесть алушта, кафе рядом с отелем алушта, рестораны алушта, доставка еды алушта, эндорфин кофейня алушта',
    alternates: {
      canonical: 'https://lovelifestyle.ru/gde-poest',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      url: 'https://lovelifestyle.ru/gde-poest',
      siteName: 'Стиль Жизни',
      images: [
        {
          url: 'https://lovelifestyle.ru/og-gde-poest.jpg',
          width: 1200,
          height: 630,
          alt: 'Кофейня «Эндорфин» в апарт-комплексе «Стиль Жизни», Алушта',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://lovelifestyle.ru/og-gde-poest.jpg'],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: 'https://lovelifestyle.ru',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Где поесть рядом со «Стилем Жизни»',
          item: 'https://lovelifestyle.ru/gde-poest',
        },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'Кафе и рестораны рядом с апарт-отелем «Стиль Жизни», Алушта',
      description:
        'Подборка заведений в шаговой доступности от апарт-комплекса «Стиль Жизни» на ул. Западной, 4',
      numberOfItems: 6,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'CafeOrCoffeeShop',
            name: 'Эндорфин (ENDORPHINSENSE COFFEE)',
            description:
              'Кофейня прямо на территории апарт-комплекса «Стиль Жизни». Скидка 5% для гостей отеля.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'ул. Западная, 4, корп. 1 «Грибоедов»',
              addressLocality: 'Алушта',
              addressRegion: 'Республика Крым',
              addressCountry: 'RU',
            },
            url: 'https://yandex.ru/maps/org/endorfin/89879110034',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'FoodEstablishment',
            name: 'Кафе «Встреча»',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'ул. Ленина, 2',
              addressLocality: 'Алушта',
              addressRegion: 'Республика Крым',
              addressCountry: 'RU',
            },
            telephone: '+79787288439',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'Restaurant',
            name: 'Ресторан «Старый город»',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'ул. Горького, 15а',
              addressLocality: 'Алушта',
              addressRegion: 'Республика Крым',
              addressCountry: 'RU',
            },
            telephone: '+79783045262',
          },
        },
        {
          '@type': 'ListItem',
          position: 4,
          item: {
            '@type': 'Restaurant',
            name: 'Roppongi Family',
            description: 'Японская кухня на Набережной Алушты.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Набережная Алушты',
              addressLocality: 'Алушта',
              addressRegion: 'Республика Крым',
              addressCountry: 'RU',
            },
            telephone: '88003505052',
          },
        },
        {
          '@type': 'ListItem',
          position: 5,
          item: {
            '@type': 'FoodEstablishment',
            name: 'Кафе «Старик Хинкалыч»',
            description: 'Грузинская кухня.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'ул. Ленина, 15',
              addressLocality: 'Алушта',
              addressRegion: 'Республика Крым',
              addressCountry: 'RU',
            },
            telephone: '+79782706133',
          },
        },
        {
          '@type': 'ListItem',
          position: 6,
          item: {
            '@type': 'BarOrPub',
            name: 'Кафе-бар Villa Vanilla',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'ул. Парковая, 2',
              addressLocality: 'Алушта',
              addressRegion: 'Республика Крым',
              addressCountry: 'RU',
            },
          },
        },
      ],
    },
  ],
};

export default function GdePoestPage() {
  return (
    <>
      <main className="gp-page">
        <GdePoestHeaderMode />
        <GdePoestReveal />
        <JsonLd data={jsonLd} />

        {/* ═══════════════════════════════════════
            ЭКРАН 1 — HERO: кадр во весь экран
            ═══════════════════════════════════════ */}
        <section className="gp-hero">
          {/* Арт-директ: вертикальный кадр на телефоне, горизонтальный на десктопе */}
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet="/images/gde-poest/endorphin-interior-h.webp"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/gde-poest/endorphin-interior-v.webp"
              alt="Интерьер кофейни «Эндорфин» — деревянные балки, бежевые диваны и мурал с танцующей парой"
              className="gp-hero-img"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <div className="gp-hero-overlay" aria-hidden="true" />

          <div className="gp-hero-content">
            {/* Чип */}
            <div className="gp-hero-chip">
              <IconCoffee />
              Кофейня в комплексе
            </div>

            {/* H1 */}
            <h1 className="gp-hero-h1">
              Где поесть
              <span>в Алуште</span>
            </h1>

            <p className="gp-hero-lead">
              Кофейня «Эндорфин» — прямо в нашем комплексе, со скидкой для
              гостей. Ниже — магазин, кафе и рестораны поблизости.
            </p>

            <div className="gp-hero-btns">
              <a href="#endorphin" className="gp-hero-btn-primary">
                Начать с кофе
              </a>
              <a href="#restaurants" className="gp-hero-btn-secondary">
                Все места
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            ЭКРАН 2 — ЭНДОРФИН: купон и кофе
            ═══════════════════════════════════════ */}
        <section className="gp-endorphin" id="endorphin">
          {/* Фото в край с градиентом */}
          <div className="gp-endorphin-photo-wrap">
            {/* Арт-директ: вертикальный кадр на телефоне, горизонтальный на десктопе */}
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet="/images/gde-poest/endorphin-coffee-h.webp"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/gde-poest/endorphin-coffee-v.webp"
                alt="Авторский раф с дроблёной малиной и безе на золотой подложке в кофейне «Эндорфин»"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="gp-endorphin-photo-gradient" aria-hidden="true" />

            {/* Текст поверх фото */}
            <div className="gp-endorphin-photo-text">
              <div className="gp-end-chip">В нашем комплексе</div>
              <h2 className="gp-end-name">Эндорфин</h2>
              <p className="gp-end-wordmark">ENDORPHINSENSE COFFEE</p>
            </div>
          </div>

          {/* Тело секции */}
          <div className="gp-endorphin-body gp-reveal">
            <p className="gp-end-desc">
              Деревянные балки, бежевые диваны и панорамное окно в зелень —
              место, где утром не хочется торопиться. На стене мурал с
              танцующей парой в пыльно-розовых и серо-синих тонах. Авторский
              раф с дроблёной малиной, безе и кофе без суеты — и всё это в
              соседнем корпусе.
            </p>

            {/* КУПОН */}
            <div className="gp-coupon" aria-label="Купон на скидку 5% для гостей «Стиля Жизни»">
              <div className="gp-coupon-left">
                <span className="gp-coupon-pct">5%</span>
                <span className="gp-coupon-label">Скидка</span>
              </div>
              <div className="gp-coupon-divider" aria-hidden="true" />
              <div className="gp-coupon-right">
                <span className="gp-coupon-sublabel">Гостям «Стиля Жизни»</span>
                <span className="gp-coupon-body">Промокод даёт менеджер при бронировании</span>
              </div>
            </div>

            {/* Строка завтрак */}
            <div className="gp-end-breakfast-note">
              <IconBreakfast />
              Завтрак по внутреннему тарифу отеля оформляется заранее через
              менеджера.
            </div>

            {/* Кнопки */}
            <div className="gp-end-actions">
              <a
                href="https://yandex.ru/maps/org/endorfin/89879110034?si=lifestyle-crimea"
                className="gp-end-btn-primary"
                target="_blank"
                rel="nofollow noopener"
                aria-label="Открыть кофейню «Эндорфин» на карте"
              >
                <IconMapPin />
                На карте
              </a>
              <BreakfastBtn />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            ЭКРАН 3 — ЗАВЕДЕНИЯ: горизонтальная карусель
            ═══════════════════════════════════════ */}
        <section id="restaurants">
          <div className="gp-restaurants">
            {/* Заголовок */}
            <div className="gp-rest-header gp-reveal">
              <p className="gp-rest-eyebrow">Выйти на ужин</p>
              <h2 className="gp-rest-heading">Пять мест в Алуште</h2>
            </div>

            {/* Карусель */}
            <div
              className="gp-carousel gp-reveal gp-reveal-delay-1"
              role="region"
              aria-label="Кафе и рестораны рядом с «Стилем Жизни»"
              tabIndex={0}
            >
              {/* 01 Villa Vanilla */}
              <div className="gp-tile gp-tile--1">
                <span className="gp-tile-num" aria-hidden="true">01</span>
                <span className="gp-tile-chip">У самого моря</span>
                <div className="gp-tile-body">
                  <h3 className="gp-tile-name">Villa Vanilla</h3>
                  <p className="gp-tile-addr">ул. Парковая, 2</p>
                  <div className="gp-tile-actions">
                    <a
                      href="https://yandex.ru/maps/?text=%D0%90%D0%BB%D1%83%D1%88%D1%82%D0%B0%2C+%D1%83%D0%BB.+%D0%9F%D0%B0%D1%80%D0%BA%D0%BE%D0%B2%D0%B0%D1%8F%2C+2+Villa+Vanilla"
                      className="gp-tile-route"
                      target="_blank"
                      rel="nofollow noopener"
                      aria-label="Маршрут до Villa Vanilla"
                    >
                      <IconMapPin />
                      Маршрут
                    </a>
                  </div>
                </div>
              </div>

              {/* 02 Встреча */}
              <div className="gp-tile gp-tile--2">
                <span className="gp-tile-num" aria-hidden="true">02</span>
                <span className="gp-tile-chip">Романтично</span>
                <div className="gp-tile-body">
                  <h3 className="gp-tile-name">Встреча</h3>
                  <p className="gp-tile-addr">ул. Ленина, 2</p>
                  <div className="gp-tile-actions">
                    <a
                      href="https://yandex.ru/maps/?text=%D0%90%D0%BB%D1%83%D1%88%D1%82%D0%B0%2C+%D1%83%D0%BB.+%D0%9B%D0%B5%D0%BD%D0%B8%D0%BD%D0%B0%2C+2+%D0%BA%D0%B0%D1%84%D0%B5+%D0%92%D1%81%D1%82%D1%80%D0%B5%D1%87%D0%B0"
                      className="gp-tile-route"
                      target="_blank"
                      rel="nofollow noopener"
                      aria-label="Маршрут до кафе Встреча"
                    >
                      <IconMapPin />
                      Маршрут
                    </a>
                    <a
                      href="tel:+79787288439"
                      className="gp-tile-phone"
                      aria-label="Позвонить в кафе Встреча"
                    >
                      <IconStore />
                    </a>
                  </div>
                </div>
              </div>

              {/* 03 Старый город */}
              <div className="gp-tile gp-tile--3">
                <span className="gp-tile-num" aria-hidden="true">03</span>
                <span className="gp-tile-chip">В центре</span>
                <div className="gp-tile-body">
                  <h3 className="gp-tile-name">Старый город</h3>
                  <p className="gp-tile-addr">ул. Горького, 15а</p>
                  <div className="gp-tile-actions">
                    <a
                      href="https://yandex.ru/maps/?text=%D0%90%D0%BB%D1%83%D1%88%D1%82%D0%B0%2C+%D1%83%D0%BB.+%D0%93%D0%BE%D1%80%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE%2C+15%D0%B0+%D0%A1%D1%82%D0%B0%D1%80%D1%8B%D0%B9+%D0%B3%D0%BE%D1%80%D0%BE%D0%B4"
                      className="gp-tile-route"
                      target="_blank"
                      rel="nofollow noopener"
                      aria-label="Маршрут до ресторана Старый город"
                    >
                      <IconMapPin />
                      Маршрут
                    </a>
                    <a
                      href="tel:+79783045262"
                      className="gp-tile-phone"
                      aria-label="Позвонить в ресторан Старый город"
                    >
                      <IconStore />
                    </a>
                  </div>
                </div>
              </div>

              {/* 04 Роппонги */}
              <div className="gp-tile gp-tile--4">
                <span className="gp-tile-num" aria-hidden="true">04</span>
                <span className="gp-tile-chip">Японская кухня</span>
                <div className="gp-tile-body">
                  <h3 className="gp-tile-name">Роппонги</h3>
                  <p className="gp-tile-addr">Набережная Алушты</p>
                  <div className="gp-tile-actions">
                    <a
                      href="https://yandex.ru/maps/?text=%D0%90%D0%BB%D1%83%D1%88%D1%82%D0%B0%2C+%D0%9D%D0%B0%D0%B1%D0%B5%D1%80%D0%B5%D0%B6%D0%BD%D0%B0%D1%8F+%D0%A0%D0%BE%D0%BF%D0%BF%D0%BE%D0%BD%D0%B3%D0%B8"
                      className="gp-tile-route"
                      target="_blank"
                      rel="nofollow noopener"
                      aria-label="Маршрут до ресторана Роппонги"
                    >
                      <IconMapPin />
                      Маршрут
                    </a>
                    <a
                      href="tel:88003505052"
                      className="gp-tile-phone"
                      aria-label="Позвонить в ресторан Роппонги"
                    >
                      <IconStore />
                    </a>
                  </div>
                </div>
              </div>

              {/* 05 Хинкалыч */}
              <div className="gp-tile gp-tile--5">
                <span className="gp-tile-num" aria-hidden="true">05</span>
                <span className="gp-tile-chip">Грузинская кухня</span>
                <div className="gp-tile-body">
                  <h3 className="gp-tile-name">Хинкалыч</h3>
                  <p className="gp-tile-addr">ул. Ленина, 15</p>
                  <div className="gp-tile-actions">
                    <a
                      href="https://yandex.ru/maps/?text=%D0%90%D0%BB%D1%83%D1%88%D1%82%D0%B0%2C+%D1%83%D0%BB.+%D0%9B%D0%B5%D0%BD%D0%B8%D0%BD%D0%B0%2C+15+%D0%A5%D0%B8%D0%BD%D0%BA%D0%B0%D0%BB%D1%8B%D1%87"
                      className="gp-tile-route"
                      target="_blank"
                      rel="nofollow noopener"
                      aria-label="Маршрут до кафе Старик Хинкалыч"
                    >
                      <IconMapPin />
                      Маршрут
                    </a>
                    <a
                      href="tel:+79782706133"
                      className="gp-tile-phone"
                      aria-label="Позвонить в кафе Старик Хинкалыч"
                    >
                      <IconStore />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Индикаторы + подпись */}
            <div className="gp-carousel-nav" aria-hidden="true">
              <div className="gp-carousel-dots">
                <span className="gp-dot gp-dot--active" />
                <span className="gp-dot" />
                <span className="gp-dot" />
                <span className="gp-dot" />
                <span className="gp-dot" />
              </div>
              <span className="gp-swipe-hint">свайп</span>
            </div>
          </div>

          {/* ПРОДУКТЫ — белая карточка с зелёным акцентом */}
          <div className="gp-products gp-reveal gp-reveal-delay-2">
            <div className="gp-products-inner">
              <div>
                <p className="gp-products-eyebrow">Продукты</p>
                <p className="gp-products-name">Яблоко</p>
                <p className="gp-products-addr">
                  ул. Симферопольская, 20 · 8:00–23:00
                </p>
              </div>
              <div className="gp-products-actions">
                <a
                  href="https://yandex.ru/maps/?text=%D0%90%D0%BB%D1%83%D1%88%D1%82%D0%B0%2C+%D1%83%D0%BB.+%D0%A1%D0%B8%D0%BC%D1%84%D0%B5%D1%80%D0%BE%D0%BF%D0%BE%D0%BB%D1%8C%D1%81%D0%BA%D0%B0%D1%8F%2C+20+%D0%AF%D0%B1%D0%BB%D0%BE%D0%BA%D0%BE"
                  className="gp-products-btn"
                  target="_blank"
                  rel="nofollow noopener"
                  aria-label="Маршрут до супермаркета «Яблоко»"
                >
                  <IconMapPin />
                  Маршрут
                </a>
                <a
                  href="https://yabloko-supermarket.ru/"
                  className="gp-products-site"
                  target="_blank"
                  rel="nofollow noopener"
                  aria-label="Сайт супермаркета «Яблоко»"
                >
                  Сайт
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            ПОДПИСЬ
            ═══════════════════════════════════════ */}
        <section className="gp-signature gp-reveal">
          <div className="gp-section-inner">
            <p className="gp-signature-text">
              Приятного аппетита. Если понадобится помощь — мы на ресепшне.
            </p>
            <p className="gp-signature-brand">
              Команда апарт-отеля «Стиль Жизни»
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* Шторка «Связаться» — вне main для корректного z-index */}
      <ContactSheet />
    </>
  );
}
