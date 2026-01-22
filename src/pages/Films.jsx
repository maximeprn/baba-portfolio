/**
 * ============================================================================
 * FILMS PAGE (HOMEPAGE)
 * ============================================================================
 *
 * This is the main landing page of the portfolio website.
 * It displays the hero section and all film projects.
 *
 * PAGE STRUCTURE:
 * 1. Hero Section - Large typographic artist name + hero image
 * 2. Divider - Horizontal line separating sections
 * 3. Film Cards - List of all film projects in alternating layout
 *
 * DATA SOURCE:
 * Film data comes from /src/data/films.js
 * To add new films, edit that file.
 *
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Import components used on this page
import HeroSection from '../components/ui/HeroSection';
import FilmCard from '../components/films/FilmCard';
import FeaturedFilmCard from '../components/films/FeaturedFilmCard';
import IntroSection from '../components/ui/IntroSection';

// Import film data
import { films } from '../data/films';

// Import smooth scroll context for scroll restoration
import { useSmoothScrollContext } from '../context/SmoothScrollContext';

// Threshold at which the hero video is fully enlarged (matches HeroSection growPhaseEnd)
const HERO_SCROLL_THRESHOLD = 1000;

// Import a placeholder hero image
// TODO: Replace with actual hero image path
// import heroImage from '../assets/hero-image.png';


/**
 * Films Page Component
 *
 * The main homepage showing the hero and all film projects.
 *
 * @returns {JSX.Element} The complete Films page
 */
