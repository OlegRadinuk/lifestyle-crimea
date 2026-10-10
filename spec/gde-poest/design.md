# Дизайн-спецификация: /gde-poest

Проект: апарт-отель «Стиль Жизни», lovelifestyle.ru
Страница: /gde-poest — «Где поесть»
Режим: Classic (markdown-спека)
Дата: 2026-10-10
Статус: готово к вёрстке

---

## 0. Контекст и приоритеты

Страница открывается с телефона. Ссылка приходит из Telegram или WhatsApp.
Гость голоден, в незнакомом городе, торопится.

Иерархия ценностей при каждом дизайн-решении:
1. Скорость нахождения нужного (телефон, маршрут, адрес)
2. Доверие (чистый аккуратный вид, без рекламных паттернов)
3. Красота (работает на доверие, не на впечатление)

---

## 1. Токены — наследование из services.css

Новых переменных не вводим. Используем готовые и добавляем только специфику /gde-poest.

```css
/* Базовые (из services.css — используем as-is) */
--gp-teal:        #139ab6;   /* основной акцент */
--gp-teal-dark:   #0d7e96;   /* тёмный тил, для мелкого текста — контраст 4.6:1 */
--gp-ink:         #0d1b22;   /* почти чёрный */
--gp-body:        #1a2e35;   /* цвет основного текста */
--gp-muted:       #4a5568;   /* вторичный текст */
--gp-border:      rgba(19, 154, 182, 0.12);  /* тонкая рамка карточек */

/* Специфика /gde-poest — фирстиль Эндорфина внутри его карточки */
--gp-endorphin-bg:     #1a2740;  /* navy Эндорфина, только внутри бонус-блока */
--gp-endorphin-accent: #c9a058;  /* бронза Эндорфина — заголовок бонус-блока */

/* Поверхности */
--gp-bg-page:   #ffffff;
--gp-bg-section: #f8fafb;   /* лёгкий серо-голубоватый фон для чётных секций */
```

### Шрифт
Только Montserrat (var(--font-montserrat)), без новых подключений.

### Типографическая шкала — продолжение services.css

| Роль | Размер | Вес | Межстрочный | Замечание |
|---|---|---|---|---|
| H1 страницы | clamp(22px, 6vw, 34px) | 600 | 1.18 | Меньше hero services: утилита, не маркетинг |
| H2 секции | 18px / 20px (768+) | 600 | 1.25 | — |
| Название карточки (Endorphin) | 22px | 600 | 1.2 | — |
| Название ресторана-карточки | 17px | 600 | 1.3 | — |
| Eyebrow | 11px | 600 | 1 | uppercase, 0.28em letter-spacing |
| Body | 15px | 300 | 1.65 | основной текст |
| Мета / адрес | 13.5px | 400 | 1.5 | — |
| Кнопка | 14px | 600 | — | — |
| Subtext под кнопкой | 12px | 400 | — | «звонок бесплатный» |

---

## 2. Сетка и контейнер

```
Мобиль 360–599px:   padding: 0 16px
Планшет 600–1024px: padding: 0 24px
Десктоп 1025px+:    padding: 0 32px, max-width: 1280px, margin: 0 auto
```

Шаг сетки: 4px. Все отступы кратны 4px.

Отступ секции сверху/снизу:
- Мобиль: 40px (py-10 в шагах 4px)
- Планшет: 56px
- Десктоп: 80px

Карточки: border-radius 20px (мобиль — 16px для .gp-restaurant-card).

---

## 3. Шапка (.gp-header)

**Состав:** логотип слева, кнопка «Ресепшн» справа. Без навигации.

**Поведение:** sticky top-0. Фон белый `#ffffff`, тонкая нижняя граница `1px solid #e2e8f0`.
Высота шапки: 56px (мобиль), 64px (планшет+). Учитывать для якорей: `scroll-margin-top: 64px`.

**Кнопка «Ресепшн» в шапке:**
- Ссылка: `tel:+79785036363`
- Вид: pill-кнопка, background `#139ab6`, цвет белый
- Размер: height 40px, padding 0 18px, font-size 13px, weight 600
- Иконка: `IconPhone` (18x18) слева от текста
- Тач-таргет: min-height 44px (добавить padding 2px сверху/снизу если нужно)

HeaderMode: `register('gde-poest-page', { mode: 'light', priority: 20 })` — шапка светлая, текст тёмный.

---

## 4. Блок 1 — Hero с H1 (.gp-hero)

**НЕ полноэкранный. Компактная секция с текстом только.**

