'use client';

import { FeatureIcon } from './ApartmentHero';
import { renderDescription } from './renderDescription';
import './apartment-content.css';

/**
 * Секции под первым экраном апартамента.
 *
 * Зачем: `.apartment-hero` — ровно один экран (100svh + overflow: hidden),
 * поэтому описание в него не помещалось: на мобиле его резал line-clamp,
 * на десктопе блок схлопывался в узкую плашку с многоточиями. Владелец
 * так и написал — «не видно на десктопе описания, оно сжато».
 *
 * Эти секции живут ПОСЛЕ hero в обычном потоке страницы: за счёт них
 * документ становится выше вьюпорта и появляется нормальная прокрутка.
 * Собственного скролл-контейнера здесь намеренно нет — лайтбокс фиксирует
 * body и возвращает `window.scrollY`, а с внутренним скроллом это сломается.
 */

type Props = {
  title: string;
  description: string;
  features: string[];
  maxGuests: number;
  area: number;
};

export default function ApartmentSections({ title, description, features, maxGuests, area }: Props) {
  const hasDescription = Boolean(description?.trim());
  const hasFeatures = features?.length > 0;

  if (!hasDescription && !hasFeatures) return null;

  return (
    <>
      {hasDescription && (
        <section className="apt-section apt-section-description" id="apartment-description">
          <div className="apt-section-container">
            <p className="apt-section-meta">
              {area ? `${area} м²` : ''}{area && maxGuests ? ' · ' : ''}
              {maxGuests ? `до ${maxGuests} гостей` : ''}
            </p>
            <h2 className="apt-section-heading">Об апартаменте</h2>
            <div className="apt-section-text">{renderDescription(description)}</div>
          </div>
        </section>
      )}

      {hasFeatures && (
        <section className="apt-section apt-section-features" id="apartment-features">
          <div className="apt-section-container">
            <h2 className="apt-section-heading">
              Что внутри <span className="apt-section-count">{features.length}</span>
            </h2>
            <div className="apt-features-grid-content">
              {features.map((feature, i) => (
                <div key={`${feature}-${i}`} className="apt-feature-card-content">
                  <span className="apt-feature-card-content__icon">
                    <FeatureIcon name={feature} />
                  </span>
                  <span className="apt-feature-card-content__label">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="apt-section apt-section-cta">
        <div className="apt-cta-inner">
          <h2 className="apt-cta-heading">Свободно на ваши даты?</h2>
          <p className="apt-cta-sub">
            {title} — бронирование напрямую, без комиссии посредников.
          </p>
          <button
            type="button"
            className="apt-cta-btn"
            onClick={() => {
              /* Кнопка проверки доступности живёт в шапке — она открывает
                 календарь. Отсюда просто поднимаем человека к ней. */
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                const btn = document.querySelector<HTMLButtonElement>('.header__booking');
                btn?.click();
              }, 500);
            }}
          >
            Проверить даты
          </button>
        </div>
      </section>
    </>
  );
}
