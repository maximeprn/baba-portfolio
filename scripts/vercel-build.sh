#!/usr/bin/env bash
# Vercel build entrypoint.
#
# Vercel's clone leaves the LFS endpoint unconfigured and its build
# cache may carry over a partial .git/lfs/ state that makes git-lfs
# think it already has the objects (so `git lfs pull` becomes a no-op
# and we ship 133-byte pointer stubs to production). This script:
#
#   1. configures lfs.url with PAT auth
#   2. wipes any cached LFS objects so the fetch is real
#   3. fetches + checks out all LFS objects for HEAD
#   4. verifies a sample mp4 is a real binary, not a pointer
#   5. runs vite build
#
# Required env var:
#   GITHUB_TOKEN — fine-grained PAT with Contents:Read on the repo.

set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: GITHUB_TOKEN env var is not set on Vercel." >&2
  exit 1
fi

echo "=== git-lfs version ==="
git lfs version

echo "=== configure lfs endpoint ==="
git config lfs.url "https://x-access-token:${GITHUB_TOKEN}@github.com/maximeprn/baba-portfolio.git/info/lfs"

echo "=== wipe stale lfs cache (if any) ==="
rm -rf .git/lfs/objects .git/lfs/tmp || true

echo "=== git lfs install ==="
git lfs install --local

echo "=== git lfs fetch --all ==="
git lfs fetch --all

echo "=== git lfs checkout ==="
git lfs checkout

echo "=== verify mp4 is real binary, not pointer ==="
SAMPLE="$(find public/videos -name '*.mp4' -print -quit)"
if [[ -z "$SAMPLE" ]]; then
  echo "ERROR: no mp4 found under public/videos." >&2
  exit 1
fi
SIZE="$(wc -c < "$SAMPLE")"
echo "sample: $SAMPLE ($SIZE bytes)"
if head -c 40 "$SAMPLE" | grep -q "git-lfs.github.com"; then
  echo "ERROR: $SAMPLE is still an LFS pointer. lfs fetch did not deliver bytes." >&2
  echo "First 200 bytes:" >&2
  head -c 200 "$SAMPLE" >&2 || true
  exit 1
fi
if (( SIZE < 1000000 )); then
  echo "ERROR: $SAMPLE is suspiciously small ($SIZE bytes) — likely incomplete." >&2
  exit 1
fi

echo "=== vite build ==="
vite build

echo "=== dist/videos sample sizes ==="
ls -lh dist/videos | head -10
