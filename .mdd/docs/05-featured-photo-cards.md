---
id: 05-featured-photo-cards
title: Featured Photo Cards — Compact Preview ↔ Expanded Gallery (FLIP morph)
edition: BABA Portfolio
depends_on:
  - 02-design-system
  - 03-collapsed-film-cards
  - 09-cms-photo-projects
source_files:
  - src/components/photos/FeaturedPhotoCard.jsx
  - src/components/photos/PhotoCardPreview.jsx
  - src/components/photos/ExpandedPhotoGallery.jsx
  - src/pages/Photos.jsx
  - src/sanity/loader.js  # photoProjects + getFeaturedProjects/getNonFeaturedProjects (CMS-backed; see doc 09)
  - src/data/photoProjects.js  # legacy fallback only
  - scripts/scaffold-photo-projects.mjs  # obsolete — content now lives in Sanity (see doc 09)
routes:
  - /photos
models: []
test_files:
  - tests/homepage.spec.js                      # existing — must stay green
  - tests/e2e/featured-photo-cards.spec.js      # 4 smoke tests
known_issues:
  - "Aspect-ratio mismatch between collage slot and gallery cell is resolved by `object-fit: cover` + width-based scale only; a photo with very different source/destination crop may briefly pop at t=0. Acceptable on real content."
  - "On mobile the collapsed card stacks (collage above text); the FLIP morph still runs but visual rhythm is less dramatic because the destination gallery is single-column."
  - "Playwright cannot use native click/scrollIntoView on /photos because the desktop smooth-scroll sets body overflow:hidden and translates content via CSS transform. Tests must use locator.dispatchEvent('click'). See tests/e2e/featured-photo-cards.spec.js."
  - "PhotoCardPreview supports per-project mobile fallback via `preview.mobilePattern` + `preview.mobilePhotos` + `preview.mobileBreakpoint` (default 767). The 5 originally-featured projects used pattern 10 (single full-bleed) with breakpoint 1349 + maxHeight 60vh — so the side-by-side comparison collapses to one photo on tablets and below. When migrating photo project data to a new system (e.g. CMS), THIS BEHAVIOR MUST BE PRESERVED — see sanity/schemas/photoProject.js fields `previewMobilePattern`, `previewMobilePhotoIndices`, `previewMobileBreakpoint`, `previewAspectRatio`, `previewMaxHeight`."
---

# 05 — Featured Photo Cards: Compact Preview ↔ Expanded Gallery

## Purpose

Featured photo projects on `/photos` render as compact cards: a 2- or 3-image collage on one side, title / year • client • category / description on the other. Clicking *anywhere* on the card (collage, title, meta text, description, whitespace) expands it in place into a full inline gallery of all of the project's photos. The 2–3 preview images **morph** from their collage positions into their final cells in the gallery (FLIP transition) so the card and the gallery feel like the same object at two scales — not a fade-and-replace. The expand animation lands the article's *top* at the viewport top and the gallery header (title + meta) is pinned to the viewport top during scroll, so the previous card scrolls offscreen and the project title is always visible above the photos. Single-expand is enforced by `Photos.jsx`. User-initiated close (clicking the X or article whitespace) is a faster fade + height shutter (no inverse morph). **Switching cards** — opening a new card while one is expanded — collapses the previous card *instantly* (no fade, no shutter, no overlay slide-in) so the experience always feels like the newly-clicked card's title appears at the top.

## Architecture

```
Photos.jsx
  ├─ state: expandedProjectId            ← which card is currently expanded (or null)
  ├─ state: closeSignals { id: count }   ← bumping a card's count auto-closes it
  ├─ handleWillExpand(id)                ← bumps prev's signal, sets expanded id
  └─ handleDidCollapse(id)               ← clears expanded id once a card lands collapsed

FeaturedPhotoCard.jsx (per-instance orchestrator)
  phase: 'collapsed' → 'animating-open' → 'expanded' → 'animating-close' → 'collapsed'
  ├─ handleOpen          ← snapshots FIRST rects (preview imgs), pins height, swaps phase
  ├─ useLayoutEffect[animating-open] ← measures LAST rects, applies inverted transforms,
  │                                    schedules rAF that kicks off transition + scroll
  ├─ handleClose         ← pins height, swaps phase
  ├─ useLayoutEffect[animating-close]← fades gallery, kicks off height shutter
  └─ handleTransitionEnd ← terminal flip; drains pendingCloseRef if a close was queued mid-open

PhotoCardPreview.jsx           ExpandedPhotoGallery.jsx
  ├─ PATTERNS[0..9]              ├─ CSS-columns masonry (1 / 2 / 3 cols)
  ├─ <img data-photo-idx>        ├─ <img data-photo-idx>  ← FLIP destinations
  └─ slot pos as %               ├─ click → onPhotoClick (Lightbox)
                                 └─ close indicator (X)
```

