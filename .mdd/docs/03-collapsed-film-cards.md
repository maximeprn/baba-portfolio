---
id: 03-collapsed-film-cards
title: Collapsed Film Cards — Shutter Expand/Collapse with Single-Expand Enforcement
edition: BABA
depends_on: [02-design-system]
source_files:
  - src/components/films/CollapsedFilmCard.jsx
  - src/components/films/FeaturedFilmCard.jsx
  - src/pages/Films.jsx
test_files: []
known_issues:
  - "Rapid back-to-back clicks across cards leave A's open animation in flight when B is clicked; A's close is queued via pendingCloseRef until A reaches 'expanded'. Acceptable steady-state but not optimized."
  - "When the auto-close target (A) is below the newly-clicked card (B) in document order, no scroll adjustment is made (correct), but the smooth-scroll glide may still feel slightly off on very tall expanded layouts due to non-A page reflow."
  - "On touch devices, the X close indicator is always visible (no hover-reveal). Users tap the X or anywhere on the expanded card's whitespace to close — affordance is implicit."
---

# 03 — Collapsed Film Cards: Shutter Expand/Collapse

## Purpose

The **Other Projects** section on the Films page lists secondary film entries as compact one-line bands. Clicking a band expands it into a full `FeaturedFilmCard` view via a 1200ms shutter animation and re-centers the viewport on the video. A small X indicator at the bottom of the expanded view (revealed on hover) plus any whitespace click triggers the inverse 600ms close. Only one card may be expanded at a time — opening a second card causes the first to auto-close in parallel, with the new card's scroll target precomputed so it lands centered when both animations settle.

## Architecture

```
Films.jsx
  ├─ state: expandedCollapsedId        ← which card is currently expanded (or null)
  ├─ state: closeSignals { id: count } ← bumping a card's count auto-closes it
  ├─ handleCollapsedWillExpand(id)     ← fires on click; bumps prev's signal, sets expanded id
  └─ handleCollapsedDidCollapse(id)    ← fires when a card lands in 'collapsed'; clears expanded id

CollapsedFilmCard.jsx (per-instance state machine)
  phase: 'collapsed' → 'animating' → 'expanded' → 'closing' → 'collapsed'
  ├─ handleOpen      ← entry from collapsed; computes target height + scroll, starts shutter open
  ├─ handleClose     ← entry from expanded; starts reverse shutter
  ├─ handleTransitionEnd  ← terminal-state flip; drains pendingCloseRef if a close was queued mid-open
  └─ useLayoutEffect[phase]  ← cleans up inline style.height / data-* attrs in same paint as React commit
```

Each `CollapsedFilmCard` owns its own animation state. The parent (`Films.jsx`) orchestrates **only** which card is "the" expanded one and signals others to close — it does not control the animation itself.

## State Machine

| Phase | Meaning | DOM state |
|---|---|---|
| `'collapsed'` | Idle single-row band | Article `md:h-9` (36px desktop), overflow:hidden. Overlay rendered as the visible row. `contentRef` is `position:absolute top-0 left-0 right-0` + `visibility:hidden` (no pixels rendered) |
| `'animating'` | Open in progress | Article inline `style.height` transitioning collapsed→target with `OPEN_TRANSITION` (1200ms). Overlay sliding up + fading out (500ms). `contentRef` becomes visible and in-flow |
| `'expanded'` | Stable expanded view | Article `style.height = 'auto'`. Overlay unmounted. Close indicator (a 12px X svg, no text label) sits at the bottom of `contentRef`. Article also gets the `group` class for hover-reveal of the X. |
| `'closing'` | Close in progress | Article transitioning expanded→collapsed with `CLOSE_TRANSITION` (600ms). Overlay re-mounts at `translateY(-100%)` opacity 0; cross-fades in over the **last 500ms** of the close so it lands fully visible exactly when the height transition ends |

## Animation Constants (`CollapsedFilmCard.jsx` top of file)

