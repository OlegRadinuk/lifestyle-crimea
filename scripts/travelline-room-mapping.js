#!/usr/bin/env node
'use strict';

/**
 * scripts/travelline-room-mapping.js
 *
 * Единственный источник маппинга: roomTypeId Travelline → id апартамента в таблице apartments.
 * Оба скрипта (sync-travelline.js, reconcile-travelline.js) импортируют этот файл.
 * Никаких копий — если нужно поправить, правим только здесь.
 *
 * Последнее обновление: 2026-09-15
 *   • 5 неверных строк исправлены (348222, 337185, 386685, 280610, 368602)
 *   • 6 новых типов добавлены (399673, 398589, 399678, 408917, 408887, 408900)
 *   • Парковки убраны из маппинга и перенесены в PARKING_ROOM_TYPE_IDS (11 ID по content API)
 */

// Маппинг: строковый roomTypeId → apartment id (из таблицы apartments)
const ROOM_TYPE_MAPPING = {

  // ── 36 верных строк ──────────────────────────────────────────────────────────
  '278023': 'ls-space',
  '243734': 'ls-coffee-ice-cream',
  '263391': 'ls-summer-emotions',
  '330325': 'ls-black-strong',
  '274922': 'ls-deep-music',
  '279273': 'ls-econom-studio',
  '277347': 'ls-family-comfort',
  '272228': 'ls-in-the-moment',
  '345796': 'ls-lux-flower-kiss',
  '289889': 'ls-relax-time',
  '269778': 'ls-sweet-summer',
  '243739': 'ls-lux-sweet-caramel',
  '274610': 'ls-steel-love',
  '244430': 'ls-art-crystal-blue',
  '243321': 'ls-art-olive',
  '265649': 'ls-blue-curacao',
  '244425': 'ls-blueberry',
  '269609': 'ls-cool-lemonade',
  '243319': 'ls-green',
  '291460': 'ls-hi-tech-emotion',
  '291417': 'ls-hi-tech-relax',
  '272288': 'ls-lux-only-you',
  '373007': 'ls-lux-fly-sky',
  '348227': 'ls-lux-beautiful-days',
  '361602': 'ls-lux-fly-mood',
  '337183': 'ls-lux-sun-rays',
  '348223': 'ls-lux-sunny-mood',
  '373006': 'ls-lux-fly-blue-light',
  '278010': 'ls-diamond-green',
  '348218': 'ls-mountain-retreat',
  '264854': 'ls-wine-and-sunset',
  '264995': 'ls-lux-white-sands',
  '244426': 'ls-lux-orange',
  '243517': 'ls-lux-soft-blue',
  '363094': 'ls-lux-fly-birds',
  '281311': 'ls-flowers-tea',

  // ── 5 исправленных строк (было неверно) ─────────────────────────────────────
  // 348222: «Арт - Мечта» → ls-art-dream-vacation (LS-DREAM VACATION); было ls-dream-vacation (это Sunshine!)
  '348222': 'ls-art-dream-vacation',
  // 337185: «Люкс - Яркое солнце» → ls-dream-vacation (LS-LUX-SUNSHINE); было ls-lux-sunshine (id не существовал)
  '337185': 'ls-dream-vacation',
  // 386685: «Золотые пески» → ls-deep-forest (LS-GOLDEN SAND); было ls-golden-sand (id не существовал)
  '386685': 'ls-deep-forest',
  // 280610: «Хвойный лес» → uuid LS-DEEP FOREST; было ls-deep-forest (это Golden Sand!)
  '280610': '8b577381-4cf1-450b-ac43-54b8a0edcc59',
  // 368602: «Солнечные дни» → ls-comfort-home (LS-SUNNY DAYS); было ls-summer-emotions (догадка, неверно)
  '368602': 'ls-comfort-home',

  // ── 6 новых типов номеров (раньше не были замаплены) ─────────────────────────
  // 399673: «Море и Песок» → LS-SEA AND SAND
  '399673': '857c8117-0653-47d3-b909-1ccb535dca03',
  // 398589: «Тропический сад» → LS-TROPICAL GARDEN
  '398589': 'c9d83795-45f1-467e-b240-a168a98c6200',
  // 399678: «Прованс» → LS-PROVENCE
  '399678': '79712c97-ef1d-44af-89dd-e61c12640f4a',
  // 408917: «Песочный» → LS-SANDY
  '408917': '16ecf0df-6ea6-49ee-8836-ca806523c44b',
  // 408887: «Арт - Бесконечность» → LS-ART-INFINITI
  '408887': '8e18d00b-934c-4563-a0c1-59f7dad359bc',
  // 408900: «Арт - Нежная роза» → LS-ART-DELICATE ROSE
  '408900': 'c4241402-5fc0-491a-b0f9-4c9853016e75',
};

// Парковочные типы номеров — не апартаменты, пропускаем без алерта.
// Названия в Travelline: «Парковочное место…», categoryCode: FoldingTent.
// Полный список по content API property 37777 (сверено 2026-09-15):
const PARKING_ROOM_TYPE_IDS = new Set([
  '267845', // парковка (в логе синка: 24 брони)
  '269604', // ls-parking-22
  '269605', // ls-parking-24
  '269606', // парковка (в логе синка: 14 броней)
  '269607', // ls-parking-26
  '345807', // парковка (content API)
  '352587', // парковка (content API)
  '352594', // ls-parking-22 (дубль)
  '353907', // парковка (content API)
  '399622', // парковка (content API)
  '352588', // исторический (в контенте удалён, в логах встречается)
]);

/**
 * Вернуть true, если данный тип номера — парковка.
 * Проверяем сначала по известному списку, затем по данным из брони (если есть).
 */
function isParking(roomTypeId, roomTypeObj) {
  if (PARKING_ROOM_TYPE_IDS.has(String(roomTypeId))) return true;
  const name     = (roomTypeObj && roomTypeObj.name)         || '';
  const category = (roomTypeObj && roomTypeObj.categoryCode) || '';
  return name.includes('Парковочное место') || category === 'FoldingTent';
}

/**
 * Маскирует секреты перед выводом в лог или TG-алерт.
 * Покрывает: client_secret, Bearer-токены, Telegram bot-токены.
 */
function maskSecrets(str) {
  return String(str)
    .replace(/client_secret=[^&\s"]+/g, 'client_secret=***')
    .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret": "***"')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer ***')
    .replace(/bot\d+:[A-Za-z0-9_\-]+/g, 'bot***:***');
}

module.exports = { ROOM_TYPE_MAPPING, PARKING_ROOM_TYPE_IDS, isParking, maskSecrets };
