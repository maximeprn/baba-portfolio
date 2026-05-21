import { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import HeroSection from '../components/ui/HeroSection';
import FeaturedFilmCard from '../components/films/FeaturedFilmCard';
import CollapsedFilmCard from '../components/films/CollapsedFilmCard';
import FilmModal from '../components/films/FilmModal';
import TitleSection from '../components/ui/TitleSection';

import { films } from '../sanity/loader';
import { siteConfig } from '../data/siteConfig';

function ShowreelOverlay({ vimeoUrl, onClose }) {
  return (
    <FilmModal
      film={{ videoUrl: vimeoUrl, title: 'Showreel' }}
      isOpen={true}
      onClose={onClose}
    />
  );
}

/**
 * Films Page (Homepage)
 * Hero section with fullscreen video + film cards below.
 * Clicking the hero opens a Vimeo showreel overlay.
 */
function Films() {
  const [showShowreel, setShowShowreel] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);

  // Collapsed "Other Projects" film cards are independent — no
  // single-expand. Opening one does not collapse the others; each card
  // owns its own state and the user collapses it itself.

  // Cascading video load: hero → featured → collapsed
  const [loadPhase, setLoadPhase] = useState('hero');
  const phaseRef = useRef('hero');
  const featuredLoadCount = useRef(0);
  const featuredFilms = films.filter(f => !f.collapsed);

  const advancePhase = useCallback((to) => {
    if (
      (to === 'featured' && phaseRef.current === 'hero') ||
      (to === 'collapsed' && phaseRef.current === 'featured')
    ) {
      phaseRef.current = to;
      setLoadPhase(to);
    }
  }, []);

  const handleHeroReady = useCallback(() => advancePhase('featured'), [advancePhase]);

  const handleFeaturedVideoReady = useCallback(() => {
    featuredLoadCount.current += 1;
    if (featuredLoadCount.current >= featuredFilms.length) {
      advancePhase('collapsed');
    }
  }, [featuredFilms.length, advancePhase]);

  // Fallback: start collapsed loading after 10s even if featured aren't all done
  useEffect(() => {
    if (loadPhase === 'featured') {
      const timer = setTimeout(() => advancePhase('collapsed'), 10000);
      return () => clearTimeout(timer);
    }
  }, [loadPhase, advancePhase]);

  // Mute hero video when opening any film modal
  const muteHero = () => {
    document.querySelectorAll('video[data-hero-video]').forEach(v => { v.muted = true; });
  };

  const handleFilmClick = (film) => {
    muteHero();
    setSelectedFilm(film);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <Helmet>
        <title>Basile Deschamps | Film & Photography</title>
        <meta name="description" content="Portfolio of Basile Deschamps - Visual artist specializing in film direction and photography. Reinventing the frame." />
        <meta property="og:title" content="Basile Deschamps | Film & Photography" />
        <meta property="og:description" content="Visual artist specializing in film direction and photography." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* HERO SECTION — full-bleed */}
      <HeroSection onVideoClick={() => setShowShowreel(true)} onReady={handleHeroReady} />

      {/* POST-HERO CONTENT — the content itself (the sections / cards) is
          capped at 1400px wide. The column is max-w-[1600px] = 1400px of
          content + the 2×100px side gutter; it is centred, so on screens
          wider than that the surplus becomes equal left/right margin.
          The md:px-[100px] gutter re-applies what Layout drops on hero
          pages, so TitleSection's -mx-[100px] escape still works and the
          cards have the same gutter as on every other page. */}
      <div className="flex flex-col items-center w-full max-w-[1600px] md:px-[100px]">
        {/* Hero → first section gap. Tablet (768–1024px) gets a wider
            120px breather; phone and desktop keep their values. */}
        <div className="h-10 md:h-[120px] lg:h-0" aria-hidden="true" />

        {/* CURATED WORKS — hidden for now, may reintroduce later */}
        {/* <TitleSection title="Curated Works" borderTop /> */}

        {films.filter(f => !f.collapsed).map((film, index) => (
          <div key={film.id} className="py-2.5 w-full">
            <FeaturedFilmCard
              film={film}
              index={index}
              onFilmClick={handleFilmClick}
              shouldLoad={loadPhase !== 'hero'}
              onVideoReady={handleFeaturedVideoReady}
            />
          </div>
        ))}

        {/* OTHER PROJECTS */}
        <div className="h-24" aria-hidden="true" />
        <TitleSection title="Other Projects" />

        {/* 1rem gap below the Other Projects title */}
        <div className="h-4" aria-hidden="true" />
        {/* Phone shows the collapsed bands two-up (unchanged); tablet lays
            them out three-up, and from the `cards` breakpoint (1350px) —
            "when the space allows it" — desktop goes four-up. Same stacked
            title + subtitle card throughout. An expanded band breaks out to
            full width via col-span-2 / md:col-span-3 / cards:col-span-4 on
            its <article>. */}
        <div className="grid w-full grid-cols-2 md:grid-cols-3 cards:grid-cols-4 gap-x-2 gap-y-[12px] md:gap-x-6 md:gap-y-4">
          {films.filter(f => f.collapsed).map((film, index) => (
            <CollapsedFilmCard
              key={film.id}
              film={film}
              index={index}
              onFilmClick={handleFilmClick}
            />
          ))}
        </div>

        <div className="h-20" aria-hidden="true" />
      </div>

      {/* SHOWREEL OVERLAY */}
      {showShowreel && (
        <ShowreelOverlay
          vimeoUrl={siteConfig.showreel.vimeoUrl}
          onClose={() => setShowShowreel(false)}
        />
      )}

      {/* FILM DETAIL MODAL */}
      <FilmModal
        film={selectedFilm}
        isOpen={!!selectedFilm}
        onClose={() => setSelectedFilm(null)}
      />
    </div>
  );
}

export default Films;
