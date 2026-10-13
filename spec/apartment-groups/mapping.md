# Связки апартаментов и корпуса — сопоставление списка клиента с базой

Источник: сообщение клиента 2026-10-13 (список корпусов, этажей и соседства).
База: живой каталог https://lovelifestyle.ru/api/apartments на 2026-10-13, 49 апартаментов.
Нотация клиента «2+2+1» = места; сумма = вместимость (сверяем с max_guests).

## ВАЖНО ПРО СМЫСЛ СЛОВА «СМЕЖНЫЕ»
Клиент пишет «Смежные двери рядом». То есть это СОСЕДНИЕ ДВЕРИ В КОРИДОРЕ, а НЕ
внутренняя дверь между номерами. На сайте НЕЛЬЗЯ писать «соединены дверью» или
«смежные номера» в гостиничном смысле. Формулировка для гостя: «соседние апартаменты,
двери рядом». Иначе семья с детьми приедет и будет разочарована.

У клиента три степени близости:
- adjacent  — «смежные», двери рядом на одном этаже (главное предложение)
- same_floor — «рядом / почти рядом / чуть дальше на этаже»
- stacked   — «этажом выше / ниже»

## Уверенное сопоставление (id в базе)

| Корпус | Этаж | Название клиента | id в базе | Заголовок в базе | Места клиента | max_guests |
|---|---|---|---|---|---|---|
| 1 | 1 | White Sand | ls-lux-white-sands | «Стиль - АРТ - Надежда» | 4 | 4 |
| 1 | 2 | Caramel | ls-lux-sweet-caramel | «Стиль - АРТ - Тепло» | 3 | 3 |
| 1 | 13 | Deep Music | ls-deep-music | LS-DEEP MUSIC | 3 | 3 |
| 1 | 13 | Steel Love | ls-steel-love | LS-STEEL LOVE | 3 | 3 |
| 1 | 14 | Orange | ls-lux-orange | LS-LUX-ORANGE | 5 | 5 |
| 2 | 2 | Sea sand | 857c8117-0653-47d3-b90… | LS-SEA AND SAND | 5 | 5 |
| 2 | 3 | Deep forest | 8b577381-… | LS-DEEP FOREST | 5 | 5 |
| 2 | 3 | Coffee ice cream | ls-coffee-ice-cream | LS-COFFEE ICE CREAM | **4** | **3** ⚠ |
| 2 | 10 | Soft blue | ls-lux-soft-blue | LS-LUX-SOFT BLUE | 5 | 5 |
| 2 | 13 | Кристал блю | ls-art-crystal-blue | LS-ART-CRYSTAL BLUE | 3 | 3 |
| 2 | 13 | Золотые пески | ls-deep-forest ⚠ | LS-GOLDEN SAND | 4 | 4 |
| 2 | 13 | Олив | ls-art-olive | LS-ART-OLIVE | 3 | 3 |
| 2 | 13 | Грин | ls-green | LS-GREEN | 3 | 3 |
| 2 | 14 | Релакс тайм | ls-relax-time | LS-RELAX TIME | 3 | 3 |
| 2 | 15 | Саншайн | ls-dream-vacation ⚠ | LS-LUX-SUNSHINE | 3 | 3 |
| 3 | 2 | Хайтек релакс | ls-hi-tech-relax | LS-HI-TECH RELAX | 3 | 3 |
| 3 | 2 | Хайтек эмоции | ls-hi-tech-emotion | LS-HI-TECH EMOTION | 3 | 3 |
| 3 | 3 | Блю курасао | ls-blue-curacao | LS-BLUE CURACAO | **4** | **3** ⚠ |
| 3 | 4 | Саммер эмошн | ls-summer-emotions | LS-ART-SUMMER EMOTIONS | 3 | 3 |
| 3 | 4 | Фемели комфорт | ls-family-comfort | LS-FAMILY COMFORT | 3 | 3 |
| 3 | 4 | Черника | ls-blueberry | LS-BLUEBERRY | 3 | 3 |
| 3 | 4 | Только ты | ls-lux-only-you | LS-ART-ONLY YOU | 3 | 3 |
| 3 | 6 | Лимонад | ls-cool-lemonade | LS-COOL LEMONADE | 3 | 3 |
| 3 | 7 | Эконом | ls-econom-studio | LS-ECONOM STUDIO | 3 | 3 |
| 3 | 7 | Тропический | c9d83795-… | LS-TROPICAL GARDEN | 3 | 3 |
| 3 | 11 | В моменте | ls-in-the-moment | LS-IN THE MOMENT | 3 | 3 |
| 3 | 12 | Сладкое лето | ls-sweet-summer | LS-SWEET SUMMER | 3 | 3 |
| 3 | 13 | Алмазно зелёный | ls-diamond-green | LS-DIAMOND GREEN | 4 | 4 |
| 3 | 15 | Чай | ls-flowers-tea | LS-FLOWERS TEA | 4 | 4 |
| 3 | 16 | Ретрит | ls-mountain-retreat | LS-MOUNTAIN RETREAT | 4 | 4 |
| 4 | 5 | Роза | c4241402-… | LS-ART-DELICATE ROSE | 4 | 4 |

