/**
 * ============================================================================
 * FLOATING GALLERY HERO — Interactive Marquee + Scale-Pin Gallery
 * ============================================================================
 *
 * THREE-ROW DEPTH LAYOUT:
 * Images alternate across 3 rows (top/mid/bottom) with per-row size scaling:
 *   Row 0 (far):  small images, top of viewport — subtle, background feel
 *   Row 1 (mid):  medium images, middle band
 *   Row 2 (near): large images, lower band — dominant, foreground feel
 * All rows stay above the persistent BASILE DESCHAMPS hero text (~55%+).
 *
 * MARQUEE SYSTEM:
 * A rAF loop updates el.style.left on each image every frame. Mouse position
 * controls direction & speed of continuous drift.
 *
 * STRIP-SHIFT SELECTION:
 * Clicking a marquee image animates the entire strip (via marqueeOffsetRef)
 * so the clicked image arrives at center. All surrounding images shift together.
 * The rAF loop drives horizontal positioning; CSS transitions handle vertical
 * centering, size, scale, and opacity independently.
 *
 * Desktop: marquee + click-to-select + scroll-to-grow
 * Mobile:  simple scattered layout, direct links
 *
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DESKTOP_HERO_IMAGES,
  MOBILE_HERO_IMAGES,
  LAYER_FLOAT_CLASS,
} from '../../data/galleryLayout';
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

// ─── Scroll Constants ──────────────────────────────────────────────
const GROW_PHASE_VH_MULTIPLIER = 1.1;

// ─── Marquee Constants ─────────────────────────────────────────────
const MAX_VISIBLE = 9;
const MARQUEE_GAP_VW = 1;
const MARQUEE_BASE_SPEED = 0.008;
const MARQUEE_MOUSE_SPEED = 0.08;

// ─── Three-Row Depth Layout ────────────────────────────────────────
const ROW_TOPS = [3, 16, 30];             // baseline top % per row
const ROW_JITTER = 6;                      // vertical variation within a row
const ROW_DEPTH_SCALE = [0.55, 1.0, 1.5]; // size multiplier: far → near

// ─── CSS Transition (gallery reorganization on click) ──────────────
const GALLERY_TRANSITION = `
  top 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  width 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  max-height 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  transform 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  opacity 700ms cubic-bezier(0.25, 0.1, 0.25, 1)
`.replace(/\n/g, '').trim();

const TRANSITION_DURATION_MS = 4000;

// ─── Selected Image Sizing ─────────────────────────────────────────
const CENTER_WIDTH = 'min(25vw, 42svh)';
const SCROLL_SCALE_MAX = 1.9;

// ─── Scatter Parallax (during scroll phase) ────────────────────────
const SCATTER_SCROLL_SPEED = 1.2;

// ─── Depth Scale (3D conveyor-belt effect) ──────────────────────────
const DEPTH_SCALE_CENTER = 1.2;    // scale at viewport center (50vw)
const DEPTH_SCALE_EDGE = 0.85;     // scale at viewport edges
const DEPTH_FALLOFF_HALF = 55;     // vw distance from center to reach EDGE
const DEPTH_EASING_POWER = 1.9;    // >1 = sharper peak at center


/**
 * Find the image whose top/left position is closest to the center (50%, 50%).
 */
function findCenterImageIndex(images) {
  let minDist = Infinity;
  let idx = 0;
  images.forEach((img, i) => {
    const dx = img.left - 50;
    const dy = img.top - 50;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  });
  return idx;
}

/**
 * Cubic ease-out for smooth deceleration on strip-shift animations.
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Map an image's horizontal center (in vw) to a depth scale factor.
 * Center of viewport (50vw) → DEPTH_SCALE_CENTER, edges → DEPTH_SCALE_EDGE.
 */
function computeDepthScale(imgCenterVw) {
  const dist = Math.abs(imgCenterVw - 50);
  const proximity = Math.max(0, 1 - dist / DEPTH_FALLOFF_HALF);
  const smooth = Math.pow(proximity, DEPTH_EASING_POWER);
  return DEPTH_SCALE_EDGE + smooth * (DEPTH_SCALE_CENTER - DEPTH_SCALE_EDGE);
}

