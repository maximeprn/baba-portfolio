---
id: 11-cms-video-uploads
title: CMS — Video Uploads (transcoded, hands-off)
edition: BABA Portfolio
depends_on:
  - 07-cms-foundation
  - 10-cms-films
status: RESEARCH — architecture decision pending (2026-05-20)
source_files: []  # populated once a path is chosen
test_files: []
known_issues: []
---

# 11 — CMS Video Uploads

## Purpose

Let Basile drop a raw film export (often 500 MB–2 GB) into Sanity Studio and end up with a 720p / ~2000 kbps web-optimized MP4 wired into the film document — with **zero manual steps** beyond clicking Publish. Today every video has to be transcoded by hand, named exactly right, copied into `public/videos/`, then pushed to Blob via `scripts/upload-videos-to-blob.mjs` and re-imported into the CMS path string. Acceptable for the developer, impossible for the artist.

## Architecture (today)

```
basile’s desktop
   └─ ffmpeg by hand (developer task)
        └─ /public/videos/<file>.mp4
              └─ npm run upload-videos-to-blob ──► Vercel Blob
                                                       ▲
                                  src/data/blobUrls.json (path → URL map)
                                  ▲
   Studio /admin → film.videoFile (path string)
              ▼
   src/data/videoShorts.js → shortVideo("/videos/<file>.mp4") → Blob URL
              ▼
   FeaturedFilmCard / FilmModal
```

Two pieces of friction:
1. **Transcoding is manual.** Basile has no ffmpeg, no patience for command lines.
2. **Upload to Blob is manual.** The CMS only stores a *path string*, not the file.

## Constraints

- **Vercel server upload limit = 4.5 MB request body** on Lambda. Films are 50–500 MB minimum, so any path that goes `browser → /api/* → Blob` is dead on arrival.
- **Sanity file-asset limit = 100 MB** on the free tier (and we’d pay per GB stored above that). The showreel alone is ~50 MB; full films exceed it. Using Sanity as a video host is out.
- **ffmpeg cannot live inside a Vercel Lambda comfortably.** `ffmpeg-static` is ~80 MB; Hobby caps function size at 50 MB unzipped. Even on Pro (250 MB), Lambdas are killed at 5 min — fine for 5 s clips, not for a 500 MB transcode.
- **Basile is non-technical.** No CLI, no separate dashboards, no “open this other tool to finish the upload.” Everything happens inside `/admin`.

## Options compared

Five viable paths. Costs are estimates for ~15 films × ~2 min avg.

### A — Mux + sanity-plugin-mux-input (RECOMMENDED for simplicity)

```
Studio /admin
   └─ mux.video input field (drag a .mov here)
        └─ direct upload to mux.com (no Vercel involved)
              └─ Mux transcodes → multiple renditions automatically
                    └─ playbackId stored on the Sanity document
                          ▼
              <MuxPlayer playbackId={…} />  (or plain <video> with HLS URL)
```

- **Code change:** add `sanity-plugin-mux-input` to `sanity.config.js`, swap the `videoFile` field on `film` from `string` to `type: 'mux.video'`, swap `<video>` for `@mux/mux-player-react` (or use the .m3u8 URL with hls.js).
- **Editor UX:** drag-drop in Studio, progress bar, automatic poster generation, automatic transcode to 720p (and 1080p, 480p — Mux picks bitrates). Officially supported by Sanity.
- **Cost:** ~$1/1000 minutes encoded one-time + ~$3/1000 minutes streamed/month. For this portfolio: $0.05 one-time + $0–1/month traffic. Effectively under $2/month.
- **Pros:** ~30-minute build, official Sanity plugin, adaptive bitrate streaming, automatic thumbnails, perfect mobile playback.
- **Cons:** Vercel Blob is no longer the video host (Mux is). Vendor dependency. If Mux changes pricing, migration is a re-upload.
- **Effort:** ~3 hours including writing the loader change + Vercel rewrites cleanup.

### B — Client direct upload to Blob + external transcoding worker (RECOMMENDED if Blob stays mandatory)

```
Studio custom input
   └─ POST /api/blob/upload-token  (returns short-lived put-token, < 4.5 MB)
        └─ browser → @vercel/blob/client.upload(raw file, token)
              └─ Vercel Blob stores raw/<id>.mov  (any size, multipart)
                    └─ POST /api/transcode-trigger?id=…  (queues the job)
                          └─ Cloud Run / Fly.io worker (ffmpeg installed)
                                ├─ GET raw blob
                                ├─ ffmpeg -vf scale=-2:720 -b:v 2000k -c:a aac -b:a 128k
                                ├─ PUT optimized/<id>.mp4 back to Blob
                                ├─ DELETE raw/<id>.mov
                                └─ PATCH the film document with the final URL
                                      ▼
                                Studio shows "Encoding…" → "Ready"
```

