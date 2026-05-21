---
id: 03-collapsed-film-cards
title: Collapsed Film Cards — Shutter Expand/Collapse, Video-Centred Open
edition: BABA
depends_on: [02-design-system]
source_files:
  - src/components/films/CollapsedFilmCard.jsx
  - src/components/films/FeaturedFilmCard.jsx
  - src/pages/Films.jsx
  - tailwind.config.js  # the `cards` (1350px) breakpoint
test_files:
  - tests/e2e/collapsed-film-cards.spec.js
known_issues:
  - "Desktop open uses a snap-trick that can transiently over-scroll the smooth-scroll content during the 1200 ms shutter. The page background is white, so the brief white-on-white gap is not visible."
  - "Mobile centres the video AFTER the open shutter (native scroll cannot snap-trick) — a brief second phase, not concurrent with the expand."
  - "The video-centre scroll inherits SmoothScrollContext's ease residual: it settles ~1–2 px shy of an exact centre."
---

# 03 — Collapsed Film Cards: Shutter Expand/Collapse, Video-Centred Open

## Purpose

The **Other Projects** section on the Films page lists secondary film entries as compact one-line bands. Clicking a band expands it into a full `FeaturedFilmCard` via a 1200 ms height shutter, scrolling the page so the **preview video's vertical centre lands at the viewport's vertical centre**. A small X indicator at the bottom of the expanded view (revealed on hover) plus any whitespace click triggers the inverse 600 ms close.

`CollapsedFilmCard` borrows `CollapsedPhotoCard`'s open/close **technique** (the expanded body is mounted only while open; same shutter timing and band-overlay slide) but differs from it deliberately in two ways:

1. **No single-expand.** Film cards are independent — opening one does **not** collapse the others. Several can be open at once; each is collapsed only by the user clicking it. (Photos enforces single-expand; Films does not.)
2. **Open scroll target.** A film's expanded body is a single preview video, so the open centres that video in the viewport. (Photos' body is a tall gallery, so it scrolls the gallery top to y=0.)

## Architecture

```
Films.jsx
  └─ renders one independent <CollapsedFilmCard> per collapsed film.
     No single-expand orchestrator — no expandedId / closeSignals state.

CollapsedFilmCard.jsx (per-instance, fully self-contained state machine)
  phase: 'collapsed' → 'animating' → 'expanded' → 'closing' → 'collapsed'
  ├─ handleOpen                 ← pins height, swaps phase to 'animating'
  ├─ useLayoutEffect[animating] ← desktop snap-trick: centre the video + open
  │                               shutter; mobile: shutter only
  ├─ handleClose                ← pins height, swaps phase to 'closing'
  ├─ useLayoutEffect[closing]   ← content fade + scroll band to y=0 + shutter
  ├─ handleTransitionEnd        ← terminal flip; mobile centres the video here
  └─ useLayoutEffect[phase]     ← settles inline style.height / opacity
```

The expanded body (`FeaturedFilmCard` + a close-X indicator) is rendered **only while `phase !== 'collapsed'`** (`showContent`) — the mount-on-open technique borrowed from `CollapsedPhotoCard`'s `showGallery`. There is no always-mounted hidden body.

## State Machine

| Phase | Meaning | DOM state |
|---|---|---|
| `'collapsed'` | Idle band | Article height driven by its in-flow `relative` overlay (≈36 px one-line row; grows when text wraps). Expanded body not mounted. |
| `'animating'` | Open in progress | Expanded body mounted in flow. Article inline `style.height` transitioning collapsed→target with `OPEN_TRANSITION` (1200 ms). Overlay sliding up + fading out. |
| `'expanded'` | Stable expanded view | Article `style.height = 'auto'`. Overlay unmounted. Close-X indicator visible at the bottom of the body; article carries `group` for the X hover-reveal. |
| `'closing'` | Close in progress | Article transitioning expanded→collapsed (600 ms). Body fades to opacity 0 (200 ms). Overlay re-mounts and cross-fades back in over the close tail. |

## Animation Constants

```js
const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600;  // 2× faster than open — snappy dismissal.
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const CONTENT_FADE_OUT_MS     = 200;
const OVERLAY_TRANSITION_MS    = 500;
const OVERLAY_REVEAL_DELAY_MS  = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS); // 100
```

