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

async function migrateProject(project, index, total) {
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
    displayOrder: project.id ?? index + 1,
    photos: photoFields,
  };

  if (project.preview?.pattern != null) {
    doc.previewPattern = project.preview.pattern;
  }
  if (Array.isArray(project.preview?.photos)) {
    doc.previewPhotoIndices = project.preview.photos;
  }
  if (project.imagePosition) {
    doc.imagePosition = project.imagePosition;
  }

  await client.createOrReplace(doc);
  process.stdout.write(`✓ ${photoFields.length} photos\n`);
}

async function main() {
  console.log('→ Loading src/data/photoProjects.js …');
  const { photoProjects } = await import(resolve(PROJECT_ROOT, 'src/data/photoProjects.js'));
  console.log(`  found ${photoProjects.length} projects`);

  if (photoProjects.length === 0) {
    console.error('✗ No projects in data file — aborting.');
    process.exit(1);
  }

  console.log('→ Migrating projects to Sanity …');
  for (let i = 0; i < photoProjects.length; i += 1) {
    await migrateProject(photoProjects[i], i, photoProjects.length);
  }

  console.log('');
  console.log(`✓ Done. ${photoProjects.length} projects migrated.`);
  console.log(`  ${assetByFilename.size} unique image assets uploaded (or already existed).`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. `npm run cms:fetch` to refresh src/data/cms.json with the new project data.');
  console.log('  2. Open /admin → 📷 Photo projects → verify project list + edit titles/descriptions.');
  console.log('  3. UPDATE THE SANITY WEBHOOK GROQ FILTER to include "photoProject":');
  console.log('       _type in ["siteSettings", "heroOverlay", "showreel", "heroPhotos", "photoProject"]');
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
