#!/usr/bin/env node
/**
 * Two-phase rename of the film display flag: `collapsed` (inverted) → `featured`.
 * Harmonizes films with photo projects, which always used `featured`.
 *
 * Phase 1 — default run (safe while the OLD build is still on production):
 *   For every film doc (published + drafts) carrying `collapsed`, set
 *   `featured = !collapsed` — OVERWRITING any existing `featured` value:
 *   the docs still carry orphaned `featured` booleans from the pre-CMS
 *   schema (the field was dropped from the schema, never from the data),
 *   and that noise must not survive as the new flag. The legacy `collapsed`
 *   value is left in place so a production rebuild from main (whose fetcher
 *   still reads `collapsed`) keeps rendering correctly.
 *
 * Phase 2 — `--prune` (run ONLY after the featured-aware build is live):
 *   Re-asserts `featured = !collapsed` one last time (guards against a
 *   skipped phase 1) and removes the retired `collapsed` field in the same
 *   patch. NOTE: a "Featured" toggle made in Studio between phase 1 and the
 *   prune is overridden by `collapsed` (the fetcher reads collapsed-first
 *   while it exists) — keep that window short.
 *
 * Idempotent: re-running either phase is a no-op when there's nothing left
 * to do. All mutations go in one transaction.
 *
 * Webhook noise: each patched doc fires one webhook event if the Sanity
 * auto-webhook is enabled. Leave it disabled (the default workflow) and
 * deploy once from the Studio Deploy tool afterwards. See CLAUDE.md.
 *
 * Usage:
 *   npm run cms:migrate-film-featured              # phase 1
 *   npm run cms:migrate-film-featured -- --prune   # phase 2, after merge+deploy
 *
 * Needs SANITY_WRITE_TOKEN (from .env via --env-file-if-exists, or exported).
 */

import { createClient } from '@sanity/client';

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const prune = process.argv.includes('--prune');

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN is not set.');
  console.error('  Generate one at https://www.sanity.io/manage/personal/project/e9pgmdfm/api/tokens (Editor permission).');
  console.error('  Then run: npm run cms:migrate-film-featured');
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
  // Raw perspective (default for tokened clients) → drafts included, so an
  // in-progress edit gets the same treatment as its published doc.
  const films = await client.fetch(
    '*[_type == "film"]{ _id, title, featured, collapsed }',
  );
  if (!films.length) {
    console.log('No film documents found — nothing to do.');
    return;
  }
  console.log(`Found ${films.length} film document(s) (drafts included).`);

  const tx = client.transaction();
  let patched = 0;

  for (const film of films) {
    // Docs without `collapsed` are post-rename creations (or already pruned)
    // — their `featured` is authoritative, nothing to derive.
    if (film.collapsed === undefined) continue;
    const featured = !(film.collapsed === true);

    if (prune) {
      // Re-assert + remove in one patch (guards against a skipped phase 1).
      tx.patch(film._id, (p) => p.set({ featured }).unset(['collapsed']));
      console.log(`  – ${film._id} (${film.title}) → featured: ${featured}, collapsed removed`);
      patched += 1;
    } else {
      if (film.featured === featured) continue; // already in sync
      // Overwrites orphaned pre-CMS `featured` values — see header comment.
      tx.patch(film._id, (p) => p.set({ featured }));
      console.log(`  – ${film._id} (${film.title}) → featured: ${featured}`);
      patched += 1;
    }
  }

  if (!patched) {
    console.log(prune ? '✓ Nothing left to prune.' : '✓ All films already migrated.');
    return;
  }

  await tx.commit();
  console.log(
    prune
      ? `✓ Pruned the retired collapsed flag from ${patched} document(s).`
      : `✓ Set featured on ${patched} document(s). The legacy collapsed flag stays until \`-- --prune\` (run it after this branch is live on production).`,
  );
  console.log('  Remember: deploy once from the Studio 🚀 Deploy tool to publish.');
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  process.exit(1);
});
