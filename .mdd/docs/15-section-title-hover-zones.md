---
id: 15-section-title-hover-zones
title: Section Title — Hover & Click Behavior
edition: BABA Portfolio
depends_on:
  - 02-design-system
  - 04-featured-card-fade-on-scroll
  - 05-featured-photo-cards
  - 07-cms-foundation
source_files:
  - src/components/films/FeaturedFilmCard.jsx
  - src/components/photos/FeaturedPhotoCard.jsx
  - sanity/schemas/siteSettings.js
  - src/sanity/loader.js
routes: []
models:
  - siteSettings
test_files:
  - tests/e2e/section-title-hover.spec.js
known_issues: []
---

# 15 — Section Title: Hover & Click Behavior

## Purpose

On the featured film and photo sections, the title's black/white invert
(black background, white text) previously activated **only** while the
pointer was directly over the title text — a hit area so small the hover
affordance was easy to miss.

This feature widens the trigger to the **whole section**: the title
reacts whenever the pointer is anywhere within the card — the thumbnail
(video/photo), the text block, or the surrounding padding — and clears
when the pointer leaves the card.

Two Sanity site settings tune the behavior:
- **Title hover effect** (`featuredTitleHoverEffect`, default
  *Highlight*) — *Highlight* (value: `'invert'`; the schema title is
  "Highlight (black background)", `siteSettings.js:157`) inverts the
  title to a black background with white text; *Grow* enlarges it and
  makes it bolder, like the active nav link.
- **Highlight title when hovering the whole section**
  (`featuredTitleHoverWholeSection`, default on) — scopes the trigger to
  the whole card, or back to the title text only.

A related change: the **whole `FeaturedFilmCard` section is now
click-to-open** (opens the film modal). Previously only the title and the
video were clickable; the metadata, description, and padding were inert.

Scope: the **featured** sections only (`FeaturedFilmCard`,
`FeaturedPhotoCard`). The thin collapsed "Other Projects" bands
(`CollapsedFilmCard`, `CollapsedPhotoCard`) are intentionally untouched.

## Architecture

The old behavior used Tailwind `group`/`group-hover` scoped to the title
`<h3>`, so only the title glyphs triggered the invert.

Each card now owns a single `titleHovered` React state, driven by
**bubbling** `mouseover` / `mouseout` listeners on the section's outer
`<article>`:

```
        <article onMouseOver / onMouseOut>      ← one listener pair
          │
          └── any descendant hovered  →  the whole section's title inverts
```

- `mouseover` bubbles to the `<article>` from any descendant → the
  pointer is somewhere in the section → `setTitleHovered(true)`.
- `mouseout` bubbles to the `<article>`; the state is dropped **only**
  when `event.relatedTarget` (the element the pointer is moving to) is
  outside the `<article>`. This `relatedTarget` guard keeps the state
  stable across the many inner element boundaries — it flips off exactly
  once, when the pointer truly leaves the card.
- `mouseenter`/`mouseleave` are **not** used — React synthesizes those
  from `mouseover`/`mouseout` anyway, and the bubbling pair is what the
  E2E test dispatches directly.

A plain Tailwind `group` on the `<article>` would express the same
"whole section" hover in pure CSS. The JS state is kept because it also
exposes `data-title-hovered="true|false"` on the `<article>` — which lets
the E2E test assert the behavior with dispatched (non-pointer) events,
where a CSS `:hover` pseudo-class could not be driven.

`titleHovered` is reflected onto the title `<span>` as
`bg-gray-900 text-white` (the design-system B&W invert).

### CMS toggles

Two `siteSettings` fields (resolved by `src/sanity/loader.js`, read at
build time) tune the behavior:

- **`featuredTitleHoverWholeSection`** (boolean, default `true`):
  - *On* — the whole-section JS path above.
  - *Off* — the `mouseover`/`mouseout` listeners are not attached and the
    effect is driven by a plain CSS `:hover` on the title element itself.
- **`featuredTitleHoverEffect`** (`'invert'` | `'grow'`, default
  `'invert'`):
  - *Highlight* — the title `<span>` gets `bg-gray-900 text-white` (the
    B&W chip).
  - *Grow* — the title `<h3>` gets `scale-[1.125] font-semibold` with
    `origin-left transition-transform` — a smooth scale + weight bump,
    matching the 18/16 px size ratio of the active nav link.

