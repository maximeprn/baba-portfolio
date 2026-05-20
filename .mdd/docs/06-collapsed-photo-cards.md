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
routes:
  - /photos
models: []
test_files:
  - tests/e2e/featured-photo-cards.spec.js
known_issues:
  - "Single-expand orchestration is shared with FeaturedPhotoCard via Photos.jsx (one expandedProjectId / closeSignals map). A click on either type collapses whichever card is currently expanded — including across types."
---

# 06 — Collapsed Photo Cards: Other Projects single-row → gallery shutter

## Purpose

The `Other Projects` section on `/photos` lists non-featured projects (`featured: false`) as compact single-row bands — exactly like `Other Projects` on the Films page. Clicking a band runs a 1200 ms shutter open into the **same** `ExpandedPhotoGallery` component used by `FeaturedPhotoCard` (sticky pinned header on mobile, JS pin on desktop, masonry grid, click-photo-to-Lightbox, click-X-or-header-to-close). A single global single-expand pool covers both card types: opening any card collapses whichever was previously open.

## Architecture

```
Photos.jsx
  ├─ getFeaturedProjects()    → FeaturedPhotoCard list (existing)
  ├─ getNonFeaturedProjects() → CollapsedPhotoCard list (new)
  ├─ state: expandedProjectId            ← shared across both card types
  ├─ state: closeSignals { id: count }   ← bumping a card's count auto-closes it
  ├─ handleWillExpand(id) / handleDidCollapse(id)  ← shared orchestrator
  └─ Lightbox state — bound to whichever project is currently expanded

CollapsedPhotoCard.jsx (per-instance shutter state machine)
  phase: 'collapsed' → 'animating' → 'expanded' → 'closing' → 'collapsed'
  ├─ handleOpen           ← anchors viewport y, flushSync-collapses any sibling,
  │                         pins height, swaps phase to 'animating'
  ├─ useLayoutEffect[animating] ← reads scrollHeight, smooth-scrolls article top
  │                         to viewport y=0, plays the height transition
  ├─ handleClose          ← pins height, fades gallery, swaps phase to 'closing'
  ├─ useLayoutEffect[closing]   ← gallery opacity 1→0 over 200 ms; height shutter 600 ms
  ├─ useLayoutEffect[closeSignal] ← INSTANT collapse when parent bumps signal
  └─ handleTransitionEnd  ← terminal flip; drains pendingCloseRef if a close was queued

ExpandedPhotoGallery.jsx (reused — no changes for this feature beyond the
                          header click-to-close behavior shared with FeaturedPhotoCard)
```

`CollapsedPhotoCard` does **not** copy or re-implement the gallery surface — it renders `<ExpandedPhotoGallery>` once `phase !== 'collapsed'`. Sticky-on-mobile / JS-pin-on-desktop behaves identically; the close-X strip and pinned-header-to-close affordance are inherited.

## Data Model

Driven by the existing `src/data/photoProjects.js`. The new helper:

```js
export const getNonFeaturedProjects = () => photoProjects.filter((p) => !p.featured);
```

Each non-featured project ships with the same fields as featured — `title`, `description`, `year`, `client`, `category`, `photos[]`. `preview` is unused for collapsed cards (no FLIP morph; the band has no images), so projects flagged `featured: false` may carry a stale `preview` block — it's just ignored.

## State Machine

| Phase | Band visible? | Gallery visible? | DOM state |
|---|---|---|---|
| `'collapsed'` | yes (in flow on mobile, absolute on desktop) | no | Article `md:h-9` (36 px desktop), `clip-path: inset(0)`. Click → `handleOpen`. |
| `'animating'` | yes (sliding up) | yes (in flow) | Article inline `style.height` transitioning collapsed → target with `OPEN_TRANSITION` (1200 ms `cubic-bezier(0.4, 0, 0.2, 1)`). Band overlay `translateY(0 → -100%)` + `opacity 1 → 0` over 500 ms ease-out. |
| `'expanded'` | no | yes (in flow) | `style.height: auto`, `clip-path: none`. Article carries `group` for the X icon's hover-reveal. Click on the article whitespace, the pinned header, or the X strip → `handleClose`. |
| `'closing'` | yes (sliding back in over the tail) | yes (fading) | Article transitions expanded → collapsed (600 ms). Gallery `opacity 1 → 0` (200 ms). Band overlay slides `translateY(-100% → 0)` + `opacity 0 → 1` over the **last 500 ms** so it lands fully visible exactly at t = 600 ms. |

