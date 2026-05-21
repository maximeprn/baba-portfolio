---
id: 06-collapsed-photo-cards
title: Collapsed Photo Cards — Other Projects single-row → gallery shutter
edition: BABA Portfolio
depends_on:
  - 02-design-system
  - 03-collapsed-film-cards
  - 05-featured-photo-cards
  - 09-cms-photo-projects
source_files:
  - src/components/photos/CollapsedPhotoCard.jsx
  - src/components/photos/ExpandedPhotoGallery.jsx
  - src/pages/Photos.jsx
  - src/sanity/loader.js  # photoProjects + getNonFeaturedProjects (CMS-backed; see doc 09)
  - src/data/photoProjects.js  # legacy fallback only
  - tailwind.config.js  # the `cards` (1350px) breakpoint
routes:
  - /photos
models: []
test_files:
  - tests/e2e/featured-photo-cards.spec.js
known_issues:
  - "Single-expand orchestration is shared with FeaturedPhotoCard via Photos.jsx (one expandedProjectId / closeSignals map). A click on either type collapses whichever card is currently expanded — including across types."
  - "Open/close scroll positioning inherits SmoothScrollContext's ease residual: a card that travels a long distance may settle a few px shy of viewport y=0."
---

# 06 — Collapsed Photo Cards: Other Projects single-row → gallery shutter

## Purpose

The `Other Projects` section on `/photos` lists non-featured projects (`featured: false`) as compact single-row bands — the same collapsed-band layout as `Other Projects` on the Films page. Clicking a band runs a 1200 ms shutter open into the **same** `ExpandedPhotoGallery` used by `FeaturedPhotoCard` (sticky pinned header on mobile, JS pin on desktop, masonry grid, click-photo-to-Lightbox, click-X-or-header-to-close).

`CollapsedPhotoCard` is **the reference implementation for the collapsed-band pattern** — `CollapsedFilmCard` (doc 03) borrows its open/close technique and shares the shutter timing and the `cards` (1350 px) destructure breakpoint. Two behaviours are **photos-only**, though: the coordinated single-expand handoff described below (film cards are independent — opening one never collapses another) and the gallery-top scroll target (films centre their preview video in the viewport instead).

## Architecture

```
Photos.jsx
  ├─ getFeaturedProjects()    → FeaturedPhotoCard list
  ├─ getNonFeaturedProjects() → CollapsedPhotoCard list
  ├─ state: expandedProjectId            ← shared across both card types
  ├─ state: closeSignals { id: count }   ← bumping a card's count auto-closes it
  ├─ handleWillExpand(id) / handleDidCollapse(id)  ← shared orchestrator
  └─ Lightbox state — bound to whichever project is currently expanded

CollapsedPhotoCard.jsx (per-instance shutter state machine)
  phase: 'collapsed' → 'animating' → 'expanded' → 'closing' → 'collapsed'
  ├─ handleOpen               ← pins height, swaps phase to 'animating'
  ├─ useLayoutEffect[animating] ← reads scrollHeight, scrolls band top to y=0, plays open shutter
  ├─ handleClose              ← pins height, swaps phase to 'closing'
  ├─ useLayoutEffect[closing]   ← gallery opacity 1→0 (200 ms); height shutter (600 ms)
  ├─ useLayoutEffect[closeSignal] ← coordinated auto-close (see Single-expand below)
  └─ handleTransitionEnd      ← terminal flip; dispatches 'photo-card-expand-done'

ExpandedPhotoGallery.jsx (reused as-is — sticky/JS-pin header, masonry, close-X)
```

`CollapsedPhotoCard` does **not** re-implement the gallery — it renders `<ExpandedPhotoGallery>` once `phase !== 'collapsed'`.

## Data Model

Driven by `getNonFeaturedProjects()` (CMS-backed via `loader.js`, fallback `photoProjects.js`):

```js
export const getNonFeaturedProjects = () => photoProjects.filter((p) => !p.featured);
```

