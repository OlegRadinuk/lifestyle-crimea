'use client';

import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { IconPhone, IconBreakfast } from './icons';
import { CONSENT_KEY, CONSENT_EVENT } from '@/lib/analytics';

/**
 * Нижняя шторка «Связаться» + липкая кнопка-триггер.
 *
 * Доступность:
 * - role="dialog" + aria-modal="true" на шторке
 * - aria-labelledby → заголовок «Связаться»
 * - aria-expanded на кнопке-триггере
 * - Фокус уходит внутрь при открытии, возвращается на триггер при закрытии
 * - Закрытие по Esc и по тапу/клику в затемнение
 * - Фокус-ловушка: Tab не уходит за пределы шторки
 *
 * Другие компоненты (BreakfastBtn) открывают шторку через
 * window.dispatchEvent(new CustomEvent('open-contact-sheet')).
 */
export default function ContactSheet() {
  const [open, setOpen] = useState(false);
  // heroVisible=true пока герой занимает ≥50% экрана: кнопка скрыта
  const [heroVisible, setHeroVisible] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Вклад каждого «соседа» в отступ кнопки — итог = Math.max(banner, sofia, 0)
  const bannerOffsetRef = useRef(0);
  const sofiaOffsetRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // ── Скрываем кнопку пока виден герой ──────────────────────
  useEffect(() => {
    const heroEl = document.querySelector<HTMLElement>('.gp-hero');
    if (!heroEl) {
      // Если герой не найден — показываем кнопку сразу
      setHeroVisible(false);
      return;
    }
    // threshold 0.5: когда герой занимает ≥50% вьюпорта — isIntersecting=true → скрыть
    const io = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    io.observe(heroEl);
    return () => io.disconnect();
  }, []);

  const focusReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    // Возврат фокуса на триггер (ждём, пока React размонтирует шторку)
    if (focusReturnTimer.current) clearTimeout(focusReturnTimer.current);
    focusReturnTimer.current = setTimeout(() => {
      triggerRef.current?.focus();
      focusReturnTimer.current = null;
    }, 50);
  }, []);

  // Снимаем страховочный таймер фокуса при размонтировании
  useEffect(() => {
    return () => {
      if (focusReturnTimer.current) clearTimeout(focusReturnTimer.current);
    };
  }, []);

  // ── Поднимаем кнопку над куки-баннером ──────────────────
  // CookieBanner монтируется позже нашего компонента (в своём useEffect),
  // поэтому разовой проверки при монтировании недостаточно.
  //
  // Стратегия:
  //   1. Ищем баннер по ИНЛАЙН-стилю (element.style.*), а не по getComputedStyle:
  //      CookieBanner рендерится из React c style={{position:'fixed', zIndex:9999, …}}
  //      — атрибут style на DOM-узле заполнен напрямую. Это даёт ту же точность
  //      селектора, но без принудительного layout-reflow на каждый div страницы.
  //      Проверка getComputedStyle по сотням div в subtree body на каждую мутацию
  //      DOM (виджет «София» подгружается асинхронно и мутирует постоянно) была
  //      ощутимо дорогой.
  //   2. Если не нашли сразу — MutationObserver на body ловит появление, callback
  //      дебаунсится через requestAnimationFrame и останавливается максимум через
  //      3 секунды, чтобы не висеть на мутациях «Софии» бесконечно.
  //   3. Запасная константа 96px → 112px bottom (CSS прибавляет 16px) через 800 мс,
  //      если баннер так и не нашёлся.
  //   4. Пересчёт при resize окна.
  //   5. Сброс по CONSENT_EVENT.
  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY)) return; // баннера нет — выходим
    } catch {
      // приватный режим / отключённые куки: читать нечего → баннер в DOM
      // всё равно появится, идём дальше по общему пути.
    }

    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    let rafId: number | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let giveUpTimer: ReturnType<typeof setTimeout> | null = null;
    let bannerEl: HTMLElement | null = null;

    // 96 + 16 (дефолт из CSS) = 112px от низа экрана — запасная константа
    const FALLBACK_OFFSET = '96px';
    const GIVE_UP_MS = 3000; // хватит ждать баннер — иначе fallback
    const FALLBACK_MS = 800;

    const setOffset = (px: string) =>
      triggerRef.current?.style.setProperty('--gp-trigger-offset', px);
    const clearOffset = () =>
      triggerRef.current?.style.removeProperty('--gp-trigger-offset');

    // Дешёвый поиск: баннер ставит инлайн-стили через React style-prop, значит
    // position/zIndex лежат прямо в element.style — чтение не триггерит layout.
    const findBanner = (): HTMLElement | null => {
      const divs = document.body.querySelectorAll<HTMLDivElement>('div');
      for (const div of divs) {
        if (div.style.position === 'fixed' && div.style.zIndex === '9999') {
          return div;
        }
      }
      return null;
    };

    // Пересчёт: низ нашей кнопки — на 12px выше верха баннера.
    // CSS: bottom = var(--gp-trigger-offset, 0px) + 16px
    // Хотим: bottom_from_viewport = viewportH - bannerTop + 12
    //   → var = viewportH - bannerTop + 12 - 16 = viewportH - bannerTop - 4
    const updateOffset = () => {
      if (!triggerRef.current || !bannerEl) return;
      const rect = bannerEl.getBoundingClientRect();
      bannerOffsetRef.current = Math.max(0, window.innerHeight - rect.top - 4);
      // Итоговый отступ — максимум из вклада баннера и вклада Sofii
      setOffset(`${Math.max(bannerOffsetRef.current, sofiaOffsetRef.current)}px`);
    };

    const stopSearching = () => {
      mo?.disconnect(); mo = null;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      if (giveUpTimer) { clearTimeout(giveUpTimer); giveUpTimer = null; }
    };

    const startObserving = () => {
      if (!bannerEl) return;
      stopSearching();
      ro = new ResizeObserver(updateOffset);
      ro.observe(bannerEl);
      window.addEventListener('resize', updateOffset);
      updateOffset();
    };

    const tryFind = (): boolean => {
      bannerEl = findBanner();
      if (bannerEl) { startObserving(); return true; }
      return false;
    };

    if (!tryFind()) {
      // Баннер ещё не в DOM — ждём появления через MutationObserver.
      // Коалесцируем множественные мутации «Софии» в один скан через rAF.
      mo = new MutationObserver(() => {
        if (bannerEl || rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (!bannerEl) tryFind();
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });

      // Страховка: если через 800 мс баннер не нашёлся — применяем константу
      fallbackTimer = setTimeout(() => {
        if (!bannerEl) setOffset(FALLBACK_OFFSET);
      }, FALLBACK_MS);

      // Через 3 сек точно хватит сканировать: если баннера нет — не придёт,
      // мутации «Софии» дальше не наши проблемы.
      giveUpTimer = setTimeout(() => {
        if (!bannerEl) stopSearching();
      }, GIVE_UP_MS);
    }

    const onConsent = () => {
      stopSearching();
      ro?.disconnect(); ro = null;
      window.removeEventListener('resize', updateOffset);
      bannerEl = null;
      bannerOffsetRef.current = 0;
      // Если виджет «Sofia» ещё активен — оставляем его вклад
      if (sofiaOffsetRef.current > 0) {
        triggerRef.current?.style.setProperty('--gp-trigger-offset', `${sofiaOffsetRef.current}px`);
      } else {
        clearOffset();
      }
    };

    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      stopSearching();
      ro?.disconnect();
      window.removeEventListener('resize', updateOffset);
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, []);

  // ── Синхронизируем нижний край кнопки с виджетом «Sofia» ─────────────
  // Виджет «Sofia» — внешний чат-ассистент, подключается скриптом асинхронно.
  // Ищем фиксированный элемент с inline z-index 10055.
  // CSS: button.bottom = --gp-trigger-offset + 16px
  // Хотим: button.bottom = sofiaEl.bottomFromViewport
  // → --gp-trigger-offset = sofiaEl.bottomFromViewport - 16
  // Итоговый отступ — Math.max с вкладом куки-баннера (bannerOffsetRef).
  useEffect(() => {
    let sofiaEl: HTMLElement | null = null;
    let sofiaRo: ResizeObserver | null = null;
    let sofiaRaf: number | null = null;
    let sofiaMo: MutationObserver | null = null;

    const findSofia = (): HTMLElement | null => {
      // 1. По известному ID виджета (O(1), самый быстрый)
      const byId = document.getElementById('opsph-btn');
      if (byId) return byId as HTMLElement;
      // 2. Фолбэк: кнопка с текстом «Sofia» (если вендор сменит ID)
      const buttons = document.body.querySelectorAll<HTMLButtonElement>('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('София') || btn.textContent?.includes('Sofia')) {
          return btn;
        }
      }
      return null;
    };

    const applyWithSofia = () => {
      if (!triggerRef.current) return;
      const final = Math.max(sofiaOffsetRef.current, bannerOffsetRef.current);
      if (final > 0) {
        triggerRef.current.style.setProperty('--gp-trigger-offset', `${final}px`);
      } else {
        triggerRef.current.style.removeProperty('--gp-trigger-offset');
      }
    };

    const updateSofia = () => {
      if (!sofiaEl) return;
      const r = sofiaEl.getBoundingClientRect();
      const sofiaBottomFromViewportBottom = window.innerHeight - r.bottom;
      // CSS bottom = --gp-trigger-offset + 16px → чтобы bottom = sofiaBottomFromViewportBottom,
      // нужно: --gp-trigger-offset = sofiaBottomFromViewportBottom - 16
      sofiaOffsetRef.current = Math.max(0, sofiaBottomFromViewportBottom - 16);
      applyWithSofia();
    };

    const startObservingSofia = () => {
      sofiaMo?.disconnect(); sofiaMo = null;
      if (sofiaRaf !== null) { cancelAnimationFrame(sofiaRaf); sofiaRaf = null; }
      sofiaRo = new ResizeObserver(updateSofia);
      sofiaRo.observe(sofiaEl!);
      window.addEventListener('resize', updateSofia);
      updateSofia();
    };

    const tryFindSofia = (): boolean => {
      sofiaEl = findSofia();
      if (sofiaEl) { startObservingSofia(); return true; }
      return false;
    };

    if (!tryFindSofia()) {
      // Sofia ещё не загрузилась — ждём через MutationObserver
      sofiaMo = new MutationObserver(() => {
        if (sofiaEl || sofiaRaf !== null) return;
        sofiaRaf = requestAnimationFrame(() => {
          sofiaRaf = null;
          if (!sofiaEl) tryFindSofia();
        });
      });
      sofiaMo.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      sofiaMo?.disconnect();
      if (sofiaRaf !== null) cancelAnimationFrame(sofiaRaf);
      sofiaRo?.disconnect();
      window.removeEventListener('resize', updateSofia);
      sofiaOffsetRef.current = 0;
    };
  }, []);

  // Слушаем кастомное событие от BreakfastBtn и других компонентов
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-contact-sheet', handler);
    return () => window.removeEventListener('open-contact-sheet', handler);
  }, []);

  // Esc + фокус-ловушка
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Фокус внутрь при открытии
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const first = sheetRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), a[href]'
        );
        first?.focus();
      });
    }
  }, [open]);

  // Блокировка скролла: сохраняем исходный overflow, чтобы не затереть
  // чужой inline-style (например, модалки ModalProvider поверх страницы).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <>
      {/* ── Липкая кнопка ───────────────────────────── */}
      {/* heroVisible=true → класс --hero → opacity:0 + pointer-events:none
          tabIndex={-1} убирает из Tab-порядка; aria-hidden скрывает от скринридеров */}
      <button
        ref={triggerRef}
        className={`gp-sheet-trigger${heroVisible ? ' gp-sheet-trigger--hero' : ''}`}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Открыть меню связи"
        tabIndex={heroVisible ? -1 : undefined}
        aria-hidden={heroVisible ? true : undefined}
      >
        <IconPhone className="gp-sheet-trigger-icon" />
        Связаться
      </button>

      {/* ── Шторка ──────────────────────────────────── */}
      {open && (
        <div
          className="gp-sheet-backdrop"
          onClick={handleBackdrop}
        >
          <div
            ref={sheetRef}
            className="gp-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            {/* Ручка-закрывашка */}
            <button
              className="gp-sheet-handle-btn"
              onClick={close}
              aria-label="Закрыть"
            >
              <span className="gp-sheet-handle" aria-hidden="true" />
            </button>

            <h2 id={titleId} className="gp-sheet-title">
              Связаться
            </h2>

            {/* Строка 1 — Ресепшн */}
            <a
              href="tel:88007776308"
              className="gp-sheet-row gp-sheet-row--teal"
            >
              <span className="gp-sheet-row-ico gp-sheet-row-ico--white">
                <IconPhone />
              </span>
              <span className="gp-sheet-row-text">
                <span className="gp-sheet-row-name">Ресепшн</span>
                <span className="gp-sheet-row-sub">8 800 777 63 08 — бесплатно</span>
              </span>
            </a>

            {/* Строка 2 — Завтрак */}
            <a
              href="tel:88007776308"
              className="gp-sheet-row gp-sheet-row--light"
            >
              <span className="gp-sheet-row-ico gp-sheet-row-ico--teal">
                <IconBreakfast />
              </span>
              <span className="gp-sheet-row-text">
                <span className="gp-sheet-row-name gp-sheet-row-name--dark">
                  Заказать завтрак
                </span>
                <span className="gp-sheet-row-sub gp-sheet-row-sub--dark">
                  в «Эндорфине» по тарифу отеля
                </span>
              </span>
            </a>

            {/* Доставка */}
            <div className="gp-sheet-delivery">
              <p className="gp-sheet-delivery-label">ДОСТАВКА ЕДЫ</p>
              <div className="gp-sheet-chips">
                <a href="tel:+79787288439" className="gp-sheet-chip">
                  Встреча
                </a>
                <a href="tel:+79783045262" className="gp-sheet-chip">
                  Старый город
                </a>
                <a href="tel:88003505052" className="gp-sheet-chip">
                  Роппонги
                </a>
                <a href="tel:+79782706133" className="gp-sheet-chip">
                  Хинкалыч
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
