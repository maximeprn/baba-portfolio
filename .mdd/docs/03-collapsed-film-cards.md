---
id: 03-collapsed-film-cards
title: Collapsed Film Cards — Shutter Expand/Collapse, Video-Centred Open
edition: BABA
depends_on: [02-design-system]
source_files:
  - src/components/films/CollapsedFilmCard.jsx
  - src/components/films/FeaturedFilmCard.jsx
  - src/pages/Films.jsx
test_files:
  - tests/e2e/collapsed-film-cards.spec.js
known_issues:
  - "Desktop open uses a snap-trick that can transiently over-scroll the smooth-scroll content during the 1200 ms shutter. The page background is white, so the brief white-on-white gap is not visible."
  - "Mobile centres the video BEFORE the open shutter, mirroring CollapsedPhotoCard's scroll-then-expand. It cannot snap-trick (native smooth-scroll clamps to the live document height), so it pins the document to its post-expand height via body.minHeight for the duration of the open."
  - "The video-centre scroll inherits SmoothScrollContext's ease residual: it settles ~1–2 px shy of an exact centre."
  - "Resize across the 1024px boundary mid-animation could mismatch the open technique (desktop snap-trick vs mobile body.minHeight); effectively unreachable in practice (scroll is locked and the window is only 1200ms). Audit 2026-06-12."
  - "The 36px close fallback (CollapsedFilmCard.jsx ~L290) references a retired row height; harmless because collapsedHeightRef is always set before a close. Audit 2026-06-12."
  - "LATENT (timer sweep, audit 2026-06-12): SmoothScrollContext's desktop scrollTo settle loop (rAF polling |current - targetPos| < 1, ~L300) has no cancellation or target-supersede detection — an instant scrollTo issued mid-ease (e.g. route change) can leave the old promise's rAF loop spinning until navigation. Harmless today because all awaiting .then() callers are in mobile branches; desktop callers fire-and-forget."
---

# 03 — Collapsed Film Cards: Shutter Expand/Collapse, Video-Centred Open

## Purpose

The **Other Projects** section on the Films page lists secondary film entries as compact stacked cards (title over subtitle) laid out in a multi-column grid. Clicking a band expands it into a full `FeaturedFilmCard` via a 1200 ms height shutter, scrolling the page so the **preview video's vertical centre lands at the viewport's vertical centre**. A small X indicator at the bottom of the expanded view (revealed on hover) plus any whitespace click triggers the inverse 600 ms close.

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
  ├─ useLayoutEffect[animating] ← centre the video, THEN open shutter
  │                               (desktop snap-trick / mobile body.minHeight)
  ├─ handleClose                ← pins height, swaps phase to 'closing'
  ├─ useLayoutEffect[closing]   ← content fade + scroll band to y=0 + shutter
  ├─ handleTransitionEnd        ← terminal phase flip (open scroll already done)
  └─ useLayoutEffect[phase]     ← settles inline style.height / opacity
```

The expanded body (`FeaturedFilmCard` + a close-X indicator) is rendered **only while `phase !== 'collapsed'`** (`showContent`) — the mount-on-open technique borrowed from `CollapsedPhotoCard`'s `showGallery`. There is no always-mounted hidden body.

## State Machine

| Phase | Meaning | DOM state |
|---|---|---|
| `'collapsed'` | Idle band | Article height driven by its in-flow `relative` overlay — the stacked title + subtitle band, ≈50–60 px (grows when text wraps). Expanded body not mounted. The `36` in `handleClose`'s fallback (`CollapsedFilmCard.jsx` ~L290) is a vestige of the retired one-line row; `collapsedHeightRef` is always set before a close, so the fallback never fires. |
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
3. **Mobile.** A native smooth-scroll clamps to the live document height, so mobile cannot snap-trick. Instead it mirrors `CollapsedPhotoCard`'s scroll-then-expand: measure the video centre (its absolute document position is the same collapsed or expanded — expanding only grows the article below its fixed top) → pin the document to its post-expand height via `document.body.style.minHeight` so the native smooth-scroll can reach the centre target and hold there → `scrollTo(videoCentre − viewportHeight/2)` → once the scroll settles, start the `OPEN_TRANSITION` shutter, which grows the article into the reserved space. The effect cleanup restores `body.minHeight`.

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
| Text column (description, metadata) | Bubbles to the article's `onClick` — closes the card (no `stopPropagation`) |
| Close-X indicator strip | Closes via `handleClose` |
| Anywhere else on the article | Closes via the article's `onClick` |

## Layout & Spacing — the collapsed band

The collapsed cards live in a CSS grid owned by `Films.jsx` (identical to the Photos page's `Other Projects` grid):

- **Parent grid** — `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` with `gap-x-2 gap-y-[12px] md:gap-x-6 md:gap-y-4`. Phones show the bands two-up, tablets (md, ≥768 px) three-up, desktop (lg, ≥1024 px) four-up.
- **One card layout at every width** — each collapsed card is a stacked `flex flex-col gap-[3px] px-4 md:px-0 py-2`: title (13.5 px) over the `year • category` subtitle (10.5 px). md+ drops the horizontal padding so the bands sit flush-left in their column. There are no responsive row tiers, no `items-stretch` equal-height columns, and no per-card `cards:pl-*` / `cards:pr-*` drift offsets — the old md `flex-row` 3-zone row is retired, and the custom Tailwind `cards` (1350 px) screen is no longer used by the collapsed cards.
- **Breakout while expanded** — when `phase !== 'collapsed'` the article adds `col-span-2 md:col-span-3 lg:col-span-4`, breaking out of its column so the expanded body spans the full grid width.

## Dependencies

- **02-design-system** — motion tokens, `cubic-bezier(0.4, 0, 0.2, 1)` shutter curve, B&W hover-invert palette.
- **`SmoothScrollContext`** — `scrollTo({ ease, instant })` and `getScrollPosition()` drive the open/close scroll; the desktop snap-trick works around `scrollTo`'s call-time `maxScroll` clamp.
- **`FeaturedFilmCard`** — rendered as the expanded body, unchanged. Its preview video is the element the open scroll centres.
- The custom Tailwind `cards` (1350 px) screen is **intentionally no longer used** by the collapsed bands — the multi-column grid + stacked card layout replaced the old 3-zone row and its drift offsets.

## Known Issues

See frontmatter `known_issues`.
