import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import LandingHeaderMode from '../_landing/LandingHeaderMode';
import LandingReveal from '../_landing/LandingReveal';
import '../_landing/landing.css';

/* Посадочная под гео-кластер «Профессорский уголок».
 *
 * Зачем отдельная страница. По Вордстату (регион Россия, август 2026)
 * «профессорский уголок алушта» — 1 792 показа в месяц, плюс «алушта
 * профессорский уголок отели» 295 и «профессорский уголок алушта снять» 129.
 * Это больше, чем весь кластер «снять жильё в алуште» (850). Район стоял
 * только в тайтле главной, посадки под него не было вовсе — запрос уходил
 * агрегаторам и санаториям.
 *
 * Почему «жильё», а не «апартаменты». «снять апартаменты алушта» — 82 показа,
 * а «апартаменты алушта» (558) почти целиком про покупку недвижимости:
 * «купить апартаменты в алуште», «крымская резиденция». Слово «апартаменты»
 * в Алуште уводит в другой рынок, поэтому ведём страницу словом «жильё».
 */

const PHONE_FREE = '8 800 777 63 08';
const PHONE_FREE_TEL = 'tel:88007776308';
const PHONE_MAIN = '+7 978 503 63 63';
const PHONE_MAIN_TEL = 'tel:+79785036363';

const URL = 'https://lovelifestyle.ru/professorskiy-ugolok';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  /* Бренд сюда НЕ дописываем: шаблон в корневом layout сам добавляет
     «| Стиль Жизни, Алушта». Иначе он задваивается, а строка вылезает за
     90 символов и выдача её обрезает. Для соцсетей бренд нужен — там шаблон
     не применяется, поэтому og:title отдельной строкой ниже. */
  const title = 'Снять жильё в Профессорском уголке Алушты';
  const ogTitle = 'Снять жильё в Профессорском уголке Алушты — апарт-отель «Стиль Жизни»';
  const description =
    'Жильё в Профессорском уголке Алушты посуточно: 47 апартаментов на Западной улице, до пляжа 650 м пешком. Бассейны круглый год, аквазона, вид на море. Бронирование напрямую, без комиссии посредников.';

  return {
    title,
    description,
    keywords:
      'профессорский уголок алушта, снять жильё профессорский уголок, жильё в профессорском уголке, профессорский уголок алушта отели, апартаменты профессорский уголок, отдых профессорский уголок алушта',
    alternates: { canonical: URL },
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      locale: 'ru_RU',
      url: URL,
      siteName: 'Стиль Жизни',
      /* JPEG 1200×630: WebP в превью ссылок не показывают ни Telegram,
         ни WhatsApp, ни VK — карточка приходит пустой. */
      images: [
        {
          url: 'https://lovelifestyle.ru/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Апартаменты с видом на море в Профессорском уголке Алушты',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['https://lovelifestyle.ru/og-image.jpg'],
    },
    robots: { index: true, follow: true, 'max-snippet': 150, 'max-image-preview': 'large' },
  };
}

const FACTS = [
  { value: '650 м', label: 'до пляжа пешком' },
  { value: '47', label: 'апартаментов' },
  { value: '24–60 м²', label: 'площадь' },
  { value: 'до 5', label: 'гостей' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Где находится Профессорский уголок в Алуште?',
    a: 'Это западная часть Алушты вдоль берега моря, у подножия горы Кастель. От центра города район отделяет набережная, дорога занимает около двадцати минут. Апарт-отель «Стиль Жизни» стоит на Западной улице, 4, корпус 3 — до пляжа 650 метров пешком.',
  },
  {
    q: 'Почему район называется Профессорским уголком?',
    a: 'Название историческое. В конце XIX века землю здесь начали покупать под дачи профессора и учёные, отсюда и имя. В советские годы район официально назывался Рабочим уголком, позже историческое название вернулось и закрепилось в обиходе.',
  },
  {
    q: 'Чем Профессорский уголок лучше центра Алушты?',
    a: 'Здесь тише: нет транзитного потока машин и рыночной толчеи, вдоль моря идёт пешеходная набережная, а улицы к воде спускаются через зелень. При этом весь город остаётся в пределах короткой поездки.',
  },
  {
    q: 'Можно ли снять жильё в Профессорском уголке напрямую, без посредников?',
    a: 'Да. Бронирование в апарт-отеле «Стиль Жизни» идёт напрямую с сайта или по телефону 8 800 777 63 08 — без комиссии агрегаторов. Свободные даты и цены видны в каталоге апартаментов.',
  },
];

export default function ProfessorskiyUgolokPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://lovelifestyle.ru' },
          { '@type': 'ListItem', position: 2, name: 'Профессорский уголок', item: URL },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return (
    <main className="lp-page">
      <LandingHeaderMode id="professorskiy-ugolok-page" />
      <LandingReveal />
      <JsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <header className="lp-hero">
        <div className="lp-hero-media">
          <Image
            src="/images/menu/home.webp"
            alt="Апартаменты с панорамным видом на море в Профессорском уголке Алушты"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="lp-hero-inner">
          <p className="lp-hero-eyebrow">Профессорский уголок · Алушта</p>
          <h1 className="lp-hero-title">
            Снять жильё в <strong>Профессорском уголке</strong> Алушты
          </h1>
          <p className="lp-hero-subtitle">
            Апарт-отель «Стиль Жизни» на Западной улице — 47 апартаментов в тихой части города
            у моря. До пляжа 650 метров пешком, бассейны работают круглый год. Бронирование
            напрямую, без комиссии агрегаторов.
          </p>
          <div className="lp-hero-actions">
            <Link href="/apartments" className="lp-btn lp-btn-primary">
              Смотреть апартаменты и цены
            </Link>
            <a href={PHONE_FREE_TEL} className="lp-btn lp-btn-ghost">
              {PHONE_FREE}
            </a>
          </div>
        </div>
      </header>

      {/* ===== ЦИФРЫ ===== */}
      <section className="lp-facts">
        <ul className="lp-facts-list">
          {FACTS.map((fact) => (
            <li className="lp-fact lp-reveal" key={fact.label}>
              <span className="lp-fact-value">{fact.value}</span>
              <span className="lp-fact-label">{fact.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== ЧТО ЗА РАЙОН ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Район</p>
          <h2 className="lp-title lp-reveal">
            Почему гости выбирают Профессорский уголок, а не центр
          </h2>
          <div className="lp-prose lp-reveal">
            <p>
              Профессорский уголок — западная часть Алушты, вытянутая вдоль берега у подножия
              горы Кастель. Название историческое: в конце XIX века землю здесь начали покупать
              под дачи профессора и учёные. В советские годы район официально звался Рабочим
              уголком, но старое имя вернулось и осталось в обиходе.
            </p>
            <p>
              От центра города район отделяет набережная — дорога занимает около двадцати минут
              пешком вдоль моря. Разница чувствуется сразу: сюда не заходит транзитный транспорт,
              нет рыночной толчеи и очередей на набережной, а улицы спускаются к воде через
              зелень. При этом всё городское — магазины, кафе, автостанция — остаётся в пределах
              короткой поездки.
            </p>
            <p>
              Для отдыха с детьми это решает многое: до пляжа идти без светофоров и оживлённых
              перекрёстков, а вечером район затихает.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ЖИЛЬЁ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Жильё</p>
          <h2 className="lp-title lp-reveal">47 апартаментов в 650 метрах от моря</h2>
          <div className="lp-prose lp-reveal">
            <p>
              Комплекс «Стиль Жизни» стоит на Западной улице, 4, корпус 3. Апартаменты — от студий
              до вариантов с отдельной спальней, площадью от 24 до 60 м², рассчитаны на компанию
              до пяти человек. В тридцати из сорока семи окна выходят на море, почти в каждом
              есть собственная терраса.
            </p>
            <p>
              Внутри всё для того, чтобы жить, а не ночевать: кухонная зона с плитой, микроволновкой
              и посудой, холодильник, стиральная машина, кондиционер, Wi-Fi и SMART TV. Уборка и
              смена белья — по графику, завтраки и питание можно заказать отдельно.
            </p>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/apartments" className="lp-btn lp-btn-primary">
              Все апартаменты и свободные даты
            </Link>
          </div>
          <ul className="lp-cards lp-reveal">
            <li>
              <Link href="/apartments/deep-music" className="lp-card">
                <span className="lp-card-kicker">С видом на море</span>
                <span className="lp-card-title">Deep Music, 28 м²</span>
                <span className="lp-card-note">13-й этаж, море во весь горизонт</span>
              </Link>
            </li>
            <li>
              <Link href="/apartments/crystal-blue" className="lp-card">
                <span className="lp-card-kicker">С видом на море</span>
                <span className="lp-card-title">Crystal Blue, 32 м²</span>
                <span className="lp-card-note">Терраса с видом на залив</span>
              </Link>
            </li>
            <li>
              <Link href="/apartments/family-comfort" className="lp-card">
                <span className="lp-card-kicker">Для семьи</span>
                <span className="lp-card-title">Family Comfort, 32 м²</span>
                <span className="lp-card-note">Место для четверых</span>
              </Link>
            </li>
            <li>
              <Link href="/apartments/econom-studio" className="lp-card">
                <span className="lp-card-kicker">Экономно</span>
                <span className="lp-card-title">Econom Studio, 28 м²</span>
                <span className="lp-card-note">Самый доступный вариант</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== БАССЕЙНЫ ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Аквазона</p>
          <h2 className="lp-title lp-reveal">Бассейны работают круглый год</h2>
          <div className="lp-prose lp-reveal">
            <p>
              На территории два больших бассейна, и они открыты не только летом, а круглый год.
              Рядом два детских — с мелкой водой и на расстоянии взгляда от шезлонгов, так что
              взрослые отдыхают, не выпуская детей из виду. Есть джакузи и бар у воды, до которого
              не нужно переодеваться. Вид с бортика — на море и горы одновременно.
            </p>
            <p>
              Посещение аквазоны доступно в некоторых категориях апартаментов — какие подойдут
              именно вам, подскажет администратор.
            </p>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/services" className="lp-btn lp-btn-ghost">
              Подробнее об аквазоне и услугах
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Частые вопросы</p>
          <h2 className="lp-title lp-reveal">О районе и бронировании</h2>
          <div className="lp-faq">
            {FAQ.map((item) => (
              <details className="lp-faq-item lp-reveal" key={item.q}>
                <summary className="lp-faq-q">{item.q}</summary>
                <p className="lp-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="lp-cta">
        <div className="lp-inner lp-cta-inner">
          <h2 className="lp-cta-title">Забронировать напрямую</h2>
          <p className="lp-cta-text">
            Без комиссии агрегаторов и наценки посредников. Свободные даты и цены — в каталоге,
            остальное подскажет администратор.
          </p>
          <div className="lp-hero-actions">
            <Link href="/apartments" className="lp-btn lp-btn-primary">
              Выбрать апартаменты
            </Link>
            <a href={PHONE_FREE_TEL} className="lp-btn lp-btn-ghost">
              {PHONE_FREE}
            </a>
            <a href={PHONE_MAIN_TEL} className="lp-btn lp-btn-ghost">
              {PHONE_MAIN}
            </a>
          </div>
          <p className="lp-cta-address">Алушта, Западная ул., 4, корп. 3 — Профессорский уголок</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
