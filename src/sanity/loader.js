/**
 * CMS loader.
 *
 * This is the bridge between Sanity (build-time fetch into src/data/cms.json)
 * and the rest of the app. Components import named exports from here that
 * match the legacy `siteConfig.js` shape so the rest of the codebase doesn't
 * have to change.
 *
 * Fallback values match the previously hardcoded site state. They kick in
 * only when cms.json is missing keys — e.g. fresh project, dataset not yet
 * seeded, or a schema-renamed field on an old snapshot.
 */

import cmsData from '../data/cms.json';
import { heroPhotos as LEGACY_HERO_PHOTOS } from '../data/heroPhotos';
import { photoProjects as LEGACY_PHOTO_PROJECTS } from '../data/photoProjects';

// ---------------------------------------------------------------------------
// Fallbacks (the values previously hardcoded in siteConfig.js / HeroSection.jsx)
// ---------------------------------------------------------------------------

const FALLBACK_SITE_SETTINGS = {
  artistName: 'Basile Deschamps',
  artistFirstName: 'Basile',
  artistLastName: 'Deschamps',
  seoTitle: 'Basile Deschamps | Film & Photography',
  seoDescription:
    'Portfolio of Basile Deschamps - Visual artist specializing in film direction and photography. Reinventing the frame.',
  seoKeywords: ['film director', 'photographer', 'visual artist', 'Paris', 'commercial', 'documentary'],
  ogImageUrl: '/images/og-image.jpg',
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
};

const FALLBACK_HERO_OVERLAY = {
  items: [
    {
      text: 'Basile Deschamps is a film director and photographer based in Paris.',
      anchor: 'top-left',
      offsetX: 32,
      offsetY: 100,
      size: 'body',
      link: { type: 'none' },
      mobileVisible: true,
      stackWithSiblings: true,
      maxWidth: 720,
    },
    {
      text: 'Selected clients include Salomon, Parel Studios, Lorette Colé Duprat, On, Asics, Pag, Specialized, Veja.',
      anchor: 'top-left',
      offsetX: 32,
      offsetY: 145,
      size: 'body',
      link: { type: 'none' },
      mobileVisible: true,
      stackWithSiblings: true,
      maxWidth: 720,
    },
    {
      text: '+33 (0)6 17 91 79 89',
      anchor: 'bottom-left',
      offsetX: 32,
      offsetY: 40,
      size: 'contact',
      link: { type: 'phone', value: '+33617917989' },
      mobileVisible: true,
      stackWithSiblings: true,
    },
    {
      text: 'basiledeschamps3@gmail.com',
      anchor: 'bottom-left',
      offsetX: 240,
      offsetY: 40,
      size: 'contact',
      link: { type: 'email', value: 'basiledeschamps3@gmail.com' },
      mobileVisible: true,
      stackWithSiblings: true,
    },
  ],
};

const FALLBACK_SHOWREEL = {
  vimeoUrl: 'https://player.vimeo.com/video/989542038',
  videoFile: '/videos/Showreel 2021.mp4',
  posterImageUrl: null,
};

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

function withFallback(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'object') return value;
  return { ...fallback, ...value };
}

export const siteSettings = withFallback(cmsData?.siteSettings, FALLBACK_SITE_SETTINGS);
export const heroOverlay = withFallback(cmsData?.heroOverlay, FALLBACK_HERO_OVERLAY);
export const showreel = withFallback(cmsData?.showreel, FALLBACK_SHOWREEL);

/**
 * Hero slideshow photos for /photos.
 *
 * The CMS resolver (`scripts/fetch-cms-content.mjs`) writes
 * `heroPhotos.photoUrls = [{ url, alt }, ...]` after resolving Sanity asset
 * refs. Components want a flat string[] of URLs, so we flatten here.
 *
 * Falls back to the legacy hardcoded list (`src/data/heroPhotos.js`) when
 * the CMS isn't seeded yet so the slideshow never goes blank during the
 * Stage 3 migration window.
 */
export const heroPhotos = (() => {
  const fromCms = cmsData?.heroPhotos?.photoUrls;
  if (Array.isArray(fromCms) && fromCms.length > 0) {
    return fromCms.map((it) => it.url).filter(Boolean);
  }
  return LEGACY_HERO_PHOTOS;
})();

/**
 * Photo projects for /photos.
 *
 * The CMS fetcher writes `photoProjects` as an array of objects already in
 * the legacy shape (id, slug, title, description, year, client, category,
 * featured, photos[{src, alt, aspectRatio}], preview, imagePosition?).
 * If the CMS array is empty (e.g. dataset not yet migrated), fall back to
 * the legacy `src/data/photoProjects.js` data so the page never goes blank.
 */
export const photoProjects = (() => {
  const fromCms = cmsData?.photoProjects;
  if (Array.isArray(fromCms) && fromCms.length > 0) return fromCms;
  return LEGACY_PHOTO_PROJECTS;
})();

export const getFeaturedProjects = () => photoProjects.filter((p) => p.featured);
export const getNonFeaturedProjects = () => photoProjects.filter((p) => !p.featured);
export const getProjectBySlug = (slug) => photoProjects.find((p) => p.slug === slug);

/**
 * Returns the social links that are non-null, formatted for display.
 * Replaces the legacy `getActiveSocialLinks()` helper in siteConfig.js.
 */
export function getActiveSocialLinks() {
  const platforms = [
    { name: 'Instagram', url: siteSettings.socialInstagram },
    { name: 'Vimeo', url: siteSettings.socialVimeo },
    { name: 'LinkedIn', url: siteSettings.socialLinkedin },
    { name: 'Twitter', url: siteSettings.socialTwitter },
    { name: 'Behance', url: siteSettings.socialBehance },
  ];
  return platforms.filter((p) => p.url);
}
