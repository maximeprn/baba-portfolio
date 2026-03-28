import React, { useState } from 'react';

import HeroSection from '../components/ui/HeroSection';
import FilmCard from '../components/films/FilmCard';
import FeaturedFilmCard from '../components/films/FeaturedFilmCard';
import CollapsedFilmCard from '../components/films/CollapsedFilmCard';
import FilmModal from '../components/films/FilmModal';

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

  return (
    <div className="flex flex-col items-center w-full">
      {/* HERO SECTION */}
      <HeroSection onVideoClick={() => setShowShowreel(true)} />

      {/* FILM CARDS */}
      {films.map((film, index) => (
        <React.Fragment key={film.id}>
          {(film.featured || film.collapsed) && (
            <hr className="border-t border-black self-stretch -mx-4 md:-mx-[100px]" />
          )}
          {film.collapsed ? (
            <CollapsedFilmCard
              film={film}
              index={index}
              onFilmClick={setSelectedFilm}
            />
          ) : film.featured ? (
            <div className="py-5 w-full">
              <FeaturedFilmCard
                film={film}
                index={index}
                onFilmClick={setSelectedFilm}
              />
            </div>
          ) : (
            <div className="py-5 w-full">
              <FilmCard
                film={film}
                onFilmClick={setSelectedFilm}
              />
            </div>
          )}
        </React.Fragment>
      ))}

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
