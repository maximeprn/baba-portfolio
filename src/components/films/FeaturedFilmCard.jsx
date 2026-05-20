/**
 * Featured Film Card — displays a film with embedded video preview.
 * Clicking opens a film detail modal (no navigation to /films/:slug).
 */

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

// Per-element padding + margin-bottom variants. Cycled by index for a
// "slightly random but intentional" feel. Desktop-only — see ffc-* rules
// in src/styles/index.css. Margin-bottom values stay <= 2rem.
const LAYOUT_VARIANTS = [
  {
    videoWidth: '47.52%', textWidth: '45%', paddingTop: '2rem', paddingBottom: '2rem', textPaddingTop: '0',
    titlePl: '2rem',   titlePr: '0.5rem', titleMb: '3rem',
    subtitlePl: '2.5rem', subtitlePr: '1rem',  subtitleMb: '4rem',
    descPl: '1rem',    descPr: '2rem',
  },
  {
    videoWidth: '47.52%', textWidth: '45%', paddingTop: '2rem', paddingBottom: '2rem', textPaddingTop: '0',
    titlePl: '0.5rem', titlePr: '2rem',   titleMb: '4rem',
    subtitlePl: '1.5rem', subtitlePr: '0.5rem', subtitleMb: '3rem',
    descPl: '2rem',    descPr: '1rem',
  },
  {
    videoWidth: '47.52%', textWidth: '45%', paddingTop: '2rem', paddingBottom: '2rem', textPaddingTop: '0',
    titlePl: '1.5rem', titlePr: '1rem',   titleMb: '3.5rem',
    subtitlePl: '0.5rem', subtitlePr: '1.5rem', subtitleMb: '4rem',
    descPl: '2.5rem',  descPr: '0.5rem',
  },
];

