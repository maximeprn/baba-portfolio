/**
 * Photos Hero — Static fullscreen cover image with sticky positioning.
 * Replaces the complex animated marquee with a simple fullscreen photo.
 */

import { photoProjects } from '../../data/photoProjects';

function FloatingGalleryHero() {
  // Use the first project's cover image as the hero background
  const coverImage = photoProjects[0]?.coverImage || '';

  return (
    <section className="relative w-full" aria-label="Photo gallery hero">
      {/* Desktop: Sticky fullscreen photo */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <img
            src={coverImage}
            alt="Photography portfolio"
            className="w-full h-full object-cover"
            loading="eager"
          />
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
