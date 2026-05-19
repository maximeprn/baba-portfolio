/**
 * SITE CONFIGURATION
 *
 * Site-wide values consumed by components. Most fields now stream from the
 * Sanity CMS via `src/sanity/loader.js`; a few (tagline, navigation
 * structure, contact location) remain hardcoded here for Stage 1 of the CMS
 * migration and will be promoted in future stages.
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
    // Pass through the videoShorts mapper so the autoplaying hero background
    // streams the shortened teaser when one exists in public/videos/.
    videoFile: shortVideo(cmsShowreel.videoFile),
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
