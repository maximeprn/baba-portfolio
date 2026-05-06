#!/usr/bin/env bash
# Vercel build entrypoint. Vercel's clone leaves the LFS endpoint
# unconfigured (`batch request: missing protocol: ""`), so we set
# `lfs.url` explicitly with a PAT-based credential before pulling.
#
# Required env var:
#   GITHUB_TOKEN — fine-grained PAT with Contents:Read on this repo.

set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: GITHUB_TOKEN env var is not set on Vercel." >&2
  exit 1
fi

echo "=== configure lfs endpoint ==="
git config lfs.url "https://x-access-token:${GITHUB_TOKEN}@github.com/maximeprn/baba-portfolio.git/info/lfs"

echo "=== git lfs install ==="
git lfs install --local

echo "=== git lfs pull ==="
git lfs pull

echo "=== vite build ==="
vite build

echo "=== dist/videos sample sizes ==="
ls -lh dist/videos | head -5
