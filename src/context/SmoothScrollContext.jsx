/**
 * ============================================================================
 * SMOOTH SCROLL CONTEXT
 * ============================================================================
 *
 * Provides smooth scroll functionality across the application.
 * Allows any component to programmatically scroll with the smooth scroll system.
 *
 * ============================================================================
 */

import { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';


// Create the context
const SmoothScrollContext = createContext(null);


/**
 * Hook to use smooth scroll functions
 */
export function useSmoothScrollContext() {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    // Return fallback for when smooth scroll is not available
    return {
      scrollTo: (pos, instant) => {
        window.scrollTo({ top: pos, behavior: instant ? 'instant' : 'smooth' });
        return Promise.resolve();
      },
      scrollToElement: (el, options) => el?.scrollIntoView({ behavior: options?.instant ? 'instant' : 'smooth', block: options?.block || 'start' }),
      getScrollPosition: () => window.scrollY,
      addScrollListener: () => () => {},
      setScrollLocked: () => {},
      scrollY: 0,
      isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
    };
  }
  return context;
}


/**
 * Lerp function for smooth interpolation
 */
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}


/**
 * SmoothScrollProvider Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to wrap with smooth scroll
 * @param {number} props.smoothness - Smoothness factor (default: 0.08)
 * @returns {JSX.Element} Smooth scroll provider
 */
