# MDD Audit Report — 2026-06-12 — Sanity Studio UI/UX

**Scope:** the `/admin` editing experience (Sanity Studio v4) — desk structure, schema-driven form UX, list previews, custom Deploy tool, plugin surface.
**Lens:** Basile (non-technical editor) is the primary user; Maxime is the secondary "advanced knobs" user.
**Status:** PROPOSAL ONLY — no fixes applied (per request).

## Executive summary

The Studio is in good shape structurally: singletons are pinned and protected, collections are drag-orderable, field descriptions are written in plain language, and advanced knobs are tucked behind collapsed fieldsets/groups. The weaknesses are all *editor-experience* gaps, and they cluster into three themes:

1. **Scannability** — the document lists don't tell Basile what's live: most films show no thumbnail (preview only reads the rarely-used override field), and hidden (`visible: false`) content looks identical to live content.
2. **Workflow confidence** — the publish→deploy gap is invisible. The Deploy tool forgets its state on reload and gives no "you have undeployed changes" signal, which is the single most likely source of "I changed it but the site didn't update" confusion.
3. **Guardrails** — the photoProject layout knobs (pattern 0–15 + index arrays) can be set to combinations that silently break the live site; the constraints exist only as prose.

No finding is data-destructive or security-relevant. Everything is schema/config-level — **no content migration is required by any proposed fix.**

## Findings by severity

### HIGH (daily-friction, fix first)

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| H1 | Films & Photo projects listed *below* 4 set-and-forget singletons in the sidebar | `sanity/desk/structure.js` | Collections first; singletons under a divider (optionally a "Site setup" sub-list) |
| H2 | Film list rows show blank thumbnails on the recommended (Mux auto-poster) path — preview reads only the `thumbnail` *override* | `sanity/schemas/film.js` preview | Fall back to Mux poster: select `videoMux.asset.playbackId`, render `image.mux.com/<id>/thumbnail.jpg` as preview media |
| H3 | `visible: false` films/projects are indistinguishable from live ones in lists | `film.js` + `photoProject.js` previews | Add `visible` to preview select; subtitle prefix "🚫 Hidden" |
| H4 | Publish→deploy gap invisible: `lastDeployedAt` lost on reload, no link to Vercel, no "undeployed changes" signal | `sanity/tools/DeployTool.jsx` | Persist timestamp in localStorage; link success msg to Vercel deployments; query Sanity for docs `_updatedAt > lastDeploy` → "N documents changed since last deploy" banner |

### MEDIUM

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| M1 | `previewPattern` is a magic number 0–15; slot-count/index constraints are prose-only and violations break the live layout silently | `photoProject.js` | Options list with descriptive pattern names (from `PhotoCardPreview.PATTERNS`); custom validation: indices length === pattern slot count, every index < photos.length (desktop + mobile pairs) |
| M2 | Vision (GROQ playground) ships to the production editor — confusing dev tool tab | `sanity.config.js` | Include `visionTool()` only when `import.meta.env.DEV` |
| M3 | Legacy `videoFile` field still visible on Showreel; Mux migration is confirmed done (cms.json `status: ready`) | `showreel.js` | `hidden: true` now; delete field after a deprecation window |
| M4 | No media-library plugin for a photography-heavy site (no asset search/tags/usage) | `sanity.config.js` | Add `sanity-plugin-media` (drop-in, no schema change) |
| M5 | Film w/ neither `videoMux` nor `videoUrl` gets no warning — card has nothing to play | `film.js` | Document-level `warning()` validation |
| M6 | Credits left/right via per-row radio forces mental column simulation | `film.js` | Keep flat shape (runtime already adapts); accept as workable — or split into two arrays later (needs migration; NOT recommended now) |

