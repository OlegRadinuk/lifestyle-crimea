/**
 * Рендерит текст описания апартамента с сохранением абзацев и переносов строк.
 * Менеджер пишет текст в админке с абзацами (\n\n) и переносами (\n) —
 * эта функция сохраняет форматирование без dangerouslySetInnerHTML.
 */
export function renderDescription(text: string) {
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} style={{ marginBottom: '0.9em' }}>
      {para.split('\n').map((line, j, arr) => (
        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
      ))}
    </p>
  ));
}
