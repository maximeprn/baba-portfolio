import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { siteConfig } from '../../data/siteConfig';
import { HeroBioOverlay } from './HeroOverlay';

// ---------------------------------------------------------------------------
// MuteButton + HeroSection
// ---------------------------------------------------------------------------

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

function HeroSection({ onVideoClick, onReady }) {
  const desktopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const readyFired = useRef(false);

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
    if (!readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }
  };

  // Mux HLS attachment: same pattern as FeaturedFilmCard. When a Mux
  // stream URL is present, hls.js drives playback (or native HLS in Safari).
  // Falls through to the legacy <video src=videoFile> path when no Mux yet.
  useEffect(() => {
    const muxUrl = siteConfig.showreel.muxStreamUrl;
    if (!muxUrl) return;

    const attach = (video) => {
      if (!video) return null;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = muxUrl;
        return null;
      }
      if (!Hls.isSupported()) return null;
      const hls = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 8 });
      hls.loadSource(muxUrl);
      hls.attachMedia(video);
      return hls;
    };

    const desktopHls = attach(desktopVideoRef.current);
    const mobileHls = attach(mobileVideoRef.current);
    return () => {
      desktopHls?.destroy();
      mobileHls?.destroy();
    };
  }, []);

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
  }, [isSafari]);

  // Mute hero when user opens a video (showreel or film modal)
  const handleHeroVideoClick = () => {
    if (desktopVideoRef.current) desktopVideoRef.current.muted = true;
    if (mobileVideoRef.current) mobileVideoRef.current.muted = true;
    setIsMuted(true);
    onVideoClick();
  };

  return (
    <section className="relative w-full" aria-label="Hero section">
      {/* DESKTOP: Full-bleed video. The +150px keeps the documented
          scroll-to-reveal allowance below the hero (see memory: hero-150px-intentional). */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden" style={{ containerType: 'inline-size' }}>
            <video
              ref={desktopVideoRef}
              data-hero-video
              src={siteConfig.showreel.muxStreamUrl ? undefined : siteConfig.showreel.videoFile || undefined}
              poster={siteConfig.showreel.muxPosterUrl || siteConfig.showreel.posterImageUrl || undefined}
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
            <HeroBioOverlay variant="desktop" />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>

      {/* MOBILE/TABLET: Full-bleed video — same plain-block layout as the
          desktop hero. NOT sticky: under native scroll a sticky inner pin
          would hold the hero at the viewport top while the absolute-positioned
          nav scrolls away above it, detaching the two. As a plain block the
          hero + nav scroll away together as one unit — matching desktop, where
          the smooth-scroll transform makes sticky inert anyway. The +150px is
          the scroll-to-reveal allowance (see memory: hero-150px-intentional). */}
      <div className="md:hidden relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden" onClick={handleHeroVideoClick} style={{ containerType: 'inline-size' }}>
            <video
              ref={mobileVideoRef}
              data-hero-video
              src={siteConfig.showreel.muxStreamUrl ? undefined : siteConfig.showreel.videoFile || undefined}
              poster={siteConfig.showreel.muxPosterUrl || siteConfig.showreel.posterImageUrl || undefined}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideoReady}
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
            <HeroBioOverlay variant="mobile" />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
