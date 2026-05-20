#!/usr/bin/env node
/**
 * One-shot migration: copy every film's existing Vercel Blob video into Mux
 * and patch the Sanity doc to reference the new Mux asset.
 *
 * For each `film` document where `videoFile` is set but `videoMux` is NOT,
 * the script:
 *   1. Resolves the Blob URL via src/data/blobUrls.json (if mapped) or uses
 *      the raw path otherwise. The Blob URL must be publicly accessible —
 *      Mux fetches it server-side.
 *   2. POSTs to Mux Create Asset:
 *        input: [{ url: blobUrl }]
 *        playback_policy: ['public']
 *        encoding_tier: 'smart'
 *        max_resolution_tier: '1080p'
 *      Mux returns an `asset.id`; we wait for the asset to reach `ready`.
 *   3. Patches the Sanity film doc with `videoMux = { asset: { _ref: muxDocId } }`
 *      where muxDocId is the `mux.videoAsset` Sanity document the plugin uses.
 *      (Created via Sanity transaction in this script.)
 *
 * Idempotent: skips films that already have `videoMux` set.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=… MUX_TOKEN_ID=… MUX_TOKEN_SECRET=… \
 *     node scripts/migrate-blob-to-mux.mjs
 *
 * The Sanity token needs Editor permission. Generate at:
 *   https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens
 * Mux tokens come from your Mux dashboard → Settings → Access Tokens.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import Mux from '@mux/mux-node';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const BLOB_MANIFEST = resolve(PROJECT_ROOT, 'src/data/blobUrls.json');

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const sanityToken = process.env.SANITY_WRITE_TOKEN;
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!sanityToken || !muxTokenId || !muxTokenSecret) {
  console.error('✗ Missing env vars. Required:');
  console.error('  SANITY_WRITE_TOKEN  — Sanity Editor token');
  console.error('  MUX_TOKEN_ID        — Mux access token ID');
  console.error('  MUX_TOKEN_SECRET    — Mux access token secret');
  process.exit(1);
}

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token: sanityToken,
  useCdn: false,
});

const { video: muxVideo } = new Mux({
  tokenId: muxTokenId,
  tokenSecret: muxTokenSecret,
});

const blobManifest = existsSync(BLOB_MANIFEST)
  ? JSON.parse(readFileSync(BLOB_MANIFEST, 'utf-8'))
  : {};

function resolveBlobUrl(videoFile) {
  if (!videoFile) return null;
  // Already a public URL (starts with https://) — use as-is.
  if (videoFile.startsWith('http')) return videoFile;
  // Otherwise look it up in the manifest (e.g. "/videos/Veja Condor 3.mp4").
  return blobManifest[videoFile] ?? null;
}

async function waitForReady(assetId) {
  // Poll Mux every 5s for up to 10 min. Free-tier transcoding is usually
  // 1–2x source duration; ours are <2 min, so 10 min ceiling is generous.
  const TIMEOUT_MS = 10 * 60 * 1000;
  const POLL_MS = 5000;
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    const asset = await muxVideo.assets.retrieve(assetId);
    if (asset.status === 'ready') return asset;
    if (asset.status === 'errored') {
      throw new Error(`Mux asset errored: ${JSON.stringify(asset.errors)}`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Timed out waiting for Mux asset ${assetId}`);
}

async function ingestToMux(blobUrl) {
  const asset = await muxVideo.assets.create({
    inputs: [{ url: blobUrl }],
    playback_policy: ['public'],
    encoding_tier: 'smart',
    max_resolution_tier: '1080p',
    mp4_support: 'none',
  });
  return waitForReady(asset.id);
}

async function attachMuxToFilm(filmDocId, muxAsset) {
  // The sanity-plugin-mux-input maintains its own document type `mux.videoAsset`
  // (one per Mux asset). The `videoMux` field on the film references it.
  // We create the videoAsset doc with the exact shape the plugin expects.
  const playbackId = muxAsset.playback_ids?.[0]?.id;
  if (!playbackId) throw new Error(`No playback_id on Mux asset ${muxAsset.id}`);

  // Pinned ID so re-running doesn't duplicate the videoAsset doc.
  const muxDocId = `mux-${muxAsset.id}`;

  const tx = sanity.transaction();
  tx.createOrReplace({
    _id: muxDocId,
    _type: 'mux.videoAsset',
    status: muxAsset.status,
    assetId: muxAsset.id,
    playbackId,
    filename: muxAsset.id,
    thumbTime: 0.5,
    data: muxAsset, // full asset payload (mirrors what the plugin stores)
  });
  tx.patch(filmDocId, {
    set: {
      videoMux: {
        _type: 'mux.video',
        asset: { _type: 'reference', _ref: muxDocId },
      },
    },
  });
  await tx.commit();
}

async function main() {
  console.log('→ Fetching films from Sanity …');
  const films = await sanity.fetch(
    `*[_type == "film"] | order(orderRank asc) {
       _id, title, videoFile, "hasMux": defined(videoMux)
     }`,
  );
  console.log(`  found ${films.length} films`);

  const todo = films.filter((f) => f.videoFile && !f.hasMux);
  console.log(`  ${todo.length} need migration (skipping ${films.length - todo.length} already done)`);

  if (todo.length === 0) {
    console.log('✓ Nothing to do.');
    return;
  }

  for (let i = 0; i < todo.length; i += 1) {
    const film = todo[i];
    const blobUrl = resolveBlobUrl(film.videoFile);
    process.stdout.write(`  [${i + 1}/${todo.length}] ${film.title} … `);

    if (!blobUrl) {
      process.stdout.write(`✗ no Blob URL for "${film.videoFile}", skipping\n`);
      continue;
    }

    try {
      process.stdout.write('ingest → ');
      const asset = await ingestToMux(blobUrl);
      process.stdout.write('attach → ');
      await attachMuxToFilm(film._id, asset);
      process.stdout.write(`✓ playbackId=${asset.playback_ids[0].id}\n`);
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`);
    }
  }

  console.log('');
  console.log('✓ Migration complete.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. `npm run cms:fetch` to refresh src/data/cms.json with the new mux fields.');
  console.log('  2. Open /admin → 🎬 Films → confirm each film shows a green Mux preview.');
  console.log('  3. Click Studio → 🚀 Deploy to publish.');
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
