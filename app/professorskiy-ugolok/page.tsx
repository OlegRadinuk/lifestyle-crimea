import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import PuHeaderMode from './PuHeaderMode';
import PuReveal from './PuReveal';
import './pu.css';

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
  const title = 'Снять жильё в Профессорском уголке Алушты — апарт-отель «Стиль Жизни»';
  const description =
    'Жильё в Профессорском уголке Алушты посуточно: 47 апартаментов на Западной улице, до пляжа 650 м пешком. Бассейны круглый год, аквазона, вид на море. Бронирование напрямую, без комиссии посредников.';

  return {
    title,
    description,
    keywords:
      'профессорский уголок алушта, снять жильё профессорский уголок, жильё в профессорском уголке, профессорский уголок алушта отели, апартаменты профессорский уголок, отдых профессорский уголок алушта',
    alternates: { canonical: URL },
    openGraph: {
      title,
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
      title,
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
    <main className="pu-page">
      <PuHeaderMode />
      <PuReveal />
      <JsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <header className="pu-hero">
        <div className="pu-hero-media">
          <Image
            src="/images/menu/home.webp"
            alt="Апартаменты с панорамным видом на море в Профессорском уголке Алушты"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="pu-hero-inner">
          <p className="pu-hero-eyebrow">Профессорский уголок · Алушта</p>
          <h1 className="pu-hero-title">
            Снять жильё в <strong>Профессорском уголке</strong> Алушты
          </h1>
          <p className="pu-hero-subtitle">
            Апарт-отель «Стиль Жизни» на Западной улице — 47 апартаментов в тихой части города
            у моря. До пляжа 650 метров пешком, бассейны работают круглый год. Бронирование
            напрямую, без комиссии агрегаторов.
          </p>
          <div className="pu-hero-actions">
            <Link href="/apartments" className="pu-btn pu-btn-primary">
              Смотреть апартаменты и цены
            </Link>
            <a href={PHONE_FREE_TEL} className="pu-btn pu-btn-ghost">
              {PHONE_FREE}
            </a>
          </div>
        </div>
      </header>

      {/* ===== ЦИФРЫ ===== */}
      <section className="pu-facts">
        <ul className="pu-facts-list">
          {FACTS.map((fact) => (
            <li className="pu-fact pu-reveal" key={fact.label}>
              <span className="pu-fact-value">{fact.value}</span>
              <span className="pu-fact-label">{fact.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== ЧТО ЗА РАЙОН ===== */}
      <section className="pu-section">
        <div className="pu-inner">
          <p className="pu-eyebrow pu-reveal">Район</p>
          <h2 className="pu-title pu-reveal">
            Почему гости выбирают Профессорский уголок, а не центр
          </h2>
          <div className="pu-prose pu-reveal">
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
      <section className="pu-section pu-section-alt">
        <div className="pu-inner">
          <p className="pu-eyebrow pu-reveal">Жильё</p>
          <h2 className="pu-title pu-reveal">47 апартаментов в 650 метрах от моря</h2>
          <div className="pu-prose pu-reveal">
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
          <div className="pu-links pu-reveal">
            <Link href="/apartments" className="pu-btn pu-btn-primary">
              Все апартаменты и свободные даты
            </Link>
          </div>
          <ul className="pu-cards pu-reveal">
            <li>
              <Link href="/apartments/deep-music" className="pu-card">
                <span className="pu-card-kicker">С видом на море</span>
                <span className="pu-card-title">Deep Music, 28 м²</span>
                <span className="pu-card-note">13-й этаж, море во весь горизонт</span>
              </Link>
            </li>
            <li>
              <Link href="/apartments/crystal-blue" className="pu-card">
                <span className="pu-card-kicker">С видом на море</span>
                <span className="pu-card-title">Crystal Blue, 32 м²</span>
                <span className="pu-card-note">Терраса с видом на залив</span>
              </Link>
            </li>
            <li>
              <Link href="/apartments/family-comfort" className="pu-card">
                <span className="pu-card-kicker">Для семьи</span>
                <span className="pu-card-title">Family Comfort, 32 м²</span>
                <span className="pu-card-note">Место для четверых</span>
              </Link>
            </li>
            <li>
              <Link href="/apartments/econom-studio" className="pu-card">
                <span className="pu-card-kicker">Экономно</span>
                <span className="pu-card-title">Econom Studio, 28 м²</span>
                <span className="pu-card-note">Самый доступный вариант</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== БАССЕЙНЫ ===== */}
      <section className="pu-section">
        <div className="pu-inner">
          <p className="pu-eyebrow pu-reveal">Аквазона</p>
          <h2 className="pu-title pu-reveal">Бассейны работают круглый год</h2>
          <div className="pu-prose pu-reveal">
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
          <div className="pu-links pu-reveal">
            <Link href="/services" className="pu-btn pu-btn-ghost">
              Подробнее об аквазоне и услугах
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="pu-section pu-section-alt">
        <div className="pu-inner">
          <p className="pu-eyebrow pu-reveal">Частые вопросы</p>
          <h2 className="pu-title pu-reveal">О районе и бронировании</h2>
          <div className="pu-faq">
            {FAQ.map((item) => (
              <details className="pu-faq-item pu-reveal" key={item.q}>
                <summary className="pu-faq-q">{item.q}</summary>
                <p className="pu-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="pu-cta">
        <div className="pu-inner pu-cta-inner">
          <h2 className="pu-cta-title">Забронировать напрямую</h2>
          <p className="pu-cta-text">
            Без комиссии агрегаторов и наценки посредников. Свободные даты и цены — в каталоге,
            остальное подскажет администратор.
          </p>
          <div className="pu-hero-actions">
            <Link href="/apartments" className="pu-btn pu-btn-primary">
              Выбрать апартаменты
            </Link>
            <a href={PHONE_FREE_TEL} className="pu-btn pu-btn-ghost">
              {PHONE_FREE}
            </a>
            <a href={PHONE_MAIN_TEL} className="pu-btn pu-btn-ghost">
              {PHONE_MAIN}
            </a>
          </div>
          <p className="pu-cta-address">Алушта, Западная ул., 4, корп. 3 — Профессорский уголок</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
