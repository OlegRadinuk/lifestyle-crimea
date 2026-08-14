'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

// ===== FEATURE ICONS (inline SVG, same as frontend) =====
const S = 15;
const SW = 2;
const IC: React.FC<React.SVGProps<SVGSVGElement>> = (p) => (
  <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
);

const adminIcons: Record<string, React.ReactElement> = {
  wifi:       <IC><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></IC>,
  fridge:     <IC><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="9" y1="6" x2="9" y2="8"/><line x1="9" y1="14" x2="9" y2="16"/></IC>,
  wind:       <IC><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></IC>,
  home:       <IC><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IC>,
  kitchen:    <IC><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></IC>,
  microwave:  <IC><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M7 12h10"/><path d="M17 6V4"/><circle cx="17" cy="10" r="1"/></IC>,
  flame:      <IC><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></IC>,
  shower:     <IC><path d="M4 4h1"/><path d="M4 8h1"/><path d="M4 12h1"/><path d="M4 16h1"/><path d="M8 4h1"/><path d="M12 4a8 8 0 0 1 8 8v8H4v-8a8 8 0 0 1 8-8"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/></IC>,
  coffee:     <IC><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></IC>,
  slippers:   <IC><path d="M2 12C2 8.13 5.13 5 9 5h4c1.1 0 2 .9 2 2v2h1a3 3 0 0 1 3 3v4H5a3 3 0 0 1-3-3v-1z"/><path d="M5 19v2"/><path d="M19 19v2"/></IC>,
  tv:         <IC><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></IC>,
  washer:     <IC><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><path d="M7 6h.01M11 6h2"/></IC>,
  bath:       <IC><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></IC>,
  bed:        <IC><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></IC>,
  robe:       <IC><path d="M6 2L2 8v14h20V8L18 2L12 6L6 2z"/><path d="M6 2L12 6L18 2"/><path d="M12 6v16"/></IC>,
  desk:       <IC><rect x="2" y="14" width="20" height="2" rx="1"/><path d="M7 14v4"/><path d="M17 14v4"/><path d="M9 14V8a3 3 0 0 1 6 0v6"/></IC>,
  utensils:   <IC><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></IC>,
  kettle:     <IC><path d="M19 9H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/><path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><path d="M9 9V6"/></IC>,
  iron:       <IC><path d="M3 10h13l5 3v3H3v-6z"/><path d="M10 10V7"/><circle cx="7" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/></IC>,
  towel:      <IC><path d="M9 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="6" rx="1"/></IC>,
  wardrobe:   <IC><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M12 3v18"/><path d="M8 12h1"/><path d="M15 12h1"/></IC>,
  pin:        <IC><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></IC>,
  outdoor:    <IC><path d="M2 12a10 10 0 0 1 20 0z"/><line x1="12" y1="12" x2="12" y2="20"/><path d="M9 20h6"/></IC>,
  cosmetics:  <IC><path d="M9 3h6l1 7H8L9 3z"/><path d="M8 10c0 5 4 9 4 9s4-4 4-9"/><line x1="12" y1="19" x2="12" y2="22"/></IC>,
  table:      <IC><rect x="2" y="6" width="20" height="3" rx="1"/><line x1="5" y1="9" x2="5" y2="20"/><line x1="19" y1="9" x2="19" y2="20"/></IC>,
  chair:      <IC><rect x="5" y="10" width="14" height="2" rx="1"/><rect x="14" y="3" width="2" height="9" rx="1"/><line x1="7" y1="12" x2="7" y2="21"/><line x1="16" y1="12" x2="16" y2="21"/></IC>,
  dishwasher: <IC><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><circle cx="8" cy="6" r="1"/><circle cx="16" cy="6" r="1"/><path d="M8 14h8M8 17h5"/></IC>,
  oven:       <IC><rect x="3" y="4" width="18" height="17" rx="2"/><rect x="7" y="9" width="10" height="8" rx="1"/><line x1="7" y1="4" x2="7" y2="2"/><line x1="17" y1="4" x2="17" y2="2"/><circle cx="8.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="6.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></IC>,
  sofa:       <IC><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 11a2 2 0 0 1 4 0v2H2v-2z"/><path d="M22 11a2 2 0 0 0-4 0v2h4v-2z"/><path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/><line x1="6" y1="19" x2="6" y2="21"/><line x1="18" y1="19" x2="18" y2="21"/></IC>,
  lounger:    <IC><path d="M2 17h20"/><path d="M6 17V10l-4 7"/><path d="M6 10h12a2 2 0 0 1 2 2v5"/><line x1="6" y1="17" x2="6" y2="20"/><line x1="18" y1="17" x2="18" y2="20"/></IC>,
  walk:       <IC><circle cx="12" cy="4" r="2"/><path d="M9.5 8.5L8 20"/><path d="M14.5 8.5L16 20"/><path d="M7 12h10"/></IC>,
  baby:       <IC><rect x="2" y="10" width="20" height="11" rx="2"/><line x1="6" y1="10" x2="6" y2="4"/><line x1="12" y1="10" x2="12" y2="4"/><line x1="18" y1="10" x2="18" y2="4"/><circle cx="12" cy="16" r="2"/></IC>,
  trekking:   <IC><line x1="7" y1="22" x2="12" y2="2"/><line x1="17" y1="22" x2="12" y2="2"/><line x1="9" y1="13" x2="15" y2="13"/></IC>,
};

