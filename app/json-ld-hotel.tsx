// app/json-ld-hotel.tsx
export default function JsonLdHotel() {
  const hotelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: 'Life Style Crimea',
    alternateName: 'Стиль Жизни с любовью',
    description: 'Премиальные апартаменты в Алуште с видом на море. 38 дизайнерских номеров с балконами, полностью укомплектованы.',
    url: 'https://lovelifestyle.ru',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Алушта',
      addressRegion: 'Крым',
      addressCountry: 'RU',
    },
    telephone: '+7 (978) 582-86-93',
    priceRange: 'от 5 000 ₽',
    starRating: {
      '@type': 'Rating',
      ratingValue: '4.9',
      bestRating: '5',
      ratingCount: '127',
    },
    amenities: ['Бесплатный Wi-Fi', 'Кондиционер', 'Парковка', 'Кухня', 'Балкон'],
    checkinTime: '14:00',
    checkoutTime: '12:00',
    numberOfRooms: '38',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }}
    />
  );
}