// data/panoramas.ts

export type Panorama = {
  id: string;
  title: string;
  image: string;
  maxGuests: number;
  meta: string[];
};

export const PANORAMAS: Panorama[] = [
  {
    id: 'ls-space',
    title: 'LS-SPACE',
    image: '/panoramas/LS-Art-Sweet-Caramel.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '36 м²', 'Вид на море', 'Балкон', 'Кухня'],
  },
  {
    id: 'ls-coffee-ice-cream',
    title: 'LS-COFFEE ICE CREAM',
    image: '/panoramas/LS-Art-Flower-Kiss.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '33 м²', 'Вид на горы', 'Интернет', 'Кондиционер'],
  },
  {
    id: 'ls-summer-emotions',
    title: 'LS-SUMMER EMOTIONS',
    image: '/panoramas/LS-Lux-Soft-Blue.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '30 м²', 'Вид на горы', 'Кофемашина', 'Пол с подогревом'],
  },
  {
    id: 'ls-black-strong',
    title: 'LS-BLACK STRONG',
    image: '/panoramas/LS-Art-Crystal-Blue.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '34 м²', 'Вид на море и горы', 'Кофемашина', 'Тапочки'],
  },
  {
    id: 'ls-deep-music',
    title: 'LS-DEEP MUSIC',
    image: '/panoramas/LS-Lux-Sunny-Mood.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '28 м²', 'Вид на море', 'Банные халаты', 'Рабочее место'],
  },
  {
    id: 'ls-dream-vacation',
    title: 'LS-DREAM VACATION',
    image: '/panoramas/LS-Lux-Beautiful-Days.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '32 м²', 'Вид на город и горы', 'Кофемашина', 'Балкон'],
  },
  {
    id: 'ls-econom-studio',
    title: 'LS-ECONOM STUDIO',
    image: '/panoramas/LS-Lux-Sun-Rays.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '28 м²', 'Вид на горы', 'Сейф', 'Банные халаты'],
  },
  {
    id: 'ls-family-comfort',
    title: 'LS-FAMILY COMFORT',
    image: '/panoramas/LS-Lux-Sunshine.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '32 м²', 'Вид на горы', 'Кофемашина', 'Тапочки'],
  },
  {
    id: 'ls-in-the-moment',
    title: 'LS-IN THE MOMENT',
    image: '/panoramas/LS-Lux-Fly-Birds.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '32 м²', 'Вид на море', 'Стиральная машина', 'Сейф'],
  },
  {
    id: 'ls-lux-flower-kiss',
    title: 'LS-LUX-FLOWER KISS',
    image: '/panoramas/LS-Lux-Fly-Mood.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '34 м²', 'Вид на море', 'Банные халаты', 'Сейф'],
  },
  {
    id: 'ls-relax-time',
    title: 'LS-RELAX TIME',
    image: '/panoramas/LS-Lux-Fly-Sky.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '33 м²', 'Вид на море и горы', 'Интернет', 'Балкон'],
  },
  {
    id: 'ls-sweet-summer',
    title: 'LS-SWEET SUMMER',
    image: '/panoramas/LS-Art-Only-You.webp',
    maxGuests: 3,
    meta: ['До 3 гостей', '32 м²', 'Вид на море', 'Кофемашина', 'Тапочки'],
  },
  {
    id: 'ls-comfort-home',
    title: 'LS-COMFORT HOME',
    image: '/panoramas/LS-Art-Dream-Vacation.webp',
    maxGuests: 2,
    meta: ['До 2 гостей', '36 м²', 'Вид на море', 'Стиральная машина', 'Кофемашина'],
  },
];