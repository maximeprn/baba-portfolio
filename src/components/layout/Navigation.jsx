/**
 * ============================================================================
 * NAVIGATION COMPONENT
 * ============================================================================
 *
 * Absolute-positioned nav at the very top of every page. It scrolls away
 * with the page content (it is NOT position:fixed). Two link colors:
 *
 * - Hero pages (/, /photos): white text — overlays the hero image/video.
 * - All other pages: dark text — overlays the page header in flow.
 *
 * Active-link style is toggled via siteConfig.navigation.activeStyle:
 *
 *   'pill'        — sliding inverted-chip highlight that follows hover and
 *                   defaults to the active page. Three render layers
 *                   (background pill + default-color links + clipped
 *                   inverted-color clone) so letters under the pill always
 *                   read in the contrasting colour.
 *   'bold-larger' — active link is rendered slightly bigger + with heavier
 *                   font weight; no background, no clone, no measurements.
 *
 * Both implementations live in this file so swapping is a one-line config
 * change. Wire siteConfig.navigation.activeStyle to a CMS-controlled
 * setting to flip styles without a code deploy.
 *
 * ============================================================================
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { siteConfig } from '../../data/siteConfig';


const PILL_TRANSITION = 'cubic-bezier(0.4, 0, 0.2, 1) 320ms';


/**
 * NavPill — sliding inverted-chip highlight.
 *
 * Three layers:
 *   1. The pill background (opaque rectangle) behind everything.
 *   2. The default-color <Link>s (interactive).
 *   3. An inverted-color clone, clipped to the pill's rect via clip-path,
 *      so the letters that sit under the pill always read in the
 *      opposite color — no matter where the pill is mid-slide.
 */
