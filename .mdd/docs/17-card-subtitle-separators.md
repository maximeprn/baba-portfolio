---
id: 17-card-subtitle-separators
title: Card Subtitle — Adaptive Dot Separators
edition: BABA Portfolio
depends_on:
  - 02-design-system
  - 03-collapsed-film-cards
  - 05-featured-photo-cards
  - 06-collapsed-photo-cards
  - 09-cms-photo-projects
  - 10-cms-films
source_files:
  - src/components/ui/CardSubtitle.jsx
  - src/components/films/FeaturedFilmCard.jsx
  - src/components/films/CollapsedFilmCard.jsx
  - src/components/photos/FeaturedPhotoCard.jsx
  - src/components/photos/CollapsedPhotoCard.jsx
  - src/components/photos/ExpandedPhotoGallery.jsx
routes: []
models:
  - film
  - photoProject
test_files: []
known_issues: []
---

# 17 — Card Subtitle: Adaptive Dot Separators

## Purpose

Film and photo cards show a metadata subtitle built from CMS fields
(`year`, `client`, `category`) joined with a `•` dot separator. All of
`year`, `client`, and `category` are **optional** in Sanity, but the card
markup previously hard-coded every separator. Leaving a field blank in
the Studio produced broken output — a leading dot, a trailing dot, or a
doubled `• •` with nothing between.

This feature makes the separator count follow the data: dots sit **only
between fields that are actually filled**.

## Architecture

A single presentational component, `CardSubtitle`
([src/components/ui/CardSubtitle.jsx](../../src/components/ui/CardSubtitle.jsx)),
owns the logic. It takes a `parts` array and a `separator` node, drops the
empty parts, and interleaves the separator between the survivors. It
renders inline content only — each caller keeps its own wrapping element
and typography classes.

Two separator styles exist in the codebase and both are passed in by the
caller, so `CardSubtitle` stays style-agnostic:

| Card family | Wrapper | `separator` prop |
|---|---|---|
| Collapsed (film + photo) | styled `<span>` with `whitespace-pre-wrap` | the plain string `"  •  "` (spaces preserved as text) |
| Featured / expanded (film, photo, gallery) | `<div>` | `<span className="mx-3">•</span>` |

## Data Model

No schema change. Consumes existing optional fields on `film` and
`photoProject`:
- `year` — number, optional
- `client` — string, optional
- `category` — string, optional

Collapsed cards render `[year, category]`; featured / expanded cards
render `[year, client, category]`.

## Business Rules

- A part is **empty** when it is `null`, `undefined`, `''`, or — for
  strings — whitespace-only (trimmed before the check). Numbers pass
  through untrimmed, so `year` is never mangled.
- Separator count = `max(0, filledCount - 1)`:
  - 3 filled → 2 dots
  - 2 filled → 1 dot
  - 1 filled → 0 dots
  - 0 filled → component returns `null` (empty subtitle wrapper)
- Field **order** is preserved; only empties are removed. Dropping
  `client` from `[year, client, category]` yields `year • category`.

## Dependencies

- Card layouts and hover chips come from docs 03 / 05 / 06 — this feature
  only swaps the inner subtitle expression, no layout change.
- Field optionality is defined by the CMS schemas (docs 09 / 10).

## Known Issues

None.
