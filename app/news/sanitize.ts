import DOMPurify from 'isomorphic-dompurify';

// Whitelist разрешённых тегов и атрибутов для контента новости.
// Контент создаёт админ, но это не повод доверять ему вслепую (защита от XSS
// при компрометации админки или ошибочной вставке).
const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li',
  'strong', 'em', 'a', 'br', 'blockquote',
];
const ALLOWED_ATTR = ['href', 'rel', 'target'];

/**
 * Санитизирует HTML-контент новости по строгому whitelist.
 * Для всех ссылок форсирует rel="noopener noreferrer"; внешним ссылкам
 * (http/https) добавляет target="_blank".
 */
export function sanitizeNewsHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // запрещаем javascript:, data: и прочие опасные схемы в href
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    RETURN_TRUSTED_TYPE: false,
  });
}

/**
 * Усиливает безопасность ссылок: всем <a> ставит rel="noopener noreferrer",
 * внешним (абсолютным http/https) — target="_blank".
 * DOMPurify hook не используем, чтобы не держать глобальное состояние —
 * пост-обработка строкой проще и предсказуемее в SSR.
 */
function hardenLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (match, attrs: string) => {
    let a = attrs;
    const hrefMatch = a.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
    const href = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? '') : '';
    const isExternal = /^https?:\/\//i.test(href);

    // убираем существующие rel/target, чтобы выставить свои
    a = a.replace(/\s+rel\s*=\s*("[^"]*"|'[^']*')/gi, '');
    a = a.replace(/\s+target\s*=\s*("[^"]*"|'[^']*')/gi, '');

    a += ' rel="noopener noreferrer"';
    if (isExternal) a += ' target="_blank"';
    return `<a${a}>`;
  });
}

/**
 * Полный безопасный путь: санитизация + усиление ссылок.
 */
export function safeNewsHtml(dirty: string): string {
  return hardenLinks(sanitizeNewsHtml(dirty));
}