function NavPill({ center, isActive, isHeroPage }) {
  const containerRef = useRef(null);
  const linkRefs = useRef({});
  const [hoveredPath, setHoveredPath] = useState(null);
  const [pillRect, setPillRect] = useState(null);
  // Suppress transitions on the very first measurement so the pill doesn't
  // glide in from (0,0). Flips to true after the first paint.
  const [armed, setArmed] = useState(false);

  const linkColor = isHeroPage ? 'text-white' : 'text-[var(--color-text)]';
  const invertedColor = isHeroPage ? 'text-black' : 'text-white';
  const pillBg = isHeroPage ? 'bg-white' : 'bg-gray-900';

  const activeItem = center.find((item) => isActive(item.path));
  const targetPath = hoveredPath ?? activeItem?.path ?? null;

  const measure = useCallback(() => {
    if (!targetPath || !containerRef.current) {
      setPillRect(null);
      return;
    }
    const linkEl = linkRefs.current[targetPath];
    if (!linkEl) return;
    // The pill matches the chip span (the padded box around the label),
    // not the whole <Link> — so its size is consistent across links of
    // different label widths.
    const chip = linkEl.querySelector('[data-nav-chip]') || linkEl;
    const chipBox = chip.getBoundingClientRect();
    const containerBox = containerRef.current.getBoundingClientRect();
    setPillRect({
      x: chipBox.left - containerBox.left,
      y: chipBox.top - containerBox.top,
      w: chipBox.width,
      h: chipBox.height,
      cw: containerBox.width,
      ch: containerBox.height,
    });
  }, [targetPath]);

  // Measure synchronously before paint so the pill is already in place
  // on first render — no jump.
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Arm transitions one frame after the first measurement so the very
  // first paint isn't a slide-in from (0,0).
  useEffect(() => {
    if (armed || !pillRect) return;
    const raf = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(raf);
  }, [armed, pillRect]);

  // Re-measure on layout changes (window resize, font load).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Clip-path for the inverted-text overlay: an inset rectangle whose
  // interior matches the pill's bounds. When the pill slides, the
  // clip-path animates with it and the inverted letters appear/disappear
  // exactly where the pill is.
  const clipPath = pillRect
    ? `inset(${pillRect.y}px ${pillRect.cw - pillRect.x - pillRect.w}px ${pillRect.ch - pillRect.y - pillRect.h}px ${pillRect.x}px)`
    : 'inset(50% 50% 50% 50%)'; // fully closed = nothing visible

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center gap-12 md:gap-16"
      onMouseLeave={() => setHoveredPath(null)}
    >
      {/* Layer 1 — sliding pill background. */}
      <div
        aria-hidden="true"
        className={`absolute pointer-events-none ${pillBg}`}
        style={{
          left: 0,
          top: 0,
          width: pillRect ? pillRect.w : 0,
          height: pillRect ? pillRect.h : 0,
          transform: pillRect
            ? `translate(${pillRect.x}px, ${pillRect.y}px)`
            : 'translate(0, 0)',
          opacity: pillRect ? 1 : 0,
          transition: armed
            ? `transform ${PILL_TRANSITION}, width ${PILL_TRANSITION}, height ${PILL_TRANSITION}, opacity 150ms linear`
            : 'none',
        }}
      />

      {/* Layer 2 — default-color, interactive links. */}
      {center.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            ref={(el) => {
              if (el) linkRefs.current[item.path] = el;
              else delete linkRefs.current[item.path];
            }}
            onMouseEnter={() => setHoveredPath(item.path)}
            onFocus={() => setHoveredPath(item.path)}
            onBlur={() => setHoveredPath(null)}
            className={[
              'relative inline-block font-header font-medium tracking-[0.08em]',
              active ? 'text-[18px]' : 'text-[16px]',
              linkColor,
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <span
              data-nav-chip
              className="px-2 py-0.5 box-decoration-clone"
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Layer 3 — inverted-color clone, clipped to the pill. Mirrors
          the layout of layer 2 exactly so letters line up pixel-for-
          pixel under the pill. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none flex items-center justify-center gap-12 md:gap-16"
        style={{
          clipPath,
          WebkitClipPath: clipPath,
          transition: armed
            ? `clip-path ${PILL_TRANSITION}, -webkit-clip-path ${PILL_TRANSITION}`
            : 'none',
        }}
      >
        {center.map((item) => {
          const active = isActive(item.path);
          return (
            <span
              key={item.path}
              className={[
                'inline-block font-header font-medium tracking-[0.08em]',
                active ? 'text-[18px]' : 'text-[16px]',
                invertedColor,
              ].join(' ')}
            >
              <span className="px-2 py-0.5 box-decoration-clone">
                {item.label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}


/**
 * NavBoldLarger — active link rendered slightly larger + with heavier
 * font weight. No background, no measurements, no animations beyond a
 * subtle hover dim on inactive links.
 */
function NavBoldLarger({ center, isActive, linkColor }) {
  return (
    <div className="flex items-center justify-center gap-12 md:gap-16">
      {center.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={[
              'inline-block font-header tracking-[0.08em] transition-opacity duration-150',
              active
                ? 'text-[20px] font-semibold'
                : 'text-[16px] font-medium hover:opacity-70',
              linkColor,
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}


function Navigation() {
  const location = useLocation();
  const { center, activeStyle = 'bold-larger' } = siteConfig.navigation;

  const isHeroPage =
    location.pathname === '/' || location.pathname === '/photos';
  const linkColor = isHeroPage ? 'text-white' : 'text-[var(--color-text)]';

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className="absolute top-0 inset-x-0 z-30 h-20 flex items-center justify-center pointer-events-none"
    >
      <nav
        className="w-full max-w-container mx-auto px-4 md:px-6 flex items-center justify-center pointer-events-auto"
        role="navigation"
        aria-label="Main navigation"
      >
        {activeStyle === 'pill' ? (
          <NavPill
            center={center}
            isActive={isActive}
            isHeroPage={isHeroPage}
          />
        ) : (
          <NavBoldLarger
            center={center}
            isActive={isActive}
            linkColor={linkColor}
          />
        )}
      </nav>
    </header>
  );
}


export default Navigation;
