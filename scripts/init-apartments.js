const Database = require('better-sqlite3');
const path = require('path');

// Подключаемся к БД
const dbPath = path.join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

// Все 39 апартаментов
const APARTMENTS = [
  // Дизайнерские студии (30 шт)
  {
    id: 'ls-space',
    title: 'LS-SPACE',
    short_description: 'Дизайнерская студия с видом на море',
    description: 'Просторная студия с современным дизайном и панорамным видом на море.',
    max_guests: 3,
    area: 36,
    price_base: 6500,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Фен', 'Балкон', 'Кухня', 'Микроволновка', 'Плита'],
    images: ['/images/apartments/space/1.webp', '/images/apartments/space/2.webp', '/images/apartments/space/3.webp']
  },
  {
    id: 'ls-coffee-ice-cream',
    title: 'LS-COFFEE ICE CREAM',
    short_description: 'Студия со вкусом мороженого с видом на горы',
    description: 'Уютная студия с оригинальным дизайном и прекрасным видом на горы.',
    max_guests: 3,
    area: 33,
    price_base: 6000,
    view: 'mountain',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душевая кабина', 'Балкон', 'Кухня'],
    images: ['/images/apartments/coffee-ice-cream/1.webp', '/images/apartments/coffee-ice-cream/2.webp']
  },
  {
    id: 'ls-summer-emotions',
    title: 'LS-SUMMER EMOTIONS',
    short_description: 'Нежные эмоции лета с видом на горы',
    description: 'Студия с тёплой атмосферой и панорамным видом на горы с 4 этажа.',
    max_guests: 3,
    area: 30,
    price_base: 5800,
    view: 'mountain',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Микроволновка', 'Кондиционер', 'Душевая кабина', 'Кофемашина', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/summer-emotions/1.webp', '/images/apartments/summer-emotions/2.webp']
  },
  {
    id: 'ls-black-strong',
    title: 'LS-BLACK STRONG',
    short_description: 'Экстремальное лето с видом на море и горы',
    description: 'Стильная студия на 7 этаже с видом на море и горы.',
    max_guests: 3,
    area: 34,
    price_base: 6200,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Микроволновка', 'Кондиционер', 'Душевая кабина', 'Кофемашина', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/black-strong/1.webp', '/images/apartments/black-strong/2.webp']
  },
  {
    id: 'ls-deep-music',
    title: 'LS-DEEP MUSIC',
    short_description: 'Звуки лета с видом на море',
    description: 'Студия на 13 этаже с панорамным видом на море и современным интерьером.',
    max_guests: 3,
    area: 28,
    price_base: 5500,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Банные халаты', 'Душ', 'Кофемашина', 'Рабочее место', 'Пол с подогревом', 'Полотенца для животных'],
    images: ['/images/apartments/deep-music/1.webp', '/images/apartments/deep-music/2.webp']
  },
  {
    id: 'ls-dream-vacation',
    title: 'LS-DREAM VACATION',
    short_description: 'Отдых мечты с видом на город и горы',
    description: 'Студия на 5 этаже с прекрасным видом на город и горы.',
    max_guests: 3,
    area: 32,
    price_base: 5900,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Кондиционер', 'Микроволновка', 'Душевая кабина', 'Кофемашина', 'Балкон', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/dream-vacation/1.webp', '/images/apartments/dream-vacation/2.webp']
  },
  {
    id: 'ls-econom-studio',
    title: 'LS-ECONOM STUDIO',
    short_description: 'Экономный отдых с видом на горы',
    description: 'Компактная студия на 7 этаже с видом на горы.',
    max_guests: 3,
    area: 28,
    price_base: 5200,
    view: 'mountain',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душ', 'Кофемашина', 'Сейф', 'Банные халаты', 'Пол с подогревом'],
    images: ['/images/apartments/econom-studio/1.webp', '/images/apartments/econom-studio/2.webp']
  },
  {
    id: 'ls-family-comfort',
    title: 'LS-FAMILY COMFORT',
    short_description: 'Летние теплые дни с видом на горы',
    description: 'Уютная студия на 4 этаже с видом на горы.',
    max_guests: 3,
    area: 32,
    price_base: 5800,
    view: 'mountain',
    has_terrace: true,
    is_active: true,
    features: ['Кондиционер', 'Микроволновка', 'Душевая кабина', 'Кофемашина', 'Балкон', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/family-comfort/1.webp', '/images/apartments/family-comfort/2.webp']
  },
  {
    id: 'ls-in-the-moment',
    title: 'LS-IN THE MOMENT',
    short_description: 'Жизнь в моменте с видом на море',
    description: 'Студия на 11 этаже с панорамным видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 6000,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Микроволновка', 'Кондиционер', 'Душевая кабина', 'Кофемашина', 'Стиральная машина', 'Сейф', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/in-the-moment/1.webp', '/images/apartments/in-the-moment/2.webp']
  },
  {
    id: 'ls-lux-flower-kiss',
    title: 'LS-LUX-FLOWER KISS',
    short_description: 'В ярких оттенках лета с видом на море',
    description: 'Студия на 2 этаже с видом на море и ярким дизайном.',
    max_guests: 3,
    area: 34,
    price_base: 6300,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душ', 'Банные халаты', 'Кофемашина', 'Сейф', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/lux-flower-kiss/1.webp', '/images/apartments/lux-flower-kiss/2.webp']
  },
  {
    id: 'ls-relax-time',
    title: 'LS-RELAX TIME',
    short_description: 'Время для отдыха с видом на море и горы',
    description: 'Студия на 14 этаже с видом на море и горы.',
    max_guests: 3,
    area: 33,
    price_base: 6100,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душевая кабина', 'Кофемашина', 'Балкон'],
    images: ['/images/apartments/relax-time/1.webp', '/images/apartments/relax-time/2.webp']
  },
  {
    id: 'ls-sweet-summer',
    title: 'LS-SWEET SUMMER',
    short_description: 'Сладкие эмоции лета с видом на море',
    description: 'Студия на 12 этаже с видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 5900,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Микроволновка', 'Кондиционер', 'Душевая кабина', 'Кофемашина', 'Балкон', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/sweet-summer/1.webp', '/images/apartments/sweet-summer/2.webp']
  },
  {
    id: 'ls-comfort-home',
    title: 'LS-COMFORT HOME',
    short_description: 'С комфортом с видом на море',
    description: 'Просторная студия с видом на море.',
    max_guests: 2,
    area: 36,
    price_base: 6200,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Фен', 'Балкон', 'Кухня', 'Плита', 'Стиральная машина', 'Кофемашина'],
    images: ['/images/apartments/comfort-home/1.webp', '/images/apartments/comfort-home/2.webp']
  },
  {
    id: 'ls-lux-sweet-caramel',
    title: 'LS-LUX-SWEET CARAMEL',
    short_description: 'Сладкий вкус лета с видом на море',
    description: 'Студия на 3 этаже с видом на море.',
    max_guests: 3,
    area: 28,
    price_base: 5500,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Фен', 'Балкон', 'Кухня', 'Стиральная машина', 'Кофемашина'],
    images: ['/images/apartments/lux-sweet-caramel/1.webp', '/images/apartments/lux-sweet-caramel/2.webp']
  },
  {
    id: 'ls-steel-love',
    title: 'LS-STEEL LOVE',
    short_description: 'В стальных оттенках лета с видом на море',
    description: 'Студия на 13 этаже с видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 6000,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Кондиционер', 'Душ', 'Кофемашина', 'Сейф', 'Рабочее место', 'Пол с подогревом'],
    images: ['/images/apartments/steel-love/1.webp', '/images/apartments/steel-love/2.webp']
  },
  {
    id: 'ls-art-crystal-blue',
    title: 'LS-ART-CRYSTAL BLUE',
    short_description: 'Кристально синее небо с видом на море',
    description: 'Студия на 13 этаже с видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 5900,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Балкон', 'Кухня'],
    images: ['/images/apartments/art-crystal-blue/1.webp', '/images/apartments/art-crystal-blue/2.webp']
  },
  {
    id: 'ls-art-olive',
    title: 'LS-ART-OLIVE',
    short_description: 'В оливковых оттенках лета с видом на море',
    description: 'Студия на 13 этаже с видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 5900,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душ', 'Кофемашина', 'Сейф', 'Пол с подогревом', 'Тапочки'],
    images: ['/images/apartments/art-olive/1.webp', '/images/apartments/art-olive/2.webp']
  },
  {
    id: 'ls-blue-curacao',
    title: 'LS-BLUE CURACAO',
    short_description: 'Горько-сладкий вкус лета с видом на море',
    description: 'Студия на 3 этаже с видом на море.',
    max_guests: 3,
    area: 29,
    price_base: 5500,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Кофемашина'],
    images: ['/images/apartments/blue-curacao/1.webp', '/images/apartments/blue-curacao/2.webp']
  },
  {
    id: 'ls-blueberry',
    title: 'LS-BLUEBERRY',
    short_description: 'Ягодных оттенков лета с видом на море',
    description: 'Студия на 4 этаже с видом на море.',
    max_guests: 3,
    area: 34,
    price_base: 6100,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Кофемашина'],
    images: ['/images/apartments/blueberry/1.webp', '/images/apartments/blueberry/2.webp']
  },
  {
    id: 'ls-cool-lemonade',
    title: 'LS-COOL LEMONADE',
    short_description: 'Освежающий вкус лимонада с видом на море',
    description: 'Студия на 6 этаже с видом на море.',
    max_guests: 3,
    area: 29,
    price_base: 5600,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Кофемашина', 'Полотенца для животных'],
    images: ['/images/apartments/cool-lemonade/1.webp', '/images/apartments/cool-lemonade/2.webp']
  },
  {
    id: 'ls-green',
    title: 'LS-GREEN',
    short_description: 'В ярких оттенках лета с боковым видом на море',
    description: 'Студия на 13 этаже с боковым видом на море.',
    max_guests: 3,
    area: 33,
    price_base: 5800,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Кондиционер', 'Микроволновка', 'Душ', 'Сейф', 'Полотенца для животных'],
    images: ['/images/apartments/green/1.webp', '/images/apartments/green/2.webp']
  },
  {
    id: 'ls-hi-tech-emotion',
    title: 'LS-HI-TECH EMOTION',
    short_description: 'Светлые эмоции лета с видом на море',
    description: 'Студия на 2 этаже с видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 5900,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Микроволновка', 'Фен'],
    images: ['/images/apartments/hi-tech-emotion/1.webp', '/images/apartments/hi-tech-emotion/2.webp']
  },
  {
    id: 'ls-hi-tech-relax',
    title: 'LS-HI-TECH RELAX',
    short_description: 'Свобода лета с видом на море',
    description: 'Студия на 2 этаже с видом на море.',
    max_guests: 3,
    area: 27,
    price_base: 5300,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Микроволновка', 'Фен'],
    images: ['/images/apartments/hi-tech-relax/1.webp', '/images/apartments/hi-tech-relax/2.webp']
  },
  {
    id: 'ls-lux-only-you',
    title: 'LS-LUX-ONLY YOU',
    short_description: 'Только ты с видом на море',
    description: 'Студия на 4 этаже с видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 6000,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Кондиционер', 'Душевая кабина', 'Сейф', 'Кухня', 'Плита', 'Полотенца для животных'],
    images: ['/images/apartments/lux-only-you/1.webp', '/images/apartments/lux-only-you/2.webp']
  },
  {
    id: 'ls-lux-fly-sky',
    title: 'LS-LUX-FLY SKY',
    short_description: 'Прямой вид на море с 16 этажа',
    description: 'Студия на 16 этаже с прямым видом на море.',
    max_guests: 2,
    area: 32,
    price_base: 6500,
    view: 'sea',
    has_terrace: false,
    is_active: true,
    features: [],
    images: ['/images/apartments/lux-fly-sky/1.webp', '/images/apartments/lux-fly-sky/2.webp']
  },
  {
    id: 'ls-lux-beautiful-days',
    title: 'LS-LUX-BEAUTIFUL DAYS',
    short_description: 'Прекрасные дни с видом на горы и море',
    description: 'Студия на 15 этаже с видом на горы и море.',
    max_guests: 3,
    area: 36,
    price_base: 6800,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Фен', 'Кухня', 'Стиральная машина', 'Кофемашина'],
    images: ['/images/apartments/lux-beautiful-days/1.webp', '/images/apartments/lux-beautiful-days/2.webp']
  },
  {
    id: 'ls-lux-fly-mood',
    title: 'LS-LUX-FLY MOOD',
    short_description: 'Прямой вид на море с 16 этажа',
    description: 'Студия на 16 этаже с прямым видом на море.',
    max_guests: 2,
    area: 36,
    price_base: 6800,
    view: 'sea',
    has_terrace: false,
    is_active: true,
    features: [],
    images: ['/images/apartments/lux-fly-mood/1.webp', '/images/apartments/lux-fly-mood/2.webp']
  },
  {
    id: 'ls-lux-sun-rays',
    title: 'LS-LUX-SUN RAYS',
    short_description: 'Солнечные лучи с видом на море',
    description: 'Студия на 15 этаже с видом на море.',
    max_guests: 3,
    area: 36,
    price_base: 6700,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Фен', 'Кухня', 'Стиральная машина', 'Кофемашина'],
    images: ['/images/apartments/lux-sun-rays/1.webp', '/images/apartments/lux-sun-rays/2.webp']
  },
  {
    id: 'ls-lux-sunny-mood',
    title: 'LS-LUX-SUNNY MOOD',
    short_description: 'Отличное настроение с видом на горы и море',
    description: 'Студия на 15 этаже с видом на горы и море.',
    max_guests: 3,
    area: 36,
    price_base: 6800,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Фен', 'Кухня', 'Стиральная машина', 'Кофемашина'],
    images: ['/images/apartments/lux-sunny-mood/1.webp', '/images/apartments/lux-sunny-mood/2.webp']
  },
  {
    id: 'ls-lux-fly-blue-light',
    title: 'LS-LUX-FLY BLUE LIGHT',
    short_description: 'Прямой вид на море с 16 этажа',
    description: 'Студия на 16 этаже с прямым видом на море.',
    max_guests: 3,
    area: 32,
    price_base: 6400,
    view: 'sea',
    has_terrace: false,
    is_active: true,
    features: [],
    images: ['/images/apartments/lux-fly-blue-light/1.webp', '/images/apartments/lux-fly-blue-light/2.webp']
  },

  // Апартаменты с отдельной спальней (9 шт)
  {
    id: 'ls-diamond-green',
    title: 'LS-DIAMOND GREEN',
    short_description: 'Алмазного свечения лета с видом на море и горы',
    description: 'Просторные апартаменты с отдельной спальней на 13 этаже, вид на море и горы.',
    max_guests: 4,
    area: 60,
    price_base: 8500,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Кухня', 'Балкон'],
    images: ['/images/apartments/diamond-green/1.webp', '/images/apartments/diamond-green/2.webp', '/images/apartments/diamond-green/3.webp']
  },
  {
    id: 'ls-mountain-retreat',
    title: 'LS-MOUNTAIN RETREAT',
    short_description: 'Медитация в окружении гор с видом на горы и море',
    description: 'Просторные апартаменты с отдельной спальней на 16 этаже, вид на горы и море.',
    max_guests: 4,
    area: 60,
    price_base: 8600,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душ', 'Кухня', 'Балкон', 'Полотенца для животных'],
    images: ['/images/apartments/mountain-retreat/1.webp', '/images/apartments/mountain-retreat/2.webp']
  },
  {
    id: 'ls-wine-and-sunset',
    title: 'LS-WINE AND SUNSET',
    short_description: 'Вино и закат с видом на море',
    description: 'Апартаменты с отдельной спальней на 5 этаже, вид на море.',
    max_guests: 4,
    area: 61,
    price_base: 8700,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душевая кабина', 'Пол с подогревом', 'Кухня', 'Балкон', 'Полотенца для животных'],
    images: ['/images/apartments/wine-and-sunset/1.webp', '/images/apartments/wine-and-sunset/2.webp']
  },
  {
    id: 'ls-lux-white-sands',
    title: 'LS-LUX-WHITE SANDS',
    short_description: 'Песочных оттенков с боковым видом на море',
    description: 'Двухуровневые апартаменты с отдельной спальней на 1 этаже, боковой вид на море.',
    max_guests: 4,
    area: 55,
    price_base: 8200,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Кухня', 'Балкон', 'Полотенца для животных'],
    images: ['/images/apartments/lux-white-sands/1.webp', '/images/apartments/lux-white-sands/2.webp']
  },
  {
    id: 'ls-lux-orange',
    title: 'LS-LUX-ORANGE',
    short_description: 'В сочных оттенках лета с лучшим видом на море',
    description: 'Апартаменты с отдельной спальней на 14 этаже, лучший вид на море.',
    max_guests: 5,
    area: 60,
    price_base: 8900,
    view: 'sea',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Пол с подогревом', 'Кухня', 'Балкон', 'Полотенца для животных'],
    images: ['/images/apartments/lux-orange/1.webp', '/images/apartments/lux-orange/2.webp']
  },
  {
    id: 'ls-lux-soft-blue',
    title: 'LS-LUX-SOFT BLUE',
    short_description: 'Небесных оттенков лета с видом на море и горы',
    description: 'Апартаменты с отдельной спальней на 10 этаже, вид на море и горы.',
    max_guests: 5,
    area: 60,
    price_base: 8800,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Холодильник', 'Кондиционер', 'Душевая кабина', 'Кухня', 'Балкон'],
    images: ['/images/apartments/lux-soft-blue/1.webp', '/images/apartments/lux-soft-blue/2.webp']
  },
  {
    id: 'ls-lux-fly-birds',
    title: 'LS-LUX-FLY BIRDS',
    short_description: 'Просторные апартаменты',
    description: 'Апартаменты с отдельной спальней.',
    max_guests: 4,
    area: 60,
    price_base: 8400,
    view: 'sea',
    has_terrace: false,
    is_active: true,
    features: [],
    images: ['/images/apartments/lux-fly-birds/1.webp', '/images/apartments/lux-fly-birds/2.webp']
  },
  {
    id: 'ls-deep-forest',
    title: 'LS-DEEP FOREST',
    short_description: 'Крымские ландшафты с видом на горы и город',
    description: 'Апартаменты с отдельной спальней на 3 этаже, вид на горы и город.',
    max_guests: 5,
    area: 60,
    price_base: 8500,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душ', 'Кухня', 'Балкон', 'Полотенца для животных'],
    images: ['/images/apartments/deep-forest/1.webp', '/images/apartments/deep-forest/2.webp']
  },
  {
    id: 'ls-flowers-tea',
    title: 'LS-FLOWERS TEA',
    short_description: 'Ароматы цветочного чая с видом на горы и море',
    description: 'Апартаменты с отдельной спальней на 15 этаже, вид на горы и море.',
    max_guests: 4,
    area: 60,
    price_base: 8600,
    view: 'mixed',
    has_terrace: true,
    is_active: true,
    features: ['Интернет', 'Холодильник', 'Кондиционер', 'Душ', 'Кухня', 'Балкон', 'Полотенца для животных'],
    images: ['/images/apartments/flowers-tea/1.webp', '/images/apartments/flowers-tea/2.webp']
  }
];

function initApartments() {
  console.log('🏢 Инициализация апартаментов в базе данных...\n');

  // Очищаем таблицу
  db.exec('DELETE FROM apartments');

  const insertStmt = db.prepare(`
    INSERT INTO apartments (
      id, title, max_guests, price_base, short_description, description, 
      area, view, has_terrace, features, images, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let success = 0;
  for (const apt of APARTMENTS) {
    try {
      insertStmt.run(
        apt.id,
        apt.title,
        apt.max_guests,
        apt.price_base,
        apt.short_description || null,
        apt.description || null,
        apt.area || null,
        apt.view || 'sea',
        apt.has_terrace ? 1 : 0,
        JSON.stringify(apt.features || []),
        JSON.stringify(apt.images || []),
        apt.is_active ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );
      console.log(`✅ ${apt.title} (${apt.id})`);
      success++;
    } catch (error) {
      console.error(`❌ ${apt.title}:`, error);
    }
  }
  console.log(`\n📊 Добавлено: ${success} апартаментов`);
}

initApartments();