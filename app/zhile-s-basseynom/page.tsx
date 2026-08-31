import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import LandingHeaderMode from '../_landing/LandingHeaderMode';
import LandingReveal from '../_landing/LandingReveal';
import '../_landing/landing.css';

/* Посадочная под кластер «с бассейном».
 *
 * Вордстат (регион Россия, август 2026, снято через API Директа):
 * «отель алушта с бассейном» / «алушта отели с бассейном» — 511 показов,
 * «алушта отели все включено с бассейном» 143, «алушта отели с бассейном
 * у моря» 90, «отели алушты с бассейном и пляжем» 51, «алушта отели с
 * бассейном с подогревом» 18, «отель в алуште с бассейном и питанием» 14.
 * В прогнозе Директа это самый дешёвый заметный кластер — 51 ₽ за клик при
 * CTR 17,7%, поэтому страница работает сразу на две задачи: органика и
 * посадка под рекламу.
 *
 * Разграничение со /services. Там аквазона описана как часть сервиса —
 * страница информационная. Здесь коммерческий интент: «снять жильё с
 * бассейном». Чтобы две страницы не бодались за один запрос, тайтл /services
 * уведён в сторону услуг, а «с бассейном» отдан этой.
 *
 * Про доступ говорим прямо: аквазона доступна не во всех категориях. Умолчать
 * — значит привезти гостя с неверным ожиданием и получить возврат и отзыв.
 */

const PHONE_FREE = '8 800 777 63 08';
const PHONE_FREE_TEL = 'tel:88007776308';
const PHONE_MAIN = '+7 978 503 63 63';
const PHONE_MAIN_TEL = 'tel:+79785036363';

const URL = 'https://lovelifestyle.ru/zhile-s-basseynom';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  /* Бренд сюда НЕ дописываем: шаблон в корневом layout сам добавляет
     «| Стиль Жизни, Алушта». Иначе он задваивается, а строка вылезает за
     90 символов и выдача её обрезает. Для соцсетей бренд нужен — там шаблон
     не применяется, поэтому og:title отдельной строкой. */
  const title = 'Снять жильё в Алуште с бассейном';
  const ogTitle = 'Снять жильё в Алуште с бассейном — апарт-отель «Стиль Жизни»';
  const description =
    'Жильё в Алуште с бассейном посуточно: два больших бассейна работают круглый год, два детских, джакузи и бар у воды. Профессорский уголок, до пляжа 650 м. Бронирование напрямую, без комиссии посредников.';

  return {
    title,
    description,
    keywords:
      'жильё в алуште с бассейном, отель алушта с бассейном, апартаменты с бассейном алушта, алушта отели с бассейном у моря, бассейн круглый год алушта, отдых с детьми алушта бассейн',
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
          url: 'https://lovelifestyle.ru/og-services.jpg',
          width: 1200,
          height: 630,
          alt: 'Бассейн с шезлонгами в апарт-отеле «Стиль Жизни» в Алуште',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['https://lovelifestyle.ru/og-services.jpg'],
    },
    robots: { index: true, follow: true, 'max-snippet': 150, 'max-image-preview': 'large' },
  };
}

const FACTS = [
  { value: '2', label: 'больших бассейна' },
  { value: 'круглый год', label: 'а не только летом' },
  { value: '2', label: 'детских бассейна' },
  { value: '650 м', label: 'до пляжа пешком' },
];

/* Со слов заказчицы, те же формулировки, что на /services. */
const AQUA = [
  'Два больших бассейна — работают круглый год',
  'Два детских бассейна с мелкой водой',
  'Джакузи',
  'Шезлонги вдоль воды',
  'Бар прямо в аквазоне',
  'Вид на море и горы одновременно',
];

const PHOTOS = [
  {
    src: '/images/aqua/pool-main.webp',
    alt: 'Большой бассейн аквазоны апарт-отеля «Стиль Жизни» в Алуште',
    caption: 'Большой бассейн',
  },
  {
    src: '/images/aqua/sea-mountains.webp',
    alt: 'Вид на море и горы от бассейнов апарт-отеля в Алуште',
    caption: 'Море и горы разом',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Работает ли бассейн зимой и не в сезон?',
    a: 'Да. Два больших бассейна открыты круглый год, а не только в летний сезон. Это редкость для Алушты: у большинства объектов бассейн работает три-четыре месяца.',
  },
  {
    q: 'Есть ли детский бассейн?',
    a: 'Есть, и не один — два отдельных детских бассейна с мелкой водой. Шезлонги стоят рядом, поэтому дети плещутся у себя, а взрослые отдыхают в нескольких шагах и всё время их видят.',
  },
  {
    q: 'Бассейн доступен всем гостям?',
    a: 'Нет, посещение аквазоны доступно в некоторых категориях апартаментов. Говорим об этом прямо, чтобы никто не приехал с неверным ожиданием: уточните у администратора по телефону 8 800 777 63 08 — подскажем, какие апартаменты подойдут.',
  },
  {
    q: 'Далеко ли от бассейна до моря?',
    a: 'До пляжа 650 метров пешком. Комплекс стоит в Профессорском уголке — тихой западной части Алушты, дорога к воде идёт без оживлённых перекрёстков.',
  },
];

export default function PoolPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://lovelifestyle.ru' },
          { '@type': 'ListItem', position: 2, name: 'Жильё с бассейном', item: URL },
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
      <LandingHeaderMode id="pool-page" />
      <LandingReveal />
      <JsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <header className="lp-hero">
        <div className="lp-hero-media">
          <Image
            src="/images/aqua/pool-loungers.webp"
            alt="Бассейн с шезлонгами и баром у воды в апарт-отеле «Стиль Жизни», Алушта"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="lp-hero-inner">
          <p className="lp-hero-eyebrow">Аквазона · Алушта</p>
          <h1 className="lp-hero-title">
            Снять жильё в Алуште <strong>с бассейном</strong>
          </h1>
          <p className="lp-hero-subtitle">
            Два больших бассейна, которые работают круглый год, два детских, джакузи и бар у
            воды — с видом на море и горы. Апарт-отель «Стиль Жизни» в Профессорском уголке,
            до пляжа 650 метров. Бронирование напрямую, без комиссии агрегаторов.
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

      {/* ===== КРУГЛЫЙ ГОД ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Главное отличие</p>
          <h2 className="lp-title lp-reveal">Бассейн, который не закрывается в сентябре</h2>
          <div className="lp-prose lp-reveal">
            <p>
              В Алуште «с бассейном» обычно значит «с бассейном в июле и августе». К середине
              сентября вода остывает, чаши накрывают, и всё, что остаётся, — это фотография в
              описании объекта. Поэтому бархатный сезон здесь традиционно продают морем, а не
              бассейном.
            </p>
            <p>
              У нас два больших бассейна работают круглый год. Это меняет смысл поездки в
              несезон: в октябре, феврале или марте, когда море уже или ещё не для купания,
              вода всё равно есть. Плюс джакузи и шезлонги вдоль бортика, а вид с них — на море
              и горы одновременно.
            </p>
          </div>

          <ul className="lp-checks lp-reveal">
            {AQUA.map((item) => (
              <li className="lp-check" key={item}>{item}</li>
            ))}
          </ul>

          <div className="lp-photos lp-reveal">
            {PHOTOS.map((photo) => (
              <figure className="lp-photo" key={photo.src}>
                <Image src={photo.src} alt={photo.alt} width={640} height={420} sizes="(max-width: 768px) 100vw, 50vw" />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== С ДЕТЬМИ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">С детьми</p>
          <h2 className="lp-title lp-reveal">Два детских бассейна, а не лягушатник в углу</h2>
          <div className="lp-prose lp-reveal">
            <p>
              Детских бассейнов два, с мелкой водой, и стоят они рядом с шезлонгами — дети
              плещутся у себя, взрослые отдыхают в нескольких шагах и всё время их видят. Не
              нужно выбирать между «посидеть» и «присмотреть».
            </p>
            <p>
              До пляжа 650 метров пешком, дорога идёт по тихой части города без оживлённых
              перекрёстков. В апартаментах есть кухня, так что кормить ребёнка по расписанию не
              проблема — не нужно подстраиваться под часы работы столовой.
            </p>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/services" className="lp-btn lp-btn-ghost">
              Подробнее об аквазоне и услугах
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ЧЕСТНАЯ ОГОВОРКА ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <div className="lp-note lp-reveal">
            <p className="lp-note-title">Аквазона доступна не во всех категориях апартаментов</p>
            <p className="lp-note-text">
              Пишем это на видном месте, а не мелким шрифтом внизу: приехать с неверным
              ожиданием — худшее, что может случиться с отпуском. Какие апартаменты дают доступ
              к бассейнам, подскажет администратор — позвоните по{' '}
              <a href={PHONE_FREE_TEL}>{PHONE_FREE}</a>, это бесплатно.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ЖИЛЬЁ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Жильё</p>
          <h2 className="lp-title lp-reveal">47 апартаментов рядом с водой</h2>
          <div className="lp-prose lp-reveal">
            <p>
              От студий до вариантов с отдельной спальней, площадью от 24 до 60 м², на компанию
              до пяти человек. В тридцати из сорока семи окна выходят на море, почти у каждого
              своя терраса. Внутри — кухонная зона, холодильник, стиральная машина, кондиционер,
              Wi-Fi и SMART TV.
            </p>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/apartments" className="lp-btn lp-btn-primary">
              Все апартаменты и свободные даты
            </Link>
            <Link href="/professorskiy-ugolok" className="lp-btn lp-btn-ghost">
              О районе — Профессорский уголок
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Частые вопросы</p>
          <h2 className="lp-title lp-reveal">О бассейнах и бронировании</h2>
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
            про доступ к аквазоне спросите администратора.
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
