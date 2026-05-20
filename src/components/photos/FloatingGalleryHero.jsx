/**
 * Photos Hero — full-bleed flashing photo slideshow.
 * Cycles through all portfolio photos with instant hard-cut transitions
 * at randomized intervals (0.5–2s). Shuffled order, no repeats until all shown.
 *
 * Text overlay (bio + contact) is shared with the Films hero — see HeroBioOverlay.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { heroPhotos } from '../../sanity/loader';
import { HeroBioOverlay } from '../ui/HeroOverlay';

// Fisher-Yates shuffle (returns new array)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random interval between 500ms and 2000ms
function randomInterval() {
  return 500 + Math.random() * 1500;
}

// Preload an image — resolves with src + natural dimensions.
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.onerror = () => reject(src);
    img.src = src;
  });
}

// Number of upcoming photos to warm in the browser cache after each advance.
const PRELOAD_AHEAD = 10;

/**
 * Hook: usePhotoSlideshow
 * Returns { src, naturalWidth, naturalHeight } for the current photo.
 */
function usePhotoSlideshow() {
  const queueRef = useRef([]);
  const indexRef = useRef(0);
  const cancelRef = useRef(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [currentPhoto, setCurrentPhoto] = useState(() => {
    const initial = shuffle(heroPhotos);
    queueRef.current = initial;
    return { src: initial[0] || '', naturalWidth: 0, naturalHeight: 0 };
  });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Track viewport width so the landscape-skip filter stays correct after resize/rotation.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const nextIndex = useCallback(() => {
    let idx = indexRef.current + 1;
    if (idx >= queueRef.current.length) {
      queueRef.current = shuffle(heroPhotos);
      idx = 0;
    }
    indexRef.current = idx;
    return idx;
  }, []);

  // Warm the browser cache for the next N photos in the queue.
  const warmUpNext = useCallback((count) => {
    const queue = queueRef.current;
    if (!queue.length) return;
    const start = indexRef.current + 1;
    for (let i = 0; i < count; i++) {
      const src = queue[(start + i) % queue.length];
      if (!src) continue;
      const img = new Image();
      img.src = src;
    }
  }, []);

  const advance = useCallback(async () => {
    let attempts = 0;
    while (attempts < 20) {
      if (cancelRef.current) return;
      const idx = nextIndex();
      const src = queueRef.current[idx];
      try {
        const result = await preloadImage(src);
        // On mobile, skip landscape images
        if (isMobile && result.naturalWidth > result.naturalHeight) {
          attempts++;
          continue;
        }
        if (!cancelRef.current) {
          setCurrentPhoto(result);
          warmUpNext(PRELOAD_AHEAD);
        }
        return;
      } catch {
        attempts++;
      }
    }
  }, [nextIndex, isMobile, warmUpNext]);

  useEffect(() => {
    if (prefersReducedMotion || heroPhotos.length <= 1) return;
    cancelRef.current = false;

    // Load the first suitable image, then warm the next 10.
    (async () => {
      for (const src of queueRef.current) {
        if (cancelRef.current) return;
        try {
          const result = await preloadImage(src);
          if (isMobile && result.naturalWidth > result.naturalHeight) continue;
          if (!cancelRef.current) {
            setCurrentPhoto(result);
            warmUpNext(PRELOAD_AHEAD);
          }
          return;
        } catch { /* skip */ }
      }
    })();

    let timer;
    const tick = async () => {
      await advance();
      if (!cancelRef.current) {
        timer = setTimeout(tick, randomInterval());
      }
    };
    timer = setTimeout(tick, randomInterval());

    return () => {
      cancelRef.current = true;
      clearTimeout(timer);
    };
  }, [advance, prefersReducedMotion, isMobile, warmUpNext]);

  return currentPhoto;
}


function FloatingGalleryHero() {
  const currentPhoto = usePhotoSlideshow();

  return (
    <section className="relative w-full" aria-label="Photo gallery hero">
      {/* Desktop: Sticky full-bleed photo. The +150px keeps the documented
          scroll-to-reveal allowance below the hero (see memory: hero-150px-intentional). */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden bg-black">
            <img
              src={currentPhoto.src}
              alt="Photography portfolio"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <HeroBioOverlay variant="desktop" />
          </div>
        </div>
      </div>

      {/* Mobile/Tablet: Sticky full-bleed photo — mirrors the desktop pattern so
          the bio + contact overlay pins through the 150px scroll-reveal window
          (see memory: hero-150px-intentional). Native sticky → no jitter. */}
      <div className="md:hidden relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden bg-black">
            <img
              src={currentPhoto.src}
              alt="Photography portfolio"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <HeroBioOverlay variant="mobile" />
          </div>
        </div>
      </div>

      <h1 className="sr-only">Photos</h1>
    </section>
  );
}

export default FloatingGalleryHero;
