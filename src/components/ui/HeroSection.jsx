import { Link } from 'react-router-dom';
import { siteConfig } from '../../data/siteConfig';

/**
 * HeroSection — Fullscreen sticky video background.
 * Video fills the viewport and stays fixed as content scrolls over it.
 *
 * @param {Object} props
 * @param {function} props.onVideoClick - Called when user clicks the video
 */
function HeroSection({ onVideoClick }) {
  const { firstName, lastName } = siteConfig.artist;
  const { center: navCenter } = siteConfig.navigation;

  return (
    <section className="relative w-full" aria-label="Hero section">
      {/* DESKTOP: Sticky fullscreen video */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <video
            src="/videos/hero-teaser.mp4"
            autoPlay
            loop
            muted
            playsInline
            onClick={onVideoClick}
            className="w-full h-full object-cover cursor-pointer"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* MOBILE: Fullscreen video + name */}
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

        {/* Video */}
        <div className="flex-1 relative" onClick={onVideoClick}>
          <video
            src="/videos/hero-teaser.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>

        {/* Name */}
        <div className="w-[90vw] mx-auto pb-4">
          <h1 className="flex flex-col items-center gap-0" aria-label="Artist name">
            <span className="font-header text-[15vw] text-primary whitespace-nowrap leading-none">
              {firstName.toUpperCase()}
            </span>
            <span className="font-header text-[15vw] text-primary whitespace-nowrap leading-none">
              {lastName.toUpperCase()}
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
