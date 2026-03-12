'use client';

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
              <a href="tel:+79785036363" className="ff-phone">+7 (978) 503-63-63</a>
              <a href="tel:+79786964510" className="ff-phone">+7 (978) 696-45-10</a>
              <span className="ff-address">Алушта, Западная ул., 4, корп. 3</span>
            </div>

            <div className="ff-copyright">
              © {new Date().getFullYear()} Стиль Жизни
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