const PRESET_FEATURES: { label: string; iconKey: string }[] = [
  { label: 'Собственная ванная комната',            iconKey: 'bath' },
  { label: 'Ванна',                                 iconKey: 'bath' },
  { label: 'Душевая кабина',                        iconKey: 'shower' },
  { label: 'Отдельная кухня',                       iconKey: 'kitchen' },
  { label: 'Кухонная зона',                         iconKey: 'kitchen' },
  { label: 'Wi-Fi',                                 iconKey: 'wifi' },
  { label: 'Большой холодильник',                   iconKey: 'fridge' },
  { label: 'Микроволновая печь',                    iconKey: 'microwave' },
  { label: 'Духовой шкаф',                          iconKey: 'oven' },
  { label: 'Индукционная варочная панель',           iconKey: 'flame' },
  { label: 'Посудомоечная машина',                  iconKey: 'dishwasher' },
  { label: 'Вытяжка',                               iconKey: 'wind' },
  { label: 'Набор посуды',                          iconKey: 'utensils' },
  { label: 'Столовые приборы',                      iconKey: 'utensils' },
  { label: 'Электрический чайник',                  iconKey: 'kettle' },
  { label: 'Кофеварка капельная',                   iconKey: 'coffee' },
  { label: 'Обеденный стол',                        iconKey: 'table' },
  { label: 'Стулья',                                iconKey: 'chair' },
  { label: 'Консольный столик',                     iconKey: 'table' },
  { label: 'Компьютерный столик',                   iconKey: 'desk' },
  { label: 'Кровать Queen-size 160 × 200',          iconKey: 'bed' },
  { label: 'Кровать King-size 180 × 200',           iconKey: 'bed' },
  { label: 'Раскладное кресло 90 × 200',            iconKey: 'sofa' },
  { label: 'Односпальная кровать 90 × 200',         iconKey: 'bed' },
  { label: 'Раскладной двухместный диван 200 × 200', iconKey: 'sofa' },
  { label: 'Гардеробная зона',                      iconKey: 'wardrobe' },
  { label: 'Доска гладильная',                      iconKey: 'iron' },
  { label: 'Утюг',                                  iconKey: 'iron' },
  { label: 'Сушилка для белья напольная',            iconKey: 'washer' },
  { label: 'SMART TV',                              iconKey: 'tv' },
  { label: 'Стиральная машинка',                    iconKey: 'washer' },
  { label: 'Фен',                                   iconKey: 'wind' },
  { label: 'Постельные принадлежности',             iconKey: 'towel' },
  { label: 'Банные полотенца',                      iconKey: 'towel' },
  { label: 'Халаты по запросу',                     iconKey: 'robe' },
  { label: 'Одноразовые тапочки',                   iconKey: 'slippers' },
  { label: 'Косметические средства',                iconKey: 'cosmetics' },
  { label: 'Балкон',                                iconKey: 'home' },
  { label: 'Лоджия',                                iconKey: 'home' },
  { label: 'Садовая мебель',                        iconKey: 'outdoor' },
  { label: 'Кресло-кокон',                          iconKey: 'outdoor' },
  { label: 'Шезлонг',                               iconKey: 'lounger' },
  { label: 'Раскладушка по запросу',                iconKey: 'bed' },
  { label: 'Матрас по запросу',                     iconKey: 'bed' },
  { label: 'Палки для треккинга',                   iconKey: 'trekking' },
  { label: 'Надувной матрас',                       iconKey: 'outdoor' },
  { label: 'Надувное кресло',                       iconKey: 'outdoor' },
  { label: 'Манеж',                                 iconKey: 'baby' },
  { label: 'Расстояние до моря от 650 м',           iconKey: 'walk' },
];

