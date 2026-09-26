'use client';

import { useState } from 'react';
import { reachGoal } from '@/lib/analytics';

/* Короткая заявка на долгосрок прямо на первом экране.
 *
 * Зачем она вообще: чтобы оставить заявку, человек был обязан выбрать апартамент
 * из 32 карточек, раскрыть блок срока, открыть модалку и заполнить имя, фамилию,
 * телефон, точную дату заезда и число месяцев. Для посуточной брони это нормально —
 * гость едет на конкретные даты в конкретный номер. Для долгосрочной порядок решения
 * обратный: сначала «подходит ли мне это вообще», потом уже квартира.
 * За месяц через длинный путь не пришло ни одной заявки при 88 кликах.
 *
 * Поэтому здесь обязателен только телефон. Срок и «когда» — варианты выбора, а не
 * ввод: человек, который ещё не решил, не должен спотыкаться об обязательное поле.
 */

const TERMS = ['1 месяц', '2–3 месяца', 'полгода', 'год и дольше', 'ещё не решил'];
const WHENS = ['в этом месяце', 'через 1–2 месяца', 'позже', 'пока просто смотрю'];

type Status = 'idle' | 'sending' | 'done';

export default function LongTermLeadForm() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [term, setTerm] = useState('');
  const [when, setWhen] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const phoneDigits = phone.replace(/\D/g, '').length;
  const canSend = phoneDigits >= 10 && consent && status === 'idle';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    setStatus('sending');
    setError('');

    try {
      const response = await fetch('/api/leads/long-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: name,
          guestPhone: phone,
          termHint: term,
          whenHint: when,
          pdConsentAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Не удалось отправить. Позвоните нам.');
        setStatus('idle');
        return;
      }

      /* Цель та же, что у полной заявки: для Директа это одно и то же целевое
         действие, а какой формой оно получено — видно по параметру. */
      reachGoal('booking_longterm', { form: 'short_lead', term_hint: term || 'не указан' });
      setStatus('done');
    } catch {
      setError('Не удалось отправить. Позвоните нам.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div className="ltl" role="status">
        <p className="ltl__done-title">Заявка принята</p>
        <p className="ltl__done-text">
          Перезвоним и подберём апартамент под ваш срок. Если удобнее сейчас —{' '}
          <a href="tel:+79785036363">+7 (978) 503-63-63</a>
        </p>
      </div>
    );
  }

  return (
    <form className="ltl" onSubmit={submit} noValidate>
      <p className="ltl__title">Подберём под ваш срок</p>
      <p className="ltl__lead">
        Оставьте телефон — перезвоним, ответим по цене и условиям. Апартамент
        выбирать сейчас не нужно.
      </p>

      <div className="ltl__row">
        <input
          className="ltl__input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Телефон *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={status === 'sending'}
          aria-label="Телефон"
          required
        />
        <input
          className="ltl__input"
          type="text"
          autoComplete="given-name"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === 'sending'}
          aria-label="Имя"
        />
      </div>

      <div className="ltl__row">
        <select
          className="ltl__select"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={status === 'sending'}
          aria-label="На какой срок"
        >
          <option value="">На какой срок</option>
          {TERMS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="ltl__select"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          disabled={status === 'sending'}
          aria-label="Когда заезжать"
        >
          <option value="">Когда заезжать</option>
          {WHENS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      <label className="ltl__consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === 'sending'}
        />
        <span>
          Согласен на{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            обработку персональных данных
          </a>
        </span>
      </label>

      {error && <p className="ltl__error">{error}</p>}

      <button className="ltl__btn" type="submit" disabled={!canSend}>
        {status === 'sending' ? 'Отправляем…' : 'Перезвоните мне'}
      </button>
    </form>
  );
}
