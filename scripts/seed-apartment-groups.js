#!/usr/bin/env node

// scripts/seed-apartment-groups.js
//
// Создаёт 7 черновиков связок + проставляет building/floor для уверенно
// сопоставленных апартаментов (только в пустые поля).
//
// ВАЖНО:
//   - Запуск ОДИН РАЗ на реальной базе, после бэкапа.
//   - Скрипт идемпотентен: повторный запуск ничего не дублирует,
//     группы ищутся по детерминированному id (seed-*), а building/floor
//     заполняются только если поле пустое.
//   - Схему базы скрипт НЕ создаёт — миграции отрабатывают при старте
//     приложения (ensureDatabaseStructure в lib/db.ts). Если нужных
//     колонок/таблиц нет — скрипт остановится с инструкцией.
//
// Запуск: node scripts/seed-apartment-groups.js
//         (из корня проекта, где лежит data.sqlite)

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

if (!fs.existsSync(DB_PATH)) {
  console.error('ОШИБКА: база данных не найдена по пути', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ─── Проверяем, что миграции уже накатили нужные колонки/таблицы ────────────

function hasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function hasTable(table) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(table);
  return !!row;
}

const missing = [];
if (!hasColumn('apartments', 'building')) missing.push('apartments.building');
if (!hasColumn('apartments', 'floor')) missing.push('apartments.floor');
if (!hasColumn('apartments', 'unit_number')) missing.push('apartments.unit_number');
if (!hasTable('apartment_groups')) missing.push('table apartment_groups');
if (!hasTable('apartment_group_items')) missing.push('table apartment_group_items');

if (missing.length > 0) {
  console.error('ОШИБКА: схема базы ещё не обновлена. Не хватает:');
  for (const m of missing) console.error('  - ' + m);
  console.error('');
  console.error('Сначала задеплой код и перезапусти приложение (pm2 restart),');
  console.error('чтобы миграции в lib/db.ts применились. Затем запусти сид снова.');
  process.exit(2);
}

// ─── Вспомогательные функции ────────────────────────────────────────────────

function aptById(id) {
  const row = db.prepare('SELECT id FROM apartments WHERE id = ?').get(id);
  return row ? row.id : null;
}

function aptByTitle(title) {
  const row = db
    .prepare('SELECT id FROM apartments WHERE UPPER(title) = UPPER(?)')
    .get(title);
  return row ? row.id : null;
}

function aptByIdPrefix(prefix) {
  const row = db
    .prepare('SELECT id FROM apartments WHERE id LIKE ?')
    .get(prefix + '%');
  return row ? row.id : null;
}

function resolveApt(entry) {
  if (entry.lookupType === 'id') return aptById(entry.id);
  if (entry.lookupType === 'prefix') return aptByIdPrefix(entry.id);
  return aptByTitle(entry.id);
}

// ─── 1. Заполнение building/floor для известных апартаментов ────────────────
//       Только туда, где поле ещё NULL — не перезаписываем то, что менеджер ввёл.

console.log('\n--- Шаг 1: building/floor для уверенно сопоставленных апартаментов ---');

const BUILDING_FLOOR_DATA = [
  // Корпус 1
  { id: 'ls-lux-white-sands',    lookupType: 'id',     building: 1, floor: 1,  label: 'WHITE SANDS' },
  { id: 'ls-lux-sweet-caramel',  lookupType: 'id',     building: 1, floor: 2,  label: 'SWEET CARAMEL' },
  { id: 'ls-deep-music',         lookupType: 'id',     building: 1, floor: 13, label: 'DEEP MUSIC' },
  { id: 'ls-steel-love',         lookupType: 'id',     building: 1, floor: 13, label: 'STEEL LOVE' },
  { id: 'ls-lux-orange',         lookupType: 'id',     building: 1, floor: 14, label: 'LUX-ORANGE' },
  // Корпус 2
  { id: '857c8117',              lookupType: 'prefix', building: 2, floor: 2,  label: 'SEA AND SAND' },
  { id: 'LS-DEEP FOREST',        lookupType: 'title',  building: 2, floor: 3,  label: 'DEEP FOREST (8b577381)' },
  { id: 'ls-coffee-ice-cream',   lookupType: 'id',     building: 2, floor: 3,  label: 'COFFEE ICE CREAM' },
  { id: 'ls-lux-soft-blue',      lookupType: 'id',     building: 2, floor: 10, label: 'LUX-SOFT BLUE' },
  { id: 'ls-art-crystal-blue',   lookupType: 'id',     building: 2, floor: 13, label: 'ART-CRYSTAL BLUE' },
  { id: 'ls-deep-forest',        lookupType: 'id',     building: 2, floor: 13, label: 'GOLDEN SAND (id=ls-deep-forest)' },
  { id: 'ls-art-olive',          lookupType: 'id',     building: 2, floor: 13, label: 'ART-OLIVE' },
  { id: 'ls-green',              lookupType: 'id',     building: 2, floor: 13, label: 'GREEN' },
  { id: 'ls-relax-time',         lookupType: 'id',     building: 2, floor: 14, label: 'RELAX TIME' },
  { id: 'ls-dream-vacation',     lookupType: 'id',     building: 2, floor: 15, label: 'SUNSHINE (id=ls-dream-vacation)' },
  // Корпус 3
  { id: 'ls-hi-tech-relax',      lookupType: 'id',     building: 3, floor: 2,  label: 'HI-TECH RELAX' },
  { id: 'ls-hi-tech-emotion',    lookupType: 'id',     building: 3, floor: 2,  label: 'HI-TECH EMOTION' },
  { id: 'ls-blue-curacao',       lookupType: 'id',     building: 3, floor: 3,  label: 'BLUE CURACAO' },
  { id: 'ls-summer-emotions',    lookupType: 'id',     building: 3, floor: 4,  label: 'ART-SUMMER EMOTIONS' },
  { id: 'ls-family-comfort',     lookupType: 'id',     building: 3, floor: 4,  label: 'FAMILY COMFORT' },
  { id: 'ls-blueberry',          lookupType: 'id',     building: 3, floor: 4,  label: 'BLUEBERRY' },
  { id: 'ls-lux-only-you',       lookupType: 'id',     building: 3, floor: 4,  label: 'ART-ONLY YOU' },
  { id: 'ls-cool-lemonade',      lookupType: 'id',     building: 3, floor: 6,  label: 'COOL LEMONADE' },
  { id: 'ls-econom-studio',      lookupType: 'id',     building: 3, floor: 7,  label: 'ECONOM STUDIO' },
  { id: 'LS-TROPICAL GARDEN',    lookupType: 'title',  building: 3, floor: 7,  label: 'TROPICAL GARDEN (c9d83795)' },
  { id: 'ls-in-the-moment',      lookupType: 'id',     building: 3, floor: 11, label: 'IN THE MOMENT' },
  { id: 'ls-sweet-summer',       lookupType: 'id',     building: 3, floor: 12, label: 'SWEET SUMMER' },
  { id: 'ls-diamond-green',      lookupType: 'id',     building: 3, floor: 13, label: 'DIAMOND GREEN' },
  { id: 'ls-flowers-tea',        lookupType: 'id',     building: 3, floor: 15, label: 'FLOWERS TEA' },
  { id: 'ls-mountain-retreat',   lookupType: 'id',     building: 3, floor: 16, label: 'MOUNTAIN RETREAT' },
  // Корпус 4
  { id: 'LS-ART-DELICATE ROSE',  lookupType: 'title',  building: 4, floor: 5,  label: 'ART-DELICATE ROSE (c4241402)' },
];

const updateBF = db.prepare(`
  UPDATE apartments
  SET building = CASE WHEN building IS NULL THEN ? ELSE building END,
      floor    = CASE WHEN floor    IS NULL THEN ? ELSE floor    END,
      updated_at = CASE WHEN building IS NULL OR floor IS NULL THEN CURRENT_TIMESTAMP ELSE updated_at END
  WHERE id = ?
`);

let bfUpdated = 0;
let bfSkipped = 0;
let bfNotFound = 0;

for (const entry of BUILDING_FLOOR_DATA) {
  const resolvedId = resolveApt(entry);
  if (!resolvedId) {
    console.warn(`  ПРОПУЩЕН (не найден): ${entry.label}`);
    bfNotFound++;
    continue;
  }

  const current = db
    .prepare('SELECT building, floor FROM apartments WHERE id = ?')
    .get(resolvedId);

  if (!current) {
    bfNotFound++;
    continue;
  }

  if (current.building !== null && current.floor !== null) {
    console.log(`  [уже заполнен] ${entry.label}: корпус ${current.building}, этаж ${current.floor}`);
    bfSkipped++;
    continue;
  }

  const result = updateBF.run(entry.building, entry.floor, resolvedId);
  if (result.changes > 0) {
    const after = db.prepare('SELECT building, floor FROM apartments WHERE id = ?').get(resolvedId);
    console.log(`  OK ${entry.label}: корпус ${after.building}, этаж ${after.floor}`);
    bfUpdated++;
  }
}

console.log(`\n  Результат building/floor: обновлено ${bfUpdated}, уже было ${bfSkipped}, не найдено ${bfNotFound}`);

// ─── 2. Создание 7 связок черновиками ───────────────────────────────────────
//      Идемпотентность — по детерминированному id группы (seed-*). Если
//      менеджер переименует связку, повторный запуск её НЕ продублирует.

console.log('\n--- Шаг 2: создание связок апартаментов ---');

const GROUPS = [
  {
    seedId: 'seed-k1-deep-music-steel-love',
    title: 'Deep Music и Steel Love',
    proximity: 'adjacent',
    building: 1,
    sort: 10,
    aptIds: [
      { id: 'ls-deep-music',       lookupType: 'id',    label: 'ls-deep-music' },
      { id: 'ls-steel-love',       lookupType: 'id',    label: 'ls-steel-love' },
    ],
  },
  {
    seedId: 'seed-k2-crystal-golden-olive',
    title: 'Crystal Blue, Golden Sand и Olive',
    proximity: 'adjacent',
    building: 2,
    sort: 20,
    aptIds: [
      { id: 'ls-art-crystal-blue', lookupType: 'id',    label: 'ls-art-crystal-blue' },
      { id: 'ls-deep-forest',      lookupType: 'id',    label: 'ls-deep-forest (Golden Sand)' },
      { id: 'ls-art-olive',        lookupType: 'id',    label: 'ls-art-olive' },
    ],
  },
  {
    seedId: 'seed-k3-hi-tech-relax-emotion',
    title: 'Hi-Tech Relax и Hi-Tech Emotion',
    proximity: 'adjacent',
    building: 3,
    sort: 30,
    aptIds: [
      { id: 'ls-hi-tech-relax',    lookupType: 'id',    label: 'ls-hi-tech-relax' },
      { id: 'ls-hi-tech-emotion',  lookupType: 'id',    label: 'ls-hi-tech-emotion' },
    ],
  },
  {
    seedId: 'seed-k3-summer-family',
    title: 'Summer Emotions и Family Comfort',
    proximity: 'adjacent',
    building: 3,
    sort: 40,
    aptIds: [
      { id: 'ls-summer-emotions',  lookupType: 'id',    label: 'ls-summer-emotions' },
      { id: 'ls-family-comfort',   lookupType: 'id',    label: 'ls-family-comfort' },
    ],
  },
  {
    seedId: 'seed-k3-blueberry-only-you',
    title: 'Blueberry и Only You',
    proximity: 'adjacent',
    building: 3,
    sort: 50,
    aptIds: [
      { id: 'ls-blueberry',        lookupType: 'id',    label: 'ls-blueberry' },
      { id: 'ls-lux-only-you',     lookupType: 'id',    label: 'ls-lux-only-you' },
    ],
  },
  {
    seedId: 'seed-k2-deep-forest-coffee',
    title: 'Deep Forest и Coffee Ice Cream',
    proximity: 'same_floor',
    building: 2,
    sort: 60,
    aptIds: [
      { id: 'LS-DEEP FOREST',      lookupType: 'title', label: 'Deep Forest (8b577381-…)' },
      { id: 'ls-coffee-ice-cream', lookupType: 'id',    label: 'ls-coffee-ice-cream' },
    ],
  },
  {
    seedId: 'seed-k1-white-sands-caramel',
    title: 'White Sands и Sweet Caramel',
    proximity: 'stacked',
    building: 1,
    sort: 70,
    aptIds: [
      { id: 'ls-lux-white-sands',  lookupType: 'id',    label: 'ls-lux-white-sands' },
      { id: 'ls-lux-sweet-caramel',lookupType: 'id',    label: 'ls-lux-sweet-caramel' },
    ],
  },
];

const insGroup = db.prepare(`
  INSERT OR IGNORE INTO apartment_groups (id, title, proximity, building, note, sort, is_active)
  VALUES (?, ?, ?, ?, NULL, ?, 0)
`);
const insItem = db.prepare(
  'INSERT OR IGNORE INTO apartment_group_items (group_id, apartment_id) VALUES (?, ?)'
);

let groupsCreated = 0;
let groupsSkipped = 0;
let groupsIncomplete = 0;

for (const def of GROUPS) {
  // Идемпотентность — ищем по детерминированному id.
  const existing = db
    .prepare('SELECT id FROM apartment_groups WHERE id = ?')
    .get(def.seedId);

  if (existing) {
    console.log(`  [уже есть] ${def.seedId} — «${def.title}»`);
    groupsSkipped++;
    continue;
  }

  // Резолвим id апартаментов
  const resolvedAptIds = [];
  let hasMissing = false;

  for (const apt of def.aptIds) {
    const resolved = resolveApt(apt);
    if (!resolved) {
      console.warn(`  ПРОПУСК «${def.title}»: не найден апартамент ${apt.label}`);
      hasMissing = true;
      break;
    }
    resolvedAptIds.push(resolved);
  }

  if (hasMissing) {
    groupsIncomplete++;
    continue;
  }

  db.transaction(() => {
    insGroup.run(def.seedId, def.title, def.proximity, def.building, def.sort);
    for (const aptId of resolvedAptIds) {
      insItem.run(def.seedId, aptId);
    }
  })();

  const guestsTotal = resolvedAptIds.reduce((sum, aptId) => {
    const row = db.prepare('SELECT max_guests FROM apartments WHERE id = ?').get(aptId);
    return sum + (row && row.max_guests ? row.max_guests : 0);
  }, 0);

  console.log(
    `  СОЗДАНА ${def.seedId} «${def.title}» (${def.proximity}, корпус ${def.building}, ` +
    `${resolvedAptIds.length} апт, итого ${guestsTotal} мест)`
  );
  groupsCreated++;
}

console.log(`\n  Результат связок: создано ${groupsCreated}, уже было ${groupsSkipped}, пропущено (не найдены апты) ${groupsIncomplete}`);

// ─── Итог ────────────────────────────────────────────────────────────────────

console.log(`
=== Готово ===
building/floor: обновлено ${bfUpdated}, уже заполнено ${bfSkipped}, не найдено ${bfNotFound}
Связки:         создано ${groupsCreated}, уже были ${groupsSkipped}, пропущено ${groupsIncomplete}

Все связки созданы как ЧЕРНОВИКИ (is_active = 0).
Клиент самостоятельно проверит данные в админке и опубликует нужные.
`);
