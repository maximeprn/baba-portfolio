import { useState } from 'react';

import HeroSection from '../components/ui/HeroSection';
import FilmCard from '../components/films/FilmCard';
import FeaturedFilmCard from '../components/films/FeaturedFilmCard';
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
    <div className="flex flex-col items-center gap-5 w-full">
      {/* HERO SECTION */}
      <HeroSection onVideoClick={() => setShowShowreel(true)} />

      {/* FILM CARDS */}
      {films.map((film, index) => (
        film.featured ? (
          <FeaturedFilmCard
            key={film.id}
            film={film}
            index={index}
            onFilmClick={setSelectedFilm}
          />
        ) : (
          <FilmCard
            key={film.id}
            film={film}
            onFilmClick={setSelectedFilm}
          />
        )
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
