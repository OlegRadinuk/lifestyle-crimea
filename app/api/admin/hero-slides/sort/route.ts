import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    const updateStmt = db.prepare('UPDATE hero_slides SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    
    for (let i = 0; i < ids.length; i++) {
      updateStmt.run(i + 1, ids[i]);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error sorting hero slides:', error);
    return NextResponse.json({ error: 'Failed to sort slides' }, { status: 500 });
  }
}