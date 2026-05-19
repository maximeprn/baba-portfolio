#!/usr/bin/env node
/**
 * Build-time CMS content fetcher.
 *
 * Reads the three singleton documents from Sanity and writes them, plus
 * resolved image asset URLs, to src/data/cms.json. The site imports that
 * file at build time so the static bundle ships with content baked in.
 *
 * Fail-soft: if Sanity is unreachable (or the dataset is empty), the existing
 * src/data/cms.json snapshot is reused and the build continues. The script
 * only fails if there's no snapshot AND no live data — i.e. the very first
 * fetch ever.
 *
 * Run automatically from `npm run build` / `vercel-build`. Can also be run
 * directly:  node scripts/fetch-cms-content.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'src/data/cms.json');

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false, // Always bypass the CDN at build time so we get the freshest data.
});

const builder = imageUrlBuilder(client);

// Pull all singletons in a single network round-trip via GROQ projection.
const QUERY = `{
  "siteSettings": *[_type == "siteSettings" && _id == "siteSettings"][0],
  "heroOverlay":  *[_type == "heroOverlay"  && _id == "heroOverlay"][0],
  "showreel":     *[_type == "showreel"     && _id == "showreel"][0],
  "heroPhotos":   *[_type == "heroPhotos"   && _id == "heroPhotos"][0]
}`;

function resolveImage(imageField) {
  if (!imageField?.asset?._ref) return null;
  return builder.image(imageField).url();
}

async function fetchCmsContent() {
  const data = await client.fetch(QUERY);

  if (
    !data ||
    (!data.siteSettings && !data.heroOverlay && !data.showreel && !data.heroPhotos)
  ) {
    throw new Error('Sanity returned no documents — has content been seeded yet?');
  }

  // Resolve image asset references to absolute CDN URLs.
  if (data.siteSettings?.ogImage) {
    data.siteSettings.ogImageUrl = resolveImage(data.siteSettings.ogImage);
  }
  if (data.showreel?.posterImage) {
    data.showreel.posterImageUrl = resolveImage(data.showreel.posterImage);
  }

  // heroPhotos.photos is an array of image fields — flatten to plain URLs so
  // the FloatingGalleryHero gets a drop-in replacement for the legacy
  // src/data/heroPhotos.js string array.
  if (Array.isArray(data.heroPhotos?.photos)) {
    data.heroPhotos.photoUrls = data.heroPhotos.photos
      .map((img) => ({ url: resolveImage(img), alt: img.alt ?? '' }))
      .filter((it) => it.url);
  }

  // Stamp the snapshot with a fetch timestamp for debugging.
  data._fetchedAt = new Date().toISOString();
  return data;
}

async function main() {
  try {
    const data = await fetchCmsContent();
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`✓ CMS content written to ${OUTPUT_PATH}`);
  } catch (err) {
    if (existsSync(OUTPUT_PATH)) {
      console.warn(
        `⚠ Sanity fetch failed (${err.message}). Falling back to existing snapshot at ${OUTPUT_PATH}.`,
      );
      process.exit(0); // do not fail the build
    } else {
      console.error(
        `✗ Sanity fetch failed and no fallback snapshot exists at ${OUTPUT_PATH}.`,
      );
      console.error(err);
      process.exit(1);
    }
  }
}

main();
