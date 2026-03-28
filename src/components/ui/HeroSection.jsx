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
function HeroSection({ onVideoClick }) {
  const { center: navCenter } = siteConfig.navigation;

  return (
    <section className="relative w-full md:w-[calc(100%+200px)]" aria-label="Hero section">
      {/* DESKTOP: Sticky contained video with 60px inset */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh - 5rem + 150px)' }}>
        <div className="sticky top-0 h-[calc(100svh-5rem)] w-full px-[60px] py-[20px]">
          <div className="relative w-full h-full overflow-hidden" style={{ containerType: 'inline-size' }}>
            <video
              src="/videos/Showreel 2021.mp4"
              autoPlay
              loop
              muted
              playsInline
              webkit-playsinline=""
              onClick={onVideoClick}
              className="w-full h-full object-cover cursor-pointer"
              aria-hidden="true"
            />
            <HeroNameOverlay />
          </div>
        </div>
      </div>

      {/* MOBILE: Fullscreen video + overlay name */}
      <div className="md:hidden flex flex-col h-[calc(100svh-5rem)]">
        {/* Nav links */}
        <div className="flex items-center justify-center gap-4 py-4">
          {navCenter.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="font-header font-normal text-xs uppercase hover:opacity-70 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Video + overlaid name */}
        <div className="flex-1 relative overflow-hidden" onClick={onVideoClick} style={{ containerType: 'inline-size' }}>
          <video
            src="/videos/Showreel 2021.mp4"
            autoPlay
            loop
            muted
            playsInline
            webkit-playsinline=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <MobileHeroNameOverlay />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
