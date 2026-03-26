/**
 * Photos Hero — Contained sticky cover image with 60px inset.
 * Name text lives inside the image container, always white.
 * Uses ResizeObserver + scale() to auto-fit text within the container.
 */

import { useRef, useState, useEffect } from 'react';
import { photoProjects } from '../../data/photoProjects';
import { siteConfig } from '../../data/siteConfig';

function FloatingGalleryHero() {
  const coverImage = photoProjects[0]?.coverImage || '';
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
    <section className="relative w-full md:w-[calc(100%+200px)]" aria-label="Photo gallery hero">
      {/* Desktop: Sticky contained photo with 60px inset */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh - 5rem + 150px)' }}>
        <div className="sticky top-0 h-[calc(100svh-5rem)] w-full px-[60px] py-[20px]">
          <div className="relative w-full h-full overflow-hidden" style={{ containerType: 'inline-size' }}>
            <img
              src={coverImage}
              alt="Photography portfolio"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Name overlay — auto-scaled to fit container */}
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
                <div className="flex flex-col items-end">
                  <div className="w-full flex justify-end pr-1">
                    <span
                      className="font-header text-white whitespace-nowrap"
                      style={{ fontSize: '1.4cqw' }}
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
                <div className="flex flex-col items-start">
                  <div className="w-full flex justify-between px-1">
                    <span
                      className="font-header text-white whitespace-nowrap"
                      style={{ fontSize: '1.4cqw' }}
                    >
                      {taglineWords[1]?.toUpperCase()}
                    </span>
                    <span
                      className="font-header text-white whitespace-nowrap"
                      style={{ fontSize: '1.4cqw' }}
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
          </div>
        </div>
      </div>

      {/* Mobile: Fullscreen photo */}
      <div className="md:hidden relative h-[80svh] w-full overflow-hidden">
        <img
          src={coverImage}
          alt="Photography portfolio"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      <h1 className="sr-only">Photos</h1>
    </section>
  );
}

export default FloatingGalleryHero;
