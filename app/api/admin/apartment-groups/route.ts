import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { apartmentGroupService, ProximityType } from '@/lib/db';

const VALID_PROXIMITIES: ProximityType[] = ['adjacent', 'same_floor', 'stacked'];

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const groups = apartmentGroupService.getAll();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching apartment groups:', error);
    return NextResponse.json({ error: 'Failed to fetch apartment groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const data = await request.json();

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    if (!VALID_PROXIMITIES.includes(data.proximity)) {
      return NextResponse.json(
        { error: `proximity must be one of: ${VALID_PROXIMITIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(data.apartmentIds) || data.apartmentIds.length < 2 || data.apartmentIds.length > 4) {
      return NextResponse.json({ error: 'apartmentIds must be an array of 2 to 4 items' }, { status: 400 });
    }

    const building = data.building === null || data.building === undefined || data.building === ''
      ? null
      : Number(data.building);
    const validBuilding = (building !== null && Number.isInteger(building) && building >= 1 && building <= 6)
      ? building
      : null;

    const group = apartmentGroupService.create({
      title: data.title.trim().slice(0, 200),
      proximity: data.proximity as ProximityType,
      building: validBuilding,
      note: typeof data.note === 'string' ? data.note.trim().slice(0, 500) || null : null,
      sort: typeof data.sort === 'number' ? data.sort : undefined,
      is_active: Boolean(data.is_active),
      apartmentIds: data.apartmentIds,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating apartment group:', error);
    return NextResponse.json({ error: 'Failed to create apartment group' }, { status: 500 });
  }
}
