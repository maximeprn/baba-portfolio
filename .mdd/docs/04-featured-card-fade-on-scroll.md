---
id: 04-featured-card-fade-on-scroll
title: Featured Card — Scroll-Tied Fade at Viewport Edges
edition: BABA Portfolio
depends_on:
  - 03-collapsed-film-cards
source_files:
  - src/components/films/FeaturedFilmCard.jsx
routes: []
models: []
test_files:
  - tests/homepage.spec.js
known_issues: []
---

# 04 — Featured Card: Scroll-Tied Fade at Viewport Edges

## Purpose

Make `FeaturedFilmCard` videos gently fade out as they cross the top or bottom edge of the viewport, instead of clipping abruptly at the visible edge. The fade is ultra-subtle (~10% of viewport height) so cards in the middle of the viewport sit at full opacity, and only the few rows of pixels near the edge are dimmed. Mobile and desktop both run the effect; reduced-motion users opt out.

## Architecture

Each `FeaturedFilmCard` registers a per-frame scroll listener via `useSmoothScrollContext().addScrollListener` (already implemented in `src/context/SmoothScrollContext.jsx:332`). On every scroll frame, the component reads the video wrapper's `getBoundingClientRect()` and writes an opacity directly to the wrapper's `style.opacity` — no React state, no re-render. On mobile (where smooth scroll falls back to native), the same listener fires from the native scroll handler, so the path is unified.

```
Scroll event (smooth or native)
        │
        ▼
addScrollListener fires per-card update()
        │
        ▼
update():  rect = wrapper.getBoundingClientRect()
           enterT = smootherstep((vh - rect.top) / RAMP)
           leaveT = smootherstep( rect.bottom    / RAMP)
           opacity = min(enterT, leaveT)
        │
        ▼
wrapper.style.opacity = opacity
```

The opacity is applied to the video **wrapper div** (`FeaturedFilmCard.jsx:118-129`) rather than the `<video>` element, so the poster `backgroundImage` set on the wrapper fades together with the playing video frame — they appear as one block.

## Data Model

N/A (visual effect, no persisted state).

## API Endpoints

N/A.

## Business Rules

- **Fade ramp:** `RAMP = window.innerHeight * 0.20` (20% of viewport height). Cached and refreshed on resize.
- **Easing:** smootherstep `t³ * (t * (t * 6 − 15) + 10)` (Ken Perlin's 5th-degree polynomial) — same S-curve family as smoothstep but with zero 1st *and* 2nd derivatives at the endpoints, so the fade arrives and departs without a perceptible kink.
- **Enter formula** (video crossing in from below):
  - `enterDist = window.innerHeight - rect.top`
  - `enterT = clamp(enterDist / RAMP, 0, 1)`
  - When the top of the video is exactly at the bottom of the viewport, `rect.top === vh` → `enterT = 0` (invisible). When the top has moved up by `RAMP` pixels, `enterT = 1` (fully opaque).
- **Leave formula** (video crossing out at top):
  - `leaveT = clamp(rect.bottom / RAMP, 0, 1)`
  - When the bottom of the video is exactly at the top of the viewport, `rect.bottom === 0` → `leaveT = 0` (invisible). When the bottom is `RAMP` pixels below the top, `leaveT = 1` (fully opaque).
- **Combined opacity:** `min(smootherstep(enterT), smootherstep(leaveT))`. Cards taller than the viewport are still fully opaque in the middle because both `enterT` and `leaveT` saturate at 1.
- **Reduced motion:** if `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, the effect is skipped — the wrapper keeps its default opacity 1 and the listener is never registered.
- **Mount/unmount:** initial `update()` is called once after mount (so cards already in view aren't briefly transparent). On unmount, the listener and resize handler are cleaned up.
- **Resize handling:** `RAMP` and the wrapper rect both depend on viewport height. A resize listener recomputes `RAMP` and re-runs `update()`.
- **Coexistence with collapsed cards:** while a `CollapsedFilmCard` is in `'collapsed'` phase, the wrapper is `visibility: hidden` (`CollapsedFilmCard.jsx:322`); the opacity write still happens but is invisible. No conflict.
- **No CSS transition:** because `update()` runs every scroll frame, a CSS `transition: opacity` would double-smooth and cause lag. Opacity is set directly via inline style.

## Dependencies

- **03-collapsed-film-cards** — `FeaturedFilmCard` is rendered both standalone (top of `Films.jsx`) and inside `CollapsedFilmCard`. The fade must work in both contexts; collapsed cards' `visibility: hidden` while collapsed makes the opacity write a no-op.
- **`SmoothScrollContext`** — provides `addScrollListener` (per-frame on desktop, native scroll on mobile/tablet).

## Constraints (do not change)

- Preload settings: `preload={shouldLoad ? 'auto' : 'none'}`, conditional `src`, `loadPhase` cascade in `Films.jsx`.
- Existing in-view play/pause IntersectionObserver in `FeaturedFilmCard.jsx` (introduced in 03 follow-up). Opacity work is independent — different ref permitted.
- Hero video and FilmModal Vimeo iframe are out of scope.

## Verification

Visual (manual):
1. `npm run dev` on desktop. Scroll slowly through the homepage. Each featured card's video should be fully opaque while in the middle of the viewport and softly dim only as its top/bottom approaches the screen edge. The fade band should be ~20vh and its onset/offset should be imperceptible.
2. Repeat on mobile-sized viewport (DevTools → 375×812). Same behavior via native scroll.
3. Open DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Reload. Cards should be flat opacity 1 with no fade.
4. Expand a collapsed card. Its video should fade exactly like a featured card while scrolling.
5. Resize the window vertically. Fade ramp should adjust (still ~10% of new vh).

Automated:
- Existing `tests/homepage.spec.js` Playwright spec stays green (no behavioral regression). No new test added — the effect is too visual/timing-sensitive to assert reliably in a headless run; manual verification is the bar.

## Known Issues

(empty for new feature — to be populated by future audits)
