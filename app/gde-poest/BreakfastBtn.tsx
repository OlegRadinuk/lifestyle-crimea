'use client';

/**
 * Кнопка «Завтрак» в секции «Эндорфин».
 * При клике открывает нижнюю шторку ContactSheet через кастомное событие.
 */
export default function BreakfastBtn() {
  const openSheet = () => {
    window.dispatchEvent(new CustomEvent('open-contact-sheet'));
  };

  return (
    <button
      className="gp-end-btn-secondary"
      onClick={openSheet}
      type="button"
    >
      Завтрак
    </button>
  );
}
