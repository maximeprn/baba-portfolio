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
// Full transition: used for the PREVIOUS image (rAF doesn't drive it)
const GALLERY_TRANSITION = `
  top 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  width 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  max-height 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  transform 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  opacity 700ms cubic-bezier(0.25, 0.1, 0.25, 1)
`.replace(/\n/g, '').trim();

// Selected image: rAF drives top, left, and transform — only CSS-transition width/maxHeight/opacity
const GALLERY_TRANSITION_SELECTED = `
  width 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  max-height 700ms cubic-bezier(0.25, 0.1, 0.25, 1),
  opacity 700ms cubic-bezier(0.25, 0.1, 0.25, 1)
`.replace(/\n/g, '').trim();

const STRIP_SHIFT_MS = 700;          // rAF strip-shift duration — must match GALLERY_TRANSITION's transform timing
const TRANSITION_DURATION_MS = 4000;  // how long CSS transition property stays declared (z-index, prevIndex gating)

// ─── Selected Image Sizing ─────────────────────────────────────────
const CENTER_WIDTH = 'min(25vw, 42svh)';
const SCROLL_SCALE_MAX = 1.5;

// ─── Scatter Parallax (during scroll phase) ────────────────────────
const SCATTER_SCROLL_SPEED = 1.2;

// ─── Depth Scale (3D conveyor-belt effect) ──────────────────────────
const DEPTH_SCALE_CENTER = 1.2;    // scale at viewport center (50vw)
const DEPTH_SCALE_EDGE = 0.85;     // scale at viewport edges
const DEPTH_FALLOFF_HALF = 55;     // vw distance from center to reach EDGE
const DEPTH_EASING_POWER = 1.9;    // >1 = sharper peak at center