⚠ id ≠ название (известное наследие базы, см. паспорт проекта): ls-deep-forest хранит
GOLDEN SAND, ls-dream-vacation хранит SUNSHINE. Связывать СТРОГО по id, не по названию.

## Предположительно — НУЖНО ПОДТВЕРЖДЕНИЕ КЛИЕНТА

| Корпус | Этаж | Название клиента | Кандидат в базе | Почему сомнение |
|---|---|---|---|---|
| 2 | 11 | Солнечный | LS-SUNNY DAYS (ls-comfort-home)? | в базе четыре «солнечных» |
| 2 | 15 | Санни шайнинг | LS-LUX-SUN RAYS (ls-lux-sun-rays)? | «shining» ≈ «rays»? |
| 2 | 15 | Солнечное настроение | LS-LUX-SUNNY MOOD (ls-lux-sunny-mood) | вероятно |
| 2 | 15 | Прекрасный | LS-LUX-BEAUTIFUL DAYS (ls-lux-beautiful-days) | вероятно |
| 2 | 16 | Птички поющие | LS-LUX-FLY BIRDS (4 места) | вероятно |
| 2 | 16 | Состояние летать | LS-LUX-FLY MOOD (2 места) | вероятно |
| 2 | 16 | Небесный | LS-LUX-FLY SKY (2 места) | вероятно |
| 2 | 16 | Блестящий (студия) | LS-LUX-FLY BLUE LIGHT (4)? | неочевидно |
| 3 | 5 | Локация | — | совпадений нет |
| 3 | 7 | Голубое небо | — | совпадений нет |
| 4 | 12 | Столик с кофе (2 места) | «Стиль - ХОУМ - Истории и кофе» или «Кофе с корицей» (обе по 3) | две похожих, вместимость 2 vs 3 |
| 4 | 14 | Кофе (2 места) | вторая из этих двух | то же |

## Расхождения по вместимости
- Coffee ice cream: клиент 2+1+1 = 4, в базе 3.
- Блю курасао: клиент 2+2 = 4, в базе 3.
- «Столик с кофе» и «Кофе»: клиент 2, в базе 3.
Для связок сумма мест — главный аргумент «для 4 взрослых с детьми». Ошибка здесь =
обещание, которое не выполнится.

## Нет в списке клиента, есть в базе
SPACE, BLACK STRONG, WINE AND SUNSET, PROVENCE, SANDY, INFINITI, ART-FLOWER KISS,
ART-DREAM VACATION (c-id ls-art-dream-vacation), один из SUNNY DAYS / SUN RAYS.
Корпус 5 — в списке пуст. Корпус 6 — этажи 7 и 9 без названий.

## Группы (как их видит клиент)
Корпус 1: [Deep Music + Steel Love] adjacent; Orange — stacked к ним (14 эт).
          White Sand (1) / Caramel (2) — stacked.
Корпус 2: Sea sand (2) stacked под [Deep forest + Coffee ice cream] same_floor (3).
          Soft blue (10) / Солнечный (11) — stacked.
          [Кристал блю + Золотые пески + Олив] adjacent (13, три номера!);
          Грин same_floor к ним; Релакс тайм (14) stacked.
          [Саншайн + Санни шайнинг] adjacent (15); same_floor с
          [Солнечное настроение + Прекрасный] adjacent (15);
          stacked над ними [Птички поющие + Состояние летать + Небесный] adjacent (16);
          Блестящий same_floor (16).
Корпус 3: [Хайтек релакс + Хайтек эмоции] adjacent (2).
          [Саммер эмошн + Фемели комфорт] adjacent (4); same_floor
          [Черника + Только ты] adjacent (4).
          Эконом same_floor [Тропический + Голубое небо] adjacent (7).
Корпуса 4, 5, 6 — «рядом между собой» (соседние здания).
