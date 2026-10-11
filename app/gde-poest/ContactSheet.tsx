'use client';

import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { IconPhone, IconBreakfast } from './icons';
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
  // burgerOpen=true пока открыто бургер-меню: кнопка скрывается под оверлеем
  const [burgerOpen, setBurgerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
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

  // ── Зеркалим позицию кнопки «МЕНЮ» в шапке ──────────────────────────────
  // Читаем getBoundingClientRect у .header__burger и выставляем нашей кнопке:
  //   top    = r.top     (та же высота над экраном)
  //   height = r.height  (тот же размер, учитывая transform:scale(1.5))
  //   right  = r.left    (зеркально: наш правый отступ = левый отступ МЕНЮ)
  //
  // ПРОБЛЕМА МОМЕНТА ЗАМЕРА: шапка стартует с translateY(-24px) и анимируется
  // в translateY(0) за 1с (delay 0.2s + duration 0.8s). Если читать rect
  // сразу при монтировании — top занижен на ~24px.
  // РЕШЕНИЕ:
  //   1. animationend на .header — срабатывает точно в момент завершения анимации.
  //   2. Несколько догоняющих замеров на 100/300/600/1100мс — ловят анимацию
  //      в процессе и закрывают случай, если animationend уже проскочил.
  //   3. ResizeObserver на .header__burger — ловит повторные изменения геометрии.
  //   4. resize — уже был, оставляем.
  //   Все таймеры и наблюдатели сняты в cleanup, утечек нет.
  useEffect(() => {
    const sync = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const menuBtn = document.querySelector<HTMLElement>('.header__burger');
      if (!menuBtn) return;
      const r = menuBtn.getBoundingClientRect();
      btn.style.top = `${r.top}px`;
      btn.style.height = `${r.height}px`;
      btn.style.right = `${r.left}px`;
    };

    // Первый замер (может быть неточным — шапка ещё едет)
    sync();

    // Догоняющие замеры: покрывают delay 200ms + duration 800ms = 1000ms
    const delays = [100, 300, 600, 1100];
    const timers = delays.map(ms => setTimeout(sync, ms));

    // animationend на .header — самый точный момент: анимация завершилась
    const headerEl = document.querySelector<HTMLElement>('.header');
    headerEl?.addEventListener('animationend', sync, { once: true });

    // ResizeObserver — ловит изменения геометрии кнопки после анимации
    let ro: ResizeObserver | null = null;
    const menuBtn = document.querySelector<HTMLElement>('.header__burger');
    if (menuBtn) {
      ro = new ResizeObserver(sync);
      ro.observe(menuBtn);
    }

    window.addEventListener('resize', sync);

    return () => {
      timers.forEach(clearTimeout);
      headerEl?.removeEventListener('animationend', sync);
      ro?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  // ── Скрываем при открытом бургер-меню ────────────────────────────────────
  // Бургер-оверлей (.burger-overlay, z-index:9999) монтируется прямым ребёнком body.
  // Наш button имеет z-index:5100 — ниже оверлея, но MutationObserver позволяет
  // скрыть кнопку явно (opacity:0 + pointer-events:none) вместо того чтобы она
  // была видна через blur-backdrop бургера.
  useEffect(() => {
    const check = () => {
      setBurgerOpen(!!document.querySelector('.burger-overlay'));
    };

    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true });
    check();

    return () => mo.disconnect();
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
      {/* ── Кнопка в правом верхнем углу ───────────────────── */}
      {/* burgerOpen → класс --hidden → opacity:0 + pointer-events:none
          tabIndex={-1} убирает из Tab-порядка; aria-hidden скрывает от скринридеров */}
      <button
        ref={triggerRef}
        className={`gp-sheet-trigger${burgerOpen ? ' gp-sheet-trigger--hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Открыть меню связи"
        tabIndex={burgerOpen ? -1 : undefined}
        aria-hidden={burgerOpen ? true : undefined}
      >
        <IconPhone className="gp-sheet-trigger-icon" />
        Связаться
      </button>

      {/* ── Шторка ──────────────────────────────────────────── */}
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
