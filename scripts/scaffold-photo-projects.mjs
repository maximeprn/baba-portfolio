#!/usr/bin/env node
/**
 * scaffold-photo-projects.mjs
 *
 * DEPRECATED — orphaned legacy scaffolder. Photo-project content now lives
 * in Sanity (doc 09); src/data/photoProjects.js survives only as the
 * loader's fallback. Re-running this script would regenerate that fallback
 * file and re-introduce the removed `imagePosition` field. Kept for
 * reference; do not run.
 *
 * One-shot generator for src/data/photoProjects.js.
 *
 * Walks /public/img/BABA PHOTOS/, groups files into projects by filename
 * prefix, measures each photo's pixel dimensions via macOS `sips` so we
 * never have to crop, and writes the data file.
 *
 * Re-run after adding new photos: `node scripts/scaffold-photo-projects.mjs`.
 *
 * After scaffolding, hand-edit photoProjects.js for:
 *   - real titles, descriptions, year, client, category
 *   - `featured` flags on the curated subset (defaults: top 5 by photo count)
 *   - per-project `imagePosition` overrides (default alternates by display
 *     index in the featured array, computed at render time)
 *   - `preview[]` photo selection (defaults: spread across the project)
 */

import { readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PHOTOS_DIR = path.join(REPO_ROOT, 'public/img/BABA PHOTOS');
const OUT_FILE = path.join(REPO_ROOT, 'src/data/photoProjects.js');

// 22 projects detected from filename prefixes. Order = alphabetical-by-slug.
// Each `match` is a startsWith / exact-match check; lowercase 'veja5.jpeg'
// is a stray that belongs to the Veja project despite the lowercase 'v'.
const PROJECTS = [
  { slug: 'acid-surfing',         title: 'Acid Surfing',          match: (f) => f.startsWith('AcidSurfing') },
  { slug: 'adidas',               title: 'Adidas',                match: (f) => f.startsWith('Adidas') },
  { slug: 'asics-running',        title: 'Asics Running',         match: (f) => f.startsWith('asicsrunning') },
  { slug: 'balthasar-de-pury',    title: 'Balthasar de Pury',     match: (f) => f.startsWith('balthasardepury') },
  { slug: 'bascule',              title: 'Bascule',               match: (f) => f.startsWith('Bascule') },
  { slug: 'charlie-watch',        title: 'Charlie Watch',         match: (f) => f.startsWith('charliewatch') },
  { slug: 'digital-travel',       title: 'Digital Travel',        match: (f) => f.startsWith('DigitalTravel') },
  { slug: 'fusalp',               title: 'Fusalp',                match: (f) => f.startsWith('fusalp') },
  { slug: 'judo',                 title: 'Judo',                  match: (f) => f.startsWith('Judo') },
  { slug: 'les-others',           title: 'Les Others',            match: (f) => f.startsWith('Les Others') },
  { slug: 'lorette-cole-duprat',  title: 'Lorette Colé Duprat',   match: (f) => f.startsWith('Lorette Colé Duprat') },
  { slug: 'lorne',                title: 'Lorne',                 match: (f) => f.startsWith('Lorne') },
  { slug: 'moscot-nyc',           title: 'Moscot NYC',            match: (f) => f.startsWith('Moscot NYC') },
  { slug: 'nuatelier',            title: 'Nu Atelier',            match: (f) => f.startsWith('nuatelier') },
  { slug: 'oakley-x-joliefoulee', title: 'Oakley x Jolie Foulée', match: (f) => f.startsWith('Oakley x joliefoulee') },
  { slug: 'pag',                  title: 'Pag',                   match: (f) => f.startsWith('Pag') },
  { slug: 'rimowa',               title: 'Rimowa',                match: (f) => f.startsWith('Rimowa') },
  { slug: 'saucony',              title: 'Saucony',               match: (f) => f.startsWith('Saucony') },
  { slug: 'simond',               title: 'Simond',                match: (f) => f.startsWith('simond') },
  { slug: 'tedax-max',            title: 'Tedax Max',             match: (f) => f.startsWith('TedaxMax') },
  { slug: 'veja',                 title: 'Veja',                  match: (f) => f.startsWith('Veja') || f === 'veja5.jpeg' },
  { slug: 'vejarunning-1',        title: 'Veja Running #1',       match: (f) => f.startsWith('vejarunning #1') },
];

// Preview pattern slot counts. The actual layout/offset values live in
// src/components/photos/PhotoCardPreview.jsx (PATTERNS). The scaffold only
// needs to know how many photos each pattern uses so it can pick that many
// photoIndices per project. This list MUST match the order/length of PATTERNS
// in PhotoCardPreview — cross-reference when changing either side.
// Interleaved 3/2 so the first 5 featured projects get a mix of slot counts.
const PREVIEW_PATTERN_LENGTHS = [3, 2, 3, 2, 3, 2, 3, 2, 3, 3];

// Natural numeric sort so "DigitalTravel10" comes after "DigitalTravel9".
const naturalSort = (a, b) => a.localeCompare(b, 'en', { numeric: true });

function getAspectRatio(filename) {
  const fullPath = path.join(PHOTOS_DIR, filename);
  const out = execSync(`sips -g pixelWidth -g pixelHeight ${JSON.stringify(fullPath)}`, { encoding: 'utf8' });
  const w = parseInt((out.match(/pixelWidth:\s*(\d+)/) || [])[1] || '0', 10);
  const h = parseInt((out.match(/pixelHeight:\s*(\d+)/) || [])[1] || '0', 10);
  return w && h ? +(w / h).toFixed(4) : 1.5;
}

function toSrc(filename) {
  return `/img/BABA%20PHOTOS/${encodeURIComponent(filename)}`;
}

const allFiles = readdirSync(PHOTOS_DIR).filter((f) => f.toLowerCase().endsWith('.jpeg'));

// Match each file to a project
const byProject = new Map();
const unmatched = [];
for (const f of allFiles) {
  const project = PROJECTS.find((p) => p.match(f));
  if (!project) {
    unmatched.push(f);
    continue;
  }
  if (!byProject.has(project.slug)) byProject.set(project.slug, []);
  byProject.get(project.slug).push(f);
}
if (unmatched.length) {
  console.warn(`Unmatched files (skipped): ${unmatched.join(', ')}`);
}
for (const files of byProject.values()) files.sort(naturalSort);

// Measure aspect ratios (one sips call per file)
console.log(`Measuring aspect ratios via sips for ${allFiles.length} photos…`);
const aspectCache = {};
let measured = 0;
for (const f of allFiles) {
  aspectCache[f] = getAspectRatio(f);
  measured++;
  if (measured % 20 === 0) process.stdout.write(`  ${measured}/${allFiles.length}\n`);
}
console.log(`  ${measured}/${allFiles.length} done.`);

// Featured = top 5 by photo count, ties broken alphabetically
const projectCounts = PROJECTS.map((p) => ({
  slug: p.slug,
  count: (byProject.get(p.slug) || []).length,
}));
const featuredSlugs = new Set(
  [...projectCounts]
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, 5)
    .map((p) => p.slug),
);

