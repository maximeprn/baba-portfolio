---
id: 01-photos-hero-slideshow
title: Photos Hero — Flashing Photo Slideshow
edition: BABA
depends_on:
  - 08-cms-hero-photos
source_files:
  - src/components/photos/FloatingGalleryHero.jsx
  - src/sanity/loader.js  # heroPhotos export — CMS-backed; see doc 08 for schema + upload script
  - src/data/heroPhotos.js  # legacy fallback only, returned by the loader when CMS array is empty
  - src/components/ui/HeroOverlay.jsx  # exports HeroBioOverlay (shared with Films hero)
known_issues:
  - "advance() silently returns after 20 consecutive landscape-skips/errors (a successful non-landscape load returns immediately — the cap only counts skips in a row); rare frozen-frame on mobile if many landscapes in a row (audit 2026-05-04 N6, still open as of 2026-05-05)"
  - "prefersReducedMotion is read once at hook mount and not reactive — toggling the OS setting does not update behavior until the page remounts (audit 2026-05-05)"
  - "Photo list source switched from a hardcoded JS array to a CMS singleton (Stage 3 / doc 08) on 2026-05-20. Component import path moved from src/data/heroPhotos to src/sanity/loader. The legacy data file remains as the loader's fallback only."
  - "LATENT (timer sweep, audit 2026-06-12): the slideshow effect resets the shared cancelRef to false on every re-run (isMobile flip at 767px, e.g. tablet rotation), which can resurrect a cancelled in-flight advance() chain mid-await — two interleaved loops hard-cutting faster than the 0.5-2s cadence until unmount. Fix shape: per-run cancel token object instead of a shared ref (FloatingGalleryHero.jsx ~L126)."
---

# 01 — Photos Hero — Flashing Photo Slideshow

## Purpose

Replace the static single-image hero on the Photos page (`/photos`) with a rapid-fire photo slideshow that cycles through the full hero-photo set from the CMS `heroPhotos` singleton (115 photos as of 2026-06). The effect is a "flashing" strobe-like display — hard instant cuts between random photos at randomized intervals (0.5–2 seconds).

## Architecture

`FloatingGalleryHero.jsx` renders the slideshow. The photo list comes from the CMS `heroPhotos` singleton via `src/sanity/loader.js` (see doc 08); `src/data/heroPhotos.js` is the fallback only, returned by the loader when the CMS array is empty.

- The photo list is the `heroPhotos` singleton's image array (Sanity CDN URLs flattened into `cms.json`); the legacy list built from `public/img/BABA PHOTOS/` in `heroPhotos.js` is the empty-CMS fallback
- Photos are shuffled randomly (Fisher-Yates), cycling through all before reshuffling
- Each interval is randomly chosen between 500ms and 2000ms
- Transition is instant (no fade/crossfade) — hard swap of `src`
- A single `<img>` with changing `src` gives the instant-cut effect
- After each advance, the next 10 photos in the queue are warmed in the browser cache (`new Image()`) to avoid flicker (`PRELOAD_AHEAD = 10`)
- The slideshow logic is encapsulated in a `usePhotoSlideshow` hook colocated in the same file
- The bio + contact overlay (`HeroBioOverlay`) is imported from `HeroOverlay.jsx` and rendered on top of the photo on **both** desktop and mobile — so the Photos hero matches the Films hero exactly. There is no per-photo brightness analysis or adaptive overlay color (overlay is always white on the photo).

## Business Rules

- Random order: shuffle all photos in `heroPhotos`, cycle through entire set before reshuffling
- Interval: random between 500ms and 2000ms, re-rolled after each photo change
- Instant cut: no CSS transition on the image swap
- Preload: rolling **10-ahead window** — warm the next 10 photos in the cache after each advance (no batch preload at mount)
- Mobile-only landscape skip: when viewport ≤ 767px, landscape photos are skipped during cycling. The `isMobile` flag is reactive (driven by `matchMedia('(max-width: 767px)').addEventListener('change', …)`) so rotation/resize updates the filter
- Shared overlay: `HeroBioOverlay` (top-left bio + clients, bottom-left phone + email) renders on top of the photo. Same component on desktop and mobile.
- The slideshow runs continuously while the hero is visible
- Respects `prefers-reduced-motion`: if enabled, show a single static photo (no cycling). Note: this is read once at hook mount and is not reactive — see Known Issues.
- Layout: desktop uses `height: calc(100svh + 150px)` with a sticky inner container at `100svh` (the +150px is the documented scroll-to-reveal allowance — see memory `hero-150px-intentional.md`). Mobile uses `h-[100svh]` flat.

## Dependencies

None — self-contained within FloatingGalleryHero.
