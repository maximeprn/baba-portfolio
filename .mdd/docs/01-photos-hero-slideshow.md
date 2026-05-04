---
id: 01-photos-hero-slideshow
title: Photos Hero — Flashing Photo Slideshow
edition: BABA
depends_on: []
source_files:
  - src/components/photos/FloatingGalleryHero.jsx
  - src/data/heroPhotos.js
known_issues:
  - "Reduced-motion path skips brightness analysis; static-photo overlay always uses light-mode color regardless of photo (audit 2026-05-04 N4)"
  - "Mobile name overlay color is hardcoded white; not adaptive like desktop (audit 2026-05-04 N5)"
  - "advance() silently returns after 20 retries; rare frozen-frame on mobile if many landscapes in a row (audit 2026-05-04 N6)"
  - "FloatingGalleryHero.jsx is 372 LOC; exceeds 300-line gate (audit 2026-05-04 N3)"
---

# 01 — Photos Hero — Flashing Photo Slideshow

## Purpose

Replace the static single-image hero on the Photos page (`/photos`) with a rapid-fire photo slideshow that cycles through all 116 photos from `public/img/BABA PHOTOS/`. The effect is a "flashing" strobe-like display — hard instant cuts between random photos at randomized intervals (0.5–2 seconds).

## Architecture

Modifies the existing `FloatingGalleryHero.jsx` component. Photo list lives in `src/data/heroPhotos.js`.

- A photo list is built from all `.jpeg` files in `public/img/BABA PHOTOS/` and exported from `heroPhotos.js`
- Photos are shuffled randomly (Fisher-Yates), cycling through all before reshuffling
- Each interval is randomly chosen between 500ms and 2000ms
- Transition is instant (no fade/crossfade) — hard swap of `src`
- A single `<img>` with changing `src` gives the instant-cut effect
- After each advance, the next 10 photos in the queue are warmed in the browser cache (`new Image()`) to avoid flicker
- Per-photo brightness analysis (bottom 10%) drives an adaptive black/white name overlay color
- Desktop and mobile layouts share the slideshow logic but render different overlays

## Business Rules

- Random order: shuffle all photos in `heroPhotos`, cycle through entire set before reshuffling
- Interval: random between 500ms and 2000ms, re-rolled after each photo change
- Instant cut: no CSS transition on the image swap
- Preload: rolling 10-ahead window — warm the next 10 photos in the cache after each advance (no batch preload at mount)
- Mobile-only landscape skip: when viewport ≤ 767px, landscape photos are skipped during cycling. The `isMobile` flag is reactive (driven by `matchMedia('(max-width: 767px)')`) so rotation/resize updates the filter
- Mobile name overlay: a separate `MobileHeroNameOverlay` (imported from `HeroSection`) is rendered on mobile to match the Films hero name position
- The slideshow runs continuously while the hero is visible
- Respects `prefers-reduced-motion`: if enabled, show a single static photo (no cycling)

## Dependencies

None — self-contained within FloatingGalleryHero.