// Pattern assignment:
//   - featured projects get distinct patterns 0..N-1 in alphabetical-among-featured
//     order, so no two visible cards on /photos share the same composition.
//   - non-featured projects cycle through the remaining patterns (offset by the
//     featured count) — order doesn't matter visually since they don't render.
let featuredCounter = 0;

// Build the project objects
const projects = PROJECTS.map((p, idx) => {
  const files = byProject.get(p.slug) || [];
  const photos = files.map((f, i) => ({
    src: toSrc(f),
    alt: `${p.title} — ${i + 1}`,
    aspectRatio: aspectCache[f],
  }));

  // Pattern selection:
  //   - featured projects get distinct patterns in alphabetical-among-featured order
  //     so the visible cards each look unique.
  //   - non-featured projects fill the remaining patterns; collisions are fine
  //     because they don't render until the user flips `featured: true`.
  const isFeatured = featuredSlugs.has(p.slug);
  let rawPatternIdx;
  if (isFeatured) {
    rawPatternIdx = featuredCounter % PREVIEW_PATTERN_LENGTHS.length;
    featuredCounter++;
  } else {
    rawPatternIdx = (idx + featuredSlugs.size) % PREVIEW_PATTERN_LENGTHS.length;
  }
  const rawSlotCount = PREVIEW_PATTERN_LENGTHS[rawPatternIdx];
  const slotCount = Math.min(rawSlotCount, files.length);
  // If the slot count had to drop (very small project), fall back to a pattern
  // that natively has that count so the layout's slot-count matches the data.
  const fallbackPatternIdx = PREVIEW_PATTERN_LENGTHS.findIndex((l) => l === slotCount);
  const patternIdx = slotCount === rawSlotCount ? rawPatternIdx : fallbackPatternIdx;

  // Spread photo indices across the project so the preview hints at the project's range.
  let indices;
  if (slotCount === 1) indices = [0];
  else if (slotCount === 2) indices = [0, Math.min(Math.floor(files.length / 2), files.length - 1)];
  else indices = [0, Math.min(Math.floor(files.length / 2), files.length - 1), files.length - 1];
  // De-dupe for tiny projects so we never reuse the same photo
  const seen = new Set();
  const safeIndices = indices.map((i) => {
    let n = i;
    while (seen.has(n) && n + 1 < files.length) n++;
    seen.add(n);
    return n;
  });
  const preview = { pattern: patternIdx, photos: safeIndices };

  return {
    id: idx + 1,
    slug: p.slug,
    title: p.title,
    description: `${p.title} — placeholder description, replace with editorial copy.`,
    year: 2024,
    client: p.title,
    category: 'Editorial',
    photos,
    preview,
    featured: featuredSlugs.has(p.slug),
  };
});

