import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const slides = db.prepare(`
      SELECT * FROM hero_slides 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `).all();

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}