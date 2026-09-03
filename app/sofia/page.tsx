import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import LandingHeaderMode from '../_landing/LandingHeaderMode';
import LandingReveal from '../_landing/LandingReveal';
import SofiaOpenChat from './SofiaOpenChat';
import '../_landing/landing.css';
import './sofia.css';

/* Страница-ссылка на чат с Софией.
 *
 * Зачем отдельная страница. Виджет Софии висит на каждой странице сайта
 * плавающей кнопкой, но чтобы дать её конкретному человеку в переписке —
 * в Instagram, WhatsApp, на визитке — нужен один прямой URL, который сам
 * открывает диалог, а не просто «зайдите на сайт и найдите кнопку внизу
 * справа». lovelifestyle.ru/sofia — эта ссылка.
 *
 * Текст сцены нарочно слева: на десктопе виджет открывается панелью в
 * правом нижнем углу (см. app/layout.tsx), и левая колонка — единственное
 * место, где заголовок не окажется под ним же секунду спустя.
 *
 * noindex: страница существует ради прямых переходов по ссылке, не ради
 * органического трафика — в поиске ей соревноваться не с кем и не за что.
 */

export const metadata: Metadata = {
  title: 'Написать Софии — Стиль Жизни, Алушта',
  description:
    'Прямой чат с Софией, персональным помощником апарт-отеля «Стиль Жизни» в Алуште. Подберёт апартамент под даты и число гостей, ответит на вопросы о заезде и ценах.',
  robots: { index: false, follow: true },
};

const SKILLS = [
  {
    title: 'Подберёт апартамент',
    text: 'Под ваши даты, число гостей и бюджет — с конкретным этажом, видом и ценой, а не общим списком.',
  },
  {
    title: 'Проверит свободные даты',
    text: 'Прямо в переписке, без ожидания на линии — данные о занятости обновляются в реальном времени.',
  },
  {
    title: 'Расскажет про виды и планировки',
    text: 'Море, горы или город; студия или отдельная спальня — сравнит варианты под то, что важно именно вам.',
  },
  {
    title: 'Работает круглосуточно',
    text: 'Отвечает за секунды в любое время — не нужно подгадывать рабочие часы менеджера.',
  },
];

export default function SofiaPage() {
  return (
    <main className="lp-page sofia-page">
      <LandingHeaderMode id="sofia-page" />
      <LandingReveal />

      {/* ===== HERO ===== */}
      <header className="lp-hero sofia-hero">
        <div className="lp-hero-media">
          <Image
            src="/images/menu/apartments.webp"
            alt="Апартамент апарт-отеля «Стиль Жизни» в Алуште"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="lp-hero-inner sofia-hero-inner">
          <span className="sofia-badge">
            <span className="sofia-badge-dot" aria-hidden="true" />
            София · онлайн
          </span>

          <p className="lp-hero-eyebrow">Стиль Жизни · Алушта</p>
          <h1 className="lp-hero-title">Спросите у Софии</h1>
          <p className="lp-hero-subtitle">
            Персональный помощник апарт-отеля. Напишите, на какие даты и сколько
            гостей — подберёт апартамент и вид, который подойдёт именно вам.
          </p>

          <SofiaOpenChat />
        </div>
      </header>

      {/* ===== ЧЕМ ПОМОЖЕТ ===== */}
      <section className="lp-section">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">Чем поможет</p>
          <h2 className="lp-title lp-reveal">Не бот с меню, а живой подбор варианта</h2>

          <ul className="sofia-skills lp-reveal">
            {SKILLS.map((s) => (
              <li key={s.title} className="sofia-skill">
                <span className="sofia-skill-title">{s.title}</span>
                <span className="sofia-skill-text">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== О КОМПЛЕКСЕ + ССЫЛКИ ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-inner">
          <p className="lp-eyebrow lp-reveal">О комплексе</p>
          <h2 className="lp-title lp-reveal">47 апартаментов в Профессорском уголке</h2>
          <div className="lp-prose lp-reveal">
            <p>
              Апарт-отель «Стиль Жизни» стоит на Западной улице в тихой части Алушты, до
              пляжа 650 метров пешком. Своя кухня и терраса в каждом апартаменте, бассейны
              работают круглый год. Бронирование напрямую, без комиссии посредников.
            </p>
          </div>
          <div className="lp-links lp-reveal">
            <Link href="/apartments" className="lp-btn lp-btn-primary">
              Смотреть апартаменты и цены
            </Link>
            <Link href="/professorskiy-ugolok" className="lp-btn lp-btn-ghost">
              О районе
            </Link>
            <Link href="/zhile-s-basseynom" className="lp-btn lp-btn-ghost">
              Про бассейны
            </Link>
          </div>

          {/* Не карточка и не секция — специально одной строкой и без
              заголовка. Заявки нужны через Софию, там сразу видно даты и
              число гостей; звонок никто не собирает и не структурирует.
              Строка не пропадает — кому действительно нужно, найдёт её и
              так, просто не завлекаем ей никого специально. */}
          <p className="sofia-phone-note lp-reveal">
            Если удобнее позвонить — <a href="tel:88007776308">8 800 777 63 08</a>.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
