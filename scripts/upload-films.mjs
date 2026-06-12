#!/usr/bin/env node
/**
 * One-shot migration: reads the legacy `src/data/films.js` raw entries
 * (`FILM_ENTRIES`) and reproduces every film as a `film` document in Sanity.
 *
 * For each film whose `thumbnail` is a `/posters/<name>.<ext>` path AND the
 * file exists on disk under `public/posters/`, the script uploads the image
 * to Sanity and attaches it. Films without an existing poster get a null
 * thumbnail (Basile uploads in Studio later).
 *
 * Preview videos are NOT migrated by this script — the `film` schema stores
 * them in Mux (`videoMux`, type `mux.video`). After a re-import, attach each
 * preview by drag-and-drop in Studio (/admin → Films → Preview video), or run
 * `cms:migrate-blob-to-mux` if legacy Blob videos still need importing.
 *
 * Idempotent: pins each document ID to `film-<slug>` so re-running overwrites
 * cleanly. Existing manual edits in Studio are lost.
 *
 * Webhook noise: each asset upload is a `sanity.imageAsset` mutation. Ensure
 * the Sanity webhook GROQ filter excludes `sanity.imageAsset` (i.e. lists
 * only the schema types). See CLAUDE.md → "Sanity webhook config".
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=<token> node scripts/upload-films.mjs
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
const POSTERS_DIR = resolve(PROJECT_ROOT, 'public/posters');

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN is not set.');
  console.error('  Generate one at https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens (Editor permission).');
  console.error('  Then run: SANITY_WRITE_TOKEN=<token> node scripts/upload-films.mjs');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

const assetByFilename = new Map();

async function uploadOrReuseAsset(thumbnailPath) {
  // thumbnailPath: '/posters/veja.jpg' → filename 'veja.jpg'
  const filename = basename(decodeURIComponent(thumbnailPath));
  if (assetByFilename.has(filename)) return assetByFilename.get(filename);

  const diskPath = resolve(POSTERS_DIR, filename);
  if (!existsSync(diskPath)) {
    console.warn(`  ⚠ poster missing on disk: ${filename} — leaving thumbnail blank`);
    return null;
  }
  const buffer = readFileSync(diskPath);
  const asset = await client.assets.upload('image', buffer, { filename });
  assetByFilename.set(filename, asset);
  return asset;
}

function creditsToArray(credits) {
  // Legacy: { left: [{role, name}], right: [{role, name}] }
  // CMS:    [{ side: 'left'|'right', role, name }]
  const out = [];
  for (const item of credits?.left ?? []) {
    if (item?.role && item?.name) out.push({ _type: 'creditItem', side: 'left', role: item.role, name: item.name });
  }
  for (const item of credits?.right ?? []) {
    if (item?.role && item?.name) out.push({ _type: 'creditItem', side: 'right', role: item.role, name: item.name });
  }
  return out.map((item, i) => ({ ...item, _key: `credit-${i}` }));
}

async function buildFilmDoc(entry, index, total, orderRank) {
  const docId = `film-${entry.slug}`;
  process.stdout.write(`  [${index + 1}/${total}] ${entry.title} … `);

  // Field set mirrors the current `film` schema (sanity/schemas/film.js):
  // identity → story → credits → videoUrl → visible/featured → aspectRatio.
  // The preview video (`videoMux`) is attached in Studio, not here.
  // Legacy entries only mark the exceptions (`featured: false`) — absence
  // means featured. The retired inverted `collapsed` flag is written too,
  // kept in sync until `cms:migrate-film-featured -- --prune` retires it.
  const featured = entry.featured ?? true;
  const doc = {
    _id: docId,
    _type: 'film',
    title: entry.title,
    slug: { _type: 'slug', current: entry.slug },
    description: entry.description ?? '',
    year: entry.year ?? null,
    client: entry.client ?? '',
    category: entry.category ?? '',
    visible: entry.visible !== false,
    featured,
    collapsed: !featured,
    videoUrl: entry.videoUrl ?? null,
    aspectRatio: typeof entry.aspectRatio === 'number' ? entry.aspectRatio : 1.78,
    credits: creditsToArray(entry.credits),
    orderRank,
  };

  if (entry.thumbnail) {
    const asset = await uploadOrReuseAsset(entry.thumbnail);
    if (asset) {
      doc.thumbnail = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      };
    }
  }

  process.stdout.write(`built${doc.thumbnail ? ' + thumbnail' : ''}\n`);
  return doc;
}

async function main() {
  console.log('→ Loading src/data/films.js …');
  const { FILM_ENTRIES } = await import(resolve(PROJECT_ROOT, 'src/data/films.js'));
  console.log(`  found ${FILM_ENTRIES.length} films`);

  if (FILM_ENTRIES.length === 0) {
    console.error('✗ No films in data file — aborting.');
    process.exit(1);
  }

  console.log('→ Generating LexoRank values for orderRank …');
  let rank = LexoRank.middle();
  const orderRanks = FILM_ENTRIES.map((_, i) => {
    const value = rank.toString();
    if (i < FILM_ENTRIES.length - 1) rank = rank.genNext();
    return value;
  });

  console.log('→ Uploading assets + building film docs …');
  const docs = [];
  for (let i = 0; i < FILM_ENTRIES.length; i += 1) {
    const doc = await buildFilmDoc(FILM_ENTRIES[i], i, FILM_ENTRIES.length, orderRanks[i]);
    docs.push(doc);
  }

  console.log('→ Committing transaction (1 atomic write for all films) …');
  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(doc);
  await tx.commit();

  console.log('');
  console.log(`✓ Done. ${docs.length} films migrated in 1 transaction.`);
  console.log(`  ${assetByFilename.size} unique poster images uploaded (or already existed).`);
  console.log('');
  console.log('REMINDER — leave the Sanity auto-webhook DISABLED while you run');
  console.log('migrations like this one. The N mutations would otherwise trigger');
  console.log('N Vercel deploys. After the script finishes, open Studio /admin →');
  console.log('🚀 Deploy tab → "Deploy now" to publish to the live site.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. `npm run cms:fetch` to refresh src/data/cms.json with the new film data.');
  console.log('  2. Open /admin → 🎬 Films → verify list + edit titles/credits/thumbnails.');
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
