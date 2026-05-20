---
id: 12-cms-video-uploads-mux
title: CMS — Video Uploads via Mux (Sanity plugin + ABR playback)
edition: BABA Portfolio
depends_on:
  - 07-cms-foundation
  - 10-cms-films
  - 11-cms-video-uploads
status: PLANNED — implementation not yet started (2026-05-20)
source_files:
  - sanity.config.js                          # modify (register mux plugin)
  - sanity/schemas/film.js                    # modify (videoFile → videoMux)
  - scripts/fetch-cms-content.mjs             # modify (project Mux playback fields)
  - src/sanity/loader.js                      # modify (surface playbackId)
  - src/data/videoShorts.js                   # keep (used only by legacy fallback)
  - src/components/films/FeaturedFilmCard.jsx # modify (Mux player or HLS <video>)
  - src/components/films/FilmCard.jsx         # modify (Mux poster image)
  - src/components/films/CollapsedFilmCard.jsx# modify (Mux player or HLS)
  - src/components/films/FilmModal.jsx        # NO CHANGE (still Vimeo)
  - src/components/ui/HeroSection.jsx         # modify if showreel preview uses Mux
  - scripts/migrate-blob-to-mux.mjs           # NEW (one-shot import of existing 15 films)
  - package.json                              # add deps
  - CLAUDE.md                                 # update CMS section + scripts table
  - .env.example                              # add MUX_TOKEN_ID / MUX_TOKEN_SECRET
test_files:
  - tests/e2e/cms-films-mux.spec.js           # NEW (assert HLS / mux CDN in network)
known_issues: []
---

# 12 — CMS Video Uploads via Mux

## Purpose

Replace the manual `ffmpeg → public/videos/*.mp4 → upload-videos-to-blob.mjs` pipeline with an in-Studio drag-and-drop. Basile drops a raw export into the `film` document, Mux transcodes to 720p with adaptive bitrate streaming (HLS), and the runtime serves via Mux's CDN — no Vercel Fast Data Transfer consumed for video bytes.

## Architecture

```
Studio /admin → film document
        │
        │ mux.video input field (sanity-plugin-mux-input)
        ▼
basile drops a .mov / .mp4 (any size, but typically ≤ 20 MB)
        │
        │ direct upload  (browser ↔ mux.com, bypasses Vercel)
        ▼
   ┌─ Mux ingest ─────────────────────────────────┐
   │   transcode → 720p HLS + multi-bitrate ABR   │
   │   auto-generate poster + thumbnails           │
   │   asset.playbackId saved on the Sanity doc   │
   └───────────────────────────────────────────────┘
        │
        │ GROQ projection at build time
        ▼
src/data/cms.json  → films[].mux.playbackId
        ▼
loader.js exposes `muxPlaybackId` + computed `posterUrl`
        ▼
FeaturedFilmCard / CollapsedFilmCard → <MuxPlayer playbackId={…} />
                                     or HLS via hls.js + <video>
```

Vimeo URLs (`film.videoUrl`) stay exactly where they are — they drive the click-through `FilmModal`, separate from the autoplaying preview tile.

## Data Model

### Schema change (`sanity/schemas/film.js`)

Replace the current Media-tab fields:

```diff
- videoFile     (string, "/videos/<file>.mp4")
- videoType     (enum 'vimeo' | 'mp4')
- aspectRatio   (number)
+ videoMux      (type: 'mux.video') — Sanity ref to a mux.videoAsset doc
+ aspectRatio   (number, kept — set manually if Mux's metadata isn't enough)
```

`videoUrl` (Vimeo player URL, for the modal) is unchanged.

The `mux.videoAsset` document type comes from the plugin and carries:

| Plugin field           | Use |
|---|---|
| `playbackId`           | Stream URL: `https://stream.mux.com/<playbackId>.m3u8` |
| `assetId`              | Mux dashboard reference |
| `status`               | `preparing`, `ready`, `errored` |
| `data.aspect_ratio`    | "16:9" string from Mux probe — useful for `aspectRatio` |
| `data.duration`        | Seconds, for player UI |

### Loader projection

`scripts/fetch-cms-content.mjs` projection becomes:

```groq
"films": *[_type == "film"] | order(orderRank asc) {
  …existing fields…,
  "mux": videoMux.asset->{
    playbackId,
    "status":     data.status,
    "aspect":     data.aspect_ratio,
    "duration":   data.duration
  }
}
```

Loader exposes:

