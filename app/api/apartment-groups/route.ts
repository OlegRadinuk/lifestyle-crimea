import { NextResponse } from 'next/server';
import { db, apartmentGroupService } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const groups = apartmentGroupService.getActive();

    if (groups.length === 0) {
      return NextResponse.json([]);
    }

    const formatted = groups.map((group) => {
      // Load apartment details for each item
      const apartmentIds = group.items.map((i) => i.apartment_id);
      const members = apartmentIds.map((aptId) => {
        const apt = db.prepare(`
          SELECT id, title, max_guests FROM apartments
          WHERE id = ? AND deleted_at IS NULL
        `).get(aptId) as { id: string; title: string; max_guests: number } | undefined;

        if (!apt) return null;

        // Get first photo
        const img = db.prepare(`
          SELECT url FROM apartment_images WHERE apartment_id = ? ORDER BY sort_order ASC LIMIT 1
        `).get(aptId) as { url: string } | undefined;

        return {
          id: apt.id,
          title: apt.title,
          max_guests: apt.max_guests,
          first_photo: img?.url ?? null,
        };
      }).filter(Boolean);

      const total_guests = members.reduce((sum, m) => sum + (m?.max_guests ?? 0), 0);

      // ВАЖНО: group.note — внутренняя заметка менеджера, НЕ выдаём публично.
      return {
        id: group.id,
        title: group.title,
        proximity: group.proximity,
        building: group.building,
        sort: group.sort,
        total_guests,
        members,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartment groups:', error);
    return NextResponse.json({ error: 'Failed to fetch apartment groups' }, { status: 500 });
  }
}
