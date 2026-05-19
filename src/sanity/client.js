/**
 * Read-only Sanity client. Used by the build-time fetcher and any potential
 * runtime use (currently the site reads from src/data/cms.json instead).
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
