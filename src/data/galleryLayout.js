/**
 * ============================================================================
 * GALLERY LAYOUT DATA — Floating Gallery Hero for Photos Page
 * ============================================================================
 *
 * Deterministic layout for the scattered collage hero.
 * Each slot references a real image in /public/img/ with its position,
 * size, depth layer, and the project it links to.
 *
 * DEPTH LAYERS (conveyed through size + parallax):
 *   Layer 0 (far):  small images, subtle parallax
 *   Layer 1 (mid):  medium images
 *   Layer 2 (near): large images, strongest parallax
 *
 * ============================================================================
 */

/**
 * Desktop hero images — scattered collage matching editorial reference.
 * Positions are in % (top/left) so they scale with viewport.
 * Width is in vw for responsive sizing.
 */
export const DESKTOP_HERO_IMAGES = [
  // ─── Original 6 ────────────────────────────────────────────────
  { src: '/img/portrait.png',        alt: 'Portrait close-up',                slug: 'portraits-series',     layer: 2, top: 14, left: 3,  width: '18vw', floatDelay: 0 },
  { src: '/img/chainlink.png',       alt: 'Chain-link fence action shot',     slug: 'summer-campaign-2024', layer: 0, top: 22, left: 30, width: '11vw', floatDelay: 1.5 },
  { src: '/img/dancers.png',         alt: 'Dancers in motion',               slug: 'summer-campaign-2024', layer: 2, top: 8,  left: 55, width: '27vw', floatDelay: 0.8 },
  { src: '/img/sacai.png',           alt: 'Sacai fashion detail',            slug: 'summer-campaign-2024', layer: 1, top: 30, left: 38, width: '16vw', floatDelay: 2.2 },
  { src: '/img/legs.png',            alt: 'Legs in urban environment',       slug: 'documentary-work',     layer: 2, top: 42, left: 3,  width: '30vw', floatDelay: 1 },
  { src: '/img/metallic.png',        alt: 'Metallic texture close-up',       slug: 'documentary-work',     layer: 2, top: 33, left: 62, width: '25vw', floatDelay: 2.5 },

  // ─── Cycling / Urban ───────────────────────────────────────────
  { src: '/img/cyclist-stairs.png',  alt: 'Cyclist wheelie on stairs',       slug: 'documentary-work',     layer: 2, top: 18, left: 15, width: '22vw', floatDelay: 0.3 },
  { src: '/img/cyclist-lowangle.png',alt: 'Low-angle cyclist in city',       slug: 'documentary-work',     layer: 1, top: 38, left: 45, width: '16vw', floatDelay: 1.8 },
  { src: '/img/cyclist-aerial.png',  alt: 'Aerial view cyclist on road',     slug: 'documentary-work',     layer: 0, top: 12, left: 70, width: '13vw', floatDelay: 2.8 },
  { src: '/img/cyclist-stairs-2.png',alt: 'Cyclist balancing on staircase',  slug: 'documentary-work',     layer: 1, top: 28, left: 20, width: '19vw', floatDelay: 0.6 },

  // ─── Judo / Sports ─────────────────────────────────────────────
  { src: '/img/judo-throw.png',      alt: 'Judo throw mid-air',             slug: 'documentary-work',     layer: 2, top: 10, left: 50, width: '24vw', floatDelay: 1.2 },
  { src: '/img/judo-ground.png',     alt: 'Judo ground grapple overhead',   slug: 'documentary-work',     layer: 2, top: 35, left: 10, width: '20vw', floatDelay: 2.0 },
  { src: '/img/judo-feet.png',       alt: 'Judo close-up feet on mat',      slug: 'documentary-work',     layer: 0, top: 40, left: 55, width: '12vw', floatDelay: 3.1 },
  { src: '/img/judo-blur.png',       alt: 'Motion blur judo exchange',      slug: 'documentary-work',     layer: 1, top: 25, left: 35, width: '17vw', floatDelay: 1.4 },

  // ─── Portrait ──────────────────────────────────────────────────
  { src: '/img/boxer-portrait.png',  alt: 'Boxer silhouette with taped hands', slug: 'portraits-series', layer: 1, top: 32, left: 75, width: '15vw', floatDelay: 2.4 },
];

/**
 * Mobile hero images — fewer images, larger sizes for narrow viewport.
 */
export const MOBILE_HERO_IMAGES = [
  { src: '/img/portrait.png',  alt: 'Portrait close-up',           slug: 'portraits-series',     layer: 1, top: 5,  left: 5,  width: '45vw', floatDelay: 0 },
  { src: '/img/dancers.png',   alt: 'Dancers in motion',           slug: 'summer-campaign-2024', layer: 2, top: 2,  left: 45, width: '55vw', floatDelay: 1 },
  { src: '/img/sacai.png',     alt: 'Sacai fashion detail',        slug: 'summer-campaign-2024', layer: 0, top: 42, left: 55, width: '30vw', floatDelay: 2 },
  { src: '/img/legs.png',      alt: 'Legs in urban environment',   slug: 'documentary-work',     layer: 1, top: 48, left: 5,  width: '50vw', floatDelay: 0.5 },
  { src: '/img/metallic.png',  alt: 'Metallic texture close-up',   slug: 'documentary-work',     layer: 2, top: 70, left: 35, width: '55vw', floatDelay: 3 },
];

/** Parallax multiplier per depth layer */
export const LAYER_PARALLAX = [0.3, 0.6, 1.0];

/** Float animation class per depth layer */
export const LAYER_FLOAT_CLASS = [
  'animate-float-slow',   // far: slow, small amplitude
  'animate-float',        // mid: existing float animation
  'animate-float-gentle', // near: medium speed, asymmetric path
];
