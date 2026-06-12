# Audit notes — 2026-06-12 — Sanity Studio UI/UX

Scope: the embedded CMS editing experience at `/admin` (Sanity Studio v4).
Audience lens: Basile — a non-technical visual artist — is the primary editor.
This is a UX audit, not a code-correctness audit (the general 2026-06-12 audit covers that).

## Files read

- `sanity.config.js`
- `sanity/desk/structure.js`
- `sanity/tools/DeployTool.jsx`
- `sanity/schemas/index.js`, `film.js`, `photoProject.js`, `heroOverlay.js`, `siteSettings.js`, `showreel.js`, `heroPhotos.js`
- `src/pages/Studio.jsx`
- Cross-checks: `src/data/cms.json` (showreel mux status = ready; film[0] has `muxPosterUrl`), `src/sanity/loader.js` (slug usage), `package.json` (sanity 4.22, mux-input 2.19, orderable-document-list 1.5.1)

## Findings

### [Desk structure] `sanity/desk/structure.js`
- 🔴 **Most-edited content is buried.** Sidebar order: 4 singletons (Site settings, Hero overlay, Showreel, Hero photos) THEN Photo projects + Films. Basile's daily work is the two collections; the set-and-forget config is what greets him. Reorder: collections first, divider, then singletons (or group singletons under a "Site setup" sub-list).
- 🟡 Emojis are baked into `.title()` strings instead of passed via `.icon()`. Renders OK but spacing is hand-tuned (`'🎬  Films'` double-space), emoji leaks into breadcrumbs/document headers, and pane titles aren't cleanly searchable. Use `.icon(() => '🎬')`.

### [film schema] `sanity/schemas/film.js`
- 🔴 **Film list rows have no thumbnails in the recommended path.** Preview `media: 'thumbnail'` — but `thumbnail` is the *override* field most films leave blank (Mux auto-poster is the documented default). Result: a list of blank media squares. Fix: preview falls back to the Mux poster (`select videoMux.asset.playbackId` → custom media component rendering `https://image.mux.com/<id>/thumbnail.jpg?width=160`).
- 🔴 **`visible: false` films are indistinguishable in the list.** Preview subtitle shows `collapsed` but not hidden state. Basile can't scan which films are live. Add `visible` to preview select; prefix subtitle with e.g. "🚫 Hidden".
- 🟡 No warning when a film has neither `videoMux` nor `videoUrl` — the card silently has nothing to play/open. Add a document-level `warning()` validation.
- 🟡 Credits columns: flat array with per-row Left/Right radio forces the editor to mentally simulate two columns. Cheap fix: keep flat (runtime already rebuilds `{left,right}`), but the per-row radio could become initial-value-from-previous-row; bigger fix: split `creditsLeft`/`creditsRight` arrays (migration + runtime change). Proposal: cheap path only, this is workable as-is.
- 🟢 `aspectRatio` override is a decimal (1.78) — editors think "16:9". Advanced field so low priority; a dropdown of named ratios (+ free entry) would be friendlier.
- 🟢 Layout paradigm differs from photoProject: film = single tab + fieldsets, photoProject = tab groups. One mental model would be better; film could adopt groups (Content / Advanced) to match.

### [photoProject schema] `sanity/schemas/photoProject.js`
- 🔴 **`visible: false` projects indistinguishable in the list** (same as films — subtitle shows `featured` only).
- 🟡 **`previewPattern` is a magic number 0–15** with prose-only constraints ("slot count must match indices length"). Violations surface only as broken layout on the live site. Fix: (a) options list with descriptive names per pattern ("Pattern 10 — single full-bleed", etc., sourced from `PhotoCardPreview.PATTERNS`), (b) custom validation: `previewPhotoIndices.length === PATTERNS[previewPattern].slots` and every index `< photos.length`. Same for the mobile pattern pair.
- 🟢 `previewAspectRatio` / `previewMaxHeight` are free CSS strings — regex `warning()` would catch typos (`"5/4"` vs `"5 / 4"`, `60hv`).

### [heroOverlay schema] `sanity/schemas/heroOverlay.js`
- 🟡 Anchor placement is blind: a 6-option dropdown with no spatial feedback; Basile must publish + check the site to see where text lands. Nice-to-have: custom input rendering a 2×3 clickable mini-map. (Labels are clear, so this is polish, not a blocker.)
- 🟢 Item preview subtitle shows raw values: `top-left · body · md`. Humanize to "Top left · Normal · Medium" — same vocabulary as the input labels.
- 🟢 Document-level `description` on the type isn't rendered anywhere in Studio v4's form view — move the guidance into the `items` field description (which does render) or drop it.

### [showreel schema] `sanity/schemas/showreel.js`
- 🟡 **Legacy `videoFile` field still visible** ("Transitional fallback… will be removed once the hero video is on Mux"). cms.json confirms mux `status: ready` — the migration is done. The read-only legacy path is now pure noise for the editor. Hide it (`hidden: true`, keep in schema so the stored value doesn't orphan-warn) and schedule actual removal.

### [siteSettings schema] `sanity/schemas/siteSettings.js`
- 🟢 No cross-field check that `navLinkActiveSize ≥ navLinkSize` (warning-level rule would prevent a confusing "active link smaller than inactive" state).
- 🟢 `seoKeywords` (meta keywords) has been ignored by search engines for ~15 years — keeping it invites wasted editor effort. Candidate for removal or a description note saying it's optional/legacy.

### [sanity.config.js]
- 🟡 **Vision tool ships to the editor in production.** The GROQ playground is a developer tool; for Basile it's a confusing third tab that can run arbitrary queries. Standard practice: include `visionTool()` only in dev (`import.meta.env.DEV`).
- 🟢 Studio is English-only; Basile is French. If he'd prefer French labels, every title/description in the schemas could be localized (they're all hand-written strings already). **Question for Maxime — preference unknown.**

### [DeployTool] `sanity/tools/DeployTool.jsx`
- 🔴 **The publish→deploy gap is invisible.** With the auto-webhook disabled, "Published in Studio" ≠ "live on the site", and nothing tells Basile whether he's deployed since his last edits. `lastDeployedAt` is React state — lost on every reload. Fixes, in increasing value: (1) persist last-deploy timestamp in `localStorage`; (2) link the success message directly to the Vercel deployments dashboard; (3) on tool load, query Sanity for docs with `_updatedAt > lastDeploy` and show "N documents changed since your last deploy" — turning the tool into a real "you have undeployed changes" signal.
- 🟢 Cooldown (90s) and CORS/error messaging are thoughtful — no change needed.

### [Asset management] (gap)
- 🟡 No media-library plugin. For a photography portfolio (hundreds of images across heroPhotos + 22 photoProjects), the default asset picker has no search, tags, or usage info. `sanity-plugin-media` is the standard fix — drop-in plugin, no schema change.

## Test coverage
No Studio-UI tests exist (none expected — Studio is third-party UI; our surface is schema config + DeployTool). DeployTool has no unit test for its error paths; low value, skip.

## Doc accuracy
- `.mdd/docs/12-cms-video-uploads-mux.md` / showreel schema description promise `videoFile` removal post-migration — migration done, removal not done.
- CLAUDE.md schema section matches code. Desk structure description matches code.