/**
 * Compute the shortest delta to travel from `current` to `target`
 * on a wrapping number line of length `totalWidth`.
 * Returns a signed delta (positive = shift right, negative = shift left).
 */
function shortestWrappingDelta(current, target, totalWidth) {
  const c = ((current % totalWidth) + totalWidth) % totalWidth;
  const t = ((target % totalWidth) + totalWidth) % totalWidth;
  let delta = t - c;
  if (delta > totalWidth / 2) delta -= totalWidth;
  if (delta < -totalWidth / 2) delta += totalWidth;
  return delta;
}


function FloatingGalleryHero() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { addScrollListener, scrollTo: smoothScrollTo } = useSmoothScrollContext();
  const navigate = useNavigate();

  // Depth scale: per-image scale factors (rAF writes, React reads for inline style)
  const depthScalesRef = useRef(null);

  // Mirrors of React state for the rAF loop (avoids stale closure)
  const selectedIndexRef = useRef(findCenterImageIndex(DESKTOP_HERO_IMAGES));
  const prevIndexRef = useRef(null);

  // =========================================================================
  // MARQUEE LAYOUT (static — depends only on image data)
  // =========================================================================

  const marqueeLayout = useMemo(() => {
    const images = DESKTOP_HERO_IMAGES;
    const N = images.length;
    const widthsVw = images.map(img => parseFloat(img.width));
    const avgWidth = widthsVw.reduce((a, b) => a + b, 0) / N;

    // Base scale for ~MAX_VISIBLE images in viewport
    const targetSlotWidth = 100 / Math.min(N, MAX_VISIBLE);
    const baseScale = targetSlotWidth / (avgWidth + MARQUEE_GAP_VW);

    // Assign rows round-robin and apply depth-based size scaling
    const rows = images.map((_, i) => i % 3);
    const scaledWidths = widthsVw.map((w, i) => w * baseScale * ROW_DEPTH_SCALE[rows[i]]);
    const scaledGap = MARQUEE_GAP_VW * baseScale;

    // Natural strip width
    let naturalTotal = 0;
    for (let i = 0; i < N; i++) {
      naturalTotal += scaledWidths[i] + scaledGap;
    }

    // Ensure strip > 100vw + maxWidth for seamless off-screen wrapping
    const maxWidth = Math.max(...scaledWidths);
    const minTotal = 100 + maxWidth + scaledGap;
    const totalWidth = Math.max(naturalTotal, minTotal);

    // Redistribute extra space as additional gap
    const extraPerSlot = (totalWidth - naturalTotal) / N;
    const effectiveGap = scaledGap + extraPerSlot;

    let cumX = 0;
    const basePositions = [];
    for (let i = 0; i < N; i++) {
      basePositions.push(cumX);
      cumX += scaledWidths[i] + effectiveGap;
    }

    // Three-row vertical positions with deterministic jitter
    const topValues = images.map((_, i) => {
      const row = rows[i];
      const base = ROW_TOPS[row];
      const jitter = (i * 3) % ROW_JITTER;
      return base + jitter;
    });

    // Compute initial offset so the default selected image starts at center
    const initialIndex = findCenterImageIndex(DESKTOP_HERO_IMAGES);
    let initialOffset = basePositions[initialIndex] - 50;
    initialOffset = ((initialOffset % totalWidth) + totalWidth) % totalWidth;

    // Pre-compute initial depth scales so first render doesn't flash with scale(1)
    const initialDepthScales = basePositions.map((pos, i) => {
      const x = ((pos - initialOffset) % totalWidth + totalWidth) % totalWidth;
      const imgCenter = x + scaledWidths[i] / 2;
      return computeDepthScale(imgCenter);
    });

    return {
      basePositions,
      scaledWidths,
      totalWidth,
      topValues,
      rows,
      maxScaledWidth: maxWidth,
      widthStrings: scaledWidths.map(w => `${w.toFixed(2)}vw`),
      initialOffset,
      initialDepthScales,
    };
  }, []);

  // Lazy-init depthScalesRef from pre-computed values
  if (depthScalesRef.current === null) {
    depthScalesRef.current = marqueeLayout.initialDepthScales;
  }

  // =========================================================================
  // STATE
  // =========================================================================

  const [selectedIndex, setSelectedIndex] = useState(
    () => findCenterImageIndex(DESKTOP_HERO_IMAGES)
  );

  const [prevIndex, setPrevIndex] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // =========================================================================
  // REFS
  // =========================================================================

  const isGrownRef = useRef(false);
  const prevTimeoutRef = useRef(null);
  const hasInteractedRef = useRef(false);

  // Section offset (for simulated sticky)
  const sectionRef = useRef(null);
  const sectionTopRef = useRef(0);

  // Marquee
  const marqueeOffsetRef = useRef(0);
  const imageElsRef = useRef([]);
  const marqueeRafRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const scrollProgressRef = useRef(0);

  // Mouse position for interactive marquee speed
  const mouseXRef = useRef(0);

  // Strip-shift animation state: { startOffset, delta, startTime, duration }
  const offsetAnimRef = useRef(null);

  // =========================================================================
  // MEASURE SECTION OFFSET (for simulated sticky)
  // =========================================================================

  useEffect(() => {
    const measure = () => {
      if (sectionRef.current) {
        let top = 0;
        let el = sectionRef.current;
        while (el) {
          top += el.offsetTop;
          el = el.offsetParent;
        }
        sectionTopRef.current = top;
      }
    };
    requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // =========================================================================
  // MOUSE TRACKING (for marquee speed control)
  // =========================================================================

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      mouseXRef.current = (e.clientX / window.innerWidth) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  // =========================================================================
  // SYNC STATE → REFS (for rAF access without stale closures)
  // =========================================================================

  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  useEffect(() => { prevIndexRef.current = prevIndex; }, [prevIndex]);

  // =========================================================================
  // DERIVED VALUES
  // =========================================================================

  const heroImage = DESKTOP_HERO_IMAGES[selectedIndex];
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const growPhaseEnd = vh * GROW_PHASE_VH_MULTIPLIER;

  const sectionTop = sectionTopRef.current;
  const adjustedScroll = Math.max(0, scrollProgress - sectionTop);

  const maxPinScroll = 1.1 * vh + 150;
  const pinOffset = Math.min(adjustedScroll, maxPinScroll);

  const isClickAnimating =
    hasInteractedRef.current &&
    !prefersReducedMotion &&
    prevIndex !== null &&
    adjustedScroll < 5;

  let heroScale;
  if (prefersReducedMotion || screenWidth < 768) {
    heroScale = 1;
  } else {
    const progress = Math.min(1, Math.max(0, adjustedScroll / growPhaseEnd));
    heroScale = 1 + progress * (SCROLL_SCALE_MAX - 1);
  }

  const scatterParallaxY = prefersReducedMotion ? 0 : adjustedScroll * SCATTER_SCROLL_SPEED;

  const scrollFraction = screenWidth >= 768
    ? Math.min(1, adjustedScroll / growPhaseEnd)
    : 0;
  const scatterOpacity = Math.max(0, 1 - Math.max(0, scrollFraction - 0.15) / 0.55);

  // =========================================================================
  // MARQUEE rAF LOOP
  // =========================================================================

  useEffect(() => {
    if (prefersReducedMotion) return;

    const { basePositions, scaledWidths, totalWidth, maxScaledWidth, initialOffset } = marqueeLayout;
    const N = DESKTOP_HERO_IMAGES.length;

    // Initialize marquee offset so the default selected image is centered
    marqueeOffsetRef.current = initialOffset;

    // Wrap threshold: images past this point get shifted left by totalWidth.
    // Ensures the teleport happens in the invisible zone (off-screen both sides).
    const wrapThreshold = totalWidth - maxScaledWidth - 5;

    let lastTime = 0;
    const tick = (timestamp) => {
      if (lastTime === 0) lastTime = timestamp;
      const dt = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;

      const scrollY = scrollProgressRef.current;
      const secTop = sectionTopRef.current;
      const adjusted = Math.max(0, scrollY - secTop);
      const scrollPaused = adjusted > 0;

      // Strip-shift animation (click-to-select): interpolate offset
      const anim = offsetAnimRef.current;
      if (anim) {
        if (anim.startTime === null) anim.startTime = timestamp;
        const elapsed = timestamp - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const eased = easeOutCubic(t);
        marqueeOffsetRef.current = anim.startOffset + anim.delta * eased;

        // Normalize within [0, totalWidth)
        marqueeOffsetRef.current = ((marqueeOffsetRef.current % totalWidth) + totalWidth) % totalWidth;

        if (t >= 1) {
          offsetAnimRef.current = null;
        }
      } else if (!scrollPaused && !isTransitioningRef.current) {
        // Normal mouse-driven drift (only when no animation and not scrolled)
        const speed = MARQUEE_BASE_SPEED + mouseXRef.current * MARQUEE_MOUSE_SPEED;
        marqueeOffsetRef.current += speed * (dt / 16.67);

        if (marqueeOffsetRef.current >= totalWidth) {
          marqueeOffsetRef.current -= totalWidth;
        } else if (marqueeOffsetRef.current < 0) {
          marqueeOffsetRef.current += totalWidth;
        }
      }

      // Position every image via el.style.left (rAF-owned, no CSS transition)
      const offset = marqueeOffsetRef.current;
      const selIdx = selectedIndexRef.current;
      const prvIdx = prevIndexRef.current;
      const animating = isTransitioningRef.current;

      // Compute scroll-based parallax for non-selected images
      const parallaxY = adjusted * SCATTER_SCROLL_SPEED;

      for (let i = 0; i < N; i++) {
        const el = imageElsRef.current[i];
        if (!el) continue;

        const rawX = basePositions[i] - offset;
        let x = ((rawX % totalWidth) + totalWidth) % totalWidth;
        if (x > wrapThreshold) {
          x -= totalWidth;
        }
        // Depth scale: center images larger, edge images smaller
        const imgCenter = x + scaledWidths[i] / 2;
        const ds = computeDepthScale(imgCenter);
        depthScalesRef.current[i] = ds;

        const isSelected = (i === selIdx);
        const isTransitioning = animating && (i === prvIdx || i === selIdx);

        // During strip-shift animation, rAF drives left for ALL images (cohesive slide).
        // After transition, selected image pins at center (React's left:50% takes over).
        if (!isSelected || animating) {
          el.style.left = `${x.toFixed(2)}vw`;
        }
        if (!isSelected && !isTransitioning) {
          el.style.transform = `translate(0px, ${-parallaxY}px) scale(${ds.toFixed(4)})`;
        }
      }

      marqueeRafRef.current = requestAnimationFrame(tick);
    };

    marqueeRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (marqueeRafRef.current) cancelAnimationFrame(marqueeRafRef.current);
    };
  }, [marqueeLayout, prefersReducedMotion]);

  // =========================================================================
  // INTERACTION HANDLERS
  // =========================================================================

  const handleSelect = useCallback((index) => {
    setSelectedIndex((current) => {
      if (index === current) return current;
      setPrevIndex(current);
      return index;
    });

    hasInteractedRef.current = true;
    isTransitioningRef.current = true;

    // Compute target offset: position clicked image at 50vw
    const { basePositions, totalWidth } = marqueeLayout;
    let targetOffset = basePositions[index] - 50;
    targetOffset = ((targetOffset % totalWidth) + totalWidth) % totalWidth;

    const delta = shortestWrappingDelta(marqueeOffsetRef.current, targetOffset, totalWidth);
    offsetAnimRef.current = {
      startOffset: marqueeOffsetRef.current,
      delta,
      startTime: null,
      duration: TRANSITION_DURATION_MS,
    };

    if (prevTimeoutRef.current) clearTimeout(prevTimeoutRef.current);
    prevTimeoutRef.current = setTimeout(() => {
      setPrevIndex(null);
      prevIndexRef.current = null;
      isTransitioningRef.current = false;
    }, TRANSITION_DURATION_MS);
  }, [marqueeLayout]);

  const handleHeroClick = useCallback(() => {
    if (isGrownRef.current) {
      navigate(`/photos/${heroImage.slug}`);
    } else {
      smoothScrollTo(
        sectionTopRef.current + window.innerHeight * GROW_PHASE_VH_MULTIPLIER,
        false
      );
    }
  }, [heroImage.slug, navigate, smoothScrollTo]);

  useEffect(() => {
    return () => {
      if (prevTimeoutRef.current) clearTimeout(prevTimeoutRef.current);
    };
  }, []);

  // =========================================================================
  // SCROLL HANDLER
  // =========================================================================

  useEffect(() => {
    const unsubscribe = addScrollListener((scrollY) => {
      setScrollProgress(scrollY);
      scrollProgressRef.current = scrollY;
      const sTop = sectionTopRef.current;
      const adjusted = Math.max(0, scrollY - sTop);
      isGrownRef.current = adjusted >= window.innerHeight * GROW_PHASE_VH_MULTIPLIER;
    });
    return unsubscribe;
  }, [addScrollListener]);


  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <section className="relative w-full" aria-label="Photo gallery hero">

      {/* ─── DESKTOP: Marquee + scroll-to-grow ───────────────────── */}
      <div
        ref={sectionRef}
        className="hidden md:block relative w-full"
        style={{ height: 'calc(210svh + 150px)' }}
      >
        <div
          className="h-[100svh] w-full overflow-hidden"
          style={{
            transform: `translateY(${pinOffset}px)`,
            willChange: 'transform',
          }}
        >
          {DESKTOP_HERO_IMAGES.map((img, i) => {
            const isSelected = i === selectedIndex;
            const isPrev = i === prevIndex;
            const fallbackX = marqueeLayout.basePositions[i];

            return (
              <div
                key={`${img.slug}-${i}`}
                ref={(el) => { imageElsRef.current[i] = el; }}
                className="absolute"
                style={{
                  top:       isSelected ? '50%' : `${marqueeLayout.topValues[i]}%`,
                  left:      isSelected ? '50%' : `${fallbackX.toFixed(2)}vw`,  // rAF overwrites non-selected
                  width:     isSelected
                    ? (prefersReducedMotion ? 'min(45vw, 70svh)' : CENTER_WIDTH)
                    : marqueeLayout.widthStrings[i],
                  maxHeight: isSelected ? '100svh' : '22svh',
                  overflow:  'hidden',
                  transform: isSelected
                    ? `translate(-50%, -50%) scale(${prefersReducedMotion ? 1 : heroScale})`
                    : `translate(0px, ${-scatterParallaxY}px) scale(${(depthScalesRef.current[i] || 1).toFixed(4)})`,
                  zIndex:    isSelected ? 40 : isPrev ? 30 : (marqueeLayout.rows[i] + 1) * 10,
                  transition: isClickAnimating ? GALLERY_TRANSITION : 'none',
                  opacity:   isSelected ? 1 : scatterOpacity,
                  pointerEvents: !isSelected && scatterOpacity < 0.1 ? 'none' : 'auto',
                }}
              >
                <div>
                  <div
                    role="button"
                    tabIndex={isSelected || scatterOpacity > 0.1 ? 0 : -1}
                    onClick={isSelected ? handleHeroClick : () => handleSelect(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isSelected) {
                          handleHeroClick();
                        } else {
                          handleSelect(i);
                        }
                      }
                    }}
                    className={`
                      block cursor-pointer
                      ${isSelected || prefersReducedMotion ? '' : LAYER_FLOAT_CLASS[img.layer]}
                    `}
                    style={{ animationDelay: `${img.floatDelay}s` }}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="
                        w-full h-auto
                        object-cover
                        transition-transform duration-300
                        hover:scale-105
                      "
                      loading="eager"
                      draggable="false"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ─── MOBILE HERO (unchanged — direct links) ─────────── */}
      <div className="md:hidden relative h-[80svh] w-full overflow-hidden">
        {MOBILE_HERO_IMAGES.map((img, i) => (
          <Link
            key={`m-${img.slug}-${i}`}
            to={`/photos/${img.slug}`}
            className="absolute block"
            style={{
              top: `${img.top}%`,
              left: `${img.left}%`,
              width: img.width,
              zIndex: img.layer * 10,
            }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-auto object-cover"
              loading="eager"
              draggable="false"
            />
          </Link>
        ))}
      </div>


      <h1 className="sr-only">Photos</h1>
    </section>
  );
}

export default FloatingGalleryHero;
