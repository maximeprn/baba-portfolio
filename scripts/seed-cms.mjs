#!/usr/bin/env node
/**
 * Seed the Sanity dataset with the current site content.
 *
 * Idempotent — uses `createOrReplace` with pinned document IDs, so running
 * this twice produces the same result. Existing content is overwritten;
 * back up first if Basile has made edits.
 *
 * Requires a write token:
 *   1. Go to https://www.sanity.io/manage/personal/project/e9pgmdfm/api
 *   2. Add API token with "Editor" or "Admin" rights, copy the value
 *   3. Run:  SANITY_WRITE_TOKEN=<token> node scripts/seed-cms.mjs
 *
 * The token is never persisted — pass it inline.
 */

import { createClient } from '@sanity/client';

const PROJECT_ID = 'e9pgmdfm';
const DATASET = 'production';
const API_VERSION = '2024-12-01';

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN is not set.');
  console.error('  Generate one at https://www.sanity.io/manage/personal/project/e9pgmdfm/api');
  console.error('  Then run:  SANITY_WRITE_TOKEN=<token> node scripts/seed-cms.mjs');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

const SITE_SETTINGS = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  artistName: 'Basile Deschamps',
  artistFirstName: 'Basile',
  artistLastName: 'Deschamps',
  seoTitle: 'Basile Deschamps | Film & Photography',
  seoDescription:
    'Portfolio of Basile Deschamps - Visual artist specializing in film direction and photography. Reinventing the frame.',
  seoKeywords: ['film director', 'photographer', 'visual artist', 'Paris', 'commercial', 'documentary'],
  siteUrl: 'https://basiledeschamps.com',
  socialInstagram: 'https://www.instagram.com/basile.deschamps/',
  socialVimeo: 'https://vimeo.com/user37669788',
  socialLinkedin: null,
  socialTwitter: null,
  socialBehance: null,
  navActiveStyle: 'bold-larger',
  navLinkSize: 16,
  navLinkActiveSize: 18,
  footerCopyright: 'Basile Deschamps. All rights reserved.',
  footerShowSocial: true,
  // ogImage intentionally omitted — upload via the Studio after seeding
};

// Field shape mirrors the current heroOverlayItem schema (docs 13 + 14):
// positions are fixed insets from `anchor` (no offsetX/offsetY), and size is
// the named `textSize` scale with automatic phone/tablet shrink.
const HERO_OVERLAY = {
  _id: 'heroOverlay',
  _type: 'heroOverlay',
  items: [
    {
      _key: 'bio',
      _type: 'heroOverlayItem',
      text: 'Basile Deschamps is a film director and photographer based in Paris.',
      anchor: 'top-left',
      size: 'body',
      textSize: 'md',
      autoShrinkSmallScreens: true,
      link: { _type: 'object', type: 'none' },
      mobileVisible: true,
      stackWithSiblings: true,
      maxWidth: 720,
    },
    {
      _key: 'clients',
      _type: 'heroOverlayItem',
      text: 'Selected clients include Salomon, Parel Studios, Lorette Colé Duprat, On, Asics, Pag, Specialized, Veja.',
      anchor: 'top-left',
      size: 'body',
      textSize: 'md',
      autoShrinkSmallScreens: true,
      link: { _type: 'object', type: 'none' },
      mobileVisible: true,
      stackWithSiblings: true,
      maxWidth: 720,
    },
    {
      _key: 'phone',
      _type: 'heroOverlayItem',
      text: '+33 (0)6 17 91 79 89',
      anchor: 'bottom-left',
      size: 'contact',
      textSize: 'md',
      autoShrinkSmallScreens: true,
      link: { _type: 'object', type: 'phone', value: '+33617917989' },
      mobileVisible: true,
      stackWithSiblings: true,
    },
    {
      _key: 'email',
      _type: 'heroOverlayItem',
      text: 'basiledeschamps3@gmail.com',
      anchor: 'bottom-left',
      size: 'contact',
      textSize: 'md',
      autoShrinkSmallScreens: true,
      link: { _type: 'object', type: 'email', value: 'basiledeschamps3@gmail.com' },
      mobileVisible: true,
      stackWithSiblings: true,
    },
  ],
};

const SHOWREEL = {
  _id: 'showreel',
  _type: 'showreel',
  vimeoUrl: 'https://player.vimeo.com/video/989542038',
  videoFile: '/videos/Showreel 2021.mp4',
};

async function seed() {
  // Commit all three singletons in ONE atomic transaction. Sanity has no
  // webhook debounce, so this still fires 3 webhook events — keep the
  // auto-webhook DISABLED while seeding and use the Studio Deploy tool
  // afterwards (see CLAUDE.md → "Sanity webhook config").
  console.log('→ Seeding singletons in one transaction (createOrReplace will overwrite existing values)…');
  await client
    .transaction()
    .createOrReplace(SITE_SETTINGS)
    .createOrReplace(HERO_OVERLAY)
    .createOrReplace(SHOWREEL)
    .commit();
  console.log('  ✓ siteSettings');
  console.log('  ✓ heroOverlay');
  console.log('  ✓ showreel');
  console.log('✓ Done. Open https://www.sanity.io/manage/personal/project/e9pgmdfm to view.');
}

seed().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
