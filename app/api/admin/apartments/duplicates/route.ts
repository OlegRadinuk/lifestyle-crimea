import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

interface ApartmentRow {
  id: string;
  title: string;
  images_count: number;
  created_at: string;
}

interface DuplicateGroupRow {
  title: string;
  cnt: number;
  ids: string;
}

interface DuplicateApartment {
  id: string;
  title: string;
  images_count: number;
  created_at: string;
}

interface DuplicateGroup {
  title: string;
  count: number;
  apartments: DuplicateApartment[];
}

const DeleteDuplicatesSchema = z.object({
  keepId: z.string().min(1),
  deleteIds: z.array(z.string().min(1)).min(1),
});

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const groups = db.prepare<[], DuplicateGroupRow>(`
      SELECT title, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
      FROM apartments
      WHERE deleted_at IS NULL
      GROUP BY LOWER(TRIM(title))
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
    `).all();

    if (groups.length === 0) {
      return NextResponse.json([]);
    }

    const result: DuplicateGroup[] = groups.map((group) => {
      const ids = group.ids.split(',');

      const apartments = ids.map((id) => {
        const apt = db.prepare<[string], ApartmentRow>(`
          SELECT
            a.id,
            a.title,
            a.created_at,
            COUNT(ai.id) AS images_count
          FROM apartments a
          LEFT JOIN apartment_images ai ON ai.apartment_id = a.id
          WHERE a.id = ?
          GROUP BY a.id
        `).get(id);

        if (!apt) {
          return null;
        }

        return {
          id: apt.id,
          title: apt.title,
          images_count: Number(apt.images_count),
          created_at: apt.created_at,
        };
      }).filter((apt): apt is DuplicateApartment => apt !== null);

      // Sort: more images first, then older records first
      apartments.sort((a, b) => {
        if (b.images_count !== a.images_count) {
          return b.images_count - a.images_count;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      return {
        title: group.title,
        count: group.cnt,
        apartments,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching duplicate apartments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate apartments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { keepId, deleteIds } = DeleteDuplicatesSchema.parse(body);

    // Verify keepId exists and is not deleted
    const keepApt = db.prepare<[string], { id: string }>(
      'SELECT id FROM apartments WHERE id = ? AND deleted_at IS NULL'
    ).get(keepId);

    if (!keepApt) {
      return NextResponse.json(
        { error: `Apartment to keep (id: ${keepId}) not found or already deleted` },
        { status: 404 }
      );
    }

    // Ensure keepId is not in deleteIds
    if (deleteIds.includes(keepId)) {
      return NextResponse.json(
        { error: 'keepId cannot be in deleteIds' },
        { status: 400 }
      );
    }

    const softDelete = db.prepare<[string]>(
      'UPDATE apartments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL'
    );

    const deleteMany = db.transaction((ids: string[]) => {
      let deleted = 0;
      for (const id of ids) {
        const info = softDelete.run(id);
        deleted += info.changes;
      }
      return deleted;
    });

    const deletedCount = deleteMany(deleteIds);

    return NextResponse.json({
      success: true,
      kept: keepId,
      deleted: deletedCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    console.error('Error deleting duplicate apartments:', error);
    return NextResponse.json(
      { error: 'Failed to delete duplicate apartments' },
      { status: 500 }
    );
  }
}