## Animation Constants (`CollapsedPhotoCard.jsx` top of file)

```js
const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600;   // 2× faster than open — snappy dismissal.
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const GALLERY_FADE_OUT_MS    = 200;
const OVERLAY_TRANSITION_MS  = 500;
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS); // 100
```

These match `CollapsedFilmCard` and `FeaturedPhotoCard` so films and photos read as one motion language.

## Anchored Open

Identical to FeaturedPhotoCard's anchored-open pattern (see doc 05). On click:

1. Snapshot `articleTopPre = article.getBoundingClientRect().top` and `scrollPre = getScrollPosition()`.
2. `flushSync(() => onWillExpand?.(id))` — forces any currently-expanded sibling (Featured **or** Collapsed) to collapse fully + clean up inline styles synchronously, before paint.
3. Re-anchor: jump-scroll instantly by `articleTopPre − articleTopPost` so the article is back at the click position.
4. Pin the article height, `setPhase('animating')`.
5. The `useLayoutEffect[animating]` reads `scrollHeight` and smooth-scrolls so the article's **center** lands at viewport center, then plays the height transition.

Because the sibling close happens inside `flushSync`, the new card's `articleTopPost` reflects the post-collapse layout — no separate sibling-delta correction needed.

### Viewport centering + the snap-trick

Mirrors `CollapsedFilmCard.handleOpen`'s video-centering. The films formula centers the `<video>` tile; the photo analogue centers the entire expanded article (header + masonry + close strip).

The naïve sequence — pin to collapsed, call `scrollTo(centered)`, then start the height transition — **silently fails** when the card sits low in the document (which Other Projects always does — past the hero + featured cards). At the moment `scrollTo` runs, the document is still doc-with-article-at-collapsedHeight (e.g., 36 px). `SmoothScrollContext.scrollTo` and native `window.scrollTo` both clamp to `Math.min(position, content.scrollHeight − innerHeight)` — and that clamp chops the centered target back down to the current `maxScroll`, which often equals "article top at viewport `y=0`". The visible result: same as before.

The fix is the snap-trick from `CollapsedFilmCard.handleOpen`: temporarily set the article to `targetHeight` so the document grows to its post-expand size, call `scrollTo` (now the un-chopped target survives the clamp), then snap back to `collapsedHeight` and start the height transition — all inside a single `requestAnimationFrame` so the browser paints only the smooth interpolation, not the snap.

```js
const collapsedHeight = collapsedHeightRef.current;
article.style.height = `${collapsedHeight}px`;
const targetHeight = article.scrollHeight; // captured pre-rAF, doc still small

requestAnimationFrame(() => {
  // Step 1 — grow the doc so the centered target survives the clamp
  article.style.transition = 'none';
  article.style.height = `${targetHeight}px`;
  article.getBoundingClientRect();

  // Step 2 — compute centering target with the doc post-expand
  const articleAbsoluteTop = article.getBoundingClientRect().top + getScrollPosition();
  const targetScroll = Math.max(
    0,
    articleAbsoluteTop - (window.innerHeight / 2) + (targetHeight / 2),
  );
  scrollTo(targetScroll, { ease: 0.05 });

  // Step 3 — snap back, then start the height transition
  article.style.height = `${collapsedHeight}px`;
  article.getBoundingClientRect();
  article.style.transition = OPEN_TRANSITION;
  article.style.height = `${targetHeight}px`;
});
```

For galleries shorter than the viewport, the article is visually centered. For taller galleries, the article center lands at viewport center — meaning the article top sits above the viewport, the sticky pinned header (see doc 05) renders at viewport top, and the masonry runs around viewport center. `scrollTo`'s lower clamp (`Math.max(0, ...)`) still applies, so a card high enough in the document just glides to `y=0`.

