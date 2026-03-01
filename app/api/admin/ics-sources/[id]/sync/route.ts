import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Временная заглушка
  return NextResponse.json({ 
    success: true, 
    count: 0,
    message: 'Sync temporarily disabled' 
  });
}