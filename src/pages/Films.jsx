import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import HeroSection from '../components/ui/HeroSection';
import FilmCard from '../components/films/FilmCard';
import FeaturedFilmCard from '../components/films/FeaturedFilmCard';
import CollapsedFilmCard from '../components/films/CollapsedFilmCard';
import FilmModal from '../components/films/FilmModal';
import TitleSection from '../components/ui/TitleSection';

import { films } from '../data/films';
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

      {/* HERO SECTION */}
      <HeroSection onVideoClick={() => setShowShowreel(true)} onReady={handleHeroReady} />

      <div className="h-20 md:h-0" aria-hidden="true" />

      {/* CURATED WORKS — hidden for now, may reintroduce later */}
      {/* <TitleSection title="Curated Works" borderTop /> */}

      {films.filter(f => !f.collapsed).map((film, index) => (
        <React.Fragment key={film.id}>
          <hr className="border-t border-black self-stretch -mx-4 md:-mx-[100px]" />
          {film.featured ? (
            <div className="py-5 w-full">
              <FeaturedFilmCard
                film={film}
                index={index}
                onFilmClick={handleFilmClick}
                shouldLoad={loadPhase !== 'hero'}
                onVideoReady={handleFeaturedVideoReady}
              />
            </div>
          ) : (
            <div className="py-5 w-full">
              <FilmCard
                film={film}
                onFilmClick={handleFilmClick}
              />
            </div>
          )}
        </React.Fragment>
      ))}

      {/* OTHER PROJECTS */}
      <TitleSection title="Other Projects" />

      {films.filter(f => f.collapsed).map((film, index) => (
        <React.Fragment key={film.id}>
          <hr className="border-t border-black self-stretch -mx-4 md:-mx-[100px]" />
          <CollapsedFilmCard
            film={film}
            index={index}
            onFilmClick={handleFilmClick}
            shouldLoad={loadPhase === 'collapsed'}
          />
        </React.Fragment>
      ))}

      {/* Bottom border after last collapsed card */}
      <hr className="border-t border-black self-stretch -mx-4 md:-mx-[100px]" />

      <div className="h-20" aria-hidden="true" />

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