Non-featured projects ship the same fields as featured — `title`, `description`, `year`, `client`, `category`, `photos[]`. The collapsed band shows only `title`, the first sentence of `description`, and `year • category` (the `client` is shown in the expanded gallery header, so it is omitted from the band as redundant).

## State Machine

| Phase | Band visible? | Gallery visible? | DOM state |
|---|---|---|---|
| `'collapsed'` | yes | no | Article height is driven by its in-flow `relative` overlay — a one-line row is ≈36 px (`py-2` + `md:min-h-[36px]`) and grows when text wraps. `clip-path: inset(0)`. Click → `handleOpen` |
| `'animating'` | yes (sliding up) | yes (in flow) | Article inline `style.height` transitioning collapsed → target with `OPEN_TRANSITION` (1200 ms). Band overlay `translateY(0 → -100%)` + `opacity 1 → 0` over 500 ms |
| `'expanded'` | no | yes (in flow) | `style.height: auto`, `clip-path: none`. Article carries `group` for the X hover-reveal. Click on article whitespace / pinned header / X → `handleClose` |
| `'closing'` | yes (sliding back in over the tail) | yes (fading) | Article transitions expanded → collapsed (600 ms). Gallery `opacity 1 → 0` (200 ms). Band overlay slides back in over the **last 500 ms** |

## Animation Constants (`CollapsedPhotoCard.jsx` top of file)

```js
const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600;   // 2× faster than open — snappy dismissal.
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const GALLERY_FADE_OUT_MS     = 200;
const OVERLAY_TRANSITION_MS    = 500;
const OVERLAY_REVEAL_DELAY_MS  = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS); // 100
```

These match `CollapsedFilmCard` and `FeaturedPhotoCard` so films and photos read as one motion language.

## Open / Close Path

**Open** — `handleOpen` pins the article to its collapsed height and swaps phase to `'animating'`. The `useLayoutEffect[animating]` runs after commit (gallery now in flow): reads `article.scrollHeight` for the target, computes `targetScroll = band top → viewport y=0`, calls `scrollTo`, then plays the height transition. Desktop runs the scroll + transition concurrently; mobile serializes (await scroll-end, then transition) because native smooth-scroll race-conditions with the growing document.

**Close** — `handleClose` pins the article to its expanded height and swaps phase to `'closing'`. The `useLayoutEffect[closing]` fades the gallery to opacity 0 (200 ms), scrolls the band top to `y=0`, and plays the `CLOSE_TRANSITION` height shutter. The band overlay slides in over the close tail.

`clip-path: inset(0)` (not `overflow: hidden`) is applied while `phase !== 'expanded'` — it preserves the gallery header's `position: sticky` scroll ancestor (the viewport) on mobile. Same trade-off as `FeaturedPhotoCard`.

**Scroll lock during animation.** While `phase` is `'animating'` or `'closing'`, a `useEffect` keyed on `phase` disables *user* scrolling so a manual scroll — or an inertial fling on mobile — cannot fight the programmatic open/close scroll (and cannot land mid-handoff). `setScrollLocked(true)` gates the desktop smooth-scroll's wheel/key handlers; a `touchmove` listener (`{ passive: false }`, `preventDefault`) covers mobile native scroll. Programmatic `scrollTo` is unaffected by either. Because the lock is keyed on `phase` (not a transition event), the unlock cleanup is guaranteed to run.

## Single-Expand — the coordinated handoff

`Photos.jsx` exposes one `expandedProjectId` + `closeSignals` map to **both** `FeaturedPhotoCard` and `CollapsedPhotoCard`. When card **B** opens while card **A** is expanded:

