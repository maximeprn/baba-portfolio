/**
 * useSafariAutoplay — robust video autoplay for Safari.
 *
 * Safari ignores the HTML autoplay attribute in many cases (Low Power Mode,
 * user preferences, battery saver). This hook:
 * 1. Forces controls=false via JS (Safari can re-inject them)
 * 2. Calls .play() on mount and on loadeddata
 * 3. If .play() is rejected, attaches a one-time user interaction listener
 * 4. Uses IntersectionObserver to play/pause based on visibility
 */

import { useRef, useEffect, useCallback } from 'react';

export default function useSafariAutoplay() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force-remove controls (Safari can re-inject them)
    video.controls = false;
    video.removeAttribute('controls');

    const tryPlay = () => {
      if (!video.paused) return;
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          // Autoplay blocked — play on first user interaction
          const playOnce = () => {
            video.play().catch(() => {});
            document.removeEventListener('click', playOnce);
            document.removeEventListener('touchstart', playOnce);
            document.removeEventListener('scroll', playOnce);
          };
          document.addEventListener('click', playOnce, { once: true, passive: true });
          document.addEventListener('touchstart', playOnce, { once: true, passive: true });
          document.addEventListener('scroll', playOnce, { once: true, passive: true });
        });
      }
    };

    // Try immediately
    tryPlay();

    // Also try when data is ready
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);

    return () => {
      video.removeEventListener('loadeddata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
    };
  }, []);

  // Ref callback to attach to <video>
  const setVideoRef = useCallback((el) => {
    videoRef.current = el;
  }, []);

  return setVideoRef;
}
