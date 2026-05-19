#!/usr/bin/env node
/**
 * Upload all mp4 files from public/videos/ to Vercel Blob and write a
 * manifest of {publicPath: blobUrl} to src/data/blobUrls.json.
 *
 * Run once after creating a Vercel Blob store (Vercel dashboard →
 * Storage → Create Database → Blob). Set BLOB_READ_WRITE_TOKEN and run:
 *
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/upload-videos-to-blob.mjs
 *
 * The script is idempotent: re-running re-uploads (allowOverwrite) and
 * regenerates the manifest. Use --skip-existing to skip uploads that
 * already exist locally in the manifest.
 */

import { put } from '@vercel/blob';
import { createReadStream } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VIDEOS_DIR = 'public/videos';
const MANIFEST_OUT = 'src/data/blobUrls.json';
const SKIP_EXISTING = process.argv.includes('--skip-existing');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('ERROR: BLOB_READ_WRITE_TOKEN env var is not set.');
  console.error('Get it from Vercel dashboard → Storage → your Blob store → .env.local tab.');
  process.exit(1);
}

// Load existing manifest if --skip-existing is set so we don't re-upload
// videos that already have a Blob URL.
let existing = {};
if (SKIP_EXISTING) {
  try {
    existing = JSON.parse(await readFile(MANIFEST_OUT, 'utf-8'));
    console.log(`Loaded existing manifest with ${Object.keys(existing).length} entries.`);
  } catch {
    console.log('No existing manifest found, will upload everything.');
  }
}

const files = (await readdir(VIDEOS_DIR)).filter((f) => f.endsWith('.mp4'));
files.sort();

if (files.length === 0) {
  console.error(`No .mp4 files found in ${VIDEOS_DIR}.`);
  process.exit(1);
}

console.log(`Found ${files.length} video files to upload.\n`);

const manifest = { ...existing };
let uploaded = 0;
let skipped = 0;

for (const file of files) {
  const publicPath = `/videos/${file}`;

  if (SKIP_EXISTING && manifest[publicPath]) {
    console.log(`⏭   ${file} — already in manifest, skipping`);
    skipped += 1;
    continue;
  }

  const filepath = path.join(VIDEOS_DIR, file);
  const fileStat = await stat(filepath);
  const sizeMb = (fileStat.size / 1024 / 1024).toFixed(1);

  process.stdout.write(`↑   ${file} (${sizeMb} MB)...`);

  try {
    const blob = await put(`videos/${file}`, createReadStream(filepath), {
      access: 'public',
      contentType: 'video/mp4',
      multipart: true,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    manifest[publicPath] = blob.url;
    process.stdout.write(`\r✓   ${file} (${sizeMb} MB) → ${blob.url}\n`);
    uploaded += 1;
  } catch (err) {
    process.stdout.write(`\r✗   ${file} (${sizeMb} MB) — ${err.message}\n`);
    process.exit(1);
  }
}

// Sort manifest by key for stable diffs.
const sorted = Object.fromEntries(
  Object.entries(manifest).sort((a, b) => a[0].localeCompare(b[0])),
);
await writeFile(MANIFEST_OUT, JSON.stringify(sorted, null, 2) + '\n');

console.log(
  `\nDone. ${uploaded} uploaded, ${skipped} skipped. Manifest: ${MANIFEST_OUT} (${Object.keys(sorted).length} entries).`,
);