function Films() {
  // Get smooth scroll functions from context
  const { scrollToElement, scrollTo, addScrollListener } = useSmoothScrollContext();

  // Audio player state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Track if mute button should be visible (hidden when scrolled past hero)
  const [isMuteButtonVisible, setIsMuteButtonVisible] = useState(true);

  // Toggle music playback
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Listen to scroll position to show/hide mute button
  useEffect(() => {
    const unsubscribe = addScrollListener((scrollY) => {
      // Hide button when scrolled past hero threshold
      setIsMuteButtonVisible(scrollY < HERO_SCROLL_THRESHOLD);
    });

    return unsubscribe;
  }, [addScrollListener]);

  // Scroll to the last clicked film card when returning to this page
  useEffect(() => {
    const lastClickedFilm = sessionStorage.getItem('lastClickedFilm');
    if (lastClickedFilm) {
      // Use setTimeout to ensure content is fully rendered before scrolling
      const timer = setTimeout(() => {
        const element = document.getElementById(`film-${lastClickedFilm}`);
        if (element) {
          scrollToElement(element, { block: 'center', instant: true });
        }
        // Clear the saved film after scrolling
        sessionStorage.removeItem('lastClickedFilm');
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Scroll to top on initial page load
      scrollTo(0, true);
    }
  }, [scrollToElement, scrollTo]);

  return (
    // Main container for the entire page
    // overflow-x-hidden prevents horizontal scrolling from hero elements
    <div
      className="
        flex                             /* Flexbox layout */
        flex-col                         /* Stack children vertically */
        items-center                     /* Center children horizontally */
        gap-5                            /* Gap between major sections */
        w-full                           /* Full width */
        bg-white                         /* White background */
      "
    >
      {/* BACKGROUND MUSIC PLAYER */}
      <audio
        ref={audioRef}
        src="/videos/hero-music.mp3"
        loop
        preload="auto"
        onEnded={() => setIsPlaying(false)}
      />

      {/* MUTE/UNMUTE BUTTON - Rendered via portal to escape transform context */}
      {createPortal(
        <button
          onClick={toggleMusic}
          className={`
            fixed
            top-20
            md:top-6
            right-4
            md:right-6
            z-50
            w-6
            h-8
            md:w-8
            md:h-10
            flex
            items-center
            justify-center
            hover:opacity-70
            transition-all
            duration-300
            ease-in-out
            ${isMuteButtonVisible
              ? 'translate-x-0 opacity-100'
              : 'translate-x-16 opacity-0 pointer-events-none'
            }
          `}
          aria-label={isPlaying ? 'Mute' : 'Unmute'}
          aria-hidden={!isMuteButtonVisible}
        >
          {isPlaying ? (
            // Unmute icon (sound on)
            <svg className="w-full h-full" viewBox="0 0 50 63" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_unmute)">
                <path d="M20.6 35.3H23.5V38.2H20.6V35.3ZM20.6 14.7H23.5V11.8H20.6V14.7ZM17.7 32.4V29.5H8.90002V29.4V20.6H17.7V17.7H5.90002V32.5L17.7 32.4V35.3H20.6V32.4H17.7ZM23.6 38.3V41.2H26.5V38.3H23.6ZM20.6 14.8H17.7V17.7H20.6V14.8ZM23.6 11.8H26.5V8.89999H23.6V11.8ZM41.2 17.7H44.1V14.8H41.2V17.7ZM41.2 35.3H44.1V32.4H41.2V35.3ZM44.2 17.7V32.5H47.1V17.7H44.2ZM41.2 20.6H38.3V29.4H41.2V20.6ZM26.5 5.89999V8.89999H32.4V41.2H26.5V44.1H35.3V5.89999H26.5Z" fill="black"/>
              </g>
              <defs>
                <clipPath id="clip0_unmute">
                  <rect width="50" height="62.5" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          ) : (
            // Mute icon (sound off)
            <svg className="w-full h-full" viewBox="0 0 50 63" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_mute)">
                <path d="M14.7 11.7H11.8V8.79999H14.7V11.7ZM11.7 5.89999H8.80002V8.79999H11.7V5.89999ZM23.5 11.8H20.6V14.7H23.5V11.8ZM23.5 17.6H20.6V20.5H23.5V17.6ZM20.5 35.3V32.4H17.6V35.3H20.5ZM29.4 23.5H26.5V26.4H29.4V23.5ZM23.5 23.5H26.4V20.6H23.5V23.5ZM23.5 11.7H26.4V8.79999H23.5V11.7ZM41.2 38.2V41.1H44.1V38.2H41.2ZM35.3 32.4V5.89999H26.5V8.79999H32.4V26.4V26.5H29.4V29.4H32.4V41.1V41.2H26.5V44.1H35.3V35.3H38.2V32.4H35.3ZM38.2 38.2H41.1V35.3H38.2V38.2ZM5.90002 17.6V29.4V32.4H17.6V29.4H8.80002V20.6V20.5H17.6V17.6H5.90002ZM17.6 17.6H20.5V14.7H17.6V17.6ZM20.6 35.3V38.2H23.5V35.3H20.6ZM14.7 11.8V14.7H17.6V11.8H14.7ZM23.5 41.1H26.4V38.2H23.5V41.1Z" fill="black"/>
              </g>
              <defs>
                <clipPath id="clip0_mute">
                  <rect width="50" height="62.5" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          )}
        </button>,
        document.body
      )}

      {/* HERO SECTION
          The large typographic treatment with artist name and hero image.
          Pass heroImage prop to display an image above the name.
          If no image, pass null or omit the prop.
      */}
      <HeroSection
        // TODO: Uncomment and update when you have a hero image
        // heroImage={heroImage}
        heroImage={null}
        audioRef={audioRef}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />


      {/* INTRO SECTION
          Large typography intro text about the artist
      */}
      <IntroSection />


      {/* FILM CARDS SECTION
          Maps through all films and renders a card for each.

          .map() is a JavaScript array method that:
          1. Goes through each item in the 'films' array
          2. Calls the function for each item
          3. Returns a new array of the results (React components)

          key={film.id} is required by React to efficiently update the list.
          Each item needs a unique key so React knows which items changed.
      */}
      {films.map((film, index) => (
        film.featured ? (
          <FeaturedFilmCard
            key={film.id}
            film={film}
            index={index}
          />
        ) : (
          <FilmCard
            key={film.id}
            film={film}
          />
        )
      ))}


      {/* BOTTOM SPACING
          Add some space at the bottom of the page before the footer
      */}
      <div className="h-20" aria-hidden="true" />
    </div>
  );
}

// Export for use in App.jsx router
export default Films;
