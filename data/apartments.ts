// data/apartments.ts

export type Apartment = {
  id: string;
  title: string;
  shortDescription: string;
  description: string;

  maxGuests: number;
  area: number;
  priceBase: number;

  features: string[];
  images: string[];

  view: 'sea' | 'city' | 'garden';
  hasTerrace: boolean;
};

export const APARTMENTS: Apartment[] = [
  {
    id: 'ls-art-sweet-caramel',
    title: 'Art Sweet Caramel',
    shortDescription: 'Светлый дизайнерский апартамент с террасой',
    description: 'Просторный апартамент с панорамными окнами и уютной террасой.',
    maxGuests: 4,
    area: 85,
    priceBase: 8000,
    view: 'sea',
    hasTerrace: true,
    features: ['Панорамные окна', 'Терраса'],
    images: [
      '/images/apartments/sweet-caramel/1.webp',
      '/images/apartments/sweet-caramel/2.webp',
      '/images/apartments/sweet-caramel/3.webp',
    ],
  },

  {
    id: 'ls-art-flower-kiss',
    title: 'Art Flower Kiss',
    shortDescription: 'Романтичный апартамент для двоих',
    description: 'Компактный апартамент с видом на море.',
    maxGuests: 2,
    area: 72,
    priceBase: 7000,
    view: 'sea',
    hasTerrace: false,
    features: ['Вид на море', 'Балкон'],
    images: [
      '/images/apartments/flower-kiss/1.webp',
      '/images/apartments/flower-kiss/2.webp',
    ],
  },

  {
    id: 'ls-lux-soft-blue',
    title: 'Lux Soft Blue',
    shortDescription: 'Премиальный апартамент с лаунж-зоной',
    description: 'Просторный люкс с панорамным остеклением.',
    maxGuests: 4,
    area: 90,
    priceBase: 9000,
    view: 'sea',
    hasTerrace: false,
    features: ['Лаунж-зона', 'Панорамные окна'],
    images: [
      '/images/apartments/soft-blue/1.webp',
      '/images/apartments/soft-blue/2.webp',
      '/images/apartments/soft-blue/3.webp',
    ],
  },

  {
    id: 'ls-art-crystal-blue',
    title: 'Art Crystal Blue',
    shortDescription: 'Стильный апартамент с видом на море',
    description: 'Современный интерьер и французский балкон.',
    maxGuests: 3,
    area: 78,
    priceBase: 7500,
    view: 'sea',
    hasTerrace: false,
    features: ['Французский балкон', 'Вид на море'],
    images: [
      '/images/apartments/crystal-blue/1.webp',
      '/images/apartments/crystal-blue/2.webp',
    ],
  },

  {
    id: 'ls-lux-sunny-mood',
    title: 'Lux Sunny Mood',
    shortDescription: 'Светлый апартамент с террасой',
    description: 'Панорамные окна и просторная терраса.',
    maxGuests: 4,
    area: 95,
    priceBase: 8800,
    view: 'sea',
    hasTerrace: true,
    features: ['Терраса', 'Панорамные окна'],
    images: [
      '/images/apartments/sunny-mood/1.webp',
      '/images/apartments/sunny-mood/2.webp',
      '/images/apartments/sunny-mood/3.webp',
    ],
  },

  {
    id: 'ls-lux-beautiful-days',
    title: 'Lux Beautiful Days',
    shortDescription: 'Просторный люкс для семьи',
    description: 'Максимальный комфорт и большая терраса.',
    maxGuests: 6,
    area: 120,
    priceBase: 11000,
    view: 'sea',
    hasTerrace: true,
    features: ['Большая терраса', 'Панорамный вид'],
    images: [
      '/images/apartments/beautiful-days/1.webp',
      '/images/apartments/beautiful-days/2.webp',
      '/images/apartments/beautiful-days/3.webp',
    ],
  },

  {
    id: 'ls-lux-sun-rays',
    title: 'Lux Sun Rays',
    shortDescription: 'Апартамент с зоной отдыха',
    description: 'Уютное пространство с панорамными окнами.',
    maxGuests: 4,
    area: 88,
    priceBase: 8700,
    view: 'sea',
    hasTerrace: false,
    features: ['Зона отдыха', 'Панорамные окна'],
    images: [
      '/images/apartments/sun-rays/1.webp',
      '/images/apartments/sun-rays/2.webp',
      '/images/apartments/sun-rays/3.webp',
    ],
  },

  {
    id: 'ls-lux-sunshine',
    title: 'Lux Sunshine',
    shortDescription: 'Компактный апартамент с балконом',
    description: 'Уютный вариант для двоих.',
    maxGuests: 2,
    area: 70,
    priceBase: 6800,
    view: 'sea',
    hasTerrace: false,
    features: ['Балкон', 'Вид на море'],
    images: [
      '/images/apartments/sunshine/1.webp',
      '/images/apartments/sunshine/2.webp',
    ],
  },

  {
    id: 'ls-lux-fly-birds',
    title: 'Lux Fly Birds',
    shortDescription: 'Апартамент с террасой и панорамой',
    description: 'Свобода пространства и свет.',
    maxGuests: 4,
    area: 92,
    priceBase: 8900,
    view: 'sea',
    hasTerrace: true,
    features: ['Терраса', 'Панорамные окна'],
    images: [
      '/images/apartments/fly-birds/1.webp',
      '/images/apartments/fly-birds/2.webp',
      '/images/apartments/fly-birds/3.webp',
    ],
  },

  {
    id: 'ls-lux-fly-mood',
    title: 'Lux Fly Mood',
    shortDescription: 'Лаунж-апартамент с видом на море',
    description: 'Комфорт и стиль.',
    maxGuests: 3,
    area: 80,
    priceBase: 8200,
    view: 'sea',
    hasTerrace: false,
    features: ['Лаунж-зона', 'Вид на море'],
    images: [
      '/images/apartments/fly-mood/1.webp',
      '/images/apartments/fly-mood/2.webp',
      '/images/apartments/fly-mood/3.webp',
    ],
  },

  {
    id: 'ls-lux-fly-sky',
    title: 'Lux Fly Sky',
    shortDescription: 'Просторный апартамент с террасой',
    description: 'Много света и воздуха.',
    maxGuests: 4,
    area: 100,
    priceBase: 9500,
    view: 'sea',
    hasTerrace: true,
    features: ['Терраса', 'Панорамные окна'],
    images: [
      '/images/apartments/fly-sky/1.webp',
      '/images/apartments/fly-sky/2.webp',
      '/images/apartments/fly-sky/3.webp',
    ],
  },

  {
    id: 'ls-art-only-you',
    title: 'Art Only You',
    shortDescription: 'Апартамент для двоих с балконом',
    description: 'Романтичная атмосфера.',
    maxGuests: 2,
    area: 68,
    priceBase: 6500,
    view: 'sea',
    hasTerrace: false,
    features: ['Балкон', 'Вид на море'],
    images: [
      '/images/apartments/only-you/1.webp',
      '/images/apartments/only-you/2.webp',
    ],
  },

  {
    id: 'ls-art-dream-vacation',
    title: 'Art Dream Vacation',
    shortDescription: 'Апартамент для комфортного отдыха',
    description: 'Отличный вариант для семьи.',
    maxGuests: 4,
    area: 90,
    priceBase: 8600,
    view: 'sea',
    hasTerrace: true,
    features: ['Терраса', 'Панорамные окна'],
    images: [
      '/images/apartments/dream-vacation/1.webp',
      '/images/apartments/dream-vacation/2.webp',
      '/images/apartments/dream-vacation/3.webp',
    ],
  },
];
