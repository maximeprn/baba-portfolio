/**
 * Photos Hero — Flashing photo slideshow with 60px inset.
 * Cycles through all portfolio photos with instant hard-cut transitions
 * at randomized intervals (0.5–2s). Shuffled order, no repeats until all shown.
 *
 * Dual-layer text overlay: black text on white background, white text on image.
 * The white text lives inside the image wrapper (overflow:hidden clips it to image bounds).
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { siteConfig } from '../../data/siteConfig';
import { heroPhotos } from '../../data/heroPhotos';

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

// Check if the bottom region of an image is predominantly light (where text sits).
// Returns true if >35% of pixels in the bottom 10% are bright (>180).
function isImageBottomLight(img) {
  try {
    const canvas = document.createElement('canvas');
    const sampleW = Math.min(img.naturalWidth, 200);
    const sampleH = Math.min(img.naturalHeight, 200);
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    // Sample bottom 10% — where the text overlay actually sits
    const regionY = Math.floor(sampleH * 0.9);
    const regionH = sampleH - regionY;
    const data = ctx.getImageData(0, regionY, sampleW, regionH).data;
    const pixelCount = data.length / 4;
    let lightPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      if (brightness > 180) lightPixels++;
    }
    return lightPixels / pixelCount > 0.35;
  } catch {
    return false;
  }
}

// Preload an image — resolves with src, natural dimensions, and brightness info
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        isLight: isImageBottomLight(img),
      });
    };
    img.onerror = () => reject(src);
    img.src = src;
  });
}

/**
 * Hook: usePhotoSlideshow
 * Returns { src, naturalWidth, naturalHeight } for the current photo.
 */
function usePhotoSlideshow() {
  const queueRef = useRef([]);
  const indexRef = useRef(0);
  const cancelRef = useRef(false);
  const [currentPhoto, setCurrentPhoto] = useState(() => {
    const initial = shuffle(heroPhotos);
    queueRef.current = initial;
    return { src: initial[0] || '', naturalWidth: 0, naturalHeight: 0, isLight: false };
  });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nextIndex = useCallback(() => {
    let idx = indexRef.current + 1;
    if (idx >= queueRef.current.length) {
      queueRef.current = shuffle(heroPhotos);
      idx = 0;
    }
    indexRef.current = idx;
    return idx;
  }, []);

  const advance = useCallback(async () => {
    let attempts = 0;
    while (attempts < 5) {
      if (cancelRef.current) return;
      const idx = nextIndex();
      const src = queueRef.current[idx];
      try {
        const result = await preloadImage(src);
        if (!cancelRef.current) setCurrentPhoto(result);
        return;
      } catch {
        attempts++;
      }
    }
  }, [nextIndex]);

  useEffect(() => {
    if (prefersReducedMotion || heroPhotos.length <= 1) return;
    cancelRef.current = false;

    // Batch-preload all images upfront (they're light)
    queueRef.current.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // Load the first image's natural dimensions
    preloadImage(queueRef.current[0]).then((result) => {
      if (!cancelRef.current) setCurrentPhoto(result);
    }).catch(() => {});

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
  }, [advance, prefersReducedMotion]);

  return currentPhoto;
}

/**
 * NameOverlay — Reusable text overlay (BASILE DESCHAMPS + tagline).
 * Rendered twice: once black (on white bg), once white (clipped to image).
 */
