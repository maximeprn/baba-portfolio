---
id: 08-cms-hero-photos
title: CMS — Hero Photos (Photos page slideshow)
edition: BABA Portfolio
depends_on:
  - 01-photos-hero-slideshow
  - 07-cms-foundation
source_files:
  - sanity/schemas/heroPhotos.js
  - sanity/schemas/index.js
  - sanity/desk/structure.js
  - sanity.config.js
  - scripts/upload-hero-photos.mjs
  - scripts/fetch-cms-content.mjs
  - src/sanity/loader.js
  - src/components/photos/FloatingGalleryHero.jsx
  - src/data/heroPhotos.js  # legacy fallback only
  - package.json
routes: []
models:
  - sanity:heroPhotos (singleton)
test_files:
  - tests/e2e/cms-photos-cdn.spec.js
known_issues:
  - "Asset SHA1 dedup means re-uploading the same files is cheap, but the script doesn't currently delete stale Sanity asset documents that are no longer referenced. Asset bloat in the dataset over time. Manual cleanup via Sanity's media library."
  - "src/data/heroPhotos.js (legacy fallback) is still bundled into the public site even though the CMS now drives the slideshow. Keep it until you're fully confident the CMS won't return an empty list; remove in a future cleanup."
---

# 08 — CMS Hero Photos

## Purpose

Move the Photos page hero slideshow's image set into Sanity so Basile can
add, remove, reorder, and re-caption the ~50 photos without code changes.
Replaces the hardcoded URL array in `src/data/heroPhotos.js` (which is
kept as a fallback).

## Architecture

```
Studio /admin → 🖼️ Hero photos
        │
        │  Basile uploads / removes / reorders images
        │  Sanity asset CDN handles storage + auto-format + auto-resize
        ▼
[scripts/fetch-cms-content.mjs] flattens heroPhotos.photos[] →
    cms.json.heroPhotos.photoUrls = [{ url, alt }, …]
        │
        ▼
[src/sanity/loader.js] reduces photoUrls[].url → string[]
                       (falls back to LEGACY_HERO_PHOTOS if empty)
        │
        ▼
[src/components/photos/FloatingGalleryHero.jsx] imports heroPhotos
    from the loader, shuffles, displays.
```

The fallback exists because `cms.json` ships with the static build — if a
future bug causes the heroPhotos doc to be empty, the slideshow never
goes blank.

## Data Model

### `heroPhotos` (singleton)

```js
{
  _id: 'heroPhotos',
  _type: 'heroPhotos',
  photos: [
    {
      _type: 'image',
      asset: { _ref: 'image-...', _type: 'reference' },
      alt: 'Optional alt text',
    },
    ...
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `photos` | array<`image`> | Each entry is a Sanity image asset reference with hotspot enabled and an optional `alt` field. |

Validation: `photos` must have at least 1 entry (warning, not error — empty
arrays are tolerated by the build's fallback path).

## API Endpoints

No HTTP endpoints exposed. Studio uses Sanity's own image upload API.

The build-time fetcher's GROQ projection looks like:
```groq
"heroPhotos": *[_type == "heroPhotos" && _id == "heroPhotos"][0]
```

After fetch, `flattenHeroPhotos` in `scripts/fetch-cms-content.mjs` resolves
each `asset._ref` to a CDN URL via `@sanity/image-url` and produces
`heroPhotos.photoUrls = [{ url, alt }, …]`.

## Business Rules

1. **Singleton enforcement.** `heroPhotos` is pinned to document ID
   `heroPhotos` in `sanity/desk/structure.js`. `sanity.config.js`
   `document.actions` filter prevents Delete/Duplicate/Unpublish.
2. **Image upload via Studio.** Basile drags photos into the array field
   in `/admin → 🖼️ Hero photos`. Sanity handles the asset upload + storage.
3. **CDN delivery.** Photos are served from `cdn.sanity.io` with automatic
   format optimization (WebP when supported) and dimension resizing.
4. **Fallback path.** `src/sanity/loader.js` returns `LEGACY_HERO_PHOTOS`
   (from `src/data/heroPhotos.js`) when `cms.json.heroPhotos.photoUrls`
   is missing or empty. This keeps the dev experience smooth before
   the migration script runs.
5. **One-shot migration.** `scripts/upload-hero-photos.mjs` reads every
   file from `public/img/BABA PHOTOS/`, uploads each to Sanity (SHA1
   dedup makes re-runs cheap), and writes the `heroPhotos` doc in one
   `createOrReplace`. Idempotent. Requires `SANITY_WRITE_TOKEN`.
6. **Shuffle on every load.** `FloatingGalleryHero` Fisher-Yates-shuffles
   the array at page load (see doc 01 for slideshow behaviour). Order
   in the CMS is the canonical "stock" order; the user always sees a
   shuffled subset.

## Dependencies

- [01-photos-hero-slideshow](01-photos-hero-slideshow.md) — the
  rendering / shuffle / preload behaviour of `FloatingGalleryHero` is
  documented there. This doc is just about where the photo list comes from.
- [07-cms-foundation](07-cms-foundation.md) — the singleton enforcement
  pattern, build-time fetch, and Studio mount are all set up there.

## Known Issues

See frontmatter.
