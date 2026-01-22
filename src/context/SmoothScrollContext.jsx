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
      scrollTo: (pos, instant) => window.scrollTo({ top: pos, behavior: instant ? 'instant' : 'smooth' }),
      scrollToElement: (el, options) => el?.scrollIntoView({ behavior: options?.instant ? 'instant' : 'smooth', block: options?.block || 'start' }),
      getScrollPosition: () => window.scrollY,
      addScrollListener: () => () => {},
      scrollY: 0,
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

  // Scroll position state that triggers re-renders for subscribers
  const [scrollY, setScrollY] = useState(0);
  const scrollListenersRef = useRef(new Set());


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

    // Update scroll position state (throttled to avoid too many re-renders)
    setScrollY(rounded);

    // Notify all scroll listeners
    scrollListenersRef.current.forEach(listener => listener(rounded));

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
    }
  }, []);


  // Handle wheel events
  const handleWheel = useCallback((e) => {
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


  // Method to programmatically scroll to a position
  const scrollTo = useCallback((position, instant = false) => {
    const content = contentRef.current;
    if (!content) return;

    const data = scrollDataRef.current;
    const maxScroll = content.scrollHeight - window.innerHeight;
    const targetPos = Math.max(0, Math.min(position, maxScroll));

    if (instant) {
      data.current = targetPos;
      data.target = targetPos;
      content.style.transform = `translateY(${-targetPos}px)`;
    } else {
      data.target = targetPos;
      if (!data.isScrolling) {
        data.isScrolling = true;
        data.rafId = requestAnimationFrame(updateScroll);
      }
    }
  }, [updateScroll]);


  // Method to scroll to an element
  const scrollToElement = useCallback((element, options = {}) => {
    const { offset = 0, block = 'start', instant = false } = options;
    const content = contentRef.current;

    if (!content || !element) return;

    const contentRect = content.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const data = scrollDataRef.current;

    // Calculate element's position relative to content
    const elementTop = elementRect.top - contentRect.top + data.current;

    let targetScroll;

    if (block === 'center') {
      targetScroll = elementTop - (window.innerHeight / 2) + (elementRect.height / 2) + offset;
    } else if (block === 'end') {
      targetScroll = elementTop - window.innerHeight + elementRect.height + offset;
    } else {
      // block === 'start'
      targetScroll = elementTop + offset;
    }

    scrollTo(targetScroll, instant);
  }, [scrollTo]);


  // Get current scroll position
  const getScrollPosition = useCallback(() => {
    return scrollDataRef.current.current;
  }, []);


  // Subscribe to scroll position changes (for components that need real-time updates)
  const addScrollListener = useCallback((listener) => {
    scrollListenersRef.current.add(listener);
    // Return unsubscribe function
    return () => scrollListenersRef.current.delete(listener);
  }, []);


  // Set up scroll container and event listeners
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Set up body styles
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    // Set content styles
    content.style.position = 'fixed';
    content.style.top = '0';
    content.style.left = '0';
    content.style.width = '100%';
    content.style.willChange = 'transform';

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

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
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);

      const data = scrollDataRef.current;
      if (data.rafId) {
        cancelAnimationFrame(data.rafId);
      }
    };
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchMove]);


  const contextValue = {
    scrollTo,
    scrollToElement,
    getScrollPosition,
    addScrollListener,
    scrollY,
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
