import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';
import { checkAdminAuth } from '@/lib/admin-auth';
import { UPLOADS_BASE } from '@/lib/uploads';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { imageId } = await params;

    console.log('Deleting image:', imageId);

    // Get image record from DB
    const image = db.prepare(`
      SELECT * FROM apartment_images WHERE id = ?
    `).get(imageId) as { id: number; url: string; apartment_id: string } | undefined;

    if (!image) {
      console.log('Image not found:', imageId);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    console.log('Image record:', image);

    // Guard: check whether any OTHER record references the same physical file.
    // If yes — skip unlink so we don't break surviving records (duplicate-image scenario).
    const { c } = db.prepare(`
      SELECT COUNT(*) AS c FROM apartment_images WHERE url = ? AND id != ?
    `).get(image.url, imageId) as { c: number };

    if (c > 0) {
      console.log(
        `Skipping file unlink: ${c} other DB record(s) still reference "${image.url}"`
      );
    } else {
      // No other records share this file — safe to delete from disk.
      try {
        const filePath = image.url.startsWith('/')
          ? image.url.substring(1)
          : image.url;

        const fullPath = path.join(UPLOADS_BASE, filePath);
        console.log('Deleting file:', fullPath);

        await unlink(fullPath);
        console.log('File deleted successfully');
      } catch (fileError) {
        // File may already be gone; log a warning but continue with DB cleanup.
        console.warn(
          'Warning: could not delete file (record will still be removed):',
          fileError
        );
      }
    }

    // Always remove this DB record regardless of file outcome.
    db.prepare('DELETE FROM apartment_images WHERE id = ?').run(imageId);
    console.log('Database record deleted');

    // Re-number sort_order sequentially for the apartment.
    const remainingImages = db.prepare(`
      SELECT id FROM apartment_images
      WHERE apartment_id = ?
      ORDER BY sort_order
    `).all(image.apartment_id) as { id: number }[];

    remainingImages.forEach((img, index) => {
      db.prepare(`
        UPDATE apartment_images
        SET sort_order = ?
        WHERE id = ?
      `).run(index + 1, img.id);
    });

    console.log('Sort order updated');

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
