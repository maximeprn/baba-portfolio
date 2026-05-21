#!/usr/bin/env node
/**
 * One-shot fix: re-assign every photoProject's `orderRank` to a valid
 * LexoRank value.
 *
 * Background: the initial migration set `orderRank` to zero-padded ints
 * like "00000001". These don't compare correctly against the LexoRank-style
 * strings (e.g. "0|i00007:k") that @sanity/orderable-document-list
 * generates when items are dragged, so dragging produced flaky results
 * (items landing in the wrong position).
 *
 * This script:
 *   1. Fetches all photoProjects in their current displayed order.
 *   2. Generates fresh LexoRank values spread evenly across the rank space.
 *   3. Patches each doc's orderRank field in ONE atomic transaction.
 *      (Sanity has no webhook debounce — keep the auto-webhook disabled and
 *      use the Studio Deploy tool afterwards. See CLAUDE.md.)
 *
 * After running: drag-to-reorder in Studio should be deterministic.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=<token> node scripts/fix-photo-project-ranks.mjs
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
  console.error('  Then run: SANITY_WRITE_TOKEN=<token> node scripts/fix-photo-project-ranks.mjs');
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
  console.log('→ Fetching all photoProject docs in current order …');
  // We order by orderRank asc as the source of truth for "current order".
  // Whatever Basile sees in Studio right now is what we preserve.
  const projects = await client.fetch(
    `*[_type == "photoProject"] | order(orderRank asc) { _id, title, orderRank }`,
  );
  console.log(`  found ${projects.length} projects`);

  if (projects.length === 0) {
    console.error('✗ No photoProject docs found — aborting.');
    process.exit(1);
  }

  // Generate fresh LexoRank values, spread out. Starting from middle()
  // and stepping with genNext() gives ranks like "0|hzzzzz:", "0|i00007:",
  // etc. — valid LexoRank strings with room on both sides for future
  // drag-insertions.
  let rank = LexoRank.middle();
  const updates = projects.map((proj, i) => {
    const newRank = rank.toString();
    if (i < projects.length - 1) rank = rank.genNext();
    return { _id: proj._id, title: proj.title, oldRank: proj.orderRank, newRank };
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
  console.log('Reload /admin → 📷 Photo projects and drag should now be deterministic.');
}

main().catch((err) => {
  console.error('✗ Fix failed:', err.message);
  console.error(err);
  process.exit(1);
});
