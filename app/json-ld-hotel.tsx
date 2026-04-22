export default function JsonLdHotel() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: 'Life Style Crimea',
    alternateName: 'Стиль Жизни с любовью',
    description: 'Премиальные апартаменты в Алуште с видом на море. 38 дизайнерских номеров с балконами, полностью укомплектованы. Бронирование онлайн. Лучшие цены напрямую.',
    url: 'https://lovelifestyle.ru',
    logo: 'https://lovelifestyle.ru/logo.png',
    image: 'https://lovelifestyle.ru/og-image.jpg',
    telephone: '8 800 777 63 08',
    email: 'info@lovelifestyle.ru',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Западная ул., 4',
      addressLocality: 'Алушта',
      addressRegion: 'Республика Крым',
      addressCountry: 'RU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '44.6630',
      longitude: '34.4001',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '8 800 777 63 08',
      contactType: 'reservations',
      areaServed: 'RU',
      availableLanguage: 'Russian',
    },
    priceRange: 'от 5 000 ₽',
    checkinTime: '14:00',
    checkoutTime: '12:00',
    numberOfRooms: 38,
    starRating: {
      '@type': 'Rating',
      ratingValue: '4.9',
      bestRating: '5',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Бесплатный Wi-Fi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Кондиционер', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Бесплатная парковка', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Кухня', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Балкон', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Телевизор', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Сейф', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Халаты и тапочки', value: true },
    ],
    acceptsReservations: 'https://lovelifestyle.ru/apartments',
    sameAs: [
      'https://www.instagram.com/lifestylecrimea',
      'https://t.me/lifestylecrimea',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
