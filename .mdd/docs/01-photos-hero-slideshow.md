---
id: 01-photos-hero-slideshow
title: Photos Hero — Flashing Photo Slideshow
edition: BABA
depends_on: []
source_files:
  - src/components/photos/FloatingGalleryHero.jsx
  - src/data/heroPhotos.js
  - src/components/ui/HeroSection.jsx  # exports HeroBioOverlay (shared with Films hero)
known_issues:
  - "advance() silently returns after 20 retries; rare frozen-frame on mobile if many landscapes in a row (audit 2026-05-04 N6, still open as of 2026-05-05)"
  - "prefersReducedMotion is read once at hook mount and not reactive — toggling the OS setting does not update behavior until the page remounts (audit 2026-05-05)"
---

# 01 — Photos Hero — Flashing Photo Slideshow

## Purpose

Replace the static single-image hero on the Photos page (`/photos`) with a rapid-fire photo slideshow that cycles through all 116 photos from `public/img/BABA PHOTOS/`. The effect is a "flashing" strobe-like display — hard instant cuts between random photos at randomized intervals (0.5–2 seconds).

## Architecture

`FloatingGalleryHero.jsx` renders the slideshow. Photo list lives in `src/data/heroPhotos.js`.

- A photo list is built from all `.jpeg` files in `public/img/BABA PHOTOS/` and exported from `heroPhotos.js`
- Photos are shuffled randomly (Fisher-Yates), cycling through all before reshuffling
- Each interval is randomly chosen between 500ms and 2000ms
- Transition is instant (no fade/crossfade) — hard swap of `src`
- A single `<img>` with changing `src` gives the instant-cut effect
- After each advance, the next 10 photos in the queue are warmed in the browser cache (`new Image()`) to avoid flicker (`PRELOAD_AHEAD = 10`)
- The slideshow logic is encapsulated in a `usePhotoSlideshow` hook colocated in the same file
- The bio + contact overlay (`HeroBioOverlay`) is imported from `HeroSection.jsx` and rendered on top of the photo on **both** desktop and mobile — so the Photos hero matches the Films hero exactly. There is no per-photo brightness analysis or adaptive overlay color (overlay is always white on the photo).

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