- **Where does ffmpeg run?** Outside Vercel. Options ranked by cheapest:
  - **Cloud Run** (Google): pay-per-request, scales to zero. Free tier covers ~2M req/month + 360k vCPU-sec. A 5-min transcode is ~$0.01 max.
  - **Fly.io**: 256 MB micro-VM = $0/mo on the free allotment. Always-on, faster cold starts than Cloud Run.
  - **Railway/Render**: similar economics, $5/mo starter plans.
- **Editor UX:** drag-drop in a custom Sanity input. Progress bar for the raw upload (browser → Blob direct, no 4.5 MB limit). Studio shows an “encoding…” spinner until the worker patches the doc.
- **Cost:** $0–5/mo depending on the host. Cloud Run free tier is realistic to stay inside.
- **Pros:** keeps the Blob-centric pipeline, no third-party CDN, full control of encoding params (exact 720p / 2000 kbps as you specified).
- **Cons:** a new service to deploy + monitor. Custom Sanity input component to write (~150 LOC). Webhook security (worker auths into Sanity with a write token). Worker can die mid-transcode → recovery logic.
- **Effort:** ~8–12 hours initial build, plus ~$0/mo ongoing.

### C — Client upload to Blob + ffmpeg.wasm in the browser

```
Studio custom input
   └─ ffmpeg.wasm transcodes IN THE BROWSER (raw 500 MB → 50 MB)
        └─ @vercel/blob/client.upload(transcoded blob)
              └─ Blob stores the final mp4
                    └─ document.videoFile = blob.url
```

- **Editor UX:** drag-drop, then *long* wait (10–50× slower than native ffmpeg). A 500 MB file → ~30–60 min of browser CPU at 100%. Memory cap ~2–4 GB; large files can OOM and crash the tab.
- **Cost:** $0. No new services.
- **Pros:** zero infra. No vendor lock-in.
- **Cons:** unusable on weaker laptops; tab-blocking; flaky on long inputs; basically a worse version of B for Basile’s use case.
- **Effort:** ~10 hours. **Not recommended.**

### D — Bunny Stream

```
Same pattern as Mux: drag-drop → Bunny transcodes → CDN URL stored on doc.
```

- **Cost:** $5/mo base + $0.005/GB egress. For this scale, $5/mo total.
- **Pros:** cheaper at high volume, faster CDN in EU.
- **Cons:** **no official Sanity plugin** — would need to write a custom input from scratch (4–6 hours). Mux saves that work.
- **Effort:** ~8 hours.

### E — Cloudinary (video transformations on URL)

```
Direct upload to Cloudinary via signed upload widget → Cloudinary URL stored.
Transformations applied via URL parameters (height, bitrate, format).
```

- **Cost:** generous free tier (25 GB transformations + 25 GB bandwidth/month).
- **Pros:** zero infra, URL-based transformation is elegant.
- **Cons:** no Sanity plugin (custom input again). The Cloudinary widget is heavier than Mux’s. Their video pricing scales more aggressively above free tier.
- **Effort:** ~6 hours.

## Recommendation matrix

| Need | Best fit |
|---|---|
| Smallest effort, best Basile UX | **A (Mux)** |
| Must keep Vercel Blob as storage | **B (Cloud Run worker)** |
| Zero monthly cost, willing to accept slow UX | C (ffmpeg.wasm) — but really, A or B |
| Already paying for Cloudinary/Bunny elsewhere | E or D |

## Open decisions for the user

1. **Is Vercel Blob a hard requirement, or just the current implementation?** If it’s the latter, pick A (Mux). If it’s mandated by some external constraint, B is the path.
2. **Are we OK paying ~$1–2/month for video infra?** Mux at this scale is closer to a dollar than five. Cloud Run free tier may be enough for B.
3. **Adaptive bitrate streaming** (HLS) vs **single mp4 file**? Mux gives ABR for free; the Blob worker would deliver a single 720p file (cheaper, lighter, still fine for a portfolio).
4. **What happens to the existing 15 films on Blob?**
   - A: re-upload each into Studio so Mux has them (one-time ~30 min of Basile’s time, or scripted).
   - B: leave them where they are; the worker only handles future uploads.

## Suggested next step

Pick A or B based on the answers above, then write a follow-up doc (`12-cms-video-uploads-impl.md`) with the implementation plan. **Both A and B are buildable in a single session.**

If unsure, **start with A (Mux)**. Two-day reversal cost if you change your mind — switch the schema back to a Blob URL string, run the existing `upload-videos-to-blob.mjs` once.

## Known issues

(populated once a path is chosen)
