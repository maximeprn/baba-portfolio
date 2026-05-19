#!/usr/bin/env node
/**
 * One-shot migration: upload every photo from `public/img/BABA PHOTOS/` to
 * Sanity, then `createOrReplace` the `heroPhotos` singleton with an array
 * of references to the uploaded assets.
 *
 * Idempotent enough for re-runs: each call uploads fresh asset documents
 * (Sanity de-dupes on SHA1) and overwrites the singleton — so running it
 * twice ends with the same state. Existing manual edits in the Studio
 * (added photos, captions) are lost — that's intentional for migration.
 *
 * IMPORTANT — webhook noise: each asset upload creates a `sanity.imageAsset`
 * document mutation. The Sanity → Vercel webhook MUST have a GROQ filter
 * (`_type in [<our singletons>]`) so these don't each trigger a Vercel
 * rebuild. See CLAUDE.md → "Sanity webhook config".
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=<token> node scripts/upload-hero-photos.mjs
 *
 * Generate the token at:
 *   https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PHOTOS_DIR = resolve(PROJECT_ROOT, 'public/img/BABA PHOTOS');

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN is not set.');
  console.error('  Generate one at https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens (Editor permission).');
  console.error('  Then run: SANITY_WRITE_TOKEN=<token> node scripts/upload-hero-photos.mjs');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

function listImageFiles(dir) {
  const entries = readdirSync(dir);
  return entries
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .map((name) => ({ name, fullPath: resolve(dir, name), size: statSync(resolve(dir, name)).size }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function fmtBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}

async function uploadOne(file, idx, total) {
  const buffer = readFileSync(file.fullPath);
  const filename = basename(file.fullPath);
  process.stdout.write(`  [${idx + 1}/${total}] ${filename} (${fmtBytes(file.size)}) … `);
  const asset = await client.assets.upload('image', buffer, { filename });
  process.stdout.write(`✓ ${asset._id}\n`);
  return asset;
}

async function main() {
  console.log(`→ Scanning ${PHOTOS_DIR} …`);
  const files = listImageFiles(PHOTOS_DIR);
  console.log(`  found ${files.length} image files`);

  if (files.length === 0) {
    console.error('✗ No images found — aborting.');
    process.exit(1);
  }

  console.log('→ Uploading to Sanity (Sanity de-dupes on SHA1, so re-uploads are cheap) …');
  const assets = [];
  for (let i = 0; i < files.length; i += 1) {
    const asset = await uploadOne(files[i], i, files.length);
    assets.push({
      _key: `photo-${i}-${asset._id.slice(-8)}`,
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt: '',
    });
  }

  console.log(`→ Writing heroPhotos singleton with ${assets.length} photos …`);
  await client.createOrReplace({
    _id: 'heroPhotos',
    _type: 'heroPhotos',
    photos: assets,
  });

  console.log(`✓ Done. ${assets.length} photos uploaded and linked.`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run `npm run cms:fetch` to refresh src/data/cms.json with the new asset URLs.');
  console.log('  2. Open http://localhost:5173/admin → 🖼️ Hero photos (Photos page) to verify, reorder, add alts.');
  console.log('  3. Once happy, delete the legacy public/img/BABA\\ PHOTOS/ folder in a follow-up commit.');
}

main().catch((err) => {
  console.error('✗ Upload failed:', err.message);
  console.error(err);
  process.exit(1);
});
