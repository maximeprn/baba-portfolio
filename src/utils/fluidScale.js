/**
 * Fluid type scaling helper.
 *
 * Returns a CSS `clamp(...)` expression that scales a font size with the
 * viewport: floor at `mobileRatio` of the base value, ceiling at the base
 * value itself, with a linear ramp in between.
 *
 *   clamp(base × mobileRatio, base/10 vw, base)
 *
 * The preferred value (`base/10 vw`) matches `base px` at ~1000px viewport,
 * so the desktop CMS value applies on standard laptop / desktop widths and
 * the floor kicks in before that.
 *
 * Used by both the nav links (Navigation.jsx) and the hero overlay items
 * (HeroSection.jsx) so they scale consistently.
 */
export function fluidScale(px, { mobileRatio = 0.85 } = {}) {
  const min = Math.round(px * mobileRatio);
  const preferred = +(px / 10).toFixed(2);
  return `clamp(${min}px, ${preferred}vw, ${px}px)`;
}
