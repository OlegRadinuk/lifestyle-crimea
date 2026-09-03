/**
 * Подсказка «нажми, чтобы посмотреть фото» на фотографии апартамента.
 *
 * Гость жаловался: непонятно, что по фото вообще можно кликнуть — оно
 * выглядело как обычная картинка. Вместо иконки лупы или базового эмодзи —
 * расходящиеся кольца, как круги на воде от брошенного камня: слабый намёк
 * на «тронь — и что-то откроется», без слов.
 *
 * Только мобилка: на десктопе рядом с фото есть текст и кнопки, кликабельность
 * фото и так очевидна из контекста. На телефоне фото — весь экран, других
 * подсказок нет.
 *
 * Чисто декоративный элемент (`pointer-events: none`): клик по фото ловит
 * сама картинка или прозрачная кнопка поверх него, эта подсказка ничего
 * не перехватывает.
 */
export default function PhotoHint() {
  return (
    <div className="apt-photo-hint" aria-hidden="true">
      <span className="apt-photo-hint__ripple">
        <span className="apt-photo-hint__ring apt-photo-hint__ring--1" />
        <span className="apt-photo-hint__ring apt-photo-hint__ring--2" />
        <span className="apt-photo-hint__ring apt-photo-hint__ring--3" />
        <span className="apt-photo-hint__dot" />
      </span>
      <span className="apt-photo-hint__text">Смотреть</span>
    </div>
  );
}
