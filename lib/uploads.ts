import path from 'path';

/**
 * Physical base directory for uploaded files.
 *
 * Set UPLOADS_ROOT on the server to move uploads outside the git repo:
 *   UPLOADS_ROOT=/var/www/lovelifestyle-uploads
 *
 * Falls back to <cwd>/public for local development (preserves existing behaviour).
 *
 * URLs stored in the DB (/images/apartments/<id>/<file>) are NOT affected —
 * nginx maps `location /images/` to `UPLOADS_ROOT/images/` on the server.
 */
export const UPLOADS_BASE: string =
  process.env.UPLOADS_ROOT ?? path.join(process.cwd(), 'public');
