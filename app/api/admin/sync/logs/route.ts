import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Проверим, есть ли таблица sync_logs
    const logs = db.prepare(`
      SELECT * FROM sync_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();

    return NextResponse.json(logs);
  } catch (error) {
    // Если таблицы нет, вернем пустой массив
    console.error('Error fetching logs:', error);
    return NextResponse.json([]);
  }
}