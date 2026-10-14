#!/usr/bin/env node

// scripts/fix-apartment-floors.js
//
// Разовый патч после коммита 4043589 («корпуса и связки»).
// Проблемы, которые исправляет:
//   1. floor у всех 49 апартаментов = 1 (DEFAULT от старой схемы);
//      seed-apartment-groups.js счёл единицу заполненным значением и не обновил.
//   2. Три апартамента с UUID-id не нашлись в сиде (обрезанные id),
//      поэтому им не проставили корпус и не создали связку Deep Forest + Coffee Ice Cream.
//
// Что делает (всё в одной транзакции):
//   а) Проставляет floor для 31 уверенно сопоставленного апартамента
//      ТОЛЬКО если текущий floor IS NULL или floor = 1.
//      Если floor уже что-то другое — менеджер поправил вручную: не трогаем.
//   б) Для трёх UUID-апартаментов (DEEP FOREST, TROPICAL GARDEN, ART-DELICATE ROSE)
//      проставляет building WHERE building IS NULL.
//   в) Апартаментам НЕ из уверенного сопоставления с floor=1 AND building IS NULL
//      ставит floor=NULL («не указан» в админке, чтобы менеджер увидел).
//   г) Создаёт черновик связки «Deep Forest и Coffee Ice Cream» (INSERT OR IGNORE).
//   д) Перед любыми изменениями проверяет наличие нужных таблиц/колонок.
//   е) Идемпотентен: повторный запуск ничего не портит.
//   ж) Печатает отчёт «было → стало» по каждому апартаменту.
//   з) --dry-run: всё то же, но транзакция откатывается — данные не меняются.
//
// Запуск (из корня проекта):
//   node scripts/fix-apartment-floors.js
//   node scripts/fix-apartment-floors.js --dry-run

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DRY_RUN = process.argv.includes('--dry-run');
const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

// ─── Открываем базу ──────────────────────────────────────────────────────────

