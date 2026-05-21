#!/usr/bin/env node
/**
 * Live CMS watcher for local dev.
 *
 * Subscribes to Sanity's real-time mutation stream (WebSocket via @sanity/client)
 * and re-runs the fetcher every time any published content document changes —
 * all four singletons plus the photoProject and film collections. Drafts
 * (autosave) are filtered out by the query so only published mutations trigger
 * a refetch.
 *
 * Run alongside `npm run dev`:
 *
 *   Terminal 1:  npm run dev
 *   Terminal 2:  npm run cms:watch
 *
 * Now edit + publish in /admin → cms.json updates → Vite hot-reloads the page.
 *
 * Ctrl+C stops the watcher cleanly.
 */

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FETCHER = resolve(__dirname, 'fetch-cms-content.mjs');

const client = createClient({
  projectId: 'e9pgmdfm',
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false, // CDN doesn't push live updates — use the API directly.
});

// Every content type the fetcher reads. Must stay in sync with the GROQ
// projection in fetch-cms-content.mjs (and the Sanity webhook filter).
const WATCHED_TYPES = [
  'siteSettings',
  'heroOverlay',
  'showreel',
  'heroPhotos',
  'photoProject',
  'film',
];

// Published-only query: draft documents have an `_id` under the "drafts."
// path, so excluding that path drops autosave noise — only Publish refetches.
const QUERY = '*[_type in $types && !(_id in path("drafts.**"))]';

let inFlight = false;
let pendingRerun = false;

function runFetcher(reason) {
  if (inFlight) {
    pendingRerun = true;
    return;
  }
  inFlight = true;
  console.log(`[cms:watch] ${reason} — refetching…`);
  const child = spawn('node', [FETCHER], { stdio: 'inherit' });
  child.on('exit', (code) => {
    inFlight = false;
    if (code !== 0) {
      console.error(`[cms:watch] fetcher exited with code ${code}`);
    }
    if (pendingRerun) {
      pendingRerun = false;
      runFetcher('queued mutation');
    }
  });
}

// Initial fetch so cms.json reflects the latest before any edit fires.
runFetcher('initial sync');

console.log('[cms:watch] connecting to Sanity mutation stream…');

const subscription = client
  .listen(QUERY, { types: WATCHED_TYPES }, { includeResult: false, visibility: 'query' })
  .subscribe({
    next: (event) => {
      const id = event.documentId ?? 'unknown';
      runFetcher(`mutation on ${id}`);
    },
    error: (err) => {
      console.error('[cms:watch] subscription error:', err.message);
      console.error('[cms:watch] retrying in 5s…');
      setTimeout(() => process.exit(1), 5000); // exit and let user restart
    },
  });

console.log('[cms:watch] listening. Edit + publish in /admin to trigger a refetch.');

function shutdown() {
  console.log('\n[cms:watch] stopping…');
  try { subscription.unsubscribe(); } catch { /* noop */ }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
