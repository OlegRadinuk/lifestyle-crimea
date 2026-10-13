import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { apartmentGroupService, ProximityType } from '@/lib/db';

const VALID_PROXIMITIES: ProximityType[] = ['adjacent', 'same_floor', 'stacked'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  try {
    const group = apartmentGroupService.getById(id);
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching apartment group:', error);
    return NextResponse.json({ error: 'Failed to fetch apartment group' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  try {
    const data = await request.json();
    const updates: Parameters<typeof apartmentGroupService.update>[1] = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
      }
      updates.title = data.title.trim().slice(0, 200);
    }

    if (data.proximity !== undefined) {
      if (!VALID_PROXIMITIES.includes(data.proximity)) {
        return NextResponse.json(
          { error: `proximity must be one of: ${VALID_PROXIMITIES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.proximity = data.proximity as ProximityType;
    }

    if (data.building !== undefined) {
      const b = data.building === null || data.building === '' ? null : Number(data.building);
      updates.building = (b !== null && Number.isInteger(b) && b >= 1 && b <= 6) ? b : null;
    }

    if (data.note !== undefined) {
      updates.note = typeof data.note === 'string' ? data.note.trim().slice(0, 500) || null : null;
    }

    if (data.sort !== undefined) {
      updates.sort = Number(data.sort) || 0;
    }

    if (data.is_active !== undefined) {
      updates.is_active = Boolean(data.is_active);
    }

    if (data.apartmentIds !== undefined) {
      if (!Array.isArray(data.apartmentIds) || data.apartmentIds.length < 2 || data.apartmentIds.length > 4) {
        return NextResponse.json({ error: 'apartmentIds must be an array of 2 to 4 items' }, { status: 400 });
      }
      updates.apartmentIds = data.apartmentIds;
    }

    const updated = apartmentGroupService.update(id, updates);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating apartment group:', error);
    return NextResponse.json({ error: 'Failed to update apartment group' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  try {
    const ok = apartmentGroupService.delete(id);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting apartment group:', error);
    return NextResponse.json({ error: 'Failed to delete apartment group' }, { status: 500 });
  }
}