```
Мобиль:   padding-top: 24px, padding-bottom: 32px
Десктоп:  padding-top: 40px, padding-bottom: 48px
```

Фон: белый (продолжение шапки).

**Контент:**
- H1: «Где поесть рядом со «Стилем Жизни»»
- Подзаголовок (p): «Кофейня «Эндорфин» — прямо в нашем комплексе, со скидкой для гостей. Ниже — магазин, кафе и рестораны поблизости.»

H1: clamp(22px, 6vw, 34px), weight 600, color `#0d1b22`, margin-bottom 12px.
Подзаголовок: 15px, weight 300, color `#4a5568`, line-height 1.65, max-width 540px.

Reveal: `.gp-reveal` с delay 0s (нет stagger на первом блоке — контент должен быть виден сразу).

---

## 5. Блок 2 — Карточка «Эндорфин» (.gp-endorphin)

### 5.1. Решение по фотографиям

**Проблема:** оба фото вертикальные (960x1280, 1014x1280). Вертикальный кадр в полную ширину на телефоне 360px при соотношении 3:4 = высота 480px, что больше половины экрана.

**Решение: принудительное соотношение + второе фото только на планшете.**

- На мобиле (< 600px): только одно фото (interior) с `aspect-ratio: 3 / 2` (высота ~240px при ширине 360px). Верхняя часть снимка с муралом и балками попадает в кадр, атмосфера передана.
- На планшете (600px+): два фото рядом, сетка `grid-template-columns: 2fr 1fr`. Левое (interior) — `aspect-ratio: 4 / 3`. Правое (coffee) — `aspect-ratio: 3 / 4`. Оба обрезаются `object-fit: cover`.
- На десктопе (1025px+): та же 2-колоночная сетка фото, но пропорция левого меняется на `3 / 2`.

**Почему не portrait на мобиле:** гость не должен скроллить одно фото — ему нужен бонус и кнопка в пределах первых двух прокруток. Кропнутое фото теряет 30% кадра, но сохраняет самое важное — мурал и балки в верхней части.

**Почему не слайдер:** слайдер = 2+ взаимодействия, требует JS, добавляет когнитивную нагрузку. Гость смотрит место, а не листает галерею.

### 5.2. Структура карточки (DOM-порядок сверху вниз)

```
.gp-endorphin-card
  .gp-card-photos
    .gp-card-photo-main          ← interior, всегда
    .gp-card-photo-secondary     ← coffee, только 600px+
  .gp-card-body
    .gp-eyebrow                  ← «В НАШЕМ КОМПЛЕКСЕ»
    h2.gp-card-name              ← «Endorphinsense Coffee»
    p.gp-card-subtitle           ← «Утро в «Стиле Жизни» начинается здесь»
    p.gp-card-desc               ← 3 предложения
    .gp-card-address             ← иконка + «ул. Западная, 4 — корп. 1 «Грибоедов»»
    .gp-bonus-block              ← бонус-подблок
    .gp-card-actions             ← кнопки
```

### 5.3. Стили карточки

```css
.gp-endorphin-card {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--gp-border);
  box-shadow: 0 8px 32px rgba(13, 27, 34, 0.06);
  background: #fff;
}

.gp-card-photos {
  /* мобиль: одна колонка */
  display: grid;
  grid-template-columns: 1fr;
}

.gp-card-photo-secondary {
  display: none;  /* мобиль: скрыто */
}

.gp-card-photo-main {
  aspect-ratio: 3 / 2;  /* мобиль */
  width: 100%;
  object-fit: cover;
  object-position: top center;  /* захватить мурал и балки сверху */
  display: block;
}

@media (min-width: 600px) {
  .gp-card-photos {
    grid-template-columns: 2fr 1fr;
    gap: 0;
  }
  .gp-card-photo-secondary {
    display: block;
    aspect-ratio: 3 / 4;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
  .gp-card-photo-main {
    aspect-ratio: 4 / 3;
    object-position: top center;
  }
}

@media (min-width: 1025px) {
  .gp-card-photo-main {
    aspect-ratio: 3 / 2;
  }
}

.gp-card-body {
  padding: 20px 16px 24px;
}

@media (min-width: 600px) {
  .gp-card-body {
    padding: 28px 24px 32px;
  }
}
```

### 5.4. Eyebrow

