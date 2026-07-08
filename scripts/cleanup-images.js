#!/usr/bin/env node
/**
 * scripts/cleanup-images.js
 *
 * Idempotent cleanup for the apartment_images table. Safe to run multiple times.
 *
 * Steps:
 *   1. DEDUP  — find url values with more than one row; keep the row with the
 *               smallest id, delete the rest. Physical files are NOT touched.
 *   2. ORPHAN — delete rows whose file does not exist on disk.
 *               Run this step on the server where UPLOADS_ROOT is set and the
 *               actual images live.
 *   3. NORMALIZE — rewrite sort_order to be sequential (1, 2, 3 …) per apartment.
 *
 * Usage:
 *   node scripts/cleanup-images.js              # dry-run (default — safe, no writes)
 *   node scripts/cleanup-images.js --apply      # apply changes
 *
 * SAFETY GUARD (orphan step):
 *   If the apartments directory (UPLOADS_BASE/images/apartments) is missing OR
 *   more than 60 % of all apartment_images rows appear to be orphans, the orphan
 *   step is aborted and nothing is deleted.  This prevents wiping the whole
 *   gallery when the script is run before files are copied to UPLOADS_ROOT.
 *   Dedup (url-only, no disk access) is unaffected by this guard.
 *
 * Expected dry-run output on production (sanity check):
 *   ~8 duplicate rows (all in ls-sweet-summer), ~33 orphan rows, 0 file changes.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DRY_RUN = !process.argv.includes('--apply');

const UPLOADS_BASE =
  process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public');

const APARTMENTS_DIR = path.join(UPLOADS_BASE, 'images', 'apartments');

const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');

/** Fraction of orphan rows that triggers the safety abort on --apply. */
const ORPHAN_ABORT_THRESHOLD = 0.60;

// ── Startup checks ────────────────────────────────────────────────────────────