// ─── Hero Cursor Parallax ───────────────────────────────────────────
const HERO_PARALLAX_PX = 12;       // max pixel shift on each axis


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
    let initialOffset = basePositions[initialIndex] + scaledWidths[initialIndex] / 2 - 50;
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

  // Container geometry for vw→% conversion (rAF reads this)
  const containerRectRef = useRef({ left: 0, width: window.innerWidth });

  // Inner container (for measuring vw→% offset)
  const innerContainerRef = useRef(null);

  // Marquee
  const marqueeOffsetRef = useRef(0);
  const imageElsRef = useRef([]);
  const marqueeRafRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const scrollProgressRef = useRef(0);

  // Mouse position for interactive marquee speed + hero parallax
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  // Strip-shift animation state: { startOffset, delta, startTime, duration }
  const offsetAnimRef = useRef(null);

  // heroScale mirror for rAF (avoids stale closure)
  const heroScaleRef = useRef(1);

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
      // Measure inner container for vw→% conversion in rAF loop
      if (innerContainerRef.current) {
        const rect = innerContainerRef.current.getBoundingClientRect();
        containerRectRef.current = { left: rect.left, width: rect.width };
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
      mouseYRef.current = (e.clientY / window.innerHeight) * 2 - 1;
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
  heroScaleRef.current = heroScale;

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

    const { basePositions, scaledWidths, totalWidth, maxScaledWidth, initialOffset, topValues } = marqueeLayout;
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
      let stripEased = null;  // null = no active strip-shift
      let animStartDs = 1;
      let animStartTop = 50;  // default to 50% (center)

      const anim = offsetAnimRef.current;
      if (anim) {
        if (anim.startTime === null) anim.startTime = timestamp;
        const elapsed = timestamp - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const eased = easeOutCubic(t);
        marqueeOffsetRef.current = anim.startOffset + anim.delta * eased;

        // Normalize within [0, totalWidth)
        marqueeOffsetRef.current = ((marqueeOffsetRef.current % totalWidth) + totalWidth) % totalWidth;

        stripEased = eased;
        animStartDs = anim.startDepthScale || 1;
        animStartTop = anim.startTop != null ? anim.startTop : 50;

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

      // Container geometry for vw→% conversion (selected image uses %)
      const cRect = containerRectRef.current;
      const vw = window.innerWidth;

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

        // LEFT: rAF drives all images.
        // Non-selected: use vw (viewport-relative marquee positioning).
        // Selected during animation: convert vw→% so it converges to 50% of parent.
        // Selected settled: pin at 50% of parent.
        if (isSelected && !animating) {
          el.style.left = '50%';
        } else if (isSelected && animating) {
          // Image center in vw → convert to % of parent
          const centerVw = x + scaledWidths[i] / 2;
          const centerPx = centerVw * vw / 100;
          const centerPct = (centerPx - cRect.left) / cRect.width * 100;
          el.style.left = `${centerPct.toFixed(2)}%`;
        } else {
          el.style.left = `${x.toFixed(2)}vw`;
        }

        // TOP: rAF drives selected image's top during strip-shift
        // to keep vertical motion in sync with horizontal (same easeOutCubic).
        if (isSelected && stripEased !== null) {
          const p = stripEased;
          const topPct = animStartTop + (50 - animStartTop) * p;
          el.style.top = `${topPct.toFixed(2)}%`;
        } else if (isSelected && animating) {
          el.style.top = '50%';
        }

        // TRANSFORM: rAF drives selected image's transform during strip-shift
        // to keep it perfectly in sync with left (same easeOutCubic, same frame).
        if (isSelected && stripEased !== null) {
          const p = stripEased;
          const scl = (animStartDs + (heroScaleRef.current - animStartDs) * p).toFixed(4);
          // Full translate(-50%, -50%) from frame 1: visual center = left position,
          // regardless of CSS width transition. Only scale interpolates.
          el.style.transform = `translate(-50%, -50%) scale(${scl})`;
        } else if (isSelected && animating) {
          // Strip-shift done but still in transition window: hold final values
          el.style.transform = `translate(-50%, -50%) scale(${heroScaleRef.current})`;
        } else if (isSelected && !isTransitioning) {
          // Settled: pin transform + cursor parallax on inner content
          el.style.transform = `translate(-50%, -50%) scale(${heroScaleRef.current})`;
          const inner = el.firstElementChild?.firstElementChild;
          if (inner) {
            const px = mouseXRef.current * HERO_PARALLAX_PX;
            const py = mouseYRef.current * HERO_PARALLAX_PX;
            inner.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
          }
        } else if (!isSelected && !isTransitioning) {
          el.style.transform = `translate(0px, ${-parallaxY}px) scale(${ds.toFixed(4)})`;
          // Clear any leftover inner parallax from when this image was selected
          const inner = el.firstElementChild?.firstElementChild;
          if (inner && inner.style.transform) inner.style.transform = '';
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
    const current = selectedIndexRef.current;
    if (index === current) return;

    // Sync refs immediately so the rAF loop picks up the change this frame
    // (useEffect would only fire after paint — too late, causes 1-2 frame glitch)
    selectedIndexRef.current = index;
    prevIndexRef.current = current;

    setSelectedIndex(index);
    setPrevIndex(current);

    hasInteractedRef.current = true;
    isTransitioningRef.current = true;

    // Compute target offset: position clicked image at 50vw
    const { basePositions, totalWidth } = marqueeLayout;
    let targetOffset = basePositions[index] + marqueeLayout.scaledWidths[index] / 2 - 50;
    targetOffset = ((targetOffset % totalWidth) + totalWidth) % totalWidth;

    const delta = shortestWrappingDelta(marqueeOffsetRef.current, targetOffset, totalWidth);
    offsetAnimRef.current = {
      startOffset: marqueeOffsetRef.current,
      delta,
      startTime: null,
      duration: STRIP_SHIFT_MS,
      startDepthScale: depthScalesRef.current[index] || 1,
      startTop: marqueeLayout.topValues[index],
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
          ref={innerContainerRef}
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
                  left:      isSelected ? '50%' : `${fallbackX.toFixed(2)}vw`,  // rAF overwrites during animation
                  width:     isSelected
                    ? (prefersReducedMotion ? 'min(45vw, 70svh)' : CENTER_WIDTH)
                    : marqueeLayout.widthStrings[i],
                  maxHeight: isSelected ? '100svh' : '22svh',
                  overflow:  'hidden',
                  transform: isSelected
                    ? `translate(-50%, -50%) scale(${prefersReducedMotion ? 1 : heroScale})`
                    : `translate(0px, ${-scatterParallaxY}px) scale(${(depthScalesRef.current[i] || 1).toFixed(4)})`,
                  zIndex:    isSelected ? 40 : isPrev ? 30 : (marqueeLayout.rows[i] + 1) * 10,
                  transition: isClickAnimating
                    ? (isSelected ? GALLERY_TRANSITION_SELECTED : GALLERY_TRANSITION)
                    : 'none',
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
                      className="w-full h-auto object-cover"
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
