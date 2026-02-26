// scripts/generate-tokens.ts
import { generateExportToken } from '../lib/db';
import { APARTMENTS } from '../data/apartments';
import { db } from '../lib/db';

function generateTokens() {
  console.log('🔑 Генерация токенов для всех апартаментов...\n');

  const existing = db.prepare('SELECT apartment_id, token FROM export_tokens').all() as { apartment_id: string; token: string }[];
  const existingMap = new Map(existing.map(e => [e.apartment_id, e.token]));

  for (const apt of APARTMENTS) {
    if (existingMap.has(apt.id)) {
      console.log(`✅ ${apt.title} (${apt.id}):`);
      console.log(`   Существующий токен: ${existingMap.get(apt.id)}`);
      console.log(`   Ссылка: https://lovelifestyle.ru/api/export/${existingMap.get(apt.id)}\n`);
    } else {
      const token = generateExportToken(apt.id);
      console.log(`✅ ${apt.title} (${apt.id}):`);
      console.log(`   Новый токен: ${token}`);
      console.log(`   Ссылка: https://lovelifestyle.ru/api/export/${token}\n`);
    }
  }
}

generateTokens();