## Close Path

`clip-path: inset(0)` (not `overflow: hidden`) is applied via the React `style` prop while `phase !== 'expanded'`. This preserves the gallery header's `position: sticky` scroll ancestor (the viewport) on mobile — `overflow: hidden` on the article would re-anchor sticky to the article and cause the header to pop out of the viewport the instant close starts. Same trade-off documented in `FeaturedPhotoCard`.

## Click Areas

| Region | Phase | Behavior |
|---|---|---|
| Band overlay (any text) | `collapsed` | bubbles to article → `handleOpen` |
| Article whitespace | `expanded` | bubbles to article → `handleClose` |
| Pinned gallery header (title / meta / description) | `expanded` | bubbles to article → `handleClose` |
| Gallery `<img>` | `expanded` | `stopPropagation` + `onPhotoClick(project, idx)` → Lightbox |
| Close-X strip | `expanded` | `handleClose` (its own onClick + `stopPropagation`) |

The pinned-header-to-close affordance is shared with `FeaturedPhotoCard` and is implemented in `ExpandedPhotoGallery` itself: the `<header>` no longer carries `onClick={(e) => e.stopPropagation()}`, so its click bubbles up. The `cursor-pointer` class on the header advertises this affordance.

## Single-Expand Across Card Types

`Photos.jsx` exposes a single `expandedProjectId` + `closeSignals` map to **both** `FeaturedPhotoCard` and `CollapsedPhotoCard`. Card IDs are unique across the project list, so `closeSignals[id]` increments unambiguously.

For `flushSync` to work across types, both card types listen for `closeSignal` in **`useLayoutEffect`** (not `useEffect`) and collapse instantly to `phase: 'collapsed'`:

- `FeaturedPhotoCard`: existing — clears morph transforms / cell opacities / inline styles in `useLayoutEffect[collapsed]`.
- `CollapsedPhotoCard`: new — clears inline `height` / `transition` in `useLayoutEffect[collapsed]`.

`flushSync` flushes layout effects synchronously, so by the time `flushSync(() => onWillExpand(id))` returns, the previous card has fully collapsed.

## Reduced Motion

`window.matchMedia('(prefers-reduced-motion: reduce)').matches` short-circuits both `handleOpen` and `handleClose` to instant phase flips. The global CSS rule in `index.css` already kills CSS transitions site-wide; the JS path mirrors that.

## Constraints / Reuse

- **Easing parity:** `cubic-bezier(0.4, 0, 0.2, 1)`, 1200 / 600 split.
- **`SmoothScrollContext`:** `scrollTo` (with `instant: true` for the re-anchor jump and `ease: 0.05` for the smooth open) + `getScrollPosition`.
- **`ExpandedPhotoGallery`:** reused as-is. Sticky-on-mobile / JS-pin-on-desktop, masonry, close X, Lightbox wiring.
- **`TitleSection`:** the same component the Films page uses for `Other Projects`.

## Verification

Visual (manual):

1. `npm run dev`, open `/photos`. Scroll past featured projects to `Other Projects`.
2. Click any collapsed band. Band slides up, height shutter to gallery height, scroll lands the article top at viewport top, gallery header pinned.
3. Click the pinned header title. Gallery fades, height shutters back, band slides in.
4. With one card expanded, click another collapsed band. The first instantly collapses (no fade/shutter) so the new card's anchor is correct; the new card opens normally.
5. With a featured card expanded, click a collapsed band — and vice versa. Same single-expand behavior across types.
6. DevTools mobile emulation — same flows. Sticky header stays still while scrolling inside the expanded gallery.
7. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Cards open instantly, no transitions.

Automated:

- `npx playwright test --project=chromium` — `homepage.spec.js` and `featured-photo-cards.spec.js` must stay green. Both depend on `dispatchEvent('click')` because the desktop smooth-scroll defeats Playwright's native actionability check on `/photos`.

## Known Issues

See frontmatter `known_issues`.
