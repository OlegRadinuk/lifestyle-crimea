import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

export type Apartment = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string;
  has_terrace: boolean;
  features: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Тип для сырых данных из БД
type RawApartment = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string;
  has_terrace: number; // в БД хранится как 0/1
  features: string | null; // в БД хранится как JSON строка
  images: string | null; // в БД хранится как JSON строка
  is_active: number; // в БД хранится как 0/1
  created_at: string;
  updated_at: string;
};

export const apartmentService = {
  // Получить все апартаменты
  getAll: (): Apartment[] => {
    const apartments = db.prepare('SELECT * FROM apartments ORDER BY title').all() as RawApartment[];
    
    return apartments.map(apt => ({
      id: apt.id,
      title: apt.title,
      short_description: apt.short_description,
      description: apt.description,
      max_guests: apt.max_guests,
      area: apt.area,
      price_base: apt.price_base,
      view: apt.view,
      has_terrace: apt.has_terrace === 1,
      features: apt.features ? JSON.parse(apt.features) : [],
      images: apt.images ? JSON.parse(apt.images) : [],
      is_active: apt.is_active === 1,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
    }));
  },

  // Получить один апартамент по ID
  getById: (id: string): Apartment | null => {
    const apt = db.prepare('SELECT * FROM apartments WHERE id = ?').get(id) as RawApartment | undefined;
    if (!apt) return null;
    
    return {
      id: apt.id,
      title: apt.title,
      short_description: apt.short_description,
      description: apt.description,
      max_guests: apt.max_guests,
      area: apt.area,
      price_base: apt.price_base,
      view: apt.view,
      has_terrace: apt.has_terrace === 1,
      features: apt.features ? JSON.parse(apt.features) : [],
      images: apt.images ? JSON.parse(apt.images) : [],
      is_active: apt.is_active === 1,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
    };
  },

  // Создать новый апартамент
  create: (data: Partial<Apartment>) => {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO apartments (
        id, title, short_description, description, max_guests,
        area, price_base, view, has_terrace, features, images, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title || '',
      data.short_description || null,
      data.description || null,
      data.max_guests || 2,
      data.area || null,
      data.price_base || 0,
      data.view || 'sea',
      data.has_terrace ? 1 : 0,
      data.features ? JSON.stringify(data.features) : '[]',
      data.images ? JSON.stringify(data.images) : '[]',
      data.is_active ? 1 : 0,
      now,
      now
    );

    return id;
  },

  // Обновить апартамент
  update: (id: string, data: Partial<Apartment>) => {
    const updates: string[] = [];
    const values: any[] = [];

    const fields = [
      'title', 'short_description', 'description', 'max_guests',
      'area', 'price_base', 'view', 'has_terrace', 'features', 'images', 'is_active'
    ];

    fields.forEach(field => {
      if (data[field as keyof Apartment] !== undefined) {
        updates.push(`${field} = ?`);
        
        if (field === 'features' || field === 'images') {
          values.push(JSON.stringify(data[field as keyof Apartment]));
        } else if (field === 'has_terrace' || field === 'is_active') {
          values.push(data[field as keyof Apartment] ? 1 : 0);
        } else {
          values.push(data[field as keyof Apartment]);
        }
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE apartments SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);
    
    return true;
  },

  // Удалить апартамент
  delete: (id: string) => {
    db.prepare('DELETE FROM apartments WHERE id = ?').run(id);
  },

  // Синхронизировать с data/apartments.ts (первоначальная загрузка)
  syncFromSource: (apartments: any[]) => {
    for (const apt of apartments) {
      const existing = db.prepare('SELECT id FROM apartments WHERE id = ?').get(apt.id) as { id: string } | undefined;
      
      if (!existing) {
        apartmentService.create({
          id: apt.id,
          title: apt.title,
          short_description: apt.shortDescription,
          description: apt.description,
          max_guests: apt.maxGuests,
          area: apt.area,
          price_base: apt.priceBase,
          view: apt.view,
          has_terrace: apt.hasTerrace,
          features: apt.features,
          images: apt.images,
          is_active: true,
        });
      }
    }
  }
};