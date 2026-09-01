import Link from 'next/link';
import './apartment-content.css';

/* Блок «Похожие апартаменты» и ссылки на тематические страницы.
 *
 * Зачем. До него карточка апартамента была тупиком: одна внутренняя ссылка
 * на всю страницу, и так на всех 47 карточках. Вес с них никуда не тёк,
 * а робот, зайдя на карточку, не имел куда идти дальше — только назад.
 * Теперь с каждой карточки уходит восемь ссылок: четыре на соседние
 * апартаменты и четыре на каталог и посадочные.
 *
 * Компонент серверный намеренно: блок существует ради перелинковки, а
 * ссылки должны быть в отдаваемом HTML, а не появляться после гидратации.
 */

export type RelatedItem = {
  id: string;
  slug: string | null;
  title: string;
  area: number | null;
  max_guests: number | null;
  view: string | null;
  image: string | null;
};

const VIEW_TEXT: Record<string, string> = {
  sea: 'с видом на море',
  mountain: 'с видом на горы',
  city: 'с видом на город',
  garden: 'с видом во двор',
  mixed: 'с видом на море и горы',
};

export default function RelatedApartments({ items }: { items: RelatedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="apt-section apt-section-related" id="related">
      <div className="apt-section-container">
        <h2 className="apt-section-heading">Другие апартаменты</h2>

        <ul className="apt-related-grid">
          {items.map((item) => {
            const href = `/apartments/${item.slug || item.id}`;
            const view = item.view ? VIEW_TEXT[item.view] : null;
            return (
              <li key={item.id}>
                <Link href={href} className="apt-related-card">
                  <span className="apt-related-media">
                    {item.image ? (
                      /* Ниже сгиба и не является LCP — грузим лениво.
                         alt описательный: он же работает как текст ссылки
                         для поиска по картинкам. */
                      <img
                        src={item.image}
                        alt={`Апартаменты ${view ?? ''} в Алуште — «${item.title}»`.replace(/\s+/g, ' ')}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="apt-related-media--empty" aria-hidden="true" />
                    )}
                  </span>
                  <span className="apt-related-body">
                    <span className="apt-related-title">{item.title}</span>
                    <span className="apt-related-meta">
                      {[view, item.area ? `${item.area} м²` : null, item.max_guests ? `до ${item.max_guests} гостей` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <nav className="apt-related-links" aria-label="Разделы сайта">
          <Link href="/apartments">Все апартаменты и цены</Link>
          <Link href="/professorskiy-ugolok">Жильё в Профессорском уголке</Link>
          <Link href="/zhile-s-basseynom">Жильё с бассейном</Link>
          <Link href="/chastnyy-sektor">Без посредников</Link>
        </nav>
      </div>
    </section>
  );
}