### LOW (polish)

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| L1 | Emojis baked into desk `.title()` strings instead of `.icon()` | `structure.js` | Use `.icon(() => '…')` |
| L2 | heroOverlay item subtitle shows raw values (`top-left · body · md`) | `heroOverlay.js` | Humanize to input-label vocabulary ("Top left · Normal · Medium") |
| L3 | Anchor picker is spatially blind (dropdown only) | `heroOverlay.js` | Custom 2×3 mini-map input component (nice-to-have) |
| L4 | `aspectRatio` override wants a decimal (1.78), editors think "16:9" | `film.js` | Options list of named ratios + free entry |
| L5 | No check `navLinkActiveSize ≥ navLinkSize` | `siteSettings.js` | Cross-field `warning()` rule |
| L6 | `seoKeywords` is a dead SEO signal inviting wasted effort | `siteSettings.js` | Remove, or annotate as legacy/optional |
| L7 | `previewAspectRatio`/`previewMaxHeight` free CSS strings, typos silently ignored | `photoProject.js` | Regex `warning()` validation |
| L8 | Document-level `description` on heroOverlay/showreel types never renders in Studio v4 | `heroOverlay.js`, `showreel.js` | Move guidance into a rendered field description |
| L9 | Studio is English-only; Basile is French | all schemas | **Open question** — localize labels/descriptions to French if he'd prefer |
| L10 | film/photoProject layout paradigms differ (fieldsets vs tab groups) | `film.js` | Optionally move film to groups (Content / Advanced) to match photoProject |

## Feature completeness matrix

| Studio surface | State | Gaps |
|---|---|---|
| Desk structure | ✅ working | ordering (H1), icons (L1) |
| film authoring | ✅ working | list preview (H2, H3), validation (M5), polish (L4, L10, M6) |
| photoProject authoring | ✅ working | list preview (H3), layout-knob guardrails (M1, L7) |
| heroOverlay authoring | ✅ working | preview polish (L2), spatial picker (L3), dead description (L8) |
| siteSettings | ✅ working | L5, L6 |
| showreel | ✅ working | legacy field cleanup (M3, L8) |
| heroPhotos | ✅ working | — (cleanest schema of the set) |
| Deploy workflow | ⚠️ functional but opaque | state persistence + undeployed-changes signal (H4) |
| Asset management | ⚠️ default only | media plugin (M4) |
| Tools surface | ⚠️ | Vision in prod (M2) |

## Proposed fix plan (NOT executed)

All schema-level; no data migration; no public-site behavior changes except none.

| Step | Name | Covers | Est. |
|---|---|---|---|
| 1 | `desk-reorder` | H1, L1 | 10 min |
| 2 | `list-previews` | H2, H3, L2 | 25 min |
| 3 | `deploy-tool-state` | H4 (localStorage + Vercel link + changed-docs query) | 45 min |
| 4 | `layout-guardrails` | M1, L7 (pattern dropdown + cross-field validation) | 40 min |
| 5 | `config-hygiene` | M2, M3, M5, L5, L6, L8 | 25 min |
| 6 | `media-plugin` | M4 (`sanity-plugin-media` install + config) | 15 min |
| 7 | `polish` (optional) | L3, L4, L10 | 60 min |

Total (steps 1–6): **~2h40** · with optional step 7: **~3h40**

**Verification per step:** `npm run lint` + load `/admin` locally and eyeball the affected pane; step 3 additionally needs one manual deploy click; step 4 needs one deliberately-invalid pattern/indices combo to confirm the validation message fires.

**Open questions before executing:**
1. French labels (L9) — does Basile want the Studio in French?
2. Step 3's "changed since last deploy" query needs a read of all 6 types' `_updatedAt` — trivial, but confirm appetite for that feature vs. just localStorage + link.
3. M6 credits: recommend leaving as-is — confirm.

---

## Execution addendum (2026-06-12, same day)

