#!/usr/bin/env bash
# Vercel build entrypoint.
#
# 1. Fetch latest CMS content from Sanity → src/data/cms.json
#    Fail-soft: if Sanity is unreachable, the committed snapshot is reused.
# 2. Run the Vite production build.
#
# Videos are streamed from Vercel Blob (see src/data/blobUrls.json,
# populated by scripts/upload-videos-to-blob.mjs). The Vite build does
# not need the local mp4s in public/videos/.

set -euo pipefail

echo "=== fetch CMS content ==="
node scripts/fetch-cms-content.mjs

echo "=== vite build ==="
vite build