## Business Rules

### Open path — video-centred

`handleOpen` measures the collapsed height, pins the article to it, and swaps phase to `'animating'`. The `useLayoutEffect[animating]` then:

1. Re-pins the article to `collapsedHeight` and reads `scrollHeight` for the target height.
2. **Desktop — snap-trick.** The video's centre sits deep in the page; `SmoothScrollContext.scrollTo` clamps to the *current* `maxScroll`, which — while the card is still collapsed — is too small and would chop the target. So, inside one `requestAnimationFrame`: grow the article to `targetHeight` (the document reaches its post-expand size) → measure the video and call `scrollTo(videoCentre − viewportHeight/2, { ease: 0.05 })` (now the target survives the clamp) → snap the article back to `collapsedHeight` → start the real `OPEN_TRANSITION`. The snapped states never paint. The smooth-scroll and the height shutter then run concurrently and settle together with the video centred.
3. **Mobile.** A native smooth-scroll race-conditions with the document growing under it, so mobile cannot snap-trick. It runs the open shutter alone; `handleTransitionEnd` centres the video afterwards, once the document is already at full height (so the native scroll is not clamped short).

### Close path

`handleClose` pins the article to its expanded height and swaps phase to `'closing'`. The `useLayoutEffect[closing]` fades the body to opacity 0 (200 ms), scrolls the collapsed band's top to viewport y=0, and plays the `CLOSE_TRANSITION` height shutter. The band overlay slides back in over the close tail (`OVERLAY_REVEAL_DELAY_MS`) so it lands fully visible exactly at t = 600 ms.

### No single-expand

Each `CollapsedFilmCard` owns its complete state. There is no parent orchestrator, no `closeSignal`, no cross-card event. Opening a card never touches any other card; the user collapses each one itself by clicking it.

### Scroll lock during animation

While `phase` is `'animating'` or `'closing'`, a `useEffect` keyed on `phase` disables *user* scrolling so a manual scroll — or an inertial fling on mobile — cannot fight the programmatic open/close scroll. `setScrollLocked(true)` gates the desktop smooth-scroll's wheel/key handlers; a `touchmove` listener (`{ passive: false }`, `preventDefault`) covers mobile native scroll. Programmatic `scrollTo` is unaffected by either. Keyed on `phase` (not a transition event), so the unlock cleanup always runs.

### Reduced motion

`reducedMotion()` short-circuits `handleOpen` / `handleClose` to instant phase flips (open scrolls the article top to y=0 instantly; no video-centre snap-trick).

### Click areas (when expanded)

| Region | Behavior |
|---|---|
| Video tile / title (FeaturedFilmCard) | Opens FilmModal — `stopPropagation` prevents the article-level close |
| Text column (description, metadata) | Inert — `stopPropagation` |
| Close-X indicator strip | Closes via `handleClose` |
| Anywhere else on the article | Closes via the article's `onClick` |

## Layout & Spacing — the collapsed band

The collapsed band has three responsive tiers (identical to `CollapsedPhotoCard`):

- **Phones (< 768 px)** — `flex-col`, stacked, left-aligned title + metadata; description sentence `hidden`; `mb-6` gap between bands.
- **768 px – 1350 px** — `md:flex-row` 3-zone row, `items-stretch` so the three column boxes share the tallest one's height, each `<p>` a flex container (`md:flex md:items-center`) for vertical centring. One-line row ≈36 px (`py-2` + `md:min-h-[36px]`); grows when text wraps. No per-card stagger offsets.
- **≥ 1350 px** — same plus the per-card `cards:pl-*` / `cards:pr-*` drift offsets (the custom Tailwind `cards` screen).

## Dependencies

- **02-design-system** — motion tokens, `cubic-bezier(0.4, 0, 0.2, 1)` shutter curve, B&W hover-invert palette.
- **`SmoothScrollContext`** — `scrollTo({ ease, instant })` and `getScrollPosition()` drive the open/close scroll; the desktop snap-trick works around `scrollTo`'s call-time `maxScroll` clamp.
- **`FeaturedFilmCard`** — rendered as the expanded body, unchanged. Its preview video is the element the open scroll centres.
- **`tailwind.config.js`** — the `cards` screen (`1350px`).

## Known Issues

See frontmatter `known_issues`.
