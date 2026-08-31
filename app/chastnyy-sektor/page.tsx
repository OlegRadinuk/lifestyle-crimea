import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import Footer from '@/components/Footer';
import LandingHeaderMode from '../_landing/LandingHeaderMode';
import LandingReveal from '../_landing/LandingReveal';
import '../_landing/landing.css';

/* Посадочная под кластер «частный сектор».
 *
 * Вордстат (регион Россия, август 2026, снято через API Директа):
 * «частный сектор алушта» — 379 показов, «жильё алушта частный сектор» 172,
 * «снять частный сектор в алуште» 85, «снять жильё в алуште частный сектор»
 * 71, «алушта частный сектор недорого» 55, «алуште частный сектор без
 * посредников» 50. В прогнозе Директа это самый дешёвый клик из всего
 * ядра — 24 ₽ при CTR 14,7%.
 *
 * Тон страницы. Мы НЕ частный сектор и делать вид, что частный сектор, не
 * будем: это обман ожидания, за который платят возвратом и отзывом. Но
 * человек, который вводит этот запрос, ищет не комнату у хозяйки как
 * таковую — он ищет прямую бронь без посредников и без наценки. Это у нас
 * есть, и страница честно показывает, чем один вариант отличается от
 * другого, включая то, в чём частный сектор объективно выигрывает (цена).
 * Такая страница отвечает на запрос лучше, чем подделка под него.
 */

const PHONE_FREE = '8 800 777 63 08';
const PHONE_FREE_TEL = 'tel:88007776308';
const PHONE_MAIN = '+7 978 503 63 63';
const PHONE_MAIN_TEL = 'tel:+79785036363';

const URL = 'https://lovelifestyle.ru/chastnyy-sektor';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const title = 'Частный сектор в Алуште или апартаменты напрямую — что выбрать';
  const description =
    'Честное сравнение: чем частный сектор в Алуште отличается от апарт-отеля. Своя кухня и ванная, фиксированная цена, договор и уборка — бронирование напрямую, без комиссии посредников. Профессорский уголок, до пляжа 650 м.';

  return {
    title,
    description,
    keywords:
      'частный сектор алушта, жильё алушта частный сектор, снять частный сектор в алуште, алушта частный сектор недорого, алушта частный сектор без посредников, снять жильё в алуште без посредников',
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
          alt: 'Апартаменты в Алуште — бронирование напрямую, без посредников',
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
  { value: '0%', label: 'комиссии посредников' },
  { value: '47', label: 'апартаментов' },
  { value: '650 м', label: 'до пляжа пешком' },
  { value: '24/7', label: 'администратор' },
];

/* Сравнение по-честному: в первой колонке типичный частный сектор, во второй
   мы. Там, где частный сектор выигрывает, так и написано. */
const COMPARE: { row: string; priv: string; us: string }[] = [
  { row: 'Цена', priv: 'Обычно дешевле — это его главное преимущество', us: 'Дороже комнаты у хозяев, но без наценки агрегаторов' },
  { row: 'Кухня', priv: 'Часто общая с хозяевами или другими гостями', us: 'Своя в каждом апартаменте: плита, холодильник, посуда' },
  { row: 'Ванная', priv: 'Бывает общая на этаж', us: 'Своя в каждом апартаменте' },
  { row: 'Бронь', priv: 'По звонку или объявлению, часто без подтверждения', us: 'С сайта или по телефону, с подтверждением' },
  { row: 'Цена на месте', priv: 'Может измениться по приезде', us: 'Фиксируется при бронировании' },
  { row: 'Уборка', priv: 'Как договоритесь', us: 'По графику, смена белья включена' },
  { row: 'Если проблема', priv: 'Решать с хозяином', us: 'Администратор на связи круглосуточно' },
  { row: 'Бассейн', priv: 'Как правило нет', us: 'Два больших и два детских, круглый год' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Вы частный сектор?',
    a: 'Нет. «Стиль Жизни» — апарт-отель на Западной улице в Профессорском уголке: 47 отдельных апартаментов, у каждого своя кухня и ванная. Мы не сдаём комнаты в частном доме и не хотим, чтобы кто-то приехал с таким ожиданием.',
  },
  {
    q: 'Тогда почему вы в выдаче по частному сектору?',
    a: 'Потому что чаще всего этим запросом ищут не комнату у хозяйки как таковую, а возможность снять напрямую и без наценки. Это у нас есть: бронирование идёт с сайта или по телефону, комиссию агрегаторов вы не платите. А чем один вариант отличается от другого, честно показано в таблице выше.',
  },
  {
    q: 'Частный сектор дешевле?',
    a: 'Как правило да, и это его настоящее преимущество — глупо было бы утверждать обратное. Разница в том, что входит в цену: своя кухня и ванная, уборка со сменой белья, фиксированная стоимость, круглосуточный администратор и доступ к бассейнам в ряде категорий.',
  },
  {
    q: 'Можно снять надолго, на месяц и больше?',
    a: 'Да, помимо посуточного проживания есть долгосрочные тарифы. Что доступно на нужные даты и по какой цене, видно в каталоге, либо уточните по телефону 8 800 777 63 08 — звонок бесплатный.',
  },
];