// Format helpers — produce readable JS, not minified JSON
function fmtPhoto(ph) {
  return `      { src: '${ph.src}', alt: ${JSON.stringify(ph.alt)}, aspectRatio: ${ph.aspectRatio} },`;
}
function fmtProject(p) {
  return `  {
    id: ${p.id},
    slug: '${p.slug}',
    title: ${JSON.stringify(p.title)},
    description: ${JSON.stringify(p.description)},
    year: ${p.year},
    client: ${JSON.stringify(p.client)},
    category: '${p.category}',
    photos: [
${p.photos.map(fmtPhoto).join('\n')}
    ],
    preview: { pattern: ${p.preview.pattern}, photos: [${p.preview.photos.join(', ')}] },
    featured: ${p.featured},
  },`;
}

const output = `/**
 * PHOTO PROJECTS DATA
 * ===================
 * Auto-scaffolded from /public/img/BABA PHOTOS/ filenames.
 * Aspect ratios measured at scaffold time via macOS \`sips\` — never crop.
 *
 * Re-scaffold: \`node scripts/scaffold-photo-projects.mjs\`
 *
 * Hand-edit after scaffolding:
 *   - title, description, year, client, category — placeholder values
 *   - featured: true|false — flip the curated subset (top 5 by photo count
 *     are featured by default)
 *   - imagePosition: 'left' | 'right' — optional per-project override
 *     (default alternates left/right by index in the featured array, computed
 *     at render time in Photos.jsx)
 *   - preview.photos — which photos (by index into project.photos[]) to render
 *     in the compact-card collage
 *   - preview.pattern — which layout (0..9) from PhotoCardPreview's PATTERNS array
 *     to use; pattern's slot count must equal preview.photos.length (2 or 3)
 */

export const photoProjects = [
${projects.map(fmtProject).join('\n')}
];

export const getFeaturedProjects = () => photoProjects.filter((p) => p.featured);
export const getProjectBySlug = (slug) => photoProjects.find((p) => p.slug === slug);

export default photoProjects;
`;

writeFileSync(OUT_FILE, output);
const totalPhotos = projects.reduce((acc, p) => acc + p.photos.length, 0);
console.log(`\nWrote ${projects.length} projects (${totalPhotos} photos) to ${OUT_FILE}`);
console.log(`Featured (top 5 by photo count): ${[...featuredSlugs].sort().join(', ')}`);