## State Machine

| Phase | Preview shown? | Gallery shown? | DOM state |
|---|---|---|---|
| `'collapsed'` | yes (in flow) | no | Article auto-sized by preview. `cursor-pointer`, click → open. |
| `'animating-open'` | no | yes (in flow) | Article inline `style.height` transitions collapsed→target with `OPEN_TRANSITION` (1200ms). Preview-matched gallery imgs animate `transform` from FIRST→identity (LAST). Non-preview gallery cells animate `opacity 0→1` with stagger. `clip-path: inset(0)` on article (not `overflow:hidden` — see Header Pin). |
| `'expanded'` | no | yes (in flow) | `style.height: auto`, `clip-path: none`. Article carries `group` for X-icon hover-reveal. Click anywhere outside the gallery imgs / header text → close. |
| `'animating-close'` | yes (absolute overlay) | yes (in flow, fading) | Article transitions expanded→collapsed (600ms). Gallery `opacity 1→0` over 200ms. Preview overlay slides in `translateY(-100%)→0`, `opacity 0→1` over the **last 500ms** so it lands fully visible at t=600ms. `clip-path: inset(0)` on article. |

## Animation Constants (`FeaturedPhotoCard.jsx` top of file)

```js
const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600;  // 2× faster than open — snappy dismissal.
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const CELL_FADE_DURATION_MS = 400;
const CELL_FADE_STAGGER_MS  = 30;
const GALLERY_FADE_OUT_MS   = 200;
const OVERLAY_TRANSITION_MS = 500;
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS); // 100
```

These match `CollapsedFilmCard`'s motion values so films and photos read as one motion language.

## FLIP Choreography (open path, ms-by-ms)

```
t=0     handleOpen():
        - querySelectorAll('[data-fpc-preview="1"]') in PhotoCardPreview
          → store getBoundingClientRect() per data-photo-idx (FIRST rects)
        - call onWillExpand(project.id) — parent bumps any other expanded card's closeSignal
        - article.style.height = collapsedHeight + 'px' (pin)
        - article.style.overflow = 'hidden'
        - setPhase('animating-open')

t=1     React commits 'animating-open':
        - PhotoCardPreview unmounts; ExpandedPhotoGallery mounts in flow

useLayoutEffect (after commit, before paint):
        for each <img data-fpc-gallery-img="1"> in ExpandedPhotoGallery:
          first = firstRectsRef.get(idx); last = img.getBoundingClientRect()
          dx = first.left - last.left
          dy = first.top  - last.top
          ds = first.width / last.width  ← width-only (object-fit:cover smooths height)
          img.style.transformOrigin = 'top left'
          img.style.transform = `translate(${dx}px, ${dy}px) scale(${ds})`
          img.style.transition = 'none'
          img.style.zIndex = 2
        for each non-preview cell in gallery:
          cell.style.opacity = '0'
          cell.style.transition = 'none'
        article.scrollHeight → targetHeight
        publish data-fpc-eh / data-fpc-ch on article (sibling-delta correction)
        compute targetScroll (center expanded gallery on screen, minus sibling shrinkage)

rAF:
        scrollTo(targetScroll, { ease: 0.05 })
        article.style.transition = `height ${OPEN_DURATION_MS}ms ${EASE}`
        article.style.height = `${targetHeight}px`
        for each morph img:
          img.style.transition = `transform ${OPEN_DURATION_MS}ms ${EASE}`
          img.style.transform = ''                          ← animates to LAST
        for each non-preview cell at index i:
          stagger = min(i * 30ms, OPEN_DURATION_MS - 400ms)
          cell.style.transition = `opacity 400ms ${EASE} ${stagger}ms`
          cell.style.opacity = '1'

t=OPEN_DURATION_MS  transitionend on article (height):
        setPhase('expanded')
        useLayoutEffect[expanded] clears inline transforms / opacity / overflow
        if pendingCloseRef.current → handleClose() in next rAF
```

### Why no clipping during open

The article carries `overflow: hidden` for the duration of `'animating-open'`. The morphing imgs *could* be clipped if their interpolated y-coordinate ever exceeded the article's growing height. Linear-interpolation argument: with the same easing curve on both `transform` and `height`, and with `last.y ≤ targetHeight` and `first.y ≤ collapsedHeight`, the morph y at any progress p stays ≤ the article height at the same progress. So no clipping happens, and we don't need a portal or `position: fixed`.

