---
id: 01-photos-hero-slideshow
title: Photos Hero — Flashing Photo Slideshow
edition: BABA
depends_on: []
source_files:
  - src/components/photos/FloatingGalleryHero.jsx
known_issues: []
---

# 01 — Photos Hero — Flashing Photo Slideshow

## Purpose

Replace the static single-image hero on the Photos page (`/photos`) with a rapid-fire photo slideshow that cycles through all 116 photos from `public/img/BABA PHOTOS/`. The effect is a "flashing" strobe-like display — hard instant cuts between random photos at randomized intervals (0.5–2 seconds).

## Architecture

Modifies the existing `FloatingGalleryHero.jsx` component. No new files needed.

- A photo list is built from all `.jpeg` files in `public/img/BABA PHOTOS/`
- Photos are shuffled randomly (Fisher-Yates), cycling through all before reshuffling
- Each interval is randomly chosen between 500ms and 2000ms
- Transition is instant (no fade/crossfade) — hard swap of `src`
- Two `<img>` tags are NOT needed; a single `<img>` with changing `src` gives the instant-cut effect
- Images are preloaded in the background (a few ahead in the queue) to avoid flicker/loading blanks
- The existing name overlay (BASILE DESCHAMPS + tagline) remains on top, unchanged
- Desktop and mobile layouts remain structurally the same (sticky inset vs fullscreen)

## Business Rules

- Random order: shuffle all 116 photos, cycle through entire set before reshuffling
- Interval: random between 500ms and 2000ms, re-rolled after each photo change
- Instant cut: no CSS transition on the image swap
- Preload: preload the next 3 images in the queue to ensure smooth display
- The slideshow runs continuously while the hero is visible
- Respects `prefers-reduced-motion`: if enabled, show a single static photo (no cycling)

## Dependencies

None — self-contained within FloatingGalleryHero.