**Decisions (Maxime):** no French (L9 dropped) · step 3 at full scope ("N docs
changed since last deploy") · credits stay flat (M6 accepted) · NEW scope:
harmonize the film placement flag — rename inverted `collapsed` → `featured`
to match photoProject; new films default to **not featured** (consistent with
photos, safer than the old featured-by-default).

**Executed:** steps 1–6 plus the `featured` harmonization. Step 7 (polish)
executed later the same day on Maxime's go (branch `feat/studio-ui-polish`):
- **L3** — `anchor` renders as a clickable 2×3 mini-map of the hero screen
  ([AnchorMiniMapInput.jsx](../../sanity/components/AnchorMiniMapInput.jsx));
  stored value unchanged, options.list kept as canonical metadata.
- **L4** — `aspectRatio` override is a named-preset dropdown ("16:9 —
  widescreen (1.78)" …) covering every stored value (1.78 ×14 / 1.33 / 1.25,
  verified read-only). Bonus finding: the ×14 is an import artifact — every
  film carries a 1.78 override that defeats the Mux native-ratio default;
  curable per film via ⋮ → Reset value (noted in doc 10).
- **L10** — film schema now uses Content / Advanced tab groups like
  photoProject (fieldsets kept inside Content for rhythm); one editing model
  across both collections.

| Step | Outcome |
|---|---|
| 1 desk-reorder | Films + Photo projects first, divider, singletons below; `.icon()` instead of emoji-in-title (`sanity/desk/structure.js`) |
| 2 list-previews | film preview falls back to `image.mux.com/<playbackId>/thumbnail.jpg`; 🚫 Hidden + ★ Featured badges on film & photoProject subtitles; heroOverlay subtitles humanized to input-label vocabulary |
| 3 deploy-tool-state | localStorage-persisted last-deploy time, Vercel deployments link (`VITE_VERCEL_DEPLOYMENTS_URL`, dashboard fallback), drafts count + "N published since last deploy" list via `useDeployStatus` (Studio `useClient`); split into DeployTool.jsx / DeployStatus.jsx / useDeployStatus.js to stay under the 300-line gate |
| 4 layout-guardrails | PATTERNS extracted to `src/components/photos/previewPatterns.js` (named entries, shared schema↔component); pattern fields became named dropdowns; error-level validation: indices length === slot count, every index within photos range; warning when a pattern lacks indices; regex warnings for previewAspectRatio / previewMaxHeight |
| 5 config-hygiene | Vision dev-only; showreel `videoFile` hidden (Mux migration confirmed done); film-level "no video at all" warning; navLinkActiveSize ≥ navLinkSize warning; seoKeywords marked legacy; doc-level descriptions moved into rendered field descriptions |
| 6 media-plugin | `sanity-plugin-media@4.3.1` installed + wired. NOTE: its `media.tag` type must NOT be added to the webhook GROQ filter |
| featured-harmonization | Two-phase rename. Schema: `featured` (initialValue false) + retired hidden `collapsed`. Fetcher GROQ: `coalesce(!collapsed, featured, false)` — **collapsed-first**: verification caught orphaned pre-CMS `featured` booleans still sitting in the documents (15/2 split instead of the true 9/8 with featured-first precedence). Loader: normalizes + exports `getFeaturedFilms`/`getNonFeaturedFilms`. films.js: 8 × duplicate-keyed entries fixed to a single correct `featured: false`. Films.jsx filters on `featured`. upload-films writes both flags (transitional). New `cms:migrate-film-featured` (phase 1 sets `featured = !collapsed`, overwriting the orphans; `-- --prune` re-asserts + deletes after the new build is live). E2E specs untouched — they assert DOM, not data fields |

**Verification (all green):** `npm run lint` clean (zero warnings) · `npm run build` clean ·
Playwright **73/73 passed** on chromium (firefox/webkit binaries not installed locally —
environment, not regressions).

**Bonus bug found by verification (real, user-facing):** the refreshed cms.json
brought in Basile's latest content — he featured `asics-running` (2 photos),
whose collapsed preview height exactly equals its expanded gallery height.
Zero-delta height transitions fire **no `transitionend`**, so
`FeaturedPhotoCard`'s phase machine jammed in `animating-open`/`-close`:
stuck `aria-expanded`, dead clicks, and the sibling waiting on
`photo-card-expand-done` never collapsed. Fixed with watchdog timers
(`OPEN/CLOSE_DURATION_MS + 120ms`) sharing the same finishers as the
transitionend handler ([FeaturedPhotoCard.jsx](../../src/components/photos/FeaturedPhotoCard.jsx)).
Side effect: the anchored-switch spec now exercises the REAL coordinated
switch path (previously the jammed card snap-collapsed through a stale-phase
escape hatch), whose content-dependent landing residual is ~86px — the
test's intent-guard tolerance was widened 60→120px and doc 05's
known_issues updated (both the residual entry and a new zero-delta entry).
Data verification: a read-only per-`_id` comparison confirmed old vs new
fetcher semantics agree on all 17 film docs, and surfaced that 15 docs carry
orphaned pre-CMS `featured` booleans — the reason for collapsed-first
precedence.

**Pending (user-side):**
1. `npm run cms:migrate-film-featured` — phase 1 (blocked for the agent by the
   production-write permission gate; needs `SANITY_WRITE_TOKEN`). Safe before
   merge: additive only.
2. After this branch is live on production: `npm run cms:migrate-film-featured -- --prune`,
   then drop the transitional `collapsed` write from `upload-films.mjs` and the
   hidden schema field.
3. Optional: set `VITE_VERCEL_DEPLOYMENTS_URL` (project deployments page) in
   `.env` + Vercel env for a direct link in the Deploy tool.