export function SmoothScrollProvider({ children, smoothness = 0.08 }) {
  const contentRef = useRef(null);
  const scrollDataRef = useRef({
    current: 0,
    target: 0,
    ease: smoothness,
    rafId: null,
    isScrolling: false,
  });

  // Check if we should use smooth scroll (desktop only, >= 1024px)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Scroll position state that triggers re-renders for subscribers
  const [scrollY, setScrollY] = useState(0);
  const scrollListenersRef = useRef(new Set());

  // Hard lock — when set, wheel/key/touch handlers bail out so an overlay
  // (e.g. Lightbox) can disable page scroll without unmounting the provider.
  const isLockedRef = useRef(false);
  const setScrollLocked = useCallback((locked) => {
    isLockedRef.current = !!locked;
  }, []);

  // Listen for resize to toggle smooth scroll
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Throttle scrollY state updates to ~15fps to avoid excessive re-renders
  const lastScrollYUpdateRef = useRef(0);

  // Update scroll on each animation frame
  const updateScroll = useCallback(() => {
    const data = scrollDataRef.current;
    const content = contentRef.current;

    if (!content) return;

    // Interpolate current position towards target
    data.current = lerp(data.current, data.target, data.ease);

    // Round to avoid sub-pixel rendering issues
    const rounded = Math.round(data.current * 100) / 100;

    // Apply transform
    content.style.transform = `translateY(${-rounded}px)`;

    // Notify all scroll listeners (real-time, no throttle)
    scrollListenersRef.current.forEach(listener => listener(rounded));

    // Throttle scrollY state updates (~15fps)
    const now = performance.now();
    if (now - lastScrollYUpdateRef.current > 66) {
      setScrollY(rounded);
      lastScrollYUpdateRef.current = now;
    }

    // Continue animation if not at target
    const diff = Math.abs(data.target - data.current);
    if (diff > 0.5) {
      data.rafId = requestAnimationFrame(updateScroll);
    } else {
      data.current = data.target;
      content.style.transform = `translateY(${-data.target}px)`;
      setScrollY(data.target);
      scrollListenersRef.current.forEach(listener => listener(data.target));
      data.isScrolling = false;
      // Restore default ease if it was temporarily overridden
      if (data._restoreEase != null) {
        data.ease = data._restoreEase;
        data._restoreEase = null;
      }
    }
  }, []);


  // Handle wheel events
  const handleWheel = useCallback((e) => {
    if (isLockedRef.current) return;
    const content = contentRef.current;
    if (!content) return;

    e.preventDefault();

    const data = scrollDataRef.current;

    // Calculate max scroll (content height - viewport height)
    const maxScroll = content.scrollHeight - window.innerHeight;

    // Update target position
    data.target += e.deltaY;

    // Clamp to bounds
    data.target = Math.max(0, Math.min(data.target, maxScroll));

    // Start animation if not already running
    if (!data.isScrolling) {
      data.isScrolling = true;
      data.rafId = requestAnimationFrame(updateScroll);
    }
  }, [updateScroll]);


  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (isLockedRef.current) return;
    const content = contentRef.current;
    if (!content) return;

    const data = scrollDataRef.current;
    const maxScroll = content.scrollHeight - window.innerHeight;
    const pageHeight = window.innerHeight * 0.9;
    const arrowStep = 100;

    let delta = 0;

    switch (e.key) {
      case 'ArrowDown':
        delta = arrowStep;
        break;
      case 'ArrowUp':
        delta = -arrowStep;
        break;
      case 'PageDown':
      case ' ':
        if (!e.shiftKey) {
          delta = pageHeight;
          e.preventDefault();
        }
        break;
      case 'PageUp':
        delta = -pageHeight;
        e.preventDefault();
        break;
      case 'Home':
        data.target = 0;
        e.preventDefault();
        break;
      case 'End':
        data.target = maxScroll;
        e.preventDefault();
        break;
      default:
        return;
    }

    if (delta !== 0) {
      data.target = Math.max(0, Math.min(data.target + delta, maxScroll));
    }

    if (!data.isScrolling) {
      data.isScrolling = true;
      data.rafId = requestAnimationFrame(updateScroll);
    }
  }, [updateScroll]);


  // Handle touch events for mobile
  const touchStartRef = useRef(0);

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const content = contentRef.current;
    if (!content) return;

    e.preventDefault();

    const data = scrollDataRef.current;
    const touchY = e.touches[0].clientY;
    const delta = touchStartRef.current - touchY;
    touchStartRef.current = touchY;

    const maxScroll = content.scrollHeight - window.innerHeight;
    data.target = Math.max(0, Math.min(data.target + delta, maxScroll));

    if (!data.isScrolling) {
      data.isScrolling = true;
      data.rafId = requestAnimationFrame(updateScroll);
    }
  }, [updateScroll]);


  // Method to programmatically scroll to a position.
  // Options: instant (boolean), ease (number) for custom scroll speed.
  // Returns a Promise that resolves when the scroll has settled at the
  // target — used by the photo cards to serialize "scroll, then expand"
  // on mobile where running both in parallel race-conditions with the
  // browser's native smooth-scroll.
  const scrollTo = useCallback((position, instantOrOptions = false) => {
    const options = typeof instantOrOptions === 'boolean'
      ? { instant: instantOrOptions }
      : instantOrOptions;
    const { instant = false, ease } = options;

    // On mobile/tablet, use native scroll
    if (!isDesktop) {
      const targetY = Math.max(0, position);
      if (instant) {
        window.scrollTo({ top: targetY, behavior: 'instant' });
        return Promise.resolve();
      }
      // Already at (or extremely close to) target → no work, resolve now.
      if (Math.abs(window.scrollY - targetY) < 2) {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          window.removeEventListener('scrollend', settle);
          clearTimeout(timer);
          resolve();
        };
        // `scrollend` fires on Safari 17+, Chrome 114+. Older browsers
        // get caught by the timeout fallback (1.2s is longer than any
        // realistic native smooth-scroll on a phone).
        window.addEventListener('scrollend', settle, { once: true });
        const timer = setTimeout(settle, 1200);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    }

    const content = contentRef.current;
    if (!content) return Promise.resolve();

    const data = scrollDataRef.current;
    const maxScroll = content.scrollHeight - window.innerHeight;
    const targetPos = Math.max(0, Math.min(position, maxScroll));

    if (instant) {
      data.current = targetPos;
      data.target = targetPos;
      content.style.transform = `translateY(${-targetPos}px)`;
      // Notify scroll-aware components (e.g. the FeaturedPhotoCard header
      // pin) that scroll changed instantly — otherwise they'd keep using
      // a stale anchor until the next user-driven scroll.
      setScrollY(targetPos);
      scrollListenersRef.current.forEach((listener) => listener(targetPos));
      return Promise.resolve();
    }

    // Temporarily override ease if a custom value is provided
    if (ease) {
      data.ease = ease;
      data._restoreEase = smoothness;
    }
    data.target = targetPos;
    if (!data.isScrolling) {
      data.isScrolling = true;
      data.rafId = requestAnimationFrame(updateScroll);
    }
    // Desktop lerp: resolve when current is within 1px of target.
    return new Promise((resolve) => {
      const settle = () => {
        if (Math.abs(scrollDataRef.current.current - targetPos) < 1) {
          resolve();
        } else {
          requestAnimationFrame(settle);
        }
      };
      requestAnimationFrame(settle);
    });
  }, [isDesktop, smoothness, updateScroll]);


  // Method to scroll to an element
  const scrollToElement = useCallback((element, options = {}) => {
    const { offset = 0, block = 'start', instant = false, ease } = options;

    if (!element) return;

    // On mobile/tablet, use native scroll
    if (!isDesktop) {
      element.scrollIntoView({
        behavior: instant ? 'instant' : 'smooth',
        block: block
      });
      return;
    }

    const content = contentRef.current;
    if (!content) return;

    const contentRect = content.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate element's position relative to content
    // contentRect.top already accounts for the translateY(-scrollPos) transform,
    // so no additional scroll offset is needed
    const elementTop = elementRect.top - contentRect.top;

    let targetScroll;

    if (block === 'center') {
      targetScroll = elementTop - (window.innerHeight / 2) + (elementRect.height / 2) + offset;
    } else if (block === 'end') {
      targetScroll = elementTop - window.innerHeight + elementRect.height + offset;
    } else {
      // block === 'start'
      targetScroll = elementTop + offset;
    }

    scrollTo(targetScroll, { instant, ease });
  }, [isDesktop, scrollTo]);


  // Get current scroll position
  const getScrollPosition = useCallback(() => {
    if (!isDesktop) {
      return window.scrollY;
    }
    return scrollDataRef.current.current;
  }, [isDesktop]);


  // Subscribe to scroll position changes (for components that need real-time updates)
  const addScrollListener = useCallback((listener) => {
    scrollListenersRef.current.add(listener);
    // Return unsubscribe function
    return () => scrollListenersRef.current.delete(listener);
  }, []);


  // Set up scroll container and event listeners (desktop only)
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // On mobile/tablet, use native scroll
    if (!isDesktop) {
      // Carry the smooth-scroll position across the desktop→mobile
      // breakpoint. Without this, removing the contentRef's transform
      // hands the page back to the body's native scroll, whose
      // scrollTop was 0 (body never scrolled while smooth-scroll was
      // active) — so the user would jump straight to the top.
      const carryOver = scrollDataRef.current.current;

      // Reset any smooth scroll styles
      document.body.style.overflow = '';
      document.body.style.height = '';
      content.style.position = '';
      content.style.top = '';
      content.style.left = '';
      content.style.width = '';
      content.style.willChange = '';
      content.style.transform = '';

      // Restore the carried-over scroll position synchronously, before
      // the next paint, so there's no visible jump to the top.
      if (carryOver > 0) {
        window.scrollTo(0, carryOver);
        setScrollY(carryOver);
        scrollListenersRef.current.forEach((listener) => listener(carryOver));
      }

      // Track native scroll for scrollY state
      const handleNativeScroll = () => {
        setScrollY(window.scrollY);
        scrollListenersRef.current.forEach(listener => listener(window.scrollY));
      };
      window.addEventListener('scroll', handleNativeScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleNativeScroll);
      };
    }

    // Desktop: use custom smooth scroll.
    // Carry the native scroll position across the mobile→desktop
    // breakpoint. After we set body to overflow:hidden + the contentRef
    // to position:fixed, the body's scrollTop becomes irrelevant and
    // the content visually resets to the top — unless we re-apply the
    // saved position as a transform.
    const carryOver = window.scrollY;

    // Set up body styles
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    // Set content styles
    content.style.position = 'fixed';
    content.style.top = '0';
    content.style.left = '0';
    content.style.width = '100%';
    content.style.willChange = 'transform';

    // Restore the carried-over position into the smooth-scroll state +
    // apply the transform synchronously so the user stays at the same
    // scroll level as before the breakpoint flip.
    if (carryOver > 0) {
      const data = scrollDataRef.current;
      data.current = carryOver;
      data.target = carryOver;
      content.style.transform = `translateY(${-carryOver}px)`;
      setScrollY(carryOver);
      scrollListenersRef.current.forEach((listener) => listener(carryOver));
    }

    // Add event listeners (wheel only on desktop, no touch events needed)
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    // Handle resize
    const handleResize = () => {
      const data = scrollDataRef.current;
      const maxScroll = content.scrollHeight - window.innerHeight;
      data.target = Math.min(data.target, maxScroll);
      data.current = Math.min(data.current, maxScroll);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';

      if (content) {
        content.style.position = '';
        content.style.top = '';
        content.style.left = '';
        content.style.width = '';
        content.style.willChange = '';
        content.style.transform = '';
      }

      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);

      const data = scrollDataRef.current;
      if (data.rafId) {
        cancelAnimationFrame(data.rafId);
      }
      // Restore ease if interrupted mid-scroll with custom ease
      if (data._restoreEase != null) {
        data.ease = data._restoreEase;
        data._restoreEase = null;
      }
    };
  }, [isDesktop, handleWheel, handleKeyDown]);


  const contextValue = {
    scrollTo,
    scrollToElement,
    getScrollPosition,
    addScrollListener,
    setScrollLocked,
    scrollY,
    isDesktop,
  };


  return (
    <SmoothScrollContext.Provider value={contextValue}>
      <div ref={contentRef}>
        {children}
      </div>
    </SmoothScrollContext.Provider>
  );
}


export default SmoothScrollContext;