Each component resolves the two settings + the `titleHovered` state into
a `titleH3Class` (grow) and a `titleSpanClass` (invert), then applies
them to the title `<h3>` and its inner `<span>`. The `invert` effect
lives on the `<span>` so `box-decoration-clone` keeps the chip on every
wrapped line; the `grow` transform lives on the block-level `<h3>` (CSS
transforms don't apply to an inline `<span>`) and is left-anchored so the
title grows rightward, not from its centre.

## Data Model

Two new fields on the **`siteSettings`** singleton (a new **Display**
group/tab in the Studio):

| Field | Type | Default | Purpose |
|---|---|---|---|
| `featuredTitleHoverEffect` | `string` (`invert` \| `grow`) | `invert` | Hover visual: *Highlight* (`invert`) = B&W chip; *Grow* (`grow`) = bigger + bolder. |
| `featuredTitleHoverWholeSection` | `boolean` | `true` | On → hovering anywhere in a featured section reacts. Off → only the title text does. |

They ride the existing build-time CMS pipeline (doc 07): `siteSettings`
is fetched whole into `cms.json`, so no GROQ projection change is needed.
`src/sanity/loader.js` carries the same defaults in
`FALLBACK_SITE_SETTINGS` for snapshots taken before the fields existed.

## API Endpoints

N/A.

## Business Rules

- **Trigger area:** the entire section `<article>` — `FeaturedFilmCard`'s
  `film-card` article and `FeaturedPhotoCard`'s outer article. Hovering
  any part of it (thumbnail, title, metadata, description, padding, flex
  gaps) restyles the title.
- **Clears on leave:** the hover styling turns off once the pointer
  leaves the `<article>` — i.e. a `mouseout` whose `relatedTarget` is
  outside the card (or `null`).
- **Only the title reacts.** Hovering anywhere in the section restyles
  the **title** only — the thumbnail, metadata and description never get
  the hover treatment themselves.
- **Both titles track one state** (`FeaturedFilmCard`): the phone title
  (above the video) and the desktop title (in the text column) both read
  the same `titleHovered`; only one is visible per breakpoint.
- **Highlight visual:** `bg-gray-900` + `text-white` on the title `<span>`,
  with `transition-colors duration-150` (the design-system fast token)
  and `box-decoration-clone` so a wrapped title keeps the band on every
  line. Unchanged from the previous implementation.
- **Photo card phase reset:** `FeaturedPhotoCard` clears `titleHovered`
  on every transition out of the `'collapsed'` phase, so the title can't
  re-appear inverted when the card later collapses back under a
  stationary pointer.
- **Pointer-only:** the invert is a hover affordance; touch devices and
  keyboard focus do not trigger it (unchanged — parity with the previous
  `:hover` implementation).
- **Reduced motion:** the global `prefers-reduced-motion` rule in
  `index.css` already neutralizes the 150ms color transition; the invert
  still applies, just instantly.
- **CMS toggles (build-time):** `featuredTitleHoverEffect`
  (`invert` | `grow`) picks the visual; `featuredTitleHoverWholeSection`
  (boolean) picks the trigger zone. Both are read from `cms.json`, so
  changing either requires a redeploy.
- **Grow effect:** scales the title `<h3>` to `1.125×` and bumps it to
  `font-semibold`, `origin-left` (grows rightward) over a 150 ms
  `transition-transform`. No layout reflow — the transform doesn't push
  surrounding content.
- **Whole-section click (film cards):** clicking anywhere in a
  `FeaturedFilmCard` — including the metadata, description, and padding
  that were previously inert — opens the film modal. The article's
  `onClick` (`handleClick`) `stopPropagation`s, so an enclosing expanded
  `CollapsedFilmCard` is not collapsed by the same click.
  `FeaturedPhotoCard` was already whole-section click-to-expand.

## Dependencies

- **02-design-system** — the black-on-white hover-invert palette
  (`bg-gray-900` / `text-white`) and the `--transition-fast` (150ms)
  motion token.
- **04-featured-card-fade-on-scroll** — shares `FeaturedFilmCard`'s outer
  `<article>` (`wrapperRef`). The new `onMouseOver`/`onMouseOut` handlers
  attach to that same element; the scroll-fade writes `style.opacity` and
  is independent — no conflict.
- **05-featured-photo-cards** — `FeaturedPhotoCard`'s phase machine. The
  hover state is only meaningful in the `'collapsed'` phase and is reset
  on every other phase.
- **03-collapsed-film-cards** — `FeaturedFilmCard` is also rendered
  inside an expanded `CollapsedFilmCard`. The widened hover applies there
  too (the expanded body is a featured section); the collapsed band's own
  `group/row` hover is a separate, untouched mechanism.

## Constraints (do not change)

- The collapsed bands (`CollapsedFilmCard`, `CollapsedPhotoCard`) keep
  their existing whole-band `group/row` hover. Out of scope.
- The Highlight visual (black bg / white text / 150ms) is unchanged —
  only the **trigger area** changes.
- `FeaturedPhotoCard`'s expand/collapse click handling, and the collapsed
  bands' click behavior, are unchanged.

## Verification

Manual:
1. `npm run dev`, desktop. On a featured film/photo section, move the
   pointer anywhere over the card — the thumbnail, the title, the
   metadata/description, the surrounding padding — the title inverts in
   every case.
2. Move the pointer off the card → the title returns to normal.
3. Hover an adjacent section → only that section's title inverts; each
   card is independent.
4. Click the metadata / description / padding of a featured film section
   → the film modal opens (the whole film section is click-to-open).
5. In Sanity Studio → Site settings → Display, switch **Title hover
   effect** to *Grow* and/or turn **Highlight title when hovering the
   whole section** off; redeploy and confirm the title grows + bolds (or
   only reacts on direct title hover) accordingly.

Automated:
- `tests/e2e/section-title-hover.spec.js` — covers the default
  (toggle-on) whole-section hover via dispatched `mouseover`/`mouseout`
  on both `/` and `/photos`, and asserts that clicking a featured film
  section's padding opens the film modal. The toggle-off mode is
  build-time config and is verified manually.

## Known Issues

(empty for new feature — to be populated by future audits)