1. B's `handleOpen` calls `onWillExpand(B.id)`; `Photos.jsx` bumps A's `closeSignal`. A is **not** collapsed yet — the collapse is deferred to step 5.
2. A's `useLayoutEffect[closeSignal]` sees `phase === 'expanded'` and **does not collapse**. It registers a one-shot `photo-card-expand-done` window-event listener and stays fully expanded.
3. B runs its normal open, scrolling its own top to `y=0` and pushing A off-screen above the viewport.
4. When B's open transition ends, `handleTransitionEnd` dispatches `photo-card-expand-done` with `{ sourceTop }`.
5. A's listener (`handleExpandDone`) fires: A collapses **instantly** (no animation). When A sits above the source it must also scroll `scrollY` up by its `(expanded − collapsed)` delta to keep B anchored — and the collapse and that scroll **must land in the same paint**, or the still-expanded A flickers back into view (the scroll moves up before the DOM has shrunk). So the collapse is committed with `flushSync(() => setPhase('collapsed'))` and the `scrollTo(scrollY − delta, { instant: true })` runs immediately after, both before the handler returns — one atomic frame. A is off-screen, so the collapse is invisible.

`closeSignal` arriving mid-animation collapses the card instantly with no waiting. All card types listen for `closeSignal` in `useLayoutEffect` and settle inline styles in `useLayoutEffect[collapsed]`.

## Reduced Motion

`reducedMotion()` (`prefers-reduced-motion: reduce`) short-circuits `handleOpen` / `handleClose` to instant phase flips. The global `index.css` rule already kills CSS transitions site-wide; the JS path mirrors that.

## Layout & Spacing — three responsive tiers

The collapsed band has three layouts (identical to `CollapsedFilmCard`):

- **Phones (< 768 px).** `flex-col`, stacked, left-aligned title + metadata; description sentence `hidden`. Overlay is `relative` and sizes the article. `mb-6` gap between bands (the `Photos.jsx` wrapper).
- **768 px – 1350 px — plain 3-zone row.** `md:flex-row` with the default `items-stretch`: the three column boxes (`<p>`s) all stretch to the **tallest** one's height. Each `<p>` is itself a flex container (`md:flex md:items-center`) so its text sits **vertically centred** within that equal-height box. Title pinned left (`flex-1`), description sentence in the middle (default `flex 0 1 auto` — it shrinks and wraps when the row is cramped, so the metadata is never pushed off-screen), metadata pinned right (`flex-1 md:justify-end md:text-right`). One-line row ≈36 px (`py-2` + `md:min-h-[36px]`); a band whose text wraps grows to fit (the `relative` overlay sizes the article) instead of clipping into its neighbour. No per-card stagger offsets. `mb-0` rhythm.
- **≥ 1350 px — composed 3-zone row.** Same plus the per-card `cards:pl-*` / `cards:pr-*` drift offsets (the custom Tailwind `cards` screen = `1350px`).

`1350px` is the complement of the photo-thumbnail `mobileBreakpoint: 1349` in `photoProjects.js` — band and thumbnail gain their composed treatment at the same width.

## Click Areas

| Region | Phase | Behavior |
|---|---|---|
| Band overlay | `collapsed` | bubbles to article → `handleOpen` |
| Article whitespace / pinned gallery header | `expanded` | bubbles to article → `handleClose` |
| Gallery `<img>` | `expanded` | `stopPropagation` + `onPhotoClick(project, idx)` → Lightbox |
| Close-X strip | `expanded` | `handleClose` |

## Constraints / Reuse

- **Easing parity:** `cubic-bezier(0.4, 0, 0.2, 1)`, 1200 / 600 split — shared with `CollapsedFilmCard` and `FeaturedPhotoCard`.
- **`SmoothScrollContext`:** `scrollTo` (`{ ease }` for the open, `{ instant }` for the handoff compensation) + `getScrollPosition`.
- **`ExpandedPhotoGallery`:** reused as-is.
- **`TitleSection`:** the same component the Films page uses for `Other Projects`.

## Verification

Visual (manual): `npm run dev`, `/photos` → scroll to `Other Projects`. Open a band; open a second band (first collapses invisibly off-screen, second opens); close via the pinned header. Resize across 1350 px — the band switches between the stacked and row layouts. DevTools → emulate `prefers-reduced-motion` → cards open instantly.

Automated: `npx playwright test --project=chromium` — `featured-photo-cards.spec.js` (photos) and `collapsed-film-cards.spec.js` (the Films-page bands) must stay green.

## Known Issues

See frontmatter `known_issues`.
