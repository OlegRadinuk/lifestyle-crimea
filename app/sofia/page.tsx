import type { Metadata } from 'next';
import Image from 'next/image';
import Footer from '@/components/Footer';
import LandingHeaderMode from '../_landing/LandingHeaderMode';
import SofiaOpenChat from './SofiaOpenChat';
import './sofia.css';

/* Страница-ссылка на чат с Софией.
 *
 * Зачем отдельная страница. Виджет Софии висит на каждой странице сайта
 * плавающей кнопкой, но чтобы дать её конкретному человеку в переписке —
 * в Instagram, WhatsApp, на визитке — нужен один прямой URL, который сам
 * открывает диалог, а не просто «зайдите на сайт и найдите кнопку внизу
 * справа». lovelifestyle.ru/sofia — эта ссылка.
 *
 * noindex: страница существует ради прямых переходов по конкретной ссылке,
 * не ради органического трафика — в поиске ей соревноваться не с кем и не
 * за что, а дублировать смысл каталога в выдаче незачем.
 */

export const metadata: Metadata = {
  title: 'Написать Софии — Стиль Жизни, Алушта',
  description:
    'Прямой чат с Софией, персональным помощником апарт-отеля «Стиль Жизни» в Алуште. Подберёт апартамент под даты и число гостей, ответит на вопросы о заезде и ценах.',
  robots: { index: false, follow: true },
};

export default function SofiaPage() {
  return (
    <main className="sofia-page">
      <LandingHeaderMode id="sofia-page" />
      <SofiaOpenChat />

      <div className="sofia-inner">
        <div className="sofia-avatar">
          <Image
            src="/images/logo/logo-white.webp"
            alt=""
            width={96}
            height={96}
            aria-hidden="true"
          />
        </div>

        <p className="sofia-eyebrow">Стиль Жизни · Алушта</p>
        <h1 className="sofia-title">София уже открывает чат</h1>
        <p className="sofia-subtitle">
          Персональный помощник апарт-отеля. Расскажите, на какие даты и сколько
          гостей — София подберёт апартамент и вид, который подойдёт именно вам.
        </p>

        <p className="sofia-hint">
          Если окно чата не появилось само — оно откроется кнопкой в правом нижнем углу.
        </p>
      </div>

      <Footer />
    </main>
  );
}
