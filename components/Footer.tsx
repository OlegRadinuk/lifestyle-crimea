'use client';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* LEFT */}
        <div className="footer__info">
          <h3 className="footer__title">
            Комплекс апартаментов «Стиль Жизни»
          </h3>

          <p className="footer__text">
            Современные апартаменты с видом на море в Алуште.
            Комфорт, сервис и эстетика для отдыха и жизни.
          </p>

          <div className="footer__contacts">
            <a href="tel:+79780000000">+7 (978) 503-63-63</a>
            <a href="tel:+79780000000">+7 (978) 696-45-10</a>
            <span>Алушта, Западная ул., 4, корп. 3</span>
          </div>

          <div className="footer__copy">
            © {new Date().getFullYear()} Стиль Жизни
          </div>
        </div>

        {/* RIGHT */}
        <div className="footer__map">
          <iframe
            src="https://yandex.ru/map-widget/v1/?um=constructor%3A822b160a4ecc5ebbd0bcd4d8b3999a074a3118a0cd0381c870a097d2c38bbc57&amp;source=constructor"
            width="100%"
            height="100%"
            frameBorder="0"
          />
        </div>
      </div>
    </footer>
  );
}