```js
const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600; // 2× faster than open — snappy dismissal.
const OPEN_TRANSITION   = `height ${OPEN_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
const CLOSE_TRANSITION  = `height ${CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
const OVERLAY_TRANSITION_MS   = 500;
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS); // = 100ms
```

Both directions share the same `cubic-bezier(0.4, 0, 0.2, 1)` curve. The asymmetric duration (open is deliberate, close is snappy) is intentional UX.

## Business Rules

### Open path (`handleOpen`)

1. Guard: only fires if `phase === 'collapsed'` and `isAnimatingRef.current === false`.
2. Calls `onWillExpand?.(film.id)` so the parent can auto-close any other expanded card.
3. Measures `content.scrollHeight` and `container.offsetHeight` for target/start heights.
4. Publishes `data-cfc-eh` (expanded height) and `data-cfc-ch` (collapsed height) on the article — siblings opening later use these to correct their scroll targets.
5. Sets phase `'animating'`, schedules a rAF for the snap-trick.
6. Inside the rAF:
   - Snap-trick: sets `style.height = targetHeight`, forces reflow, measures the video's `getBoundingClientRect()` to compute the scroll target.
   - **Sibling-delta correction:** sums `(expH − colH)` for any sibling with `data-cfc-eh` whose viewport top is above ours. Subtracts that sum from `targetScroll` so smooth-scroll glides directly to the post-collapse-of-other-cards centered position.
   - Calls `scrollTo(targetScroll, { ease: 0.05 })`.
   - Snaps back to `collapsedHeight`, sets `transition = OPEN_TRANSITION`, sets `style.height = targetHeight` to start the actual open animation.
7. `handleTransitionEnd` fires when the height transition completes; phase goes to `'expanded'`. If `pendingCloseRef.current` was set (because a close was requested mid-open), `handleClose` is fired in the next rAF.

### Close path (`handleClose`)

1. Guard: only fires if `phase === 'expanded'` and `isAnimatingRef.current === false`.
2. Reads `expandedHeight = container.offsetHeight`. Target = `collapsedHeightRef.current` (saved during open) with desktop fallback of 36px (`md:h-9`).
3. Sets phase `'closing'`, schedules a rAF that flips the transition to `CLOSE_TRANSITION` and `style.height = targetHeight`.
4. A separate `useEffect` keyed on phase schedules a `setTimeout(setClosingOverlayVisible(true), OVERLAY_REVEAL_DELAY_MS)` so the collapsed-text overlay slides in (translateY(-100%) → 0, opacity 0 → 1, 500ms ease-out) over the **tail** of the close window — landing at full opacity exactly at t=600ms when the height transition ends.
5. `handleTransitionEnd` flips phase to `'collapsed'` and clears the inline height in the `useLayoutEffect` (which runs in the same paint frame as React's commit, preventing one-frame layout flashes).

### Reduced motion

`window.matchMedia('(prefers-reduced-motion: reduce)').matches` short-circuits both paths to instant phase flips with no animation. Overlay state still resets correctly.

### Single-expand enforcement (parent `Films.jsx`)

When any card calls `onWillExpand(id)`:

```jsx
const handleCollapsedWillExpand = (id) => {
  setExpandedCollapsedId((prev) => {
    if (prev !== null && prev !== id) {
      // Bump the previous card's closeSignal counter — that card watches its own
      // closeSignal prop in a useEffect and calls handleClose when the value changes.
      setCloseSignals((sigs) => ({ ...sigs, [prev]: (sigs[prev] || 0) + 1 }));
    }
    return id;
  });
};
```

When a card's close signal arrives **mid-open** (phase `'animating'`), the close is queued via `pendingCloseRef.current = true` and fired automatically on transition-end so the card never strands in a half-open state.

When a card lands in `'collapsed'` it fires `onDidCollapse(id)`. The parent clears `expandedCollapsedId` only if the closing card matches.

### Centering math (sibling-delta)

Without correction: when card B is clicked while card A is expanded above, `handleOpen`'s scroll target is computed against a layout where A is still expanded. After A's close completes, A has shrunk by `Δ = expandedHeight − collapsedHeight` and B's video sits Δ pixels above viewport center.

With correction: the data-attribute pair `data-cfc-eh` / `data-cfc-ch` published during `handleOpen` exposes each in-flight card's heights. B's rAF queries `[data-cfc-eh]` siblings, sums Δ for those positioned above (`siblingTop < containerTop`), and subtracts from `targetScroll`. Smooth-scroll glides directly to the post-collapse centered position — no two-phase scroll, A's close animation untouched.

### Click areas (when expanded)

| Region | Behavior |
|---|---|
| Video tile (FeaturedFilmCard) | Opens FilmModal — `stopPropagation` prevents the article-level close handler from firing |
| Title (`<h3>`) | Opens FilmModal — `stopPropagation` |
| Text column (description, metadata) | Inert — `onClick={e => e.stopPropagation()}` so reading text doesn't collapse |
| Close indicator strip (X + Collapse label area) | Closes via `handleClose` |
| Anywhere else on the article | Closes via the article's `onClick={handleArticleClick}` |

### Hover affordances (desktop, `(hover: hover)`)

| Surface | Hover behavior |
|---|---|
| Collapsed band | The outer overlay carries `group/row`. Each of the three text elements (title, first sentence, year • category) is wrapped in its own `<span>` carrying `group-hover/row:bg-gray-900 group-hover/row:text-white` — so on hover the band shows **three separate black-on-white pills**, not a single band-wide invert. Trigger is band-wide; visual is per-element. |
| Inner flex (collapsed) | 16px horizontal padding (`px-4`) so the chips breathe inside the band |
| Expanded card (article) | Class `group` is added — used to gate the X icon's reveal |
| X svg | `md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300` — invisible by default, fades in on article hover |
| Indicator strip | Currently the strip itself is the click target with the X icon centered; the standalone "Collapse" label has been removed from the implementation |

### Description first sentence

The middle column on the collapsed band uses a regex slice: `description.match(/^[^.!?]+[.!?]/)?.[0] || description`. Falls back to the full string if no terminator exists. Replaces the prior "first 5 words + …" cut.

### Symmetric padding

`contentRef` carries an unconditional `pt-[52px]`. The 52px equals the close-indicator stack (`pt-2` 8 + 12px X + `pb-8` 32). Net effect: top space above the video matches the bottom space the X indicator carves out. Because the padding lives on `contentRef`, it's part of `content.scrollHeight` from the very first measurement — no end-of-animation snap.

### Subpixel-leak fix on collapsed `contentRef`

`contentRef` while `phase === 'collapsed'` carries `invisible` (`visibility: hidden`). The article clips at 36px, but the underlying FeaturedFilmCard's video edge sits at y=32 inside contentRef. Without `invisible`, a 1px subpixel leak under the smooth-scroll transform could expose the video edge below the band. `visibility: hidden` keeps `scrollHeight` valid for measurement while suppressing all painting under the article.

## Layout & Spacing

- Article: `w-full bg-white relative`. Adds `cursor-pointer md:h-9` when collapsed; `cursor-pointer group` when expanded.
- Article overflow: `'hidden'` while non-expanded, undefined while expanded (so the article can size to `auto` content).
- Overlay (the visible collapsed row): `relative md:absolute top-0 left-0 right-0 bg-white z-10`. Inner flex: `flex-col md:flex-row md:items-center gap-2 md:gap-6 px-4 py-2 md:py-0 md:h-9`.
- Hover invert is on the **outer overlay** (so the entire band inverts uniformly, not just the inner text).

## Dependencies

- **02-design-system** — relies on the documented motion tokens, `cubic-bezier(0.4, 0, 0.2, 1)` shutter curve, and the strict B&W palette for the hover invert.
- **`SmoothScrollContext`** (`src/context/SmoothScrollContext.jsx`) — `scrollTo({ ease })` and `getScrollPosition()` drive the open scroll-to-center and the sibling-delta-corrected variant.
- **`FeaturedFilmCard`** — rendered as the expanded body. The `handleClick` (video) and the text-column wrapper both `stopPropagation` so the enclosing CollapsedFilmCard's close handler doesn't fire on internal interactions.

## Known Issues

See frontmatter `known_issues`.
