/**
 * Read-only Sanity client.
 *
 * Not currently imported anywhere: the build-time fetcher
 * (scripts/fetch-cms-content.mjs) constructs its own client, and at runtime
 * the site reads the pre-fetched src/data/cms.json snapshot instead of
 * querying Sanity. Kept as the canonical read-only client surface for any
 * future runtime Sanity use (e.g. live preview / on-demand queries).
 */

import { createClient } from '@sanity/client';

export const SANITY_PROJECT_ID = 'e9pgmdfm';
export const SANITY_DATASET = 'production';
export const SANITY_API_VERSION = '2024-12-01';

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
});