```css
.gp-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gp-teal-dark);  /* #0d7e96 — проходит 4.6:1 на белом */
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

Иконка перед текстом: `IconCoffee` (18x18, color currentColor). Добавляет якорь-ассоциацию с кофейней.

### 5.5. Бонус-блок (.gp-bonus-block)

**Цель:** читается за секунду. Не выглядит рекламой, потому что находится внутри карточки кофейни, а не выпрыгивает баннером.

**Цветовое решение:** фирстиль «Эндорфина» — navy (`#1a2740`) + бронза (`#c9a058`) — цитируем ТОЛЬКО здесь. На остальной странице эти цвета не появляются. Это сигнал гостю: «это про кофейню, не про отель».

```css
.gp-bonus-block {
  background: #1a2740;
  border-radius: 14px;
  padding: 18px 16px;
  margin: 20px 0 24px;
}

.gp-bonus-heading {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #c9a058;        /* бронза — контраст 5.4:1 на navy */
  margin: 0 0 14px;
}

.gp-bonus-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}
.gp-bonus-item:last-child {
  margin-bottom: 0;
}

.gp-bonus-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #c9a058;
  margin-top: 1px;
}

.gp-bonus-text {
  font-size: 14px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);  /* ~15:1 на navy */
  font-weight: 400;
  margin: 0;
}
```

**Иконки в бонус-блоке:**
- Бонус 1 (скидка): `IconStore` или отдельная иконка процента (если нарисуем). Пока `IconStore`.
- Бонус 2 (завтрак): `IconBreakfast`.

**Тексты в блоке (из copy.md):**
- Заголовок: «Гостям «Стиля Жизни»»
- Бонус 1: «Назовите промокод «Стиль Жизни» на кассе — и получите скидку 5%.»
- Бонус 2: «Завтрак по внутреннему тарифу отеля оформляется заранее через менеджера.»

### 5.6. Кнопки карточки Эндорфина (.gp-card-actions)

```css
.gp-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
```

- Основная «Открыть на карте»: `.gp-btn-primary` (тил, pill) + `IconMapPin` слева
- Вторичная «Посмотреть меню»: `.gp-btn-outline` (outline, pill) + `IconArrowRight` справа
  - Если ссылки нет — не выводить кнопку вообще (не disabled)

На мобиле (< 440px): кнопки идут в column, `align-items: stretch`, каждая занимает полную ширину. Так тач-таргет максимален.

---

## 6. Блок 3 — Продукты (.gp-products)

**Минимальный формат.** Не карточка с фото и описанием — справочная строка.

```
.gp-products
  h2.gp-section-heading  ← «Продукты»
  .gp-store-row          ← строка «Яблоко»
    .gp-store-info
      span.gp-store-name ← «Супермаркет «Яблоко»»
      span.gp-store-hours ← «ежедневно 8:00–23:00» (единственный блок с часами — они подтверждены)
      span.gp-store-address ← «ул. Симферопольская, 20»
    a.gp-btn-outline ← «Маршрут»
```

```css
.gp-products {
  padding: 40px 0;
  border-top: 1px solid #e2e8f0;
}

.gp-section-heading {
  font-size: 18px;
  font-weight: 600;
  color: #0d1b22;
  margin: 0 0 20px;
  letter-spacing: -0.01em;
}

@media (min-width: 768px) {
  .gp-section-heading { font-size: 20px; }
}

.gp-store-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--gp-bg-section);
  border-radius: 14px;
  border: 1px solid var(--gp-border);
}

.gp-store-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gp-store-name {
  font-size: 15px;
  font-weight: 600;
  color: #0d1b22;
}

.gp-store-hours {
  font-size: 13px;
  color: var(--gp-teal-dark);
  font-weight: 500;
}

.gp-store-address {
  font-size: 13px;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 6px;
}
```

Иконка в адресе: `IconMapPin` (16x16, color `#139ab6`).
Иконка рядом с именем: `IconStore` (20x20, color `#139ab6`).

Кнопка «Маршрут»: `.gp-btn-outline`, min-height 44px. На очень узких экранах (< 380px) кнопка переходит под строку (flex-direction: column).

---

## 7. Блок 4 — Доставка (.gp-delivery)

**Формат:** компактный список. Никаких фото, никакого описания атмосферы — только имя и действия.

**Фон секции:** `var(--gp-bg-section)` — лёгкий серо-голубоватый, чтобы визуально отделить от соседних белых блоков без тяжёлой рамки.

```
.gp-delivery
  .gp-section-inner
    h2.gp-section-heading   ← «Можно заказать с доставкой»
    p.gp-section-lead       ← «Если выходить не хочется — звоните напрямую.»
    ul.gp-delivery-list
      li.gp-delivery-item   ← повторяется для каждого заведения
        span.gp-delivery-name   ← название
        .gp-delivery-actions    ← кнопки
```

