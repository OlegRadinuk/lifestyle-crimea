'use client';

import { useEffect } from 'react';
import { YM_ID, reachGoal } from '@/lib/analytics';

/**
 * Цель «заявка через Софию» — ловим отправку контакта в чат-виджете.
 *
 * Зачем вообще: заявки из чата уходят на платформу Optisphere и дальше в
 * Telegram, минуя сайт. Для Метрики их не существует, поэтому в отчётах
 * Директа по рекламе стоял ноль конверсий, хотя живые лиды приходили —
 * считались только микродействия вроде «открыл календарь».
 *
 * Почему через DOM, а не по событию: widget.js на optisphere.tech общий
 * для четырёх ботов и никаких событий наружу не шлёт. Трогать чужой общий
 * файл ради одного клиента — плохая идея, а вот наблюдать за собственным
 * DOM мы вправе. Виджет при успешной отправке заменяет карточку формы на
 * блок с классом .opsph-lead-ok («Заявка принята!») — его появление и есть
 * надёжный признак, что контакт ушёл на сервер, а не что гость просто
 * потыкал в поля.
 *
 * Хрупкость осознанная: если Optisphere переименует класс, цель перестанет
 * срабатывать молча. Поэтому класс вынесен в константу и назван в одном
 * месте — при обновлении виджета проверять здесь.
 */
const LEAD_OK_CLASS = 'opsph-lead-ok';

export default function SofiaLeadGoal() {
  useEffect(() => {
    if (!YM_ID) return;

    /* Одна заявка за сессию: виджет не даёт отправить форму дважды, но
       MutationObserver может увидеть один и тот же узел при перерисовке. */
    let fired = false;

    const isLeadOk = (node: Node): boolean =>
      node instanceof HTMLElement &&
      (node.classList.contains(LEAD_OK_CLASS) ||
        node.querySelector?.(`.${LEAD_OK_CLASS}`) != null);

    const observer = new MutationObserver((records) => {
      if (fired) return;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (isLeadOk(node)) {
            fired = true;
            reachGoal('sofia_lead');
            observer.disconnect();
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