function NameOverlay({ color, containerRef, contentRef, scale, style }) {
  const { firstName, lastName, tagline } = siteConfig.artist;
  const taglineWords = tagline.split(' ').concat(['', '', '']);
  const textClass = color === 'white' ? 'text-white' : 'text-black';

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 overflow-hidden pb-4 pointer-events-none"
      style={style}
    >
      <div
        ref={contentRef}
        className="flex items-end justify-center w-fit mx-auto"
        style={{
          gap: '3.6cqw',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
        aria-label={color === 'black' ? 'Artist name' : undefined}
        aria-hidden={color === 'white' ? 'true' : undefined}
      >
        <div className="flex flex-col items-end">
          <div className="w-full flex justify-end pr-1">
            <span
              className={`font-header ${textClass} whitespace-nowrap`}
              style={{ fontSize: '1.4cqw' }}
            >
              {taglineWords[0]?.toUpperCase()}
            </span>
          </div>
          <span
            className={`font-header font-bold ${textClass} whitespace-nowrap leading-none`}
            style={{ fontSize: '9cqw' }}
          >
            {firstName.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <div className="w-full flex justify-between px-1">
            <span
              className={`font-header ${textClass} whitespace-nowrap`}
              style={{ fontSize: '1.4cqw' }}
            >
              {taglineWords[1]?.toUpperCase()}
            </span>
            <span
              className={`font-header ${textClass} whitespace-nowrap`}
              style={{ fontSize: '1.4cqw' }}
            >
              {taglineWords[2]?.toUpperCase()}
            </span>
          </div>
          <span
            className={`font-header font-bold ${textClass} whitespace-nowrap leading-none`}
            style={{ fontSize: '9cqw' }}
          >
            {lastName.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function FloatingGalleryHero() {
  const outerRef = useRef(null);
  const blackOverlayRef = useRef(null);
  const blackContentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [outerSize, setOuterSize] = useState({ width: 0, height: 0 });
  const currentPhoto = usePhotoSlideshow();

  // Track outer container size
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const update = () => {
      setOuterSize({ width: outer.clientWidth, height: outer.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => ro.disconnect();
  }, []);

  // Text scale: measure black overlay to auto-fit width
  useEffect(() => {
    const container = blackOverlayRef.current;
    const content = blackContentRef.current;
    if (!container || !content) return;

    const update = () => {
      const cw = container.clientWidth;
      const tw = content.scrollWidth;
      setScale(tw > cw ? cw / tw : 1);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Compute image wrapper size + offsets for white text alignment
  const { wrapperW, wrapperH, horizontalOffset, verticalOffset } = useMemo(() => {
    const { naturalWidth, naturalHeight } = currentPhoto;
    if (!naturalWidth || !naturalHeight || !outerSize.width || !outerSize.height) {
      return { wrapperW: 0, wrapperH: 0, horizontalOffset: 0, verticalOffset: 0 };
    }

    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = outerSize.width / outerSize.height;

    let renderedW, renderedH;
    if (imageAspect > containerAspect) {
      renderedW = outerSize.width;
      renderedH = outerSize.width / imageAspect;
    } else {
      renderedH = outerSize.height;
      renderedW = outerSize.height * imageAspect;
    }

    return {
      wrapperW: Math.round(renderedW),
      wrapperH: Math.round(renderedH),
      horizontalOffset: (outerSize.width - Math.round(renderedW)) / 2,
      verticalOffset: (outerSize.height - Math.round(renderedH)) / 2,
    };
  }, [currentPhoto, outerSize]);

  return (
    <section className="relative w-full md:w-[calc(100%+200px)]" aria-label="Photo gallery hero">
      {/* Desktop: Sticky contained photo with 60px inset */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh - 5rem + 150px)' }}>
        <div className="sticky top-0 h-[calc(100svh-5rem)] w-full px-[60px] py-[20px]">
          <div
            ref={outerRef}
            className="relative w-full h-full overflow-hidden flex items-center justify-center bg-white"
            style={{ containerType: 'inline-size' }}
          >
            {/* Layer 1: Black text (visible on white background) */}
            <NameOverlay
              color="black"
              containerRef={blackOverlayRef}
              contentRef={blackContentRef}
              scale={scale}
              style={{ zIndex: 10 }}
            />

            {/* Image wrapper: shrink-wrapped to rendered image, clips white text */}
            {wrapperW > 0 && wrapperH > 0 && (
              <div
                className="relative overflow-hidden flex-shrink-0"
                style={{
                  width: wrapperW,
                  height: wrapperH,
                  zIndex: 20,
                }}
              >
                <img
                  src={currentPhoto.src}
                  alt="Photography portfolio"
                  className="w-full h-full block"
                />

                {/* Layer 2: Text clipped to image bounds — white on dark photos, black on light */}
                <NameOverlay
                  color={currentPhoto.isLight ? 'black' : 'white'}
                  containerRef={null}
                  contentRef={null}
                  scale={scale}
                  style={{
                    zIndex: 30,
                    bottom: -verticalOffset,
                    left: -horizontalOffset,
                    width: outerSize.width,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Fullscreen photo */}
      <div className="md:hidden relative h-[80svh] w-full overflow-hidden flex items-center justify-center bg-white">
        <img
          src={currentPhoto.src}
          alt="Photography portfolio"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <h1 className="sr-only">Photos</h1>
    </section>
  );
}

export default FloatingGalleryHero;
