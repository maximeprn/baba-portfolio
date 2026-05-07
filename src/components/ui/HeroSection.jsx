import { useRef, useState, useEffect } from 'react';
import { siteConfig } from '../../data/siteConfig';

/**
 * HeroBioOverlay — Top-left bio + selected clients, bottom-left contact info.
 * Used by both Films and Photos heroes (desktop + mobile).
 *
 * Desktop: 28px / 25px text, nowrap (intentional — the long client list
 * overflows the right edge of the viewport on narrower screens).
 * Mobile: scaled down + allowed to wrap; contact stacks vertically.
 */
function HeroBioOverlay() {
  return (
    <>
      {/* TOP-LEFT: bio + selected clients */}
      <div className="absolute top-[100px] left-8 right-8 md:right-auto z-10 flex flex-col items-start gap-3.5 text-white pointer-events-none font-header">
        <p className="m-0 font-medium leading-tight tracking-[-0.01em] text-lg md:text-[28px] md:whitespace-nowrap">
          Basile Deschamps is a film director and photographer based in Paris.
        </p>
        <p className="m-0 font-medium leading-tight tracking-[-0.01em] text-lg md:text-[28px] md:whitespace-nowrap">
          Selected clients include Salomon, Parel Studios, Lorette Colé Duprat, On, Asics, Pag, Specialized, Veja.
        </p>
      </div>

      {/* BOTTOM-LEFT: contact */}
      <div className="absolute bottom-10 left-8 z-10 flex flex-col md:flex-row gap-2 md:gap-6 text-white font-header font-medium tracking-[0.15em] pointer-events-none">
        <span className="uppercase text-base md:text-[25px]">+33 (0)6 17 91 79 89</span>
        <span className="text-base md:text-[25px]">basiledeschamps3@gmail.com</span>
      </div>
    </>
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
    <section className="relative w-full" aria-label="Hero section">
      {/* DESKTOP: Sticky full-bleed video. The +150px keeps the documented
          scroll-to-reveal allowance below the hero (see memory: hero-150px-intentional). */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full">
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
            <HeroBioOverlay />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>

      {/* MOBILE/TABLET: Sticky full-bleed video — mirrors the desktop pattern so
          the bio + contact overlay pins through the 150px scroll-reveal window
          (see memory: hero-150px-intentional). Native sticky (no JS), so no
          scroll-event lag → no jitter. */}
      <div className="md:hidden relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden" onClick={onVideoClick} style={{ containerType: 'inline-size' }}>
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
            <HeroBioOverlay />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
export { HeroBioOverlay };