```css
.gp-delivery {
  background: var(--gp-bg-section);
  padding: 40px 0;
}

.gp-section-lead {
  font-size: 14.5px;
  color: #4a5568;
  margin: 0 0 24px;
  font-weight: 300;
}

.gp-delivery-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.gp-delivery-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.gp-delivery-item:first-child {
  border-top: 1px solid #e2e8f0;
}

.gp-delivery-name {
  font-size: 15px;
  font-weight: 600;
  color: #0d1b22;
  flex: 1 1 auto;
  min-width: 120px;
}

.gp-delivery-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}
```

**Кнопки в каждой строке доставки:**
- «Заказать доставку»: `.gp-btn-primary` (тил, pill) + `IconPhone`
- «Меню» или «Сайт»: `.gp-btn-outline` (outline, pill) — если есть ссылка
- Под кнопкой «Заказать доставку» для Роппонги: подпись `<span class="gp-btn-subtext">звонок бесплатный</span>` (12px, color #4a5568, margin-top 4px)

На очень узких экранах (< 380px): `.gp-delivery-item` переходит в `flex-direction: column`, `align-items: flex-start`. Кнопки растягиваются на `width: 100%`.

---

## 8. Блок 5 — Кафе и рестораны (.gp-restaurants)

### 8.1. Сетка карточек

```css
.gp-restaurant-grid {
  display: grid;
  grid-template-columns: 1fr;    /* мобиль: одна колонка */
  gap: 16px;
}

@media (min-width: 600px) {
  .gp-restaurant-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1025px) {
  .gp-restaurant-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  /* 5 карточек в сетке 3: последние 2 центрируются через специальный враппер */
  /* Вариант: оставить 2+3, CSS auto-placement это сделает само */
}
```

### 8.2. Анатомия карточки ресторана (.gp-restaurant-card)

```
.gp-restaurant-card
  .gp-rc-head
    .gp-rc-icon           ← IconRestaurant или IconCoffee, 24x24, цвет --gp-teal
    h3.gp-rc-name         ← название заведения
  .gp-tags                ← плашки-теги
    .gp-tag               ← каждый тег
  p.gp-rc-desc            ← одно предложение
  .gp-rc-address          ← IconMapPin + адрес
  .gp-rc-actions          ← кнопки
```

```css
.gp-restaurant-card {
  background: #fff;
  border: 1px solid var(--gp-border);
  border-radius: 16px;
  padding: 20px 18px 22px;
  box-shadow: 0 4px 16px rgba(13, 27, 34, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}

.gp-restaurant-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(19, 154, 182, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .gp-restaurant-card { transition: none; }
}

.gp-rc-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.gp-rc-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--gp-teal);
  margin-top: 1px;
}

.gp-rc-name {
  font-size: 17px;
  font-weight: 600;
  color: #0d1b22;
  margin: 0;
  line-height: 1.3;
}

.gp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gp-tag {
  font-size: 12px;
  font-weight: 500;
  color: var(--gp-teal-dark);
  background: rgba(13, 126, 150, 0.08);
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  line-height: 1.6;
}

.gp-rc-desc {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  font-weight: 300;
  margin: 0;
}

.gp-rc-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4a5568;
}

.gp-rc-address-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--gp-teal);
}

.gp-rc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;   /* прижать кнопки к низу карточки */
  padding-top: 4px;
}
```

### 8.3. Состояния кнопок в карточке

- «Маршрут»: `.gp-btn-primary` (заполненный тил, pill), `IconMapPin` слева, height 40px (min 44px tap target с padding)
- «Меню» / «Сайт»: `.gp-btn-outline` (outline тил, pill), `IconArrowRight` справа
- Если ссылки нет (Роппонги, Хинкалыч) — кнопку не выводить

На мобиле < 380px: `.gp-rc-actions` → `flex-direction: column`. Каждая кнопка на всю ширину.

### 8.4. Как не задублировать заведения из блока доставки

Визуальный ответ: блок доставки = компактный список без описания и без фото. Блок ресторанов = карточки с описанием и тегами. Одинаковые заведения (Встреча, Старый город, Роппонги, Хинкалыч) появляются оба раза, но в разных форматах, с разными действиями. Тег «есть доставка» на карточках ресторана служит перекрёстной ссылкой — гость сам поймёт, что телефон доставки есть в блоке выше.

Блок доставки и блок ресторанов визуально разделены:
- Доставка: фон `#f8fafb`, список-разделитель, только кнопки телефона
- Рестораны: фон белый, карточки в сетке, описание + маршрут

---

## 9. Блок 6 — Завтрак (.gp-breakfast)

**Самостоятельный компактный блок.** Не раздут, не выглядит маркетинговым.

```css
.gp-breakfast {
  background: linear-gradient(135deg, #0d2733 0%, #139ab6 100%);
  border-radius: 20px;
  padding: 32px 20px;
  color: #fff;
  margin: 40px 0;
}

@media (min-width: 600px) {
  .gp-breakfast {
    padding: 40px 32px;
  }
}
```

**Состав:**

```
.gp-breakfast
  .gp-breakfast-icon   ← IconBreakfast (32x32, color rgba(255,255,255,0.8))
  h2.gp-breakfast-heading  ← «Завтрак в «Эндорфине» по тарифу отеля»
  p.gp-breakfast-desc      ← 2 предложения из copy.md
  .gp-breakfast-actions
    a.gp-btn-white       ← «Позвонить в отель» → tel:88007776308
    a.gp-phone-link      ← +7 978 503 63 63 → tel:+79785036363
  span.gp-free-note      ← «звонок бесплатный» (под кнопкой «Позвонить в отель»)
```

```css
.gp-breakfast-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

.gp-breakfast-heading {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 12px;
  line-height: 1.3;
}

.gp-breakfast-desc {
  font-size: 14.5px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 300;
  margin: 0 0 24px;
  max-width: 480px;
}

.gp-breakfast-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

/* Белая кнопка на тёмном градиентном фоне */
.gp-btn-white {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
  height: 44px;
  border-radius: 999px;
  background: #fff;
  color: #0d6b7f;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}

.gp-btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.22);
}

/* Телефонная ссылка — кликабельный номер, не кнопка */
.gp-phone-link {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.92);
  text-decoration: none;
  padding: 10px 4px;   /* тач-таргет мин 44px по высоте */
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.gp-phone-link:hover {
  color: #fff;
  text-decoration: underline;
}

.gp-free-note {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin-top: 6px;
  display: block;
  width: 100%;
}
```

**Заметка по WhatsApp/Telegram кнопке (из copy.md):** блок завтрака содержит условный слот для кнопки мессенджера. Верстальщик оставляет его закомментированным с TODO-комментарием до подтверждения менеджера. Если канал подтверждён — кнопка добавляется третьей в `.gp-breakfast-actions`, стиль `.gp-btn-outline-white` (outline белый, аналог `.sv-btn-secondary`).

---

## 10. Блок 7 — Закрывающая подпись (.gp-signature)

Минималистично. Не дублирует шапку.

```css
.gp-signature {
  padding: 32px 0 40px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.gp-signature-text {
  font-size: 15px;
  color: #4a5568;
  line-height: 1.7;
  font-weight: 300;
  margin: 0 0 6px;
}

.gp-signature-brand {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 400;
  margin: 0;
}
```

Текст: Вариант А из copy.md — «Приятного аппетита. Если понадобится помощь — мы на ресепшне.» и «Команда апарт-отеля «Стиль Жизни»».

---

## 11. Плавающая кнопка «Ресепшн» (.gp-fab)

**Только на мобиле и планшете (< 1025px). На десктопе — скрыта.**

```css
.gp-fab {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;

  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
  height: 48px;
  border-radius: 999px;
  background: #139ab6;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(19, 154, 182, 0.45);
  transition: transform 0.22s ease, opacity 0.22s ease;
  white-space: nowrap;
}

.gp-fab:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 12px 32px rgba(19, 154, 182, 0.55);
}

/* FAB скрывается, когда footer в зоне видимости */
.gp-fab.gp-fab--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(8px);
}

@media (min-width: 1025px) {
  .gp-fab { display: none; }
}
```

Иконка: `IconPhone` (18x18, color currentColor) слева от текста «Ресепшн».
Ссылка: `tel:88007776308` (бесплатный).
Подпись «бесплатно»: не в самой кнопке — кнопка должна быть лаконичной. Вывести как отдельный `<span class="gp-fab-note">бесплатно</span>` рядом с FAB или не выводить вообще (в контексте всё ясно).

**Поведение:** JS добавляет класс `.gp-fab--hidden`, когда footer входит в `IntersectionObserver`. Аналогично паттерну в ServicesReveal — не изобретать заново, расширить или скопировать.

**Конфликт с footer:** FAB высотой 48px + 16px отступ = 64px от низа экрана. Footer содержит ссылки — следить, чтобы последний блок (.gp-signature) имел `padding-bottom: 80px` на мобиле, чтобы FAB не перекрывал подпись.

---

## 12. Универсальные кнопки (.gp-btn-*)

Повторяем паттерн services.css, меняем только префикс.

```css
/* PRIMARY — заполненная тил */
.gp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  height: 44px;
  border-radius: 999px;
  background: #139ab6;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.01em;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.gp-btn-primary svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.gp-btn-primary:hover {
  background: #0d7e96;
  transform: translateY(-1px);
}

.gp-btn-primary:focus-visible {
  outline: 3px solid #4fd0e8;
  outline-offset: 3px;
}

/* OUTLINE — рамочная */
.gp-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  height: 44px;
  border-radius: 999px;
  background: transparent;
  color: #139ab6;
  border: 1.5px solid #139ab6;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.gp-btn-outline svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.gp-btn-outline:hover {
  background: rgba(19, 154, 182, 0.08);
}

.gp-btn-outline:focus-visible {
  outline: 3px solid #4fd0e8;
  outline-offset: 3px;
}
```

На экранах < 380px кнопки в `.gp-card-actions`, `.gp-delivery-actions`, `.gp-rc-actions` растягиваются на всю ширину через `flex-direction: column; align-items: stretch`.

---

## 13. Иконки

**Берём из `app/services/icons.tsx`:**
- `IconCoffee` — eyebrow карточки Эндорфина
- `IconStore` — строка «Яблоко», бонус-блок (скидка)
- `IconBreakfast` — бонус-блок (завтрак), блок .gp-breakfast
- `IconPhone` — кнопки телефона, FAB
- `IconArrowRight` — кнопки «Меню», «Сайт»
- `IconInfo` — если понадобится пояснение

**Создать в `app/gde-poest/icons.tsx`** (viewBox 0 0 32 32, stroke="currentColor", strokeWidth 1.5, fill="none", aria-hidden="true"):

```tsx
// IconMapPin — метка на карте (для кнопок «Маршрут», адресов)
// Метка: круг с точкой внутри + капля снизу
// Примерный путь: M16 4 C10.477 4 6 8.477 6 14 C6 21 16 28 16 28 C16 28 26 21 26 14 C26 8.477 21.523 4 16 4 Z / circle cx=16 cy=14 r=4

// IconRestaurant — столовые приборы / ресторан
// Примерный вид: вертикальная вилка слева (3 зубца) + вертикальный нож справа
// Пути упрощённые — нарисовать в стиле остальных иконок (stroke 1.5)
```

Импортировать готовые: `import { IconCoffee, IconStore, ... } from '../services/icons';`

---

## 14. Reveal-анимации

Копируем `app/services/ServicesReveal.tsx`, меняем:
- Класс-источник: `gp-anim` вместо `sv-anim`
- Целевой класс: `gp-reveal` вместо `sv-reveal`

CSS:

```css
.gp-anim .gp-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}

.gp-anim .gp-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.gp-reveal-delay-1 { transition-delay: 0.06s; }
.gp-reveal-delay-2 { transition-delay: 0.12s; }

@media (prefers-reduced-motion: reduce) {
  .gp-anim .gp-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

**ВАЖНО:** класс `.gp-reveal` НЕ ставим в HTML напрямую с `opacity: 0` — скрипт навешивает его сам. Иначе гости без JS видят пустую страницу.

**Что НЕ анимировать:** H1 (.gp-hero), кнопки в шапке и FAB — они должны быть видны мгновенно.

---

## 15. Доступность

| Элемент | Требование | Значение |
|---|---|---|
| Весь текстовый контент | Контраст ≥ 4.5:1 | #1a2e35 на #fff → 9:1 ✓ |
| Eyebrow #0d7e96 на #fff | Контраст | 4.6:1 ✓ (используем --gp-teal-dark) |
| Белый текст на #1a2740 (бонус-блок) | Контраст | ~15:1 ✓ |
| #c9a058 (бронза) на #1a2740 | Контраст | 5.4:1 ✓ |
| Белый на #139ab6 (кнопки) | Контраст | 3.2:1 — для крупного bold текста допустимо AA Large |
| Все тач-таргеты | min 44x44px | высота кнопок 44px, FAB 48px |
| Фокус | видимый outline | `outline: 3px solid #4fd0e8; outline-offset: 3px` на всех интерактивных |
| Иконки | декоративные | `aria-hidden="true"` на всех SVG-иконках |
| Кнопки с только иконкой | нет таких | все кнопки содержат текст |
| Alt-тексты фото | обязательно | точные alt из copy.md раздел «Альты» |
| Внешние ссылки | пояснение | `rel="nofollow noopener"`, для скринридеров добавить `aria-label` если текст кнопки одинаковый на разных карточках («Маршрут» × 5) — добавить `aria-label="Маршрут до Villa Vanilla"` и т.д. |
| Reduced motion | отключить анимации | CSS `@media (prefers-reduced-motion: reduce)` на всех transition/animation |

**Aria-labels для дублирующихся кнопок «Маршрут»:**
- Villa Vanilla: `aria-label="Маршрут до Villa Vanilla"`
- Встреча: `aria-label="Маршрут до кафе Встреча"`
- Старый город: `aria-label="Маршрут до ресторана Старый город"`
- Роппонги: `aria-label="Маршрут до ресторана Роппонги"`
- Хинкалыч: `aria-label="Маршрут до кафе Старик Хинкалыч"`

---

## 16. Полный список CSS-классов с префиксом gp-

```
gp-page                — корневой элемент страницы
gp-header              — минимальная шапка (sticky)
gp-header-inner        — контейнер шапки
gp-header-logo         — логотип
gp-header-cta          — кнопка «Ресепшн» в шапке

gp-hero                — секция H1
gp-hero-inner          — контейнер секции H1

gp-section             — общая оболочка секции (max-width + padding)
gp-section-heading     — H2 секции
gp-section-lead        — вводная строка под H2
gp-section--alt        — секция с фоном --gp-bg-section

gp-endorphin           — секция карточки Эндорфина
gp-endorphin-card      — сама карточка
gp-card-photos         — область фотографий карточки
gp-card-photo-main     — главное фото (interior)
gp-card-photo-secondary — второе фото (coffee), только 600px+
gp-card-body           — текстовое тело карточки
gp-card-subtitle       — подзаголовок карточки
gp-card-desc           — описание (3 предложения Endorphin)
gp-card-address        — строка адреса с иконкой
gp-card-actions        — ряд кнопок карточки

gp-eyebrow             — надзаголовок-eyebrow (11px, uppercase)
gp-bonus-block         — бонус-субкарточка (navy bg)
gp-bonus-heading       — заголовок бонус-блока (бронза)
gp-bonus-item          — строка бонуса (иконка + текст)
gp-bonus-icon          — иконка бонуса
gp-bonus-text          — текст бонуса

gp-products            — секция продуктов
gp-store-row           — строка супермаркета Яблоко
gp-store-info          — информационная часть строки
gp-store-name          — название магазина
gp-store-hours         — часы работы
gp-store-address       — адрес магазина

gp-delivery            — секция доставки
gp-delivery-list       — список заведений с доставкой
gp-delivery-item       — строка одного заведения
gp-delivery-name       — название заведения в строке
gp-delivery-actions    — кнопки в строке доставки

gp-restaurants         — секция кафе и ресторанов
gp-restaurant-grid     — сетка карточек ресторанов
gp-restaurant-card     — карточка ресторана
gp-rc-head             — голова карточки (иконка + название)
gp-rc-icon             — иконка ресторана
gp-rc-name             — название ресторана (h3)
gp-rc-desc             — одна фраза об атмосфере
gp-rc-address          — адрес с иконкой
gp-rc-actions          — кнопки карточки ресторана

gp-tags                — контейнер тегов
gp-tag                 — один тег-пилюля

gp-breakfast           — секция завтрака
gp-breakfast-icon      — иконка секции
gp-breakfast-heading   — заголовок секции
gp-breakfast-desc      — описание
gp-breakfast-actions   — ряд кнопок

gp-signature           — закрывающая подпись
gp-signature-text      — основной текст
gp-signature-brand     — имя команды

gp-btn-primary         — основная pill-кнопка (тил, заполненная)
gp-btn-outline         — вторичная pill-кнопка (outline тил)
gp-btn-white           — белая pill-кнопка (на тёмном фоне)
gp-btn-subtext         — мелкий текст под кнопкой («звонок бесплатный»)
gp-phone-link          — кликабельный телефонный номер (не кнопка)

gp-fab                 — плавающая кнопка «Ресепшн»
gp-fab--hidden         — FAB скрыт (когда footer виден)
gp-fab-note            — подпись «бесплатно» рядом с FAB (опционально)

gp-reveal              — элемент с reveal-анимацией
gp-reveal-delay-1      — задержка 0.06s
gp-reveal-delay-2      — задержка 0.12s
gp-anim                — корневой класс для активации reveal (вешает скрипт)
```

---

## 17. Полная последовательность блоков на странице

```
HeaderMode (клиентский компонент)
Reveal (клиентский компонент)

<main class="gp-page gp-anim">
  <header class="gp-header">        ← sticky, логотип + «Ресепшн»
  <section class="gp-hero">         ← H1 + подзаголовок
  <section class="gp-endorphin">    ← карточка Endorphinsense Coffee
    ↳ photos (interior + coffee 600px+)
    ↳ eyebrow + название + subtitle + desc + address
    ↳ bонус-блок (navy: скидка + завтрак)
    ↳ кнопки (карта + меню)
  <section class="gp-products">     ← Яблоко — строка
  <section class="gp-delivery gp-section--alt"> ← список доставки
  <section class="gp-restaurants">  ← сетка карточек ресторанов
  <section class="gp-breakfast">    ← завтрак (тёмный градиент)
  <section class="gp-signature">    ← подпись
</main>

<footer>                            ← @/components/Footer
<a class="gp-fab">                  ← FAB «Ресепшн», вне main для правильного z-index
<JsonLd>                            ← @/components/JsonLd
```

---

## 18. Адаптив — сводная таблица

| Элемент | 360–599px | 600–1024px | 1025px+ |
|---|---|---|---|
| Фото Эндорфина | 1 фото, ratio 3/2 | 2 фото, сетка 2fr+1fr | 2 фото, сетка 2fr+1fr |
| Карточки ресторанов | 1 колонка | 2 колонки | 3 колонки |
| Кнопки пары в action | column < 380px, иначе row | row | row |
| FAB | виден | виден | скрыт |
| Padding секции | 40px 0 | 56px 0 | 80px 0 |
| H1 | clamp(22px, 6vw, 28px) | clamp(22px, 4vw, 34px) | 34px |

---

## 19. Спорные места

### 1. Белый текст на тил-кнопке (#139ab6)
Контраст белого текста на #139ab6 — ~3.2:1. Проходит WCAG AA Large (14px bold = «крупный» по стандарту, порог 3:1), не проходит AA для обычного текста. Для кнопок 14px 600-weight это формально корректно. a11y-агент должен проверить и подтвердить или потребовать использовать #0d7e96 для кнопок.

### 2. Часы работы «Эндорфина» отсутствуют
Стратегия требует часы в карточке Эндорфина. Без них гость вечером может прийти к закрытой двери. Верстальщик оставляет слот: `<!-- TODO: часы работы — добавить после ответа менеджера -->` сразу после `.gp-card-address`. Дизайн слота — та же строка `.gp-card-address` с иконкой часов (можно IconInfo).

### 3. Кнопка «Посмотреть меню» Эндорфина скрыта
Карточка визуально выглядит завершённой и с одной кнопкой «Открыть на карте». Когда появится ссылка — кнопка добавляется без изменения раскладки (`.gp-card-actions` с flex-wrap держит оба варианта).

### 4. WhatsApp/Telegram в блоке завтрака
Слот закомментирован. Если менеджер укажет мессенджер — три кнопки рядом. На мобиле они уйдут во вторую строку (flex-wrap). Это нормально.

### 5. Villa Vanilla без телефона и меню
Единственная кнопка «Маршрут». Карточка выглядит скромнее остальных. Это честно — данных нет. Альтернатива: поставить Villa Vanilla последней в сетке ресторанов — но стратегия поставила её первой из-за уникальной локации. Оставляем первой, скромная карточка — лучше, чем выдуманные данные.

---

## 20. Что верстальщик делает первым

1. Создать `app/gde-poest/page.tsx` и `app/gde-poest/gde-poest.css` по образцу `/services`.
2. Скопировать и адаптировать `ServicesHeaderMode.tsx` → `GdePoestHeaderMode.tsx` (ключ `gde-poest-page`).
3. Скопировать и адаптировать `ServicesReveal.tsx` → `GdePoestReveal.tsx` (класс `gp-anim`/`gp-reveal`).
4. Создать `app/gde-poest/icons.tsx` с `IconMapPin` и `IconRestaurant`; импортировать готовые из `../services/icons`.
5. Собрать карточку Эндорфина — она главный элемент, остальное вокруг неё.
6. Проверить на реальном устройстве (iOS Safari, 360–390px): FAB не перекрывает подпись, бонус-блок читается с первого взгляда, кнопки достижимы большим пальцем.