function FeaturedFilmCard({ film, index = 0, mediaSide = 'left', onFilmClick, shouldLoad = true, onVideoReady }) {
  const {
    title,
    description,
    year,
    client,
    category,
    muxStreamUrl,
    muxPosterUrl,
    thumbnail,
    aspectRatio = 1.78,
  } = film;

  // Poster priority: manual upload (if the editor set one) wins; otherwise
  // use Mux's auto-generated thumbnail so cards always have a background.
  const posterUrl = thumbnail || muxPosterUrl || null;

  // Where the video sits — provided by the parent based on the site-wide
  // `cardAlignment` setting (see src/utils/cardAlignment.js).
  const isVideoLeft = mediaSide === 'left';
  const variant = LAYOUT_VARIANTS[index % LAYOUT_VARIANTS.length];

  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const { addScrollListener } = useSmoothScrollContext();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Subtle opacity ramp when the card crosses the top/bottom edge of the
  // viewport. Driven per-frame off the smooth-scroll listener (native scroll
  // on mobile via the same hook). Reduced-motion users opt out entirely.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const FADE_RAMP_VH = 0.20;
    let ramp = window.innerHeight * FADE_RAMP_VH;

    // Smootherstep (Perlin): 6t⁵ − 15t⁴ + 10t³.
    // Zero 1st AND 2nd derivatives at 0/1 → fades begin/end without a kink.
    const smootherstep = (t) => {
      const c = t < 0 ? 0 : t > 1 ? 1 : t;
      return c * c * c * (c * (c * 6 - 15) + 10);
    };

    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      const enterT = (vh - rect.top) / ramp;
      const leaveT = rect.bottom / ramp;
      const opacity = Math.min(smootherstep(enterT), smootherstep(leaveT));
      wrapper.style.opacity = String(opacity);
    };

    const handleResize = () => {
      ramp = window.innerHeight * FADE_RAMP_VH;
      update();
    };

    update();
    const unsubscribe = addScrollListener(update);
    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      wrapper.style.opacity = '';
    };
  }, [addScrollListener]);

  // HLS attachment for Mux-hosted streams. Runs once shouldLoad goes true.
  // For browsers with native HLS (Safari), we set <video src> directly so
  // hls.js never instantiates. Everything else uses hls.js's MediaSource.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!shouldLoad || !muxStreamUrl) return;

    // Native HLS — Safari, iOS WebKit.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = muxStreamUrl;
      return;
    }
    if (!Hls.isSupported()) return;

    const hls = new Hls({
      // Keep the preview tile light: cap to the lowest renditions Mux
      // ships so background autoplay tiles never request a 1080p layer.
      capLevelToPlayerSize: true,
      maxBufferLength: 8,
    });
    hls.loadSource(muxStreamUrl);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [shouldLoad, muxStreamUrl]);

  // Playback is driven by the in-view effect — not by autoPlay or onLoadedData —
  // so videos only run while the user can actually see them.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isInView && shouldLoad) {
      video.play().catch((err) => console.warn(`Video play blocked for "${title}":`, err.message));
    } else {
      video.pause();
    }
  }, [isInView, shouldLoad, title]);

  // stopPropagation so an enclosing CollapsedFilmCard doesn't treat this as a "close" click.
  const handleClick = (e) => {
    e?.stopPropagation?.();
    onFilmClick(film);
  };
  const handleVideoReady = (e) => {
    e.target.controls = false;
    e.target.removeAttribute('controls');
    onVideoReady?.();
  };

  return (
    <article
      ref={wrapperRef}
      className="film-card w-full bg-white"
      style={{
        '--section-padding-top': variant.paddingTop,
        '--section-padding-bottom': variant.paddingBottom,
        '--video-width': variant.videoWidth,
        '--text-width': variant.textWidth,
        '--text-padding-top': variant.textPaddingTop,
        '--ffc-title-pl': variant.titlePl,
        '--ffc-title-pr': variant.titlePr,
        '--ffc-title-mb': variant.titleMb,
        '--ffc-subtitle-pl': variant.subtitlePl,
        '--ffc-subtitle-pr': variant.subtitlePr,
        '--ffc-subtitle-mb': variant.subtitleMb,
        '--ffc-desc-pl': variant.descPl,
        '--ffc-desc-pr': variant.descPr,
      }}
    >
      {/* TITLE — mobile only, above the video */}
      <header className="px-4 lg:hidden">
        <h3
          onClick={handleClick}
          className="font-header text-lg font-medium tracking-widest uppercase cursor-pointer leading-tight mb-4 group/ffc-title-m"
        >
          <span className="px-2 py-0.5 box-decoration-clone transition-colors duration-150 group-hover/ffc-title-m:bg-gray-900 group-hover/ffc-title-m:text-white">
            {title}
          </span>
        </h3>
      </header>

      <div
        className={`px-4 lg:px-0 flex flex-col lg:items-center ${isVideoLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
      >
        {/* VIDEO */}
        <div
          onClick={handleClick}
          className="w-full overflow-hidden cursor-pointer"
          style={{
            aspectRatio,
            ...(posterUrl ? {
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}),
          }}
        >
          <video
            ref={videoRef}
            // src is left empty — hls.js attaches via MediaSource in the
            // effect above (or sets src for Safari's native HLS).
            poster={posterUrl || undefined}
            loop
            playsInline
            muted
            preload="metadata"
            onLoadedData={handleVideoReady}
            className="w-full h-full object-cover pointer-events-none"
            aria-label={title}
          />
        </div>

        {/* TEXT CONTENT — stopPropagation so reading text doesn't collapse an enclosing card.
            Per-element padding + margin-bottom come from CSS vars + lg-only rules in index.css. */}
        <div
          className="flex flex-col justify-center min-w-0 items-start"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TITLE — desktop only (mobile title is overlaid on video) */}
          <header className="hidden lg:block ffc-title">
            <h3
              onClick={handleClick}
              className="font-header text-lg font-medium tracking-widest uppercase cursor-pointer leading-tight group/ffc-title-d"
            >
              <span className="px-2 py-0.5 box-decoration-clone transition-colors duration-150 group-hover/ffc-title-d:bg-gray-900 group-hover/ffc-title-d:text-white">
                {title}
              </span>
            </h3>
          </header>

          {/* METADATA */}
          <div className="ffc-subtitle font-header text-xs tracking-widest text-primary uppercase">
            {year}
            <span className="mx-3">•</span>
            {client}
            <span className="mx-3">•</span>
            {category}
          </div>

          {/* DESCRIPTION */}
          <div className="ffc-desc relative w-full overflow-hidden">
            <p className="font-header text-xs tracking-[0.15em] leading-6 text-primary">
              {description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default FeaturedFilmCard;