## Close Path (no inverse morph)

```
t=0     handleClose():
        article.style.height = expandedHeight + 'px'  (pin)
        article.style.overflow = 'hidden'
        setPhase('animating-close')

useLayoutEffect[animating-close]:
        gallery.style.transition = 'opacity 200ms ease-out'
        gallery.style.opacity = '0'
        rAF:
          article.style.transition = `height ${CLOSE_DURATION_MS}ms ${EASE}`
          article.style.height = collapsedHeight + 'px'

t=100ms (= CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS)
        overlayVisible flips true → preview overlay slides in:
          translateY(-100%) → 0,  opacity 0 → 1   (500ms ease-out)

t=600ms transitionend on article (height):
        setPhase('collapsed') — preview unmounts the overlay form, remounts in flow.
        Inline styles cleared in useLayoutEffect[collapsed].
```

A two-direction FLIP morph would double the bookkeeping; close is supposed to feel snappy. The 200ms gallery fade + a 500ms collapsed-text slide-in (mirroring `CollapsedFilmCard`'s overlay reveal) reads as "snap shut" without the user noticing the absence of the morph.

## Data Model

Driven entirely by `src/data/photoProjects.js`:

```js
{
  id, slug, title, description, year, client, category,
  photos: [{ src, alt, aspectRatio }],
  preview: {
    pattern: 0..9,           // index into PATTERNS in PhotoCardPreview
    photos: [0, 2, 4],       // photo indices (length must equal slot count)
  },
  imagePosition?: 'left' | 'right',  // collage side; defaults alternate by feature index in Photos.jsx
  featured: boolean,
}
```

`PATTERNS` (in `PhotoCardPreview.jsx`) is an array of 10 collage layouts. Each entry has a `slots` array of `{ left, top, width, height }` percentages within a 5:4 container; slot count is 2 or 3. The `<img>` rendered into slot *i* uses `project.photos[project.preview.photos[i]]` and carries `data-photo-idx={projectPhotosIndex}` plus `data-fpc-preview="1"`.

`ExpandedPhotoGallery` renders **all** `project.photos` in CSS-columns masonry (`columns-1 sm:columns-2 lg:columns-3 gap-4`). Each `<img>` carries `data-photo-idx={arrayIndex}` plus `data-fpc-gallery-img="1"`. The gallery cell wrappers carry `data-fpc-cell={arrayIndex}` so the FLIP code can target preview vs. non-preview cells by index. The masonry container itself carries `data-fpc-gallery` (no value) — used by Playwright tests.

## Single-Expand Enforcement

Identical to `Films.jsx`'s film-card pattern:

```jsx
// Photos.jsx
const [expandedProjectId, setExpandedProjectId] = useState(null);
const [closeSignals, setCloseSignals] = useState({});

const handleWillExpand = (id) => {
  setExpandedProjectId((prev) => {
    if (prev !== null && prev !== id) {
      setCloseSignals((sigs) => ({ ...sigs, [prev]: (sigs[prev] || 0) + 1 }));
    }
    return id;
  });
};
const handleDidCollapse = (id) =>
  setExpandedProjectId((prev) => (prev === id ? null : prev));
```

A `closeSignal` bump triggers an **instant** collapse on the previously-expanded card — no `'animating-close'` phase. The `'collapsed'` `useLayoutEffect` clears any inline styles left over from a possibly-interrupted `'animating-open'`. The animated close path (`handleClose` → `'animating-close'`) is reserved for explicit user dismissal (clicking the X strip or article whitespace in the expanded phase). When the collapsing card sits above the newly-opened one, its collapse and the scroll compensation are committed as one atomic frame — `flushSync(() => setPhase('collapsed'))` then `scrollTo(scrollY − delta, { instant: true })` — so the still-expanded card can never flicker back into view between the two updates (see doc 06's "Single-Expand — the coordinated handoff").

## Anchored Open — Sibling Collapses Invisibly

When the user clicks a card while another card is already expanded above it, naïvely letting the previous card collapse and then smooth-scrolling to the new card's top reads as a big page-trip — the user is yanked from wherever they were inside card A's gallery to a different doc position before the scroll-up animation even begins. The fix anchors the click target at its viewport y-coord, then closes the previous card *invisibly* in the same paint cycle.

**Sequence in `handleOpen`** (this card = the new one being opened):

1. Snapshot anchor before any state change:
   ```js
   const articleTopPre = article.getBoundingClientRect().top;
   const scrollPre = getScrollPosition();
   ```

2. `flushSync(() => onWillExpand?.(id))` — forces the parent's single-expand state and the previously-expanded sibling's `useLayoutEffect[closeSignal]` (note: `useLayoutEffect`, not `useEffect`) to commit synchronously. By the end of this block the sibling's article has shrunk, its `[data-fpc-eh]` markers are gone, and its gallery has unmounted — but no paint has happened yet.

3. Re-anchor — the wrapper's `translateY` hasn't moved, so this article jumped *up* in the viewport when the sibling collapsed. Jump scroll instantly to compensate:
   ```js
   const articleTopPost = article.getBoundingClientRect().top;
   const collapseDelta = articleTopPre - articleTopPost;
   scrollTo(Math.max(0, scrollPre - collapseDelta), { instant: true });
   ```

4. *Now* capture FIRST rects on the preview imgs. They're at exactly the viewport positions the user clicked on, so the morph starts where the eye was.

5. Pin our height, `setPhase('animating-open')`, continue with the existing FLIP setup.

The smooth-scroll target inside `useLayoutEffect[animating-open]` is then just `articleTop + currentScroll` — no sibling-delta correction, since `flushSync` already collapsed any sibling above. The motion is a small local scroll from the click position to viewport top.

**Why `useLayoutEffect` for `closeSignal`:** `flushSync` flushes layout effects synchronously; it does **not** flush passive (`useEffect`) effects. Moving the close-on-signal handler into `useLayoutEffect` is what lets the sibling's full collapse — including its `useLayoutEffect[collapsed]` style/data-attr cleanup — finish inside the `flushSync` boundary.

**Why `setScrollY` on instant `scrollTo`:** the `SmoothScrollContext.scrollTo({ instant: true })` path now also fires `setScrollY` and broadcasts to `scrollListenersRef`, so scroll-aware components (like the gallery header pin) recompute their anchor immediately rather than against a stale value.

## Header Pin

Two paths, dispatched by viewport width:

**Mobile (< 1024 px):** the page scrolls natively, so we use plain CSS `position: sticky; top: 0` on the `<header>`. The browser updates its position in lockstep with paint. Running JS here would chase passive `scroll` events, which fire AFTER the browser has already painted the new scroll position — every tick the header would drift one frame and snap back, visible as a tremble while scrolling. The sticky-with-bottom-stop release is what `position: sticky` does natively (the header stops sticking once its containing block's bottom is reached).

**Desktop (≥ 1024 px):** `SmoothScrollContext` sets `body { overflow: hidden }` and translates content via CSS transform — no real scrolling ancestor for sticky to attach to. `ExpandedPhotoGallery` instead subscribes to `addScrollListener` (called inside the smooth-scroll rAF, BEFORE paint) and applies a `translate3d(0, …, 0)` to the header that exactly cancels the wrapper's `translateY(-scrollY)` whenever the header's natural document-space top would otherwise scroll above viewport top:

```js
useLayoutEffect(() => {
  if (!pinHeader) return;
  if (!isDesktop) return;                                       // mobile uses sticky
  const header = headerRef.current;
  header.style.transform = '';                                  // measure clean
  const initialScroll = getScrollPosition();
  const headerDocTop = header.getBoundingClientRect().top + initialScroll;
  const apply = (scrollY) => {
    const visualTop = headerDocTop - scrollY;
    if (visualTop >= 0) { header.style.transform = ''; return; }
    const articleBottomVisual = article.getBoundingClientRect().bottom;
    const headerBottomLimit = articleBottomVisual - RELEASE_MARGIN_PX;
    const desiredHeaderTop = Math.min(0, headerBottomLimit - header.offsetHeight);
    header.style.transform = `translate3d(0, ${desiredHeaderTop - visualTop}px, 0)`;
  };
  apply(initialScroll);
  return addScrollListener(apply);
}, [pinHeader, isDesktop, ...]);
```

Header className: `sticky top-0 lg:relative lg:top-auto z-10 bg-white …`. At lg+ the `lg:relative` override drops it back to relative so the desktop JS pin's `transform` writes don't fight sticky's own positioning. `bg-white z-10` keeps masonry photos that scroll under it from showing through. The pin engages for the entire non-collapsed lifecycle — during `'animating-open'` the header would otherwise scroll past and then snap back when the pin activated at transitionend.

### Article clip: `clip-path: inset(0)`, not `overflow: hidden`

During `'animating-open'` and `'animating-close'` the article must clip its overflow so (a) the morph imgs don't escape the growing/shrinking box and (b) the close-path overlay can sit at `translateY(-100%)` invisibly above the article before sliding down. We use `clip-path: inset(0)` — not `overflow: hidden` — because `overflow: hidden` would make the article a sticky scroll-ancestor on mobile, instantly re-anchoring the sticky header from the viewport to the article (popping it off-screen if the user is scrolled deep into the gallery) the moment close starts, before the gallery's 200 ms opacity fade can mask it. `clip-path` produces the same visual clipping without affecting sticky's scroll-ancestor calculation.

## `[data-fpc-eh]` / `[data-fpc-ch]` markers

Set during `useLayoutEffect[animating-open]`, deleted in `useLayoutEffect[collapsed]`. With the anchored-open flow they are no longer used to correct the smooth-scroll target (that's superseded by the `flushSync` re-anchor described above). They remain purely as a single-expand sentinel — `document.querySelectorAll('[data-fpc-eh]')` returning anything other than the new card itself, after `flushSync`, would mean the previous card failed to clean up. Useful for debugging.

## Click Areas

| Region | Phase | Behavior |
|---|---|---|
| Article whitespace | `collapsed` | `handleArticleClick` → `handleOpen` |
| Article whitespace | `expanded`  | `handleArticleClick` → `handleClose` |
| Collage img       | `collapsed` | `pointer-events: none` — falls through to article |
| Title / meta / desc text | `collapsed` | bubbles to article → `handleOpen` (entire card is clickable) |
| Gallery img       | `expanded`  | `stopPropagation` + `onPhotoClick(project, idx)` → Lightbox |
| Header (title / meta / description) | `expanded` | bubbles to article → `handleClose` (the pinned header is the primary collapse affordance once expanded; `cursor-pointer` advertises this) |
| Close X strip     | `expanded`  | `handleClose` |

## Scroll Lock During Animation

While `phase` is `'animating-open'` or `'animating-close'`, a `useEffect` keyed on `phase` disables *user* scrolling so a manual scroll — or an inertial fling on mobile — cannot fight the programmatic open/close scroll (and cannot land mid-handoff, flickering the collapsing sibling back into view). `setScrollLocked(true)` gates the desktop smooth-scroll's wheel/key handlers; a `touchmove` listener (`{ passive: false }`, `preventDefault`) covers mobile native scroll. Programmatic `scrollTo` is unaffected by either. Keyed on `phase` (not a transition event), so the unlock cleanup always runs.

## Reduced Motion

`window.matchMedia('(prefers-reduced-motion: reduce)').matches` short-circuits `handleOpen` / `handleClose` to instant phase flips with no transforms or transitions. The global `prefers-reduced-motion: reduce` rule in `index.css` already disables CSS animations site-wide; the only thing the JS needs to skip is the FLIP transform writes, which it does.

## Constraints / Reuse

- **Easing parity with films:** keep `cubic-bezier(0.4, 0, 0.2, 1)` and the `1200 / 600` open/close split.
- **`SmoothScrollContext`:** `scrollTo` + `getScrollPosition` only. `addScrollListener` is unused here (the cross-fade-on-scroll from doc 04 is film-card-specific).
- **Lightbox:** unchanged. `Photos.jsx`'s existing `useEffect` resets `lightbox` when `expandedProjectId` changes.
- **Background warm-up:** the existing `Photos.jsx` warm-up that fetches all featured-project photos shortly after page mount means the gallery imgs are already in browser cache by the time a user clicks, so the morph and the staggered fade-in don't fight an in-flight network request.

## Verification

Visual (manual):
1. `npm run dev`, open `/photos` on desktop. Click a featured card. Each preview photo should glide from its collage cell into its gallery cell with no visible jump. Other gallery cells fade in with a small stagger over the same window.
2. Click another featured card while one is expanded. The first closes (no morph, fast fade + shutter); the second opens; final scroll lands with the new gallery centered.
3. Click the X (or any whitespace) on an expanded card. Gallery fades, height collapses, collage reappears at t≈600ms.
4. Click a gallery image — Lightbox opens. Close it — gallery still expanded.
5. Mobile viewport (DevTools 375×812). Same flows; height shutter via native scroll. Gallery becomes single-column.
6. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Card opens instantly, no transforms / transitions.
7. `npm run build` — no new dependencies; bundle delta ≈ size of the three new files only.

Automated:
- `npx playwright test --project=chromium` — both `homepage.spec.js` and `featured-photo-cards.spec.js` must stay green. Note: tests use `locator.dispatchEvent('click')` because the custom desktop smooth-scroll defeats Playwright's native `scrollIntoView` actionability check.

## Known Issues

See frontmatter `known_issues`.
