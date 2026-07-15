interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Structured data (schema.org) — рендерится НА СЕРВЕРЕ, прямо в HTML.
 *
 * Раньше это был клиентский компонент: он создавал <script> в useEffect и
 * вешал его в <head> уже в браузере. В исходном HTML разметки не было вовсе,
 * поэтому краулеры (особенно Яндекс, который не всегда исполняет JS) её просто
 * не видели — вся разметка /services и /concept работала вхолостую.
 * Тот же приём, что и в app/json-ld-hotel.tsx: скрипт в разметке страницы.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
