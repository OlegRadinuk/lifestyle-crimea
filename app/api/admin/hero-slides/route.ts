import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// GET /api/admin/hero-slides - получить все слайды
export async function GET() {
  try {
    const slides = db.prepare(`
      SELECT * FROM hero_slides ORDER BY sort_order ASC
    `).all();

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}

// POST /api/admin/hero-slides - добавить новый слайд
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Генерируем уникальное имя
    const ext = file.name.split('.').pop();
    const filename = `hero_${Date.now()}.${ext}`;
    const filepath = path.join(process.cwd(), 'public/images/hero', filename);
    
    // Убедимся, что папка существует
    const dir = path.join(process.cwd(), 'public/images/hero');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, buffer);
    
    const imageUrl = `/images/hero/${filename}`;
    
    // Получаем максимальный sort_order
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM hero_slides').get() as { max: number };
    const sortOrder = (maxOrder.max || 0) + 1;
    
    // Сохраняем в БД
    const stmt = db.prepare(`
      INSERT INTO hero_slides (image_url, title, subtitle, sort_order, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    
    const result = stmt.run(imageUrl, title || null, subtitle || null, sortOrder);
    
    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid,
      image_url: imageUrl,
      sort_order: sortOrder
    });
    
  } catch (error) {
    console.error('Error uploading hero slide:', error);
    return NextResponse.json({ error: 'Failed to upload slide' }, { status: 500 });
  }
}