export default function PrivateSectorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://lovelifestyle.ru' },
          { '@type': 'ListItem', position: 2, name: 'Частный сектор', item: URL },
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
      <LandingHeaderMode id="private-sector-page" />
      <LandingReveal />
      <JsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <header className="lp-hero">
        <div className="lp-hero-media">
          <Image
            src="/images/menu/apartments.webp"
            alt="Апартаменты в Алуште — бронирование напрямую, без посредников"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="lp-hero-inner">
          <p className="lp-hero-eyebrow">Алушта · без посредников</p>
          <h1 className="lp-hero-title">
            Частный сектор в Алуште — <strong>или апартаменты напрямую</strong>
          </h1>
          <p className="lp-hero-subtitle">
            Мы не частный сектор и не будем притворяться им. Но если вы ищете жильё без наценки
            посредников — это как раз к нам: 47 апартаментов со своей кухней и ванной, бронь
            напрямую, цена фиксируется сразу. Ниже честное сравнение, включая то, в чём частный
            сектор выигрывает.
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

      {/* ===== ЧТО ИЩУТ ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">По сути</p>
          <h2 className="lp-title lp-reveal">Что на самом деле ищут словами «частный сектор»</h2>
          <div className="lp-prose lp-reveal">
            <p>
              Почти всегда — три вещи: снять напрямую у того, кто сдаёт, не переплачивать
              посреднику и договориться по-человечески, а не через форму. Комната в доме у
              хозяйки тут скорее следствие, чем цель.
            </p>
            <p>
              Все три пункта у нас работают. Бронирование идёт напрямую с сайта или по телефону,
              комиссию агрегаторов вы не платите, а на любой вопрос отвечает живой администратор.
              Разница в том, что вы получаете за деньги: не комнату в чужой квартире, а
              отдельные апартаменты со своей кухней и ванной.
            </p>
            <p>
              И сразу про главное: частный сектор, как правило, дешевле. Это его настоящее
              преимущество, спорить с ним бессмысленно. Дальше — что входит в разницу.
            </p>
          </div>
        </div>
      </section>

      {/* ===== СРАВНЕНИЕ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Сравнение</p>
          <h2 className="lp-title lp-reveal">Частный сектор и апарт-отель — по пунктам</h2>
          <div className="lp-table-wrap lp-reveal">
            <table className="lp-table">
              <thead>
                <tr>
                  <th scope="col">&nbsp;</th>
                  <th scope="col">Частный сектор</th>
                  <th scope="col">«Стиль Жизни»</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((item) => (
                  <tr key={item.row}>
                    <th scope="row">{item.row}</th>
                    <td>{item.priv}</td>
                    <td>{item.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/apartments" className="lp-btn lp-btn-primary">
              Все апартаменты и свободные даты
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ГДЕ ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Где это</p>
          <h2 className="lp-title lp-reveal">Профессорский уголок, 650 метров до моря</h2>
          <div className="lp-prose lp-reveal">
            <p>
              Комплекс стоит на Западной улице, 4, корпус 3 — в тихой западной части Алушты у
              подножия горы Кастель. Сюда не заходит транзитный транспорт, дорога к пляжу идёт
              без оживлённых перекрёстков. Апартаменты — от 24 до 60 м², на компанию до пяти
              человек, в тридцати из сорока семи окна выходят на море.
            </p>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/professorskiy-ugolok" className="lp-btn lp-btn-ghost">
              Подробнее о районе
            </Link>
            <Link href="/zhile-s-basseynom" className="lp-btn lp-btn-ghost">
              Про бассейны круглый год
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Частые вопросы</p>
          <h2 className="lp-title lp-reveal">Без уверток</h2>
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
            на любой вопрос ответит администратор.
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