if (!fs.existsSync(DB_PATH)) {
  console.error('ОШИБКА: база данных не найдена:', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ─── Проверка схемы ──────────────────────────────────────────────────────────

function hasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function hasTable(table) {
  return !!db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
}

const missing = [];
if (!hasColumn('apartments', 'floor'))    missing.push('apartments.floor');
if (!hasColumn('apartments', 'building')) missing.push('apartments.building');
if (!hasTable('apartment_groups'))        missing.push('table apartment_groups');
if (!hasTable('apartment_group_items'))   missing.push('table apartment_group_items');

if (missing.length > 0) {
  console.error('ОШИБКА: схема базы не обновлена. Не хватает:');
  for (const m of missing) console.error('  -', m);
  console.error('\nЗадеплой код и перезапусти приложение (pm2 restart), чтобы');
  console.error('миграции в lib/db.ts применились, затем запусти скрипт снова.');
  process.exit(2);
}

// ─── Данные: 31 уверенно сопоставленный апартамент ───────────────────────────
// Для трёх UUID-строк используем полные id (в сиде были обрезаны).
// 857c8117-... оставляем префиксным — полный UUID неизвестен, но в сиде он нашёлся.

const MAPPING = [
  // Корпус 1
  { id: 'ls-lux-white-sands',                   lookupType: 'id',     building: 1, floor: 1,  label: 'WHITE SANDS' },
  { id: 'ls-lux-sweet-caramel',                 lookupType: 'id',     building: 1, floor: 2,  label: 'SWEET CARAMEL' },
  { id: 'ls-deep-music',                         lookupType: 'id',     building: 1, floor: 13, label: 'DEEP MUSIC' },
  { id: 'ls-steel-love',                         lookupType: 'id',     building: 1, floor: 13, label: 'STEEL LOVE' },
  { id: 'ls-lux-orange',                         lookupType: 'id',     building: 1, floor: 14, label: 'LUX-ORANGE' },
  // Корпус 2
  { id: '857c8117',                              lookupType: 'prefix', building: 2, floor: 2,  label: 'SEA AND SAND' },
  { id: '8b577381-4cf1-450b-ac43-54b8a0edcc59', lookupType: 'id',     building: 2, floor: 3,  label: 'DEEP FOREST' },
  { id: 'ls-coffee-ice-cream',                   lookupType: 'id',     building: 2, floor: 3,  label: 'COFFEE ICE CREAM' },
  { id: 'ls-lux-soft-blue',                      lookupType: 'id',     building: 2, floor: 10, label: 'LUX-SOFT BLUE' },
  { id: 'ls-art-crystal-blue',                   lookupType: 'id',     building: 2, floor: 13, label: 'ART-CRYSTAL BLUE' },
  { id: 'ls-deep-forest',                        lookupType: 'id',     building: 2, floor: 13, label: 'GOLDEN SAND (id=ls-deep-forest)' },
  { id: 'ls-art-olive',                          lookupType: 'id',     building: 2, floor: 13, label: 'ART-OLIVE' },
  { id: 'ls-green',                              lookupType: 'id',     building: 2, floor: 13, label: 'GREEN' },
  { id: 'ls-relax-time',                         lookupType: 'id',     building: 2, floor: 14, label: 'RELAX TIME' },
  { id: 'ls-dream-vacation',                     lookupType: 'id',     building: 2, floor: 15, label: 'SUNSHINE (id=ls-dream-vacation)' },
  // Корпус 3
  { id: 'ls-hi-tech-relax',                      lookupType: 'id',     building: 3, floor: 2,  label: 'HI-TECH RELAX' },
  { id: 'ls-hi-tech-emotion',                    lookupType: 'id',     building: 3, floor: 2,  label: 'HI-TECH EMOTION' },
  { id: 'ls-blue-curacao',                       lookupType: 'id',     building: 3, floor: 3,  label: 'BLUE CURACAO' },
  { id: 'ls-summer-emotions',                    lookupType: 'id',     building: 3, floor: 4,  label: 'ART-SUMMER EMOTIONS' },
  { id: 'ls-family-comfort',                     lookupType: 'id',     building: 3, floor: 4,  label: 'FAMILY COMFORT' },
  { id: 'ls-blueberry',                          lookupType: 'id',     building: 3, floor: 4,  label: 'BLUEBERRY' },
  { id: 'ls-lux-only-you',                       lookupType: 'id',     building: 3, floor: 4,  label: 'ART-ONLY YOU' },
  { id: 'ls-cool-lemonade',                      lookupType: 'id',     building: 3, floor: 6,  label: 'COOL LEMONADE' },
  { id: 'ls-econom-studio',                      lookupType: 'id',     building: 3, floor: 7,  label: 'ECONOM STUDIO' },
  { id: 'c9d83795-45f1-467e-b240-a168a98c6200', lookupType: 'id',     building: 3, floor: 7,  label: 'TROPICAL GARDEN' },
  { id: 'ls-in-the-moment',                      lookupType: 'id',     building: 3, floor: 11, label: 'IN THE MOMENT' },
  { id: 'ls-sweet-summer',                       lookupType: 'id',     building: 3, floor: 12, label: 'SWEET SUMMER' },
  { id: 'ls-diamond-green',                      lookupType: 'id',     building: 3, floor: 13, label: 'DIAMOND GREEN' },
  { id: 'ls-flowers-tea',                        lookupType: 'id',     building: 3, floor: 15, label: 'FLOWERS TEA' },
  { id: 'ls-mountain-retreat',                   lookupType: 'id',     building: 3, floor: 16, label: 'MOUNTAIN RETREAT' },
  // Корпус 4
  { id: 'c4241402-5fc0-491a-b0f9-4c9853016e75', lookupType: 'id',     building: 4, floor: 5,  label: 'ART-DELICATE ROSE' },
];

// Связка, которую сид не смог создать из-за обрезанного UUID
const MISSING_GROUP = {
  id:        'seed-k2-deep-forest-coffee',
  title:     'Deep Forest и Coffee Ice Cream',
  proximity: 'same_floor',
  building:  2,
  sort:      60,
  aptIds: [
    '8b577381-4cf1-450b-ac43-54b8a0edcc59', // DEEP FOREST
    'ls-coffee-ice-cream',
  ],
};

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function aptById(id) {
  const row = db.prepare('SELECT id FROM apartments WHERE id = ?').get(id);
  return row ? row.id : null;
}

function aptByIdPrefix(prefix) {
  const row = db.prepare('SELECT id FROM apartments WHERE id LIKE ?').get(prefix + '%');
  return row ? row.id : null;
}

function resolveApt(entry) {
  if (entry.lookupType === 'prefix') return aptByIdPrefix(entry.id);
  return aptById(entry.id);
}

// ─── Dry-run: бросаем специальный «сигнал» внутри транзакции ─────────────────

class DryRunAbort {
  constructor(report) { this.report = report; }
}

// ─── Основная логика (выполняется внутри транзакции) ─────────────────────────

function executeAll() {
  const report = {
    floorUpdates:     [],  // { label, resolvedId, floorBefore, floorAfter, buildingBefore, buildingAfter }
    skippedByManager: [],  // { label, resolvedId, floor }  — менеджер уже поставил свой этаж
    notFound:         [],  // { label, searchKey }
    falsOnesCleared:  0,
    groupStatus:      '',  // 'created' | 'already_existed' | 'members_missing'
  };

  // ── Шаг А+Б: floor и building для уверенно сопоставленных апартаментов ──────

  // Собираем resolved-id всех апартаментов из сопоставления (нужно для шага В)
  const mappedResolvedIds = [];

  for (const entry of MAPPING) {
    const resolvedId = resolveApt(entry);

    if (!resolvedId) {
      report.notFound.push({ label: entry.label, searchKey: entry.id });
      continue;
    }

    mappedResolvedIds.push(resolvedId);

    const cur = db
      .prepare('SELECT floor, building FROM apartments WHERE id = ?')
      .get(resolvedId);

    if (!cur) {
      report.notFound.push({ label: entry.label, searchKey: entry.id });
      continue;
    }

    const floorBefore    = cur.floor;
    const buildingBefore = cur.building;

    // Если менеджер уже проставил свой этаж — не трогаем ничего
    if (cur.floor !== null && cur.floor !== 1) {
      report.skippedByManager.push({
        label: entry.label,
        resolvedId,
        floor: cur.floor,
        building: cur.building,
      });
      continue;
    }

    // Обновляем floor (если NULL или 1) и building (если NULL)
    db.prepare(`
      UPDATE apartments
      SET
        floor    = CASE WHEN floor IS NULL OR floor = 1 THEN ? ELSE floor END,
        building = CASE WHEN building IS NULL            THEN ? ELSE building END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(entry.floor, entry.building, resolvedId);

    const after = db
      .prepare('SELECT floor, building FROM apartments WHERE id = ?')
      .get(resolvedId);

    report.floorUpdates.push({
      label:          entry.label,
      resolvedId,
      floorBefore,
      floorAfter:     after.floor,
      buildingBefore,
      buildingAfter:  after.building,
    });
  }

  // ── Шаг В: обнуляем ложные единицы у неизвестных апартаментов ───────────────
  // Условие: floor = 1 AND building IS NULL AND id NOT IN (mapped list)
  // building IS NULL — дополнительная защита: если менеджер уже присвоил корпус,
  // значит, он работал с записью и мог видеть этаж; не трогаем.

  let clearResult;
  if (mappedResolvedIds.length > 0) {
    const placeholders = mappedResolvedIds.map(() => '?').join(', ');
    clearResult = db.prepare(`
      UPDATE apartments
      SET floor = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE floor = 1
        AND building IS NULL
        AND id NOT IN (${placeholders})
    `).run(...mappedResolvedIds);
  } else {
    // Если ни одного из списка не нашли — безопаснее ничего не трогать
    clearResult = { changes: 0 };
  }
  report.falsOnesCleared = clearResult.changes;

  // ── Шаг Г: создаём недостающую связку ───────────────────────────────────────

  const groupExists = db
    .prepare('SELECT id FROM apartment_groups WHERE id = ?')
    .get(MISSING_GROUP.id);

  if (groupExists) {
    report.groupStatus = 'already_existed';
  } else {
    // Проверяем, что оба апартамента существуют
    const missingMembers = MISSING_GROUP.aptIds.filter((aptId) => !aptById(aptId));

    if (missingMembers.length > 0) {
      report.groupStatus = 'members_missing';
      report.notFound.push(
        ...missingMembers.map((id) => ({ label: `member of ${MISSING_GROUP.id}`, searchKey: id }))
      );
    } else {
      db.prepare(`
        INSERT OR IGNORE INTO apartment_groups
          (id, title, proximity, building, note, sort, is_active)
        VALUES (?, ?, ?, ?, NULL, ?, 0)
      `).run(
        MISSING_GROUP.id,
        MISSING_GROUP.title,
        MISSING_GROUP.proximity,
        MISSING_GROUP.building,
        MISSING_GROUP.sort,
      );

      for (const aptId of MISSING_GROUP.aptIds) {
        db.prepare(
          'INSERT OR IGNORE INTO apartment_group_items (group_id, apartment_id) VALUES (?, ?)'
        ).run(MISSING_GROUP.id, aptId);
      }

      report.groupStatus = 'created';
    }
  }

  return report;
}

// ─── Запуск: dry-run или реальный прогон ────────────────────────────────────

let report;

const runInTx = db.transaction(() => {
  const r = executeAll();
  if (DRY_RUN) throw new DryRunAbort(r); // ROLLBACK вызывается автоматически
  return r;
});

try {
  report = runInTx();
} catch (e) {
  if (e instanceof DryRunAbort) {
    report = e.report;
  } else {
    console.error('ОШИБКА при выполнении:', e.message);
    process.exit(1);
  }
}

// ─── Отчёт ────────────────────────────────────────────────────────────────────

const mode = DRY_RUN ? '[--dry-run]' : '[реальный прогон]';
console.log(`\n=== fix-apartment-floors.js ${mode} ===`);

console.log('\n--- Шаг А+Б: floor и building для уверенно сопоставленных апартаментов ---');

for (const r of report.floorUpdates) {
  const floorPart    = r.floorBefore === r.floorAfter
    ? `floor ${r.floorAfter} [без изменений]`
    : `floor ${r.floorBefore ?? 'NULL'} → ${r.floorAfter}`;
  const buildingPart = r.buildingBefore === r.buildingAfter
    ? `building ${r.buildingAfter ?? 'NULL'} [без изменений]`
    : `building ${r.buildingBefore ?? 'NULL'} → ${r.buildingAfter}`;
  console.log(`  OK  ${r.label}: ${floorPart}, ${buildingPart}`);
}

for (const r of report.skippedByManager) {
  console.log(
    `  ПРОПУЩЕН (менеджер): ${r.label} (${r.resolvedId}) — floor уже = ${r.floor}, building = ${r.building ?? 'NULL'} — не трогаем`
  );
}

for (const r of report.notFound) {
  console.log(`  ПРОПУЩЕН (не найден): ${r.label} [искали: ${r.searchKey}]`);
}

const totalProcessed = report.floorUpdates.length;
const totalSkipped   = report.skippedByManager.length;
const totalNotFound  = report.notFound.filter(n => !n.label.startsWith('member of')).length;
console.log(
  `\n  Итог А+Б: обработано ${totalProcessed}, пропущено менеджером ${totalSkipped}, не найдено ${totalNotFound}`
);

console.log('\n--- Шаг В: очистка ложных единиц у неизвестных апартаментов ---');
console.log(
  `  floor = NULL проставлен ${report.falsOnesCleared} апарт. ` +
  `(условие: floor=1 AND building IS NULL AND id NOT IN сопоставления)`
);

console.log('\n--- Шаг Г: связка Deep Forest и Coffee Ice Cream ---');
if (report.groupStatus === 'created') {
  console.log(`  СОЗДАНА: ${MISSING_GROUP.id} «${MISSING_GROUP.title}»`);
  console.log(`           proximity=${MISSING_GROUP.proximity}, building=${MISSING_GROUP.building}, is_active=0`);
} else if (report.groupStatus === 'already_existed') {
  console.log(`  УЖЕ СУЩЕСТВУЕТ: ${MISSING_GROUP.id} — пропускаем`);
} else {
  console.log(`  НЕ СОЗДАНА: один или оба апартамента не найдены в базе`);
}

console.log('\n=== Итог ===');
if (DRY_RUN) {
  console.log('Транзакция ОТКАТАНА. Реальных изменений в базе нет.');
  console.log('Для применения запусти без флага --dry-run.');
} else {
  const changed = totalProcessed + report.falsOnesCleared + (report.groupStatus === 'created' ? 1 : 0);
  console.log(`Транзакция применена. Всего изменено объектов: ~${changed}.`);
}
