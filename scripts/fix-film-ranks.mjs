#!/usr/bin/env node
/**
 * One-shot fix: re-assign every film's `orderRank` to a valid LexoRank value.
 *
 * Same shape as `scripts/fix-photo-project-ranks.mjs`. Run when drag-to-reorder
 * in Studio's 🎬 Films list is producing flaky results — a sign that some
 * orderRank values aren't LexoRank-compatible.
 *
 * This script:
 *   1. Fetches all films in their current displayed order (orderRank asc).
 *   2. Generates fresh LexoRank values spread evenly across the rank space.
 *   3. Patches each doc's orderRank in ONE atomic transaction.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=<token> node scripts/fix-film-ranks.mjs
 */

import { createClient } from '@sanity/client';
import { LexoRank } from 'lexorank';

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN is not set.');
  console.error('  Generate one at https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens (Editor permission).');
  console.error('  Then run: SANITY_WRITE_TOKEN=<token> node scripts/fix-film-ranks.mjs');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

async function main() {
  console.log('→ Fetching all film docs in current order …');
  const films = await client.fetch(
    `*[_type == "film"] | order(orderRank asc) { _id, title, orderRank }`,
  );
  console.log(`  found ${films.length} films`);

  if (films.length === 0) {
    console.error('✗ No film docs found — aborting.');
    process.exit(1);
  }

  let rank = LexoRank.middle();
  const updates = films.map((film, i) => {
    const newRank = rank.toString();
    if (i < films.length - 1) rank = rank.genNext();
    return { _id: film._id, title: film.title, oldRank: film.orderRank, newRank };
  });

  console.log('');
  console.log('→ New orderRank assignment:');
  for (const u of updates) {
    console.log(`  ${u._id.padEnd(40)}  ${String(u.oldRank).padEnd(12)} → ${u.newRank}`);
  }

  console.log('');
  console.log('→ Committing patch transaction (1 atomic write) …');
  let tx = client.transaction();
  for (const u of updates) {
    tx = tx.patch(u._id, { set: { orderRank: u.newRank } });
  }
  await tx.commit();

  console.log(`✓ Done. ${updates.length} ranks updated.`);
  console.log('');
  console.log('Reload /admin → 🎬 Films and drag should now be deterministic.');
}

main().catch((err) => {
  console.error('✗ Fix failed:', err.message);
  console.error(err);
  process.exit(1);
});
