import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../data/siteConfig';

/**
 * HeroNameOverlay — White "BASILE DESCHAMPS" + "REINVENTING THE FRAME"
 * Positioned at the bottom of the video container, clipped by overflow-hidden.
 * Uses ResizeObserver + scale() to auto-fit text within the container.
 */
function HeroNameOverlay() {
  const { firstName, lastName, tagline } = siteConfig.artist;
  const taglineWords = tagline.split(' ');
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
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

  return (
    <div ref={containerRef} className="absolute bottom-0 left-0 right-0 overflow-hidden pb-4 pointer-events-none">
      <div
        ref={contentRef}
        className="flex items-end justify-center w-fit mx-auto"
        style={{
          gap: '3.6cqw',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
        aria-label="Artist name"
      >
        {/* LEFT — "REINVENTING" + "BASILE" */}
        <div className="flex flex-col items-end">
          <div className="w-full flex justify-end pr-1">
            <span
              className="font-header text-white whitespace-nowrap"
              style={{ fontSize: '1cqw' }}
            >
              {taglineWords[0]?.toUpperCase()}
            </span>
          </div>
          <span
            className="font-header font-bold text-white whitespace-nowrap leading-none"
            style={{ fontSize: '9cqw' }}
          >
            {firstName.toUpperCase()}
          </span>
        </div>

        {/* RIGHT — "THE" + "FRAME" + "DESCHAMPS" */}
        <div className="flex flex-col items-start">
          <div className="w-full flex justify-between px-1">
            <span
              className="font-header text-white whitespace-nowrap"
              style={{ fontSize: '1cqw' }}
            >
              {taglineWords[1]?.toUpperCase()}
            </span>
            <span
              className="font-header text-white whitespace-nowrap"
              style={{ fontSize: '1cqw' }}
            >
              {taglineWords[2]?.toUpperCase()}
            </span>
          </div>
          <span
            className="font-header font-bold text-white whitespace-nowrap leading-none"
            style={{ fontSize: '9cqw' }}
          >
            {lastName.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

/** MobileHeroNameOverlay — Stacked tagline + "BASILE" / "DESCHAMPS" left-aligned at bottom of video */
function MobileHeroNameOverlay() {
  const { firstName, lastName, tagline } = siteConfig.artist;
  const taglineWords = tagline.split(' ');
  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start pl-4 pb-4 pointer-events-none">
      {/* "REINVENTING" above "BASILE" */}
      <span className="font-header text-white" style={{ fontSize: '2cqw' }}>
        {taglineWords[0]?.toUpperCase()}
      </span>
      <span className="font-header font-bold text-white leading-none" style={{ fontSize: '13cqw' }}>
        {firstName.toUpperCase()}
      </span>
      {/* "THE FRAME" spread above "DESCHAMPS", both wrapped so width matches */}
      <div className="flex flex-col">
        <div className="flex justify-between px-1">
          <span className="font-header text-white" style={{ fontSize: '2cqw' }}>
            {taglineWords[1]?.toUpperCase()}
          </span>
          <span className="font-header text-white" style={{ fontSize: '2cqw' }}>
            {taglineWords[2]?.toUpperCase()}
          </span>
        </div>
        <span className="font-header font-bold text-white leading-none" style={{ fontSize: '13cqw' }}>
          {lastName.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

/**
 * HeroSection — Contained sticky video with 60px inset from viewport edges.
 * Name text lives inside the video container so it never exceeds video bounds.
 */
function MuteButton({ isMuted, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute bottom-6 right-6 z-20 flex items-center justify-center w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200"
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
    >
      {isMuted ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}

function HeroSection({ onVideoClick }) {
  const { center: navCenter } = siteConfig.navigation;
  const desktopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const isSafari = typeof navigator !== 'undefined'
    && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Mute toggle (always works — direct user gesture)
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (desktopVideoRef.current) desktopVideoRef.current.muted = newMuted;
    if (mobileVideoRef.current) mobileVideoRef.current.muted = newMuted;
  };

  // Single play handler — fires per-video when its data is ready.
  // No useEffect play calls (calling .play() on hidden videos poisons Safari).
  const handleVideoReady = (e) => {
    const video = e.target;
    video.controls = false;
    video.removeAttribute('controls');
    video.play().catch(() => {});
  };

  // Non-Safari: unmute after 2.5s, re-mute if browser kills playback
  useEffect(() => {
    if (isSafari) return;
    const timer = setTimeout(() => {
      const video = desktopVideoRef.current || mobileVideoRef.current;
      if (!video || video.paused) return;
      video.muted = false;
      setTimeout(() => {
        if (video.paused) {
          video.muted = true;
          video.play().catch(() => {});
          setIsMuted(true);
        } else {
          if (desktopVideoRef.current) desktopVideoRef.current.muted = false;
          if (mobileVideoRef.current) mobileVideoRef.current.muted = false;
          setIsMuted(false);
        }
      }, 100);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Mute hero when user opens a video (showreel or film modal)
  const handleHeroVideoClick = () => {
    if (desktopVideoRef.current) desktopVideoRef.current.muted = true;
    if (mobileVideoRef.current) mobileVideoRef.current.muted = true;
    setIsMuted(true);
    onVideoClick();
  };

  return (
    <section className="relative w-full md:w-[calc(100%+200px)]" aria-label="Hero section">
      {/* DESKTOP: Sticky contained video with 60px inset */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh - 5rem + 150px)' }}>
        <div className="sticky top-0 h-[calc(100svh-5rem)] w-full px-[60px] py-[20px]">
          <div className="relative w-full h-full overflow-hidden" style={{ containerType: 'inline-size' }}>
            <video
              ref={desktopVideoRef}
              data-hero-video
              src={siteConfig.showreel.videoFile}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideoReady}
              onClick={handleHeroVideoClick}
              className="w-full h-full object-cover cursor-pointer"
              aria-hidden="true"
            />
            <HeroNameOverlay />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>

      {/* MOBILE: Fullscreen video + overlay name */}
      <div className="md:hidden flex flex-col h-[calc(100svh-5rem)]">
        {/* Nav links */}
        <div className="flex items-center justify-center gap-2 py-4">
          {navCenter.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="font-header font-normal text-xs uppercase hover:opacity-70 transition-opacity py-3 px-2"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Video + overlaid name */}
        <div className="flex-1 relative overflow-hidden" onClick={onVideoClick} style={{ containerType: 'inline-size' }}>
          <video
            ref={mobileVideoRef}
            data-hero-video
            src={siteConfig.showreel.videoFile}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={handleVideoReady}
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <MobileHeroNameOverlay />
          <MuteButton isMuted={isMuted} onClick={toggleMute} />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
