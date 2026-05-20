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

// Pull all singletons + the photo project collection in one round-trip.
// For photoProjects, dereference the asset (`->{ ... }`) so we can read
// metadata.dimensions to compute aspectRatio (no extra round-trip per photo).
const QUERY = `{
  "siteSettings": *[_type == "siteSettings" && _id == "siteSettings"][0],
  "heroOverlay":  *[_type == "heroOverlay"  && _id == "heroOverlay"][0],
  "showreel":     *[_type == "showreel"     && _id == "showreel"][0],
  "heroPhotos":   *[_type == "heroPhotos"   && _id == "heroPhotos"][0],
  "photoProjects": *[_type == "photoProject"] | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    year,
    client,
    category,
    featured,
    previewPattern,
    previewPhotoIndices,
    previewMobilePattern,
    previewMobilePhotoIndices,
    previewMobileBreakpoint,
    previewAspectRatio,
    previewMaxHeight,
    imagePosition,
    "photos": photos[]{
      "src": asset->url,
      alt,
      "width":  asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    }
  },
  "films": *[_type == "film"] | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    year,
    client,
    category,
    featured,
    collapsed,
    "thumbnail": thumbnail.asset->url,
    videoUrl,
    aspectRatio,
    imagePosition,
    credits[]{ side, role, name },
    "mux": videoMux.asset->{
      playbackId,
      "status":   data.status,
      "aspect":   data.aspect_ratio,
      "duration": data.duration
    }
  }
}`;

function resolveImage(imageField) {
  if (!imageField?.asset?._ref) return null;
  return builder.image(imageField).url();
}

function flattenPhotoProject(project) {
  // Compose the legacy shape the React components expect:
  //   { id, slug, title, description, year, client, category, featured,
  //     photos: [{ src, alt, aspectRatio }, ...],
  //     preview: { pattern, photos: [indices] },
  //     imagePosition? }
  const photos = (project.photos ?? []).map((p) => ({
    src: p.src,
    alt: p.alt ?? '',
    aspectRatio: p.width && p.height ? p.width / p.height : 1,
  }));

  const hasDesktopPreview =
    typeof project.previewPattern === 'number' &&
    Array.isArray(project.previewPhotoIndices) &&
    project.previewPhotoIndices.length > 0;

  let preview = null;
  if (hasDesktopPreview) {
    preview = {
      pattern: project.previewPattern,
      photos: project.previewPhotoIndices,
    };
    // Mobile fallback: at viewport widths below `mobileBreakpoint`,
    // PhotoCardPreview swaps to the mobile pattern + photos.
    if (
      typeof project.previewMobilePattern === 'number' &&
      Array.isArray(project.previewMobilePhotoIndices) &&
      project.previewMobilePhotoIndices.length > 0
    ) {
      preview.mobilePattern = project.previewMobilePattern;
      preview.mobilePhotos = project.previewMobilePhotoIndices;
    }
    if (typeof project.previewMobileBreakpoint === 'number') {
      preview.mobileBreakpoint = project.previewMobileBreakpoint;
    }
    if (project.previewAspectRatio) preview.aspectRatio = project.previewAspectRatio;
    if (project.previewMaxHeight) preview.maxHeight = project.previewMaxHeight;
  }

  const out = {
    id: project._id,
    slug: project.slug,
    title: project.title,
    description: project.description ?? '',
    year: project.year ?? null,
    client: project.client ?? '',
    category: project.category ?? '',
    featured: !!project.featured,
    photos,
  };
  if (preview) out.preview = preview;
  if (project.imagePosition) out.imagePosition = project.imagePosition;
  return out;
}

function flattenFilm(film) {
  // Reconstruct credits as { left: [...], right: [...] } from the flat
  // array of { side, role, name } so existing React components don't need
  // any change.
  const credits = { left: [], right: [] };
  for (const item of film.credits ?? []) {
    if (!item || !item.role || !item.name) continue;
    const side = item.side === 'right' ? 'right' : 'left';
    credits[side].push({ role: item.role, name: item.name });
  }

  // Mux fields are only populated when an asset is attached AND ready.
  // While the asset is `preparing` we fall back to the static thumbnail —
  // no half-loaded HLS stream.
  const muxPlaybackId = film.mux?.playbackId ?? null;
  const muxReady = film.mux?.status === 'ready';
  const muxAspect = parseAspectString(film.mux?.aspect);

  const out = {
    id: film._id,
    slug: film.slug,
    title: film.title,
    description: film.description ?? '',
    year: film.year ?? null,
    client: film.client ?? '',
    category: film.category ?? '',
    featured: !!film.featured,
    collapsed: !!film.collapsed,
    thumbnail: film.thumbnail ?? null,
    videoUrl: film.videoUrl ?? null,
    // Aspect-ratio resolution order:
    //   1. Manual override from the schema field (rare — only set when the
    //      editor wants to force a different card shape).
    //   2. Mux's probed aspect_ratio (e.g. "16:9" → 1.78).
    //   3. Sensible fallback (16:9).
    aspectRatio:
      typeof film.aspectRatio === 'number'
        ? film.aspectRatio
        : muxAspect ?? 1.78,
    credits,
    muxPlaybackId: muxReady ? muxPlaybackId : null,
    muxStatus: film.mux?.status ?? null,
    muxStreamUrl: muxReady ? `https://stream.mux.com/${muxPlaybackId}.m3u8` : null,
    muxPosterUrl: muxPlaybackId
      ? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=0.5`
      : null,
  };
  if (film.imagePosition) out.imagePosition = film.imagePosition;
  return out;
}

function parseAspectString(s) {
  // Mux returns aspect_ratio as "16:9", "4:3", etc. Convert to a number.
  if (typeof s !== 'string') return null;
  const [w, h] = s.split(':').map((n) => parseFloat(n));
  if (!w || !h) return null;
  return w / h;
}

async function fetchCmsContent() {
  const data = await client.fetch(QUERY);

  if (
    !data ||
    (!data.siteSettings &&
      !data.heroOverlay &&
      !data.showreel &&
      !data.heroPhotos &&
      !(Array.isArray(data.photoProjects) && data.photoProjects.length) &&
      !(Array.isArray(data.films) && data.films.length))
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

  // photoProjects → flatten to the legacy shape consumed by Photos.jsx.
  if (Array.isArray(data.photoProjects)) {
    data.photoProjects = data.photoProjects.map(flattenPhotoProject);
  }

  // films → flatten to the legacy shape consumed by Films.jsx.
  if (Array.isArray(data.films)) {
    data.films = data.films.map(flattenFilm);
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
