#!/usr/bin/env bash
# Vercel build entrypoint.
#
# Videos are streamed from Vercel Blob (see src/data/blobUrls.json,
# populated by scripts/upload-videos-to-blob.mjs). The Vite build does
# not need the local mp4s in public/videos/ — they are LFS pointer
# stubs on Vercel and unreferenced at runtime. So this script just
# forwards to vite build, with no Git LFS dance.

set -euo pipefail

echo "=== vite build ==="
vite build