if (!fs.existsSync(DB_PATH)) {
  console.error(`ERROR: database not found at ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);

console.log('============================================================');
console.log(`Mode          : ${DRY_RUN ? 'DRY-RUN (no changes will be made)' : 'APPLY'}`);
console.log(`Database      : ${DB_PATH}`);
console.log(`UPLOADS_BASE  : ${UPLOADS_BASE}`);
console.log(`APARTMENTS_DIR: ${APARTMENTS_DIR}`);
console.log('============================================================');
console.log('');

let dedupDeleted = 0;
let orphanDeleted = 0;
let orphanSkipped = false;

// ── Step 1: DEDUP ─────────────────────────────────────────────────────────────
// Pure DB operation, no disk access — runs regardless of UPLOADS_ROOT state.

console.log('Step 1 — Dedup: looking for rows sharing the same url …');

const dupes = db.prepare(`
  SELECT url, MIN(id) AS keep_id, COUNT(*) AS cnt
  FROM apartment_images
  GROUP BY url
  HAVING cnt > 1
`).all();

if (dupes.length === 0) {
  console.log('  No duplicates found.');
} else {
  for (const row of dupes) {
    const toDelete = db.prepare(`
      SELECT id FROM apartment_images WHERE url = ? AND id != ?
    `).all(row.url, row.keep_id);

    console.log(
      `  url="${row.url}" (${row.cnt} rows) — keep id=${row.keep_id}, ` +
      `delete ids=[${toDelete.map(r => r.id).join(', ')}]`
    );

    if (!DRY_RUN) {
      for (const d of toDelete) {
        db.prepare('DELETE FROM apartment_images WHERE id = ?').run(d.id);
      }
    }

    dedupDeleted += toDelete.length;
  }
}

console.log('');

// ── Step 2: ORPHAN removal ────────────────────────────────────────────────────

console.log('Step 2 — Orphans: checking files on disk …');

// Guard 1: apartments directory must exist before we can trust fs.existsSync results.
if (!fs.existsSync(APARTMENTS_DIR)) {
  console.error('');
  console.error('  SAFETY ABORT — apartments directory not found:');
  console.error(`    ${APARTMENTS_DIR}`);
  console.error('  This almost certainly means UPLOADS_ROOT is not set or the files');
  console.error('  have not been copied to the target location yet.');
  console.error('  The orphan step is SKIPPED to protect the DB.');
  console.error('  Fix: copy files first, then re-run.');
  console.error('');
  orphanSkipped = true;
} else {
  const allImages = db.prepare(
    'SELECT id, apartment_id, url FROM apartment_images ORDER BY apartment_id, sort_order'
  ).all();

  const orphans = [];

  for (const img of allImages) {
    const filePath = img.url.startsWith('/') ? img.url.substring(1) : img.url;
    const fullPath = path.join(UPLOADS_BASE, filePath);
    if (!fs.existsSync(fullPath)) {
      orphans.push({ ...img, fullPath });
    }
  }

  const total = allImages.length;
  const orphanRatio = total > 0 ? orphans.length / total : 0;
  const orphanPct = (orphanRatio * 100).toFixed(0);
  const thresholdPct = (ORPHAN_ABORT_THRESHOLD * 100).toFixed(0);

  // Guard 2: refuse to delete when > threshold fraction appear orphaned.
  // In dry-run mode: show the list with a warning but do not block.
  if (orphanRatio > ORPHAN_ABORT_THRESHOLD) {
    console.error('');
    console.error(
      `  SAFETY ALERT: ${orphans.length} of ${total} records (${orphanPct}%) appear orphaned` +
      ` — exceeds the ${thresholdPct}% threshold.`
    );
    console.error('  Most likely the files have not been copied to UPLOADS_ROOT yet.');

    if (!DRY_RUN) {
      console.error('  --apply is ABORTED for orphan deletion. No orphan records will be removed.');
      console.error('  Steps to fix:');
      console.error('    1. Copy files:  cp -a <repo>/public/images/ $UPLOADS_ROOT/images/');
      console.error('    2. Verify:      UPLOADS_ROOT=... node scripts/cleanup-images.js');
      console.error('    3. Apply:       UPLOADS_ROOT=... node scripts/cleanup-images.js --apply');
      console.error('');
      orphanSkipped = true;
    } else {
      console.warn(`  In --apply mode this would be aborted. Listing for inspection only:`);
      console.warn('');
    }
  }

  if (!orphanSkipped) {
    if (orphans.length === 0) {
      console.log('  No orphan records found.');
    } else {
      console.log(`  ${orphans.length} of ${total} record(s) have no matching file on disk:`);
      for (const img of orphans) {
        console.log(
          `  id=${img.id} apartment=${img.apartment_id} url="${img.url}"` +
          ` → ${img.fullPath} [MISSING]`
        );
        if (!DRY_RUN) {
          db.prepare('DELETE FROM apartment_images WHERE id = ?').run(img.id);
        }
      }
      orphanDeleted = orphans.length;
    }
  } else if (orphans.length > 0) {
    // Threshold exceeded during dry-run or apply-abort — still show the full list.
    for (const img of orphans) {
      console.log(
        `  [skipped] id=${img.id} apartment=${img.apartment_id} url="${img.url}"` +
        ` → ${img.fullPath} [MISSING]`
      );
    }
  }
}

console.log('');

// ── Step 3: NORMALIZE sort_order ──────────────────────────────────────────────

if (!DRY_RUN) {
  console.log('Step 3 — Normalizing sort_order …');
  const apartments = db.prepare(
    'SELECT DISTINCT apartment_id FROM apartment_images'
  ).all();

  for (const apt of apartments) {
    const rows = db.prepare(`
      SELECT id FROM apartment_images
      WHERE apartment_id = ?
      ORDER BY sort_order, id
    `).all(apt.apartment_id);

    rows.forEach((row, idx) => {
      db.prepare(
        'UPDATE apartment_images SET sort_order = ? WHERE id = ?'
      ).run(idx + 1, row.id);
    });
  }

  console.log(`  Done — normalized ${apartments.length} apartment(s).`);
} else {
  const apartments = db.prepare(
    'SELECT DISTINCT apartment_id FROM apartment_images'
  ).all();
  console.log(
    `Step 3 — sort_order: will normalize ${apartments.length} apartment(s) on --apply.`
  );
}

console.log('');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('============================================================');
console.log('Summary');
console.log('============================================================');
console.log(
  `  Duplicate DB rows deleted : ${DRY_RUN ? '[dry] ' : ''}${dedupDeleted}`
);
if (orphanSkipped) {
  console.log('  Orphan DB rows deleted    : [SKIPPED — safety guard triggered]');
  console.log('  Orphan step               : ABORTED — see details above');
} else {
  console.log(
    `  Orphan DB rows deleted    : ${DRY_RUN ? '[dry] ' : ''}${orphanDeleted}`
  );
}
console.log(
  `  Total DB deletes          : ${DRY_RUN || orphanSkipped ? '[dry/skipped] ' : ''}${dedupDeleted + (orphanSkipped ? 0 : orphanDeleted)}`
);
console.log('  Files deleted on disk     : 0 (files are never deleted by this script)');

if (DRY_RUN) {
  console.log('');
  console.log('Re-run with --apply to commit these changes.');
}
