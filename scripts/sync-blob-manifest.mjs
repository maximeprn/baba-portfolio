#!/usr/bin/env node
/**
 * Build src/data/blobUrls.json from the existing Vercel Blob store.
 *
 * Use this when videos were uploaded via the Vercel dashboard (instead
 * of via scripts/upload-videos-to-blob.mjs). Lists every blob, derives
 * the original `/videos/<filename>.mp4` key from the blob pathname, and
 * writes the manifest sorted.
 *
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/sync-blob-manifest.mjs
 *
 * Verifies coverage against the 29 expected files (the LFS-tracked
 * videos in public/videos/) and warns about missing or extra entries.
 */

import { list } from '@vercel/blob';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VIDEOS_DIR = 'public/videos';
const MANIFEST_OUT = 'src/data/blobUrls.json';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('ERROR: BLOB_READ_WRITE_TOKEN env var is not set.');
  console.error('Get it from Vercel dashboard → Storage → your Blob store → .env.local tab.');
  process.exit(1);
}

// Pull the full blob list (paginate if needed).
const allBlobs = [];
let cursor;
do {
  const page = await list({
    token: process.env.BLOB_READ_WRITE_TOKEN,
    cursor,
    limit: 1000,
  });
  allBlobs.push(...page.blobs);
  cursor = page.cursor;
} while (cursor);

console.log(`Found ${allBlobs.length} blobs in the store.\n`);

// Expected filenames — the mp4s we have locally that need mapping.
let expectedFilenames = [];
try {
  expectedFilenames = (await readdir(VIDEOS_DIR)).filter((f) => f.endsWith('.mp4'));
} catch {
  console.warn(`(${VIDEOS_DIR} not readable — skipping coverage check)`);
}

const manifest = {};
const unmatched = [];

for (const blob of allBlobs) {
  // pathname may be 'X.mp4' or 'videos/X.mp4' depending on upload method.
  // Always key by the bare filename for the public path.
  const filename = path.posix.basename(blob.pathname);
  if (!filename.endsWith('.mp4')) {
    unmatched.push(blob);
    continue;
  }
  manifest[`/videos/${filename}`] = blob.url;
}

// Sort by key for stable diffs.
const sorted = Object.fromEntries(
  Object.entries(manifest).sort((a, b) => a[0].localeCompare(b[0])),
);

await writeFile(MANIFEST_OUT, JSON.stringify(sorted, null, 2) + '\n');
console.log(`✓ Wrote ${MANIFEST_OUT} (${Object.keys(sorted).length} entries).\n`);

// Coverage report.
if (expectedFilenames.length > 0) {
  const expectedKeys = new Set(expectedFilenames.map((f) => `/videos/${f}`));
  const actualKeys = new Set(Object.keys(sorted));

  const missing = [...expectedKeys].filter((k) => !actualKeys.has(k)).sort();
  const extra = [...actualKeys].filter((k) => !expectedKeys.has(k)).sort();

  console.log(
    `Coverage: ${actualKeys.size}/${expectedKeys.size} expected videos present.`,
  );
  if (missing.length > 0) {
    console.log(`\n⚠  ${missing.length} expected file(s) NOT in Blob store:`);
    missing.forEach((k) => console.log(`    - ${k}`));
    console.log(
      '\n   These will fall back to /videos/<file>.mp4 paths at runtime,',
    );
    console.log(
      '   which will 404 in production once you drop the local mp4s.',
    );
  }
  if (extra.length > 0) {
    console.log(`\n   ${extra.length} blob(s) in store but NOT in public/videos/:`);
    extra.forEach((k) => console.log(`    - ${k}`));
    console.log('   (probably fine — leftover or dashboard-renamed entries.)');
  }
}

if (unmatched.length > 0) {
  console.log(`\n⚠  ${unmatched.length} non-mp4 blob(s) ignored:`);
  unmatched.forEach((b) => console.log(`    - ${b.pathname}`));
}
