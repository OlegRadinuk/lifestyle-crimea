'use client';

import { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    // Удаляем старый скрипт если есть
    const existingScript = document.getElementById('json-ld-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'json-ld-script';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('json-ld-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data]);

  return null;
}