```js
films[i] = {
  …,
  muxPlaybackId:  string | null,
  muxStatus:      'ready' | 'preparing' | 'errored' | null,
  posterUrl:      `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0.5`,
  streamUrl:      `https://stream.mux.com/${playbackId}.m3u8`,
}
```

Films with `muxStatus !== 'ready'` (still encoding) render the thumbnail static — no autoplay until Mux finishes. `cms:fetch` re-run picks up the ready status on the next deploy.

## Business Rules

1. **Mux is the source of truth for the autoplay preview**; Vimeo stays the source for the modal. Two different URLs, two different concerns.
2. **Signed playback URLs are NOT used.** Films are public on a portfolio — no DRM, no expiring tokens. The Mux asset uses the `public` playback policy so the `.m3u8` URL is permanent and embeddable.
3. **Aspect ratio comes from Mux probe** when available; the `aspectRatio` field on the document is a manual override that wins if set.
4. **No autoplay until status === ready.** The plugin sets status to `preparing` on upload and patches to `ready` on completion (~30 s for a 20 MB file). Until then, the card shows the poster only.
5. **Existing 15 films migrate via `scripts/migrate-blob-to-mux.mjs`**: for each film with a Blob `videoFile`, POST to Mux Create Asset with `input: [{ url: blobUrl }]`, wait for ready, patch the film doc with the new asset reference. Run once. Then the Blob videos can be deleted at leisure.

## Cost estimate

Mux pricing (2026, "On Demand" Smart plan):

| Item | Rate | This portfolio |
|---|---|---|
| Encoding | $0.04 / source minute | 15 × 2 min = $1.20 one-time |
| Storage  | $0.003 / min / month | 30 min × $0.003 = $0.09 / mo |
| Streaming | $0.00096 / streamed min | ~100 plays × 2 min = $0.19 / mo |
| **Total** |  | **$1.20 one-time + ~$0.30 / mo** |

Effectively free at this scale.

## Dependencies

- [07-cms-foundation](07-cms-foundation.md) — Studio mount + config.
- [10-cms-films](10-cms-films.md) — `film` schema is what we're modifying.
- [11-cms-video-uploads](11-cms-video-uploads.md) — decision doc (option A chosen).

## Build plan (10 steps, ~3 h)

### Phase 5 — Implement (do AFTER compaction if needed)

| # | Step | Files | Effort |
|---|---|---|---|
| 1 | **Mux account + creds** | (manual: create Mux account, generate access token at dashboard, save `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET`) | 10 min |
| 2 | **Install deps** | `package.json` — `sanity-plugin-mux-input`, `@mux/mux-player-react`, `@mux/mux-node` (for migration script) | 5 min |
| 3 | **Plugin wiring** | `sanity.config.js` — `plugins: […, muxInput({ mp4_support: 'none', max_resolution_tier: '720p' })]` | 5 min |
| 4 | **Schema update** | `sanity/schemas/film.js` — swap `videoFile` for `videoMux` (`type: 'mux.video'`); leave `videoUrl` alone | 10 min |
| 5 | **Fetcher projection** | `scripts/fetch-cms-content.mjs` — dereference the asset doc, extract `playbackId`, `status`, `aspect_ratio`, `duration`; build `streamUrl` + `posterUrl` strings | 20 min |
| 6 | **Loader** | `src/sanity/loader.js` — surface `muxPlaybackId`, `muxStatus`, `posterUrl`, `streamUrl`; keep `LEGACY_FILMS` fallback intact for safety | 15 min |
| 7 | **Components** | `FeaturedFilmCard.jsx`, `CollapsedFilmCard.jsx` — swap the `<video src>` for `<MuxPlayer>` (preferred) or `<video>` + hls.js; pass `playbackId`, `autoPlay='muted'`, `loop`, `playsInline`, `muted`, `streamType='on-demand'`. `FilmCard.jsx` only needs the `posterUrl` for the static thumbnail. `FilmModal.jsx` stays unchanged (Vimeo). | 40 min |
| 8 | **Migration script** | `scripts/migrate-blob-to-mux.mjs` — read every film, for each one with a Blob `videoFile`, POST to Mux Create Asset (input URL = Blob URL, playback_policy=`public`), poll until ready, patch the Sanity doc with the new asset ref. Idempotent (skips films that already have `videoMux`). | 35 min |
| 9 | **npm scripts + CLAUDE.md** | `package.json` — add `cms:migrate-blob-to-mux`. Update CLAUDE.md schema section + scripts table. | 10 min |
| 10 | **E2E test + build verify** | `tests/e2e/cms-films-mux.spec.js` — load `/`, intercept network, assert at least one request to `stream.mux.com`. `npm run build` clean. | 20 min |

Total dev time: **~3 h**.
User-side: 10 min Mux signup + 5 min env var setup in Vercel + ~5 min waiting for the migration script + 1 Studio Deploy click.

## Migration workflow

Once the code merges:

1. **Sign up at mux.com** (Smart plan, on-demand). Generate an access token (`Settings → Access Tokens → Generate new token`).
2. **Add env vars** in two places:
   - **Sanity Studio CORS / secrets**: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`. Set via `sanity secrets set` (the plugin reads them from there — they don't end up in the public Studio bundle).
   - **Local `.env`** for the migration script: same two values.
3. `SANITY_WRITE_TOKEN=… MUX_TOKEN_ID=… MUX_TOKEN_SECRET=… npm run cms:migrate-blob-to-mux`. The script copies every existing Blob video into Mux and patches each film doc. ~30 s per video; ~10 min total.
4. Click Studio **🚀 Deploy** to publish.
5. Verify on the homepage: each film card autoplays via Mux (check Network → `.m3u8` requests).
6. (Later, optional) Delete `public/videos/*.mp4` from Vercel Blob via dashboard or the Blob `del()` API. Drop `videoFile` from the schema and the loader in a follow-up PR.

## Open decisions

- **MuxPlayer vs hls.js + plain `<video>`?**
  - `@mux/mux-player-react` (~60 KB) gives a polished player with Mux Data analytics + auto-poster + accessibility — but it's a *full UI*. For autoplay previews with no controls, the plain `<video>` element with hls.js (~30 KB) is leaner.
  - **Recommendation**: hls.js + `<video>` for the autoplay preview tiles (matches current bare-`<video>` UX exactly). MuxPlayer could be used inside the modal if you ever want to drop Vimeo — out of scope here.
- **Keep `videoFile` (Blob path) as a transitional field?**
  - **Recommendation: yes, for one PR.** Keep both `videoFile` and `videoMux` on the schema during the migration window. Loader prefers Mux when present, falls back to Blob. Drop `videoFile` in a follow-up PR once every film is on Mux.

## Known issues

(populated during implementation)
