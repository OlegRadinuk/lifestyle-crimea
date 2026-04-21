import { NextResponse } from 'next/server';
import { db, pricingService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;
  return NextResponse.json(pricingService.getSeasons(id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id: apartment_id } = await params;

  try {
    const data = await request.json();
    const seasonId = pricingService.upsertSeason({
      id: data.id,
      apartment_id,
      name: data.name,
      date_from: data.date_from,
      date_to: data.date_to,
      price_per_night: Number(data.price_per_night),
      sort_order: Number(data.sort_order || 0),
    });
    return NextResponse.json({ success: true, id: seasonId });
  } catch (error) {
    console.error('Error saving season:', error);
    return NextResponse.json({ error: 'Failed to save season' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { seasonId } = await request.json();
    pricingService.deleteSeason(seasonId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
  }
}