type PageProps = {
  params: Promise<{ id: string }>
};

type Apartment = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  breakfast_price: number;
  lunch_price: number;
  dinner_price: number;
  custom_meal_price: number;
  custom_meal_description: string;
  hot_deal_enabled: boolean;
  hot_deal_discount: number;
  hot_deal_date_from: string | null;
  hot_deal_date_to: string | null;
  long_term_enabled: boolean;
  long_term_price: number;
  long_term_note: string;
  view: string;
  has_terrace: boolean;
  features: string[];
  images: string[];
  is_active: boolean;
  images_count?: number;
};

type Season = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  price_per_night: number;
  sort_order: number;
  template_id?: string | null;
};

type TemplatePrice = {
  id: string;           // template id
  name: string;
  date_from: string;
  date_to: string;
  sort_order: number;
  price_per_night: number | null;  // null = не задана для этого апартамента
  season_id: string | null;        // id строки в apartment_pricing_seasons
};

export default function EditApartmentPage({ params }: PageProps) {
  const { id } = use(params);

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imagesCount, setImagesCount] = useState(0);

  // Seasons state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    date_from: '',
    date_to: '',
    price_per_night: '',
  });
  const [savingSeason, setSavingSeason] = useState(false);

  // Template-based pricing
  const [templatePrices, setTemplatePrices] = useState<TemplatePrice[]>([]);
  const [tplPriceInputs, setTplPriceInputs] = useState<Record<string, string>>({});
  const [savingTpl, setSavingTpl] = useState<string | null>(null);

  useEffect(() => {
    fetchApartment();
    fetchImagesCount();
    fetchSeasons();
    fetchTemplatePrices();
  }, [id]);

  const fetchApartment = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${id}`);
      const data = await res.json();
      setApartment({
        ...data,
        breakfast_price: data.breakfast_price ?? 0,
        lunch_price: data.lunch_price ?? 0,
        dinner_price: data.dinner_price ?? 0,
        custom_meal_price: Number(data.custom_meal_price ?? 0),
        custom_meal_description: data.custom_meal_description ?? '',
        hot_deal_enabled: Boolean(data.hot_deal_enabled),
        hot_deal_discount: data.hot_deal_discount ?? 10,
        hot_deal_date_from: data.hot_deal_date_from ?? null,
        hot_deal_date_to: data.hot_deal_date_to ?? null,
        long_term_enabled: Boolean(data.long_term_enabled),
        long_term_price: Number(data.long_term_price ?? 0),
        long_term_note: data.long_term_note ?? '',
      });
    } catch (error) {
      console.error('Error fetching apartment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImagesCount = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${id}/images`);
      const data = await res.json();
      setImagesCount(data.length || 0);
    } catch (error) {
      console.error('Error fetching images count:', error);
    }
  };

  const fetchSeasons = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${id}/seasons`);
      const data = await res.json();
      setSeasons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchTemplatePrices = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${id}/template-prices`);
      if (res.ok) {
        const data: TemplatePrice[] = await res.json();
        setTemplatePrices(data);
        const inputs: Record<string, string> = {};
        data.forEach(t => { inputs[t.id] = t.price_per_night !== null ? String(t.price_per_night) : ''; });
        setTplPriceInputs(inputs);
      }
    } catch (e) {
      console.error('Error fetching template prices:', e);
    }
  };

  const handleSaveTplPrice = async (templateId: string) => {
    const price = Number(tplPriceInputs[templateId]);
    if (!price || price <= 0) return alert('Введите цену больше 0');
    setSavingTpl(templateId);
    try {
      const res = await fetch(`/api/admin/apartments/${id}/template-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, price }),
      });
      if (res.ok) await fetchTemplatePrices();
      else alert('Ошибка при сохранении');
    } finally {
      setSavingTpl(null);
    }
  };

  const handleRemoveTplPrice = async (templateId: string) => {
    if (!confirm('Убрать сезонную цену для этого апартамента?')) return;
    await fetch(`/api/admin/apartments/${id}/template-prices`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    });
    await fetchTemplatePrices();
  };

  const handleAddSeason = async () => {
    if (!seasonForm.name || !seasonForm.date_from || !seasonForm.date_to || !seasonForm.price_per_night) return;
    setSavingSeason(true);
    try {
      const res = await fetch(`/api/admin/apartments/${id}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: seasonForm.name,
          date_from: seasonForm.date_from,
          date_to: seasonForm.date_to,
          price_per_night: Number(seasonForm.price_per_night),
          sort_order: seasons.length,
        }),
      });
      if (res.ok) {
        setSeasonForm({ name: '', date_from: '', date_to: '', price_per_night: '' });
        fetchSeasons();
      } else {
        const err = await res.json();
        alert(`Ошибка: ${err.error}`);
      }
    } catch (error) {
      console.error('Error saving season:', error);
    } finally {
      setSavingSeason(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    if (!confirm('Удалить сезон?')) return;
    try {
      await fetch(`/api/admin/apartments/${id}/seasons`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId }),
      });
      setSeasons((prev) => prev.filter((s) => s.id !== seasonId));
    } catch (error) {
      console.error('Error deleting season:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartment) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/apartments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apartment),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving apartment:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (!apartment) return <div>Апартамент не найден</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактирование: {apartment.title}</h1>
        <Link href="/admin/apartments" className="admin-button">← Назад</Link>
      </div>

      {saveSuccess && (
        <div className="save-success-banner">
          Сохранено успешно
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        {/* Основные поля формы */}
        <div className="form-group">
          <label>Название</label>
          <input
            type="text"
            value={apartment.title}
            onChange={(e) => setApartment({ ...apartment, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Краткое описание</label>
          <input
            type="text"
            value={apartment.short_description || ''}
            onChange={(e) => setApartment({ ...apartment, short_description: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Полное описание</label>
          <textarea
            value={apartment.description || ''}
            onChange={(e) => setApartment({ ...apartment, description: e.target.value })}
            rows={5}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Макс. гостей</label>
            <input
              type="number"
              value={apartment.max_guests}
              onChange={(e) => setApartment({ ...apartment, max_guests: +e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Площадь (м²)</label>
            <input
              type="number"
              value={apartment.area || ''}
              onChange={(e) => setApartment({ ...apartment, area: +e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Базовая цена (₽/ночь)</label>
          <input
            type="number"
            value={apartment.price_base}
            onChange={(e) => setApartment({ ...apartment, price_base: +e.target.value })}
            required
          />
        </div>

        {/* Блок Питание */}
        <div className="meal-section">
          <h3 className="meal-section__title">Питание (₽ / на чел. / день)</h3>
          <div className="meal-grid">
            <div className="form-group">
              <label>Завтрак</label>
              <input
                type="number"
                value={apartment.breakfast_price}
                onChange={(e) => setApartment({ ...apartment, breakfast_price: +e.target.value })}
                min={0}
              />
            </div>
            <div className="form-group">
              <label>Обед</label>
              <input
                type="number"
                value={apartment.lunch_price}
                onChange={(e) => setApartment({ ...apartment, lunch_price: +e.target.value })}
                min={0}
              />
            </div>
            <div className="form-group">
              <label>Ужин</label>
              <input
                type="number"
                value={apartment.dinner_price}
                onChange={(e) => setApartment({ ...apartment, dinner_price: +e.target.value })}
                min={0}
              />
            </div>
            <div className="form-group">
              <label>Индивидуальное питание — цена, ₽</label>
              <input
                type="number"
                min={0}
                value={apartment.custom_meal_price ?? 0}
                onChange={(e) => setApartment({ ...apartment, custom_meal_price: Math.max(0, Number(e.target.value) || 0) })}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Индивидуальное питание — описание</label>
              <textarea
                value={apartment.custom_meal_description}
                onChange={(e) => setApartment({ ...apartment, custom_meal_description: e.target.value })}
                placeholder="Опишите варианты для особых диет (ЗОЖ, веган, безглютен...)"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Блок Горячее предложение */}
        <div className={`hot-deal-section${apartment.hot_deal_enabled ? ' hot-deal-section--active' : ''}`}>
          <div className="hot-deal-header">
            <span className="hot-deal-title">🔥 Горячее предложение</span>
            <div className="hot-deal-controls">
              <label className="toggle-switch" aria-label="Включить горячее предложение">
                <input
                  type="checkbox"
                  checked={apartment.hot_deal_enabled}
                  onChange={(e) => setApartment({ ...apartment, hot_deal_enabled: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
              <div className="hot-deal-discount-field">
                <span>Скидка:</span>
                <input
                  type="number"
                  value={apartment.hot_deal_discount}
                  onChange={(e) => setApartment({ ...apartment, hot_deal_discount: Math.max(1, Math.min(99, +e.target.value || 1)) })}
                  min={1}
                  max={99}
                  disabled={!apartment.hot_deal_enabled}
                  className="discount-input"
                />
                <span>%</span>
              </div>
            </div>
          </div>
          {apartment.hot_deal_enabled && (
            <div className="hot-deal-preview">
              Цена со скидкой:{' '}
              <strong>
                {Math.round(apartment.price_base * (1 - apartment.hot_deal_discount / 100)).toLocaleString('ru-RU')} ₽/ночь
              </strong>
            </div>
          )}
          {apartment.hot_deal_enabled && (
            <div className="hot-deal-dates">
              <div className="form-group">
                <label>Начало акции</label>
                <input
                  type="date"
                  value={apartment.hot_deal_date_from ?? ''}
                  onChange={(e) => setApartment({ ...apartment, hot_deal_date_from: e.target.value || null })}
                />
              </div>
              <div className="form-group">
                <label>Конец акции</label>
                <input
                  type="date"
                  value={apartment.hot_deal_date_to ?? ''}
                  onChange={(e) => setApartment({ ...apartment, hot_deal_date_to: e.target.value || null })}
                  min={apartment.hot_deal_date_from ?? undefined}
                />
              </div>
              <small style={{color: '#94a3b8', fontSize: '12px'}}>Если даты не указаны — скидка действует всегда</small>
            </div>
          )}
        </div>

        {/* Блок Долгосрочная аренда */}
        <div className={`long-term-section${apartment.long_term_enabled ? ' long-term-section--active' : ''}`}>
          <div className="long-term-header">
            <span className="long-term-title">📅 Длительная аренда</span>
            <label className="toggle-switch" aria-label="Сдавать этот апартамент надолго">
              <input
                type="checkbox"
                checked={apartment.long_term_enabled}
                onChange={(e) => setApartment({ ...apartment, long_term_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {apartment.long_term_enabled && (
            <div className="long-term-body">
              <div className="form-group">
                <label>Цена за месяц, ₽</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={apartment.long_term_price}
                  onChange={(e) => setApartment({ ...apartment, long_term_price: Math.max(0, +e.target.value || 0) })}
                  placeholder="Например, 90000"
                />
              </div>

              <div className="form-group">
                <label>Подпись под ценой (необязательно)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={apartment.long_term_note}
                  onChange={(e) => setApartment({ ...apartment, long_term_note: e.target.value })}
                  placeholder="Если пусто — покажем «от N суток» из настроек"
                />
              </div>

              {apartment.long_term_price > 0 ? (
                <div className="long-term-preview">
                  На сайте:{' '}
                  <strong>{apartment.long_term_price.toLocaleString('ru-RU')} ₽ / мес</strong>
                </div>
              ) : (
                <div className="long-term-warning">
                  Пока цена не заполнена, апартамент не появится во вкладке «Долгосрочно» на сайте
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Вид</label>
          <select
            value={apartment.view}
            onChange={(e) => setApartment({ ...apartment, view: e.target.value })}
          >
            <option value="sea">На море</option>
            <option value="city">На город</option>
            <option value="garden">Во двор</option>
          </select>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={apartment.has_terrace}
              onChange={(e) => setApartment({ ...apartment, has_terrace: e.target.checked })}
            />
            Есть балкон
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={apartment.is_active}
              onChange={(e) => setApartment({ ...apartment, is_active: e.target.checked })}
            />
            Апартамент активен (показывается на сайте)
          </label>
        </div>

        {/* Характеристики */}
        <div className="form-section">
          <h3>Характеристики</h3>

          {/* Чипы с пресетами */}
          <div className="features-preset-grid">
            {PRESET_FEATURES.map((preset) => {
              const isSelected = apartment.features.includes(preset.label);
              return (
                <button
                  key={preset.label}
                  type="button"
                  className={`feature-chip-btn${isSelected ? ' selected' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      setApartment({ ...apartment, features: apartment.features.filter(f => f !== preset.label) });
                    } else {
                      setApartment({ ...apartment, features: [...apartment.features, preset.label] });
                    }
                  }}
                >
                  <span className="chip-icon">{adminIcons[preset.iconKey]}</span>
                  <span className="chip-label">{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Кастомные характеристики */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Дополнительные (через Enter)</label>
            <div className="custom-features-list">
              {apartment.features.filter(f => !PRESET_FEATURES.some(p => p.label === f)).map((feature, i) => (
                <div key={i} className="custom-feature-tag">
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => setApartment({ ...apartment, features: apartment.features.filter(f2 => f2 !== feature) })}
                  >✕</button>
                </div>
              ))}
              <input
                type="text"
                placeholder="Введите и нажмите Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !apartment.features.includes(val)) {
                      setApartment({ ...apartment, features: [...apartment.features, val] });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* КНОПКА ДЛЯ УПРАВЛЕНИЯ ФОТО */}
        <div className="photo-section">
          <h3>Фотографии</h3>
          <div className="photo-info">
            <span className={`photo-count-badge ${imagesCount ? 'has-photos' : 'no-photos'}`}>
              {imagesCount} фото загружено
            </span>
          </div>
          
          <Link
            href={`/admin/apartments/${id}/images`}
            className="photo-management-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="7" cy="7" r="1" fill="currentColor"/>
              <path d="M17 12L13 8L5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Управление фотографиями ({imagesCount})</span>
          </Link>
        </div>

        {/* СЕЗОННЫЕ ЦЕНЫ */}
        <div className="seasons-section">
          <h3 className="seasons-title">Сезонные цены</h3>

          {/* Шаблонные сезоны */}
          {templatePrices.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                Укажите цену для каждого сезона. Даты берутся из <a href="/admin/season-templates" style={{ color: '#0891b2' }}>глобальных шаблонов</a>.
              </p>
              {templatePrices.map(t => (
                <div key={t.id} className="season-item tpl-season-item">
                  <div className="season-item__info">
                    <span className="season-item__name">{t.name}</span>
                    <span className="season-item__dates">{t.date_from} — {t.date_to}</span>
                  </div>
                  <div className="tpl-price-controls">
                    <input
                      type="number"
                      value={tplPriceInputs[t.id] ?? ''}
                      onChange={e => setTplPriceInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="₽/ночь"
                      className="tpl-price-input"
                    />
                    <button
                      type="button"
                      className="admin-button small primary"
                      disabled={savingTpl === t.id}
                      onClick={() => handleSaveTplPrice(t.id)}
                    >
                      {savingTpl === t.id ? '...' : 'Сохранить'}
                    </button>
                    {t.price_per_night !== null && (
                      <button type="button" className="admin-button small warning" onClick={() => handleRemoveTplPrice(t.id)}>
                        Убрать
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {templatePrices.length === 0 && (
            <p className="seasons-empty" style={{ marginBottom: 12 }}>
              Глобальные шаблоны не настроены.{' '}
              <a href="/admin/season-templates" style={{ color: '#0891b2' }}>Настроить шаблоны</a>
            </p>
          )}

          {/* Кастомные сезоны (без шаблона) */}
          {seasons.filter(s => !s.template_id).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Кастомные сезоны (заданы вручную):</p>
              <div className="seasons-list">
                {seasons.filter(s => !s.template_id).map((s) => (
                  <div key={s.id} className="season-item">
                    <div className="season-item__info">
                      <span className="season-item__name">{s.name}</span>
                      <span className="season-item__dates">{s.date_from} — {s.date_to}</span>
                      <span className="season-item__price">{s.price_per_night.toLocaleString('ru-RU')} ₽/ночь</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteSeason(s.id)} className="admin-button small warning">
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="season-form">
            <h4 className="season-form__title">Добавить кастомный сезон</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={seasonForm.name}
                  onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                  placeholder="Например: Высокий сезон"
                />
              </div>
              <div className="form-group">
                <label>Цена за ночь (₽)</label>
                <input
                  type="number"
                  value={seasonForm.price_per_night}
                  onChange={(e) => setSeasonForm({ ...seasonForm, price_per_night: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Дата начала</label>
                <input
                  type="date"
                  value={seasonForm.date_from}
                  onChange={(e) => setSeasonForm({ ...seasonForm, date_from: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Дата окончания</label>
                <input
                  type="date"
                  value={seasonForm.date_to}
                  onChange={(e) => setSeasonForm({ ...seasonForm, date_to: e.target.value })}
                />
              </div>
            </div>
            <button
              type="button"
              className="admin-button primary"
              disabled={savingSeason}
              onClick={handleAddSeason}
            >
              {savingSeason ? 'Сохранение...' : '+ Добавить сезон'}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-button primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <Link href="/admin/apartments" className="admin-button secondary">
            ← К списку
          </Link>
        </div>
      </form>

      {/* Sticky save на мобиле */}
      <div className="sticky-save">
        <button
          type="button"
          className="admin-button primary"
          disabled={saving}
          onClick={handleSubmit as unknown as React.MouseEventHandler}
        >
          {saving ? 'Сохранение...' : saveSuccess ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>

      <style jsx>{`
        /* Success banner */
        .save-success-banner {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
          border-radius: 10px;
          padding: 12px 20px;
          margin-bottom: 16px;
          font-weight: 500;
          font-size: 14px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Sticky save button (mobile only) */
        .sticky-save {
          display: none;
        }

        @media (max-width: 640px) {
          .sticky-save {
            display: block;
            position: fixed;
            bottom: 16px;
            left: 16px;
            right: 16px;
            z-index: 100;
          }

          .sticky-save .admin-button.primary {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(19, 154, 182, 0.5);
            text-align: center;
            justify-content: center;
          }

          /* Отступ снизу чтобы форма не перекрывалась */
          .admin-form {
            padding-bottom: 80px;
          }
        }

        /* Блок Питание */
        .meal-section {
          margin: 0 0 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .meal-section__title {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 16px;
        }

        .meal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .meal-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Блок Горячее предложение */
        .hot-deal-section {
          margin: 0 0 24px;
          padding: 16px 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: background 0.2s, border-color 0.2s;
        }

        .hot-deal-section--active {
          background: #fff7ed;
          border-color: #f97316;
        }

        .hot-deal-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .hot-deal-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
        }

        .hot-deal-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Toggle switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          cursor: pointer;
          margin-bottom: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .toggle-slider {
          position: absolute;
          inset: 0;
          background: #cbd5e1;
          border-radius: 24px;
          transition: background 0.2s;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          left: 3px;
          top: 3px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }

        .toggle-switch input:checked + .toggle-slider {
          background: #f97316;
        }

        .toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .hot-deal-discount-field {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #475569;
        }

        .discount-input {
          width: 60px;
          padding: 6px 8px;
          border: 1px solid #d0d9e2;
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
          transition: border-color 0.2s;
        }

        .discount-input:focus {
          outline: none;
          border-color: #f97316;
        }

        .discount-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .hot-deal-preview {
          margin-top: 12px;
          font-size: 14px;
          color: #ea580c;
        }

        .hot-deal-preview strong {
          font-size: 16px;
          font-weight: 700;
        }

        /* Длительная аренда */
        .long-term-section {
          margin: 0 0 24px;
          padding: 16px 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: background 0.2s, border-color 0.2s;
        }

        .long-term-section--active {
          background: #ecfeff;
          border-color: #139ab6;
        }

        .long-term-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .long-term-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
        }

        .long-term-body {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 16px;
          align-items: start;
        }

        .long-term-preview,
        .long-term-warning {
          grid-column: 1 / -1;
          font-size: 14px;
        }

        .long-term-preview {
          color: #0e7490;
        }

        .long-term-preview strong {
          font-size: 16px;
          font-weight: 700;
        }

        .long-term-warning {
          color: #b45309;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 8px 12px;
        }

        @media (max-width: 768px) {
          .long-term-body {
            grid-template-columns: 1fr;
          }
        }

        .photo-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .photo-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 16px;
        }
        
        .photo-info {
          margin-bottom: 16px;
        }
        
        .photo-count-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .photo-count-badge.has-photos {
          background: #e6f7ff;
          color: #139ab6;
          border: 1px solid rgba(19, 154, 182, 0.2);
        }
        
        .photo-count-badge.no-photos {
          background: #f5f5f5;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        
        .photo-management-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #139ab6, #1fb3cf);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
          border: none;
          cursor: pointer;
        }
        
        .photo-management-btn:hover {
          background: linear-gradient(135deg, #0f7a91, #139ab6);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(19, 154, 182, 0.4);
        }
        
        .photo-management-btn svg {
          margin-right: 4px;
        }
        
        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        .admin-button.primary {
          background: linear-gradient(135deg, #139ab6, #1fb3cf);
          color: white;
          padding: 12px 28px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
        }
        
        .admin-button.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #0f7a91, #139ab6);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(19, 154, 182, 0.4);
        }
        
        .admin-button.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .admin-button.secondary {
          background: white;
          color: #1a2634;
          padding: 12px 28px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .admin-button.secondary:hover {
          background: #f8fafc;
          border-color: #139ab6;
          color: #139ab6;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #1a2634;
        }
        
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #139ab6;
        }
        
        .form-group.checkbox {
          display: flex;
          align-items: center;
        }
        
        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .form-group.checkbox input {
          width: auto;
        }
        
        /* Секция характеристик */
        .form-section {
          margin: 0 0 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .form-section h3 {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 16px;
        }

        .features-preset-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .feature-chip-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          background: #f9fafb;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .feature-chip-btn:hover {
          border-color: #6366f1;
          background: #eef2ff;
        }

        .feature-chip-btn.selected {
          background: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }

        .chip-icon { font-size: 14px; }
        .chip-label { font-size: 13px; }

        .custom-features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .custom-feature-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 12px;
          font-size: 13px;
        }

        .custom-feature-tag button {
          background: none;
          border: none;
          cursor: pointer;
          color: #92400e;
          font-size: 12px;
          padding: 0;
        }

        .custom-features-list input {
          border: 1px dashed #d1d5db;
          border-radius: 12px;
          padding: 4px 12px;
          font-size: 13px;
          outline: none;
          min-width: 200px;
        }
        
        /* Seasons */
        .seasons-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .seasons-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 16px;
        }

        .seasons-empty {
          color: #94a3b8;
          font-style: italic;
          margin-bottom: 20px;
        }

        .seasons-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .season-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .season-item__info {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .season-item__name {
          font-weight: 600;
          color: #1a2634;
          font-size: 14px;
        }

        .season-item__dates {
          font-size: 13px;
          color: #64748b;
        }

        .season-item__price {
          font-size: 13px;
          font-weight: 500;
          color: #139ab6;
        }

        .season-form {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          margin-top: 4px;
        }

        .season-form__title {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 12px;
        }

        /* Template price controls */
        .tpl-price-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .tpl-price-input {
          width: 110px;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
        }

        .tpl-season-item {
          align-items: center;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .photo-management-btn {
            width: 100%;
            justify-content: center;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .admin-button.primary,
          .form-actions .admin-button.secondary {
            width: 100%;
            text-align: center;
          }

          .add-feature {
            flex-direction: column;
          }

          .season-item {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .tpl-season-item {
            align-items: stretch;
          }

          .tpl-price-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
          }

          .tpl-price-input {
            flex: 1;
            width: auto;
            min-width: 80px;
          }

          .tpl-price-controls .admin-button {
            flex-shrink: 0;
          }

          .season-item > div:last-child {
            display: flex;
            gap: 8px;
            width: 100%;
          }

          .season-item > div:last-child input {
            flex: 1;
            width: auto;
          }

          .season-item > div:last-child .admin-button {
            flex-shrink: 0;
          }

          /* hot-deal dates в одну колонку */
          .hot-deal-dates .form-group {
            width: 100%;
          }

          /* features preset grid — уменьшаем чипы */
          .feature-chip-btn {
            font-size: 12px;
            padding: 5px 10px;
          }

          .chip-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}