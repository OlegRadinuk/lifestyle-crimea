'use client';

import Link from 'next/link';

interface FooterProps {
  isMobile?: boolean;
}

export default function Footer({ isMobile = false }: FooterProps) {
  return (
    <footer className={`ff-footer ${isMobile ? 'ff-footer-mobile' : 'ff-footer-desktop'}`}>
      <div className="ff-container">
        <div className="ff-grid">
          {/* Левая колонка */}
          <div className="ff-info">
            <h3 className="ff-title">
              Комплекс апартаментов «Стиль Жизни»
            </h3>

            <p className="ff-description">
              Современные апартаменты с видом на море в Алуште.
              Комфорт, сервис и эстетика для отдыха и жизни.
            </p>

            <div className="ff-contacts">
              <a href="tel:+79785036363" className="ff-phone">+7 978 503 63 63</a>
              <a href="tel:+79786964510" className="ff-phone">+7 978 696 45 10</a>
              <a href="tel:88007776308" className="ff-phone">8 800 777 63 08 <span className="ff-phone-note">бесплатный</span></a>
              <span className="ff-address">Алушта, Западная ул., 4, корп. 3</span>
            </div>

            {/* Навигация в футере. Раньше её тут не было вовсе — футер стоит на
                каждой странице и не вёл никуда, кроме политики. Из-за этого с
                главной уходило всего две внутренние ссылки, а с карточки одна:
                вес не растекался, и новые страницы висели в пустоте. */}
            <nav className="ff-nav" aria-label="Разделы сайта">
              <Link href="/apartments" className="ff-nav-link">Апартаменты</Link>
              <Link href="/professorskiy-ugolok" className="ff-nav-link">Профессорский уголок</Link>
              <Link href="/services" className="ff-nav-link">Аквазона и услуги</Link>
              <Link href="/concept" className="ff-nav-link">Концепция</Link>
              <Link href="/news" className="ff-nav-link">Новости</Link>
            </nav>

            <div className="ff-copyright">
              © {new Date().getFullYear()} Стиль Жизни
            </div>

            <div className="ff-legal">
              <Link href="/privacy" className="ff-legal-link">
                Политика конфиденциальности
              </Link>
            </div>
          </div>

          {/* Правая колонка - карта */}
          <div className="ff-map">
            <iframe
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A822b160a4ecc5ebbd0bcd4d8b3999a074a3118a0cd0381c870a097d2c38bbc57&amp;source=constructor"
              width="100%"
              height="100%"
              frameBorder="0"
              title="Карта"
              allowFullScreen
              className="ff-map-iframe"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}