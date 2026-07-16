export default function JsonLdHotel() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: 'Life Style Crimea',
    alternateName: 'Стиль Жизни с любовью',
    description: 'Премиальные апартаменты в Алуште с видом на море. 40 дизайнерских апартаментов с балконами, полностью укомплектованы. Бронирование онлайн. Лучшие цены напрямую.',
    url: 'https://lovelifestyle.ru',
    logo: 'https://lovelifestyle.ru/logo.png',
    image: [
      'https://lovelifestyle.ru/og-image.jpg',
      'https://lovelifestyle.ru/images/aqua/pool-loungers.webp',
      'https://lovelifestyle.ru/images/aqua/sea-mountains.webp',
    ],
    // Оба номера — в формате E.164, иначе поисковики их игнорируют в сниппете
    telephone: ['+79785036363', '+78007776308'],
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
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+78007776308',
        contactType: 'reservations',
        name: 'Бесплатный по России',
        areaServed: 'RU',
        availableLanguage: 'Russian',
      },
      {
        '@type': 'ContactPoint',
        telephone: '+79785036363',
        contactType: 'reservations',
        areaServed: 'RU',
        availableLanguage: 'Russian',
      },
    ],
    // Приём круглосуточный — Яндекс любит показывать режим работы в сниппете
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    hasMap: 'https://yandex.ru/maps/?text=Алушта, Западная улица, 4к3',
    priceRange: 'от 5 000 ₽',
    checkinTime: '14:00',
    checkoutTime: '12:00',
    numberOfRooms: 40,
    starRating: {
      '@type': 'Rating',
      ratingValue: '4.9',
      bestRating: '5',
    },
    /* Реальные цифры с карточки Яндекс.Карт (проверено 16.07.2026): 4.9 из 91.
       Держать в схеме число, которого нет в источнике, нельзя — это фальшивый
       отзыв в разметке. Растёт число отзывов — обновляем здесь. */
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '91',
      bestRating: '5',
      worstRating: '1',
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
