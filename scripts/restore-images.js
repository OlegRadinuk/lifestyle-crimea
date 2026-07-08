#!/usr/bin/env node
/**
 * scripts/restore-images.js
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SAFE VERSION — rewritten July 2026. Does NOT create duplicates.   ║
 * ║                                                                      ║
 * ║  The previous version did DELETE-all then INSERT, which caused       ║
 * ║  duplicate rows when run on top of a restored DB backup.            ║
 * ║  This version is idempotent: it only INSERTs records that don't     ║
 * ║  already exist in the DB (matched by url). It never deletes.        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Purpose: scan UPLOADS_BASE/images/apartments/<id>/ directories and insert
 * DB records for any image file that doesn't already have one.
 * Existing records are left untouched.
 *
 * Usage:
 *   node scripts/restore-images.js                               # dry-run (default)
 *   node scripts/restore-images.js --apply                       # apply inserts
 *   UPLOADS_ROOT=/var/www/lovelifestyle-uploads \
 *     node scripts/restore-images.js --apply                     # production
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DRY_RUN = !process.argv.includes('--apply');

const UPLOADS_BASE =
  process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public');

const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');

const APARTMENTS_DIR = path.join(UPLOADS_BASE, 'images', 'apartments');

// ── Startup checks ────────────────────────────────────────────────────────────

if (!fs.existsSync(DB_PATH)) {
  console.error(`ERROR: database not found at ${DB_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(APARTMENTS_DIR)) {
  console.error(`ERROR: apartments directory not found: ${APARTMENTS_DIR}`);
  process.exit(1);
}

const db = new Database(DB_PATH);

console.log('============================================================');
console.log(`Mode        : ${DRY_RUN ? 'DRY-RUN (no changes will be made)' : 'APPLY'}`);
console.log(`Database    : ${DB_PATH}`);
console.log(`UPLOADS_BASE: ${UPLOADS_BASE}`);
console.log(`Scanning    : ${APARTMENTS_DIR}`);
console.log('============================================================');
console.log('');

let inserted = 0;
let skipped = 0;

// Prepare the idempotent insert statement once.
// Uses WHERE NOT EXISTS to guarantee no duplicates even under concurrent access.
const insertStmt = db.prepare(`
  INSERT INTO apartment_images (apartment_id, url, sort_order)
  SELECT ?, ?, ?
  WHERE NOT EXISTS (
    SELECT 1 FROM apartment_images WHERE url = ?
  )
`);

const apartmentDirs = fs.readdirSync(APARTMENTS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

for (const aptId of apartmentDirs) {
  const aptDir = path.join(APARTMENTS_DIR, aptId);

  let files;
  try {
    files = fs.readdirSync(aptDir)
      .filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f))
      .sort();
  } catch (err) {
    console.warn(`  Skipping ${aptId}: cannot read directory (${err.message})`);
    continue;
  }

  if (files.length === 0) continue;

  for (const file of files) {
    const imageUrl = `/images/apartments/${aptId}/${file}`;

    // Check if record already exists.
    const existing = db.prepare(
      'SELECT id FROM apartment_images WHERE url = ?'
    ).get(imageUrl);

    if (existing) {
      skipped++;
      continue;
    }

    // Determine next sort_order for this apartment.
    const maxSort = db.prepare(
      'SELECT MAX(sort_order) AS max FROM apartment_images WHERE apartment_id = ?'
    ).get(aptId);
    const sortOrder = (maxSort?.max ?? 0) + 1;

    console.log(
      `  [INSERT] apartment=${aptId}  url="${imageUrl}"  sort_order=${sortOrder}`
    );

    if (!DRY_RUN) {
      insertStmt.run(aptId, imageUrl, sortOrder, imageUrl);
    }

    inserted++;
  }
}

console.log('');
console.log('============================================================');
console.log('Summary');
console.log('============================================================');
console.log(`  Already in DB (skipped)   : ${skipped}`);
console.log(`  New records inserted      : ${DRY_RUN ? '[dry] ' : ''}${inserted}`);

if (DRY_RUN && inserted > 0) {
  console.log('');
  console.log('Re-run with --apply to insert the above records.');
}
