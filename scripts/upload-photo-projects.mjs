#!/usr/bin/env node
/**
 * One-shot migration: reads the legacy `src/data/photoProjects.js` data
 * file and reproduces every project as a `photoProject` document in Sanity.
 *
 * Each project's photo `src` paths are URL-encoded paths under
 * `public/img/BABA PHOTOS/`. The script uploads each photo file to Sanity
 * (Sanity de-dupes on SHA1, so the photos already uploaded via
 * `cms:upload-hero-photos` won't be re-uploaded — the asset refs are
 * reused), then writes the project document.
 *
 * Idempotent: pins each document ID to `photoProject-<slug>` so re-running
 * overwrites cleanly. Existing manual edits in Studio are lost.
 *
 * Webhook noise: each asset upload is a `sanity.imageAsset` mutation.
 * Ensure the Sanity webhook GROQ filter excludes `sanity.imageAsset`
 * (i.e. lists only the schema types). See CLAUDE.md → "Sanity webhook config".
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=<token> node scripts/upload-photo-projects.mjs
 *
 * Generate the token at:
 *   https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { LexoRank } from 'lexorank';

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
  console.error('  Then run: SANITY_WRITE_TOKEN=<token> node scripts/upload-photo-projects.mjs');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

function srcToFilename(src) {
  // legacy src example: '/img/BABA%20PHOTOS/AcidSurfing1.jpeg'
  const decoded = decodeURIComponent(src);
  return basename(decoded);
}

// Cache assets so the same filename in multiple projects only uploads once
// per script run (Sanity also dedupes on SHA1, but local cache avoids the
// network round-trip).
const assetByFilename = new Map();

async function uploadOrReuseAsset(filename) {
  if (assetByFilename.has(filename)) return assetByFilename.get(filename);

  const path = resolve(PHOTOS_DIR, filename);
  if (!existsSync(path)) {
    console.warn(`  ⚠ missing file ${filename} — skipping`);
    return null;
  }
  const buffer = readFileSync(path);
  const asset = await client.assets.upload('image', buffer, { filename });
  assetByFilename.set(filename, asset);
  return asset;
}

async function buildProjectDoc(project, index, total, orderRank) {
  const docId = `photoProject-${project.slug}`;
  process.stdout.write(`  [${index + 1}/${total}] ${project.title} … `);

  const photoFields = [];
  for (let i = 0; i < (project.photos ?? []).length; i += 1) {
    const photo = project.photos[i];
    const filename = srcToFilename(photo.src);
    const asset = await uploadOrReuseAsset(filename);
    if (!asset) continue;
    photoFields.push({
      _key: `photo-${i}-${asset._id.slice(-8)}`,
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt: photo.alt ?? '',
    });
  }

  const doc = {
    _id: docId,
    _type: 'photoProject',
    title: project.title,
    slug: { _type: 'slug', current: project.slug },
    description: project.description ?? '',
    year: project.year ?? null,
    client: project.client ?? '',
    category: project.category ?? 'Editorial',
    featured: !!project.featured,
    orderRank,
    photos: photoFields,
  };

  // Desktop preview pattern + photo indices.
  if (project.preview?.pattern != null) {
    doc.previewPattern = project.preview.pattern;
  }
  if (Array.isArray(project.preview?.photos)) {
    doc.previewPhotoIndices = project.preview.photos;
  }
  // Mobile preview fallback (controls the featured-card collapse below
  // `mobileBreakpoint`). The original 5 featured projects used pattern 10
  // (single full-bleed) with mobileBreakpoint 1349, maxHeight 60vh.
  if (project.preview?.mobilePattern != null) {
    doc.previewMobilePattern = project.preview.mobilePattern;
  }
  if (Array.isArray(project.preview?.mobilePhotos)) {
    doc.previewMobilePhotoIndices = project.preview.mobilePhotos;
  }
  if (project.preview?.mobileBreakpoint != null) {
    doc.previewMobileBreakpoint = project.preview.mobileBreakpoint;
  }
  if (project.preview?.aspectRatio) {
    doc.previewAspectRatio = project.preview.aspectRatio;
  }
  if (project.preview?.maxHeight) {
    doc.previewMaxHeight = project.preview.maxHeight;
  }
  if (project.imagePosition) {
    doc.imagePosition = project.imagePosition;
  }

  process.stdout.write(`built (${photoFields.length} photos)\n`);
  return doc;
}

async function main() {
  console.log('→ Loading src/data/photoProjects.js …');
  const { photoProjects } = await import(resolve(PROJECT_ROOT, 'src/data/photoProjects.js'));
  console.log(`  found ${photoProjects.length} projects`);

  if (photoProjects.length === 0) {
    console.error('✗ No projects in data file — aborting.');
    process.exit(1);
  }

  // Generate LexoRank values for each project so the drag-to-reorder plugin
  // can produce valid "between" ranks when items are moved. Zero-padded ints
  // would sort correctly with each other but break LexoRank's `between()`
  // operation when the plugin generates new ranks for dragged items.
  console.log('→ Generating LexoRank values for orderRank …');
  let rank = LexoRank.middle();
  const orderRanks = photoProjects.map((_, i) => {
    const value = rank.toString();
    if (i < photoProjects.length - 1) rank = rank.genNext();
    return value;
  });

  console.log('→ Uploading assets + building project docs …');
  const docs = [];
  for (let i = 0; i < photoProjects.length; i += 1) {
    const doc = await buildProjectDoc(photoProjects[i], i, photoProjects.length, orderRanks[i]);
    docs.push(doc);
  }

  // Commit all 22 projects in ONE atomic transaction so Sanity sees this as
  // a single batch instead of 22 separate API calls. The webhook still fires
  // per-document mutation — set a "Delay" of ~60s on the Sanity webhook
  // (Sanity Manage → API → Webhooks) so the burst is coalesced into a single
  // Vercel deploy. See CLAUDE.md → "Sanity webhook config".
  console.log('→ Committing transaction (1 atomic write for all projects) …');
  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(doc);
  await tx.commit();

  console.log('');
  console.log(`✓ Done. ${docs.length} projects migrated in 1 transaction.`);
  console.log(`  ${assetByFilename.size} unique image assets uploaded (or already existed).`);
  console.log('');
  console.log('REMINDER — Sanity has no webhook debounce, so the 22 mutations in');
  console.log('this transaction each fire a webhook event = up to 22 Vercel deploys.');
  console.log('Next time, toggle the Sanity webhook DISABLED before running this');
  console.log('script, then re-enable + manual Redeploy from Vercel. See CLAUDE.md.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. `npm run cms:fetch` to refresh src/data/cms.json with the new project data.');
  console.log('  2. Open /admin → 📷 Photo projects → verify project list + edit titles/descriptions.');
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
