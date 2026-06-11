/**
 * SITE CONFIGURATION
 *
 * Site-wide values consumed by components. The CMS migration is complete
 * through Stage 6 (Mux video); this file remains a compatibility shim around
 * `src/sanity/loader.js`. A few fields (tagline, navigation structure,
 * contact location) are still hardcoded here — largely unused by components
 * but kept for shape compatibility.
 *
 * The exported `siteConfig` keeps the legacy nested shape so existing
 * component imports (Footer, Navigation, HeroSection, etc.) work unchanged.
 */

import { shortVideo } from './videoShorts';
import {
  siteSettings as cmsSiteSettings,
  showreel as cmsShowreel,
  getActiveSocialLinks as cmsGetActiveSocialLinks,
} from '../sanity/loader';

export const siteConfig = {
  artist: {
    name: cmsSiteSettings.artistName,
    firstName: cmsSiteSettings.artistFirstName,
    lastName: cmsSiteSettings.artistLastName,
    // Not yet in CMS — promoted in a future stage if Basile wants to change it.
    tagline: 'Reinventing the Frame',
    shortBio: 'Sports photographer and filmmaker exploring the poetry of athletic movement',
    title: 'Sports Photographer & Filmmaker',
  },

  // Stage 1: contact info now lives inside the hero overlay items in the CMS.
  // These fields are retained here so any leftover references don't crash;
  // they're not the source of truth for what's displayed on the site.
  contact: {
    email: 'basiledeschamps3@gmail.com',
    phone: null,
    location: 'Paris, France',
  },

  social: {
    instagram: cmsSiteSettings.socialInstagram,
    vimeo: cmsSiteSettings.socialVimeo,
    linkedin: cmsSiteSettings.socialLinkedin,
    twitter: cmsSiteSettings.socialTwitter,
    behance: cmsSiteSettings.socialBehance,
  },

  navigation: {
    activeStyle: cmsSiteSettings.navActiveStyle,
    linkSize: cmsSiteSettings.navLinkSize,
    activeLinkSize: cmsSiteSettings.navLinkActiveSize,
    left: [],
    center: [
      { label: 'Photos', path: '/photos' },
      { label: 'Films', path: '/' },
    ],
    right: [],
  },

  seo: {
    title: cmsSiteSettings.seoTitle,
    description: cmsSiteSettings.seoDescription,
    keywords: cmsSiteSettings.seoKeywords,
    ogImage: cmsSiteSettings.ogImageUrl,
    siteUrl: cmsSiteSettings.siteUrl,
  },

  showreel: {
    vimeoUrl: cmsShowreel.vimeoUrl,
    // Legacy Blob path (kept as transitional fallback for browsers/states
    // where the Mux asset isn't ready yet). Routed through shortVideo() so
    // the runtime gets the teaser cut + Blob URL.
    videoFile: cmsShowreel.videoFile ? shortVideo(cmsShowreel.videoFile) : null,
    // Mux fields — prefer these when present.
    muxStreamUrl: cmsShowreel.muxStreamUrl,
    muxPosterUrl: cmsShowreel.muxPosterUrl,
    posterImageUrl: cmsShowreel.posterImageUrl,
  },

  footer: {
    copyright: cmsSiteSettings.footerCopyright,
    showSocial: cmsSiteSettings.footerShowSocial,
    links: [],
  },
};

export const getActiveSocialLinks = cmsGetActiveSocialLinks;

export const getAllNavItems = () => {
  const { left, center, right } = siteConfig.navigation;
  return [...left, ...center, ...right];
};

export default siteConfig;
