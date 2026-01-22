/**
 * ============================================================================
 * HERO SECTION COMPONENT - Advanced Interactive Floating Video with Pin Effect
 * ============================================================================
 *
 * Complete Video Animation System with THREE simultaneous animations:
 *
 * 1. SCROLL-BASED SCALE & PINNING (Transform-based)
 *    - Scale: 0.40 (40%) → 1.05 (105%) over ~1000px scroll
 *    - TranslateY: -105vh → 0vh (counteracts scroll to create pin illusion)
 *    - Video appears "pinned" while text scrolls behind
 *
 * 2. CURSOR PARALLAX (Always Active, X & Y axes)
 *    - TranslateX: -135px ← → +230px based on mouse X position
 *    - TranslateY: -80px ↑ → +80px based on mouse Y position
 *    - Creates magnetic/tracking effect on both axes
 *    - Strength diminishes as video grows (1.0 → 0.2)
 *
 * 3. GENTLE FLOATING (CSS Animation)
 *    - Subtle up/down movement via Tailwind keyframes
 *    - Adds organic, living quality to the video
 *
 * PERFORMANCE:
 * - Uses will-change for GPU acceleration
 * - Passive event listeners for scroll/mouse
 * - RequestAnimationFrame for smooth 60fps updates
 *
 * ============================================================================
 */

// React hooks for state and lifecycle management
import { useState, useEffect, useRef } from 'react';

// Link component for client-side navigation
import { Link, useLocation } from 'react-router-dom';

// Import site config for artist name and tagline
import { siteConfig } from '../../data/siteConfig';

// Import smooth scroll context for scroll position
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';


/**
 * HeroSection Component
 *
 * Renders the interactive hero section with advanced floating video
 * that appears "pinned" to the viewport while scrolling.
 *
 * @param {Object} props - Component props
 * @param {React.RefObject} props.audioRef - Reference to the audio element for syncing
 * @param {boolean} props.isPlaying - Whether audio is currently playing
 * @param {Function} props.setIsPlaying - Function to update playing state
 * @returns {JSX.Element} The hero section
 */
function HeroSection({ audioRef, isPlaying, setIsPlaying }) {
  // Destructure artist info from config
  const { firstName, lastName, tagline } = siteConfig.artist;

  // Get navigation center items (Photos, Films)
  const { center: navCenter } = siteConfig.navigation;

  // Get current location for active state
  const location = useLocation();

  // Check if nav item is active
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Split the tagline into words for layout
  const taglineWords = tagline.split(' ');

  // Get scroll position from smooth scroll context
  const { addScrollListener, scrollTo: smoothScrollTo } = useSmoothScrollContext();


  // =========================================================================
  // REFS
  // =========================================================================

  // Reference to the hero section element for scroll calculations
  const heroRef = useRef(null);

  // Reference to store the animation frame ID for cleanup
  const rafRef = useRef(null);

  // References to video elements for audio sync
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);


  // =========================================================================
  // STATE
  // =========================================================================

  // Track scroll progress (raw pixels)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track mouse position as offset from viewport center (-1 to 1)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Store calculated transform values for smooth RAF updates
  // On small screens: no animation (scale 1, no translateY)
  // On larger screens: start small and grow with scroll
  const [transform, setTransform] = useState(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (screenWidth < 768) {
      return { scale: 1, translateY: 0, parallaxX: 0, parallaxY: 0 };
    }
    const initialScale = screenWidth < 1024 ? 0.48 : 0.40;
    return {
      scale: initialScale,
      translateY: 30,
      parallaxX: 0,
      parallaxY: 0,
    };
  });


  // =========================================================================
  // AUDIO-VIDEO SYNC
  // =========================================================================

  // Track if we've already started audio
  const audioStartedRef = useRef(false);

  // Auto-start audio when video starts and keep them in sync
  useEffect(() => {
    const desktopVideo = desktopVideoRef.current;
    const mobileVideo = mobileVideoRef.current;
    const audio = audioRef?.current;

    if (!audio) return;

    const tryPlayAudio = (video) => {
      if (audioStartedRef.current) return;

      // Sync audio time with video and start playing
      audio.currentTime = video.currentTime;
      audio.play().then(() => {
        audioStartedRef.current = true;
        if (setIsPlaying) setIsPlaying(true);
      }).catch(() => {
        // Autoplay blocked - will try on first interaction
      });
    };

    // Throttle sync corrections to avoid audio stuttering
    let lastSyncTime = 0;
    const handleTimeUpdate = (video) => {
      // Keep audio in sync with video (within 0.5 second tolerance)
      // Only check every 2 seconds to avoid stuttering
      if (audio && !audio.paused) {
        const now = Date.now();
        if (now - lastSyncTime < 2000) return; // Throttle to every 2 seconds

        const diff = Math.abs(audio.currentTime - video.currentTime);
        if (diff > 0.5) {
          audio.currentTime = video.currentTime;
          lastSyncTime = now;
        }
      }
    };

    // Try to play audio on first user interaction (click, scroll, keypress)
    const handleFirstInteraction = () => {
      const video = desktopVideo || mobileVideo;
      if (video && !audioStartedRef.current) {
        tryPlayAudio(video);
      }
      // Remove listeners after first successful play
      if (audioStartedRef.current) {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('scroll', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      }
    };

    // Add interaction listeners for autoplay fallback
    document.addEventListener('click', handleFirstInteraction, { once: false });
    document.addEventListener('scroll', handleFirstInteraction, { once: false });
    document.addEventListener('keydown', handleFirstInteraction, { once: false });
    document.addEventListener('touchstart', handleFirstInteraction, { once: false });

    // Desktop video handlers
    const onDesktopPlay = () => tryPlayAudio(desktopVideo);
    const onDesktopTimeUpdate = () => handleTimeUpdate(desktopVideo);

    // Mobile video handlers
    const onMobilePlay = () => tryPlayAudio(mobileVideo);
    const onMobileTimeUpdate = () => handleTimeUpdate(mobileVideo);

    if (desktopVideo) {
      desktopVideo.addEventListener('play', onDesktopPlay);
      desktopVideo.addEventListener('timeupdate', onDesktopTimeUpdate);
      // If video is already playing, try to start audio
      if (!desktopVideo.paused) {
        tryPlayAudio(desktopVideo);
      }
    }

    if (mobileVideo) {
      mobileVideo.addEventListener('play', onMobilePlay);
      mobileVideo.addEventListener('timeupdate', onMobileTimeUpdate);
      // If video is already playing, try to start audio
      if (!mobileVideo.paused) {
        tryPlayAudio(mobileVideo);
      }
    }

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      if (desktopVideo) {
        desktopVideo.removeEventListener('play', onDesktopPlay);
        desktopVideo.removeEventListener('timeupdate', onDesktopTimeUpdate);
      }
      if (mobileVideo) {
        mobileVideo.removeEventListener('play', onMobilePlay);
        mobileVideo.removeEventListener('timeupdate', onMobileTimeUpdate);
      }
    };
  }, [audioRef, setIsPlaying]);

  // Handle manual play/pause from button
  useEffect(() => {
    const audio = audioRef?.current;
    const video = desktopVideoRef.current || mobileVideoRef.current;

    if (!audio || !video) return;

    if (isPlaying) {
      audio.currentTime = video.currentTime;
      audio.play();
      audioStartedRef.current = true;
    } else {
      audio.pause();
    }
  }, [isPlaying, audioRef]);


  // =========================================================================
  // SCROLL HANDLER
  // =========================================================================

  useEffect(() => {
    // Subscribe to smooth scroll position updates
    const unsubscribe = addScrollListener((scrollY) => {
      setScrollProgress(scrollY);
    });

    return unsubscribe;
  }, [addScrollListener]);


  // =========================================================================
  // MOUSE HANDLER
  // =========================================================================

  useEffect(() => {
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      setMousePosition({
        x: (e.clientX - centerX) / centerX,
        y: (e.clientY - centerY) / centerY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


  // =========================================================================
  // TRANSFORM CALCULATION
  // =========================================================================

  useEffect(() => {
    const updateTransform = () => {
      const screenWidth = window.innerWidth;

      // On small screens (<768px), no animation - video is static at full size
      if (screenWidth < 768) {
        setTransform({
          scale: 1,
          translateY: 0,
          parallaxX: 0,
          parallaxY: 0,
        });
        return;
      }

      const growPhaseEnd = 1000;
      const holdDuration = 50;
      const holdPhaseEnd = growPhaseEnd + holdDuration;

      // Responsive initial scale for medium and large screens
      const initialScale = screenWidth < 1024 ? 0.48 : 0.40;
      const scaleGrowth = 1.05 - initialScale;

      let scale;
      let translateY;

      if (scrollProgress <= growPhaseEnd) {
        // PHASE 1: GROWING (0-1000px)
        // Video starts at bottom (+30vh) and animates UP to center (0)
        const progress = scrollProgress / growPhaseEnd;
        scale = initialScale + (progress * scaleGrowth);
        translateY = 30 - (progress * 30);
      } else if (scrollProgress <= holdPhaseEnd) {
        // PHASE 2: HOLD (1000-1050px)
        scale = 1.05;
        translateY = 0;
      } else {
        // PHASE 3: RELEASE (>1050px)
        scale = 1.05;
        translateY = 0;
      }

      // Parallax strength calculation
      // Parallax reduces faster than video growth (reaches 0 at ~60% scroll)
      const progress = Math.min(scrollProgress / growPhaseEnd, 1);
      const parallaxStrength = Math.max(0, 1.0 - progress * 1.2);

      // Horizontal parallax
      const maxOffsetLeftX = 135;
      const maxOffsetRightX = 230;
      const maxOffsetX = mousePosition.x > 0 ? maxOffsetRightX : maxOffsetLeftX;
      const parallaxX = mousePosition.x * maxOffsetX * parallaxStrength;

      // Vertical parallax
      const maxOffsetY = 80;
      const parallaxY = mousePosition.y * maxOffsetY * parallaxStrength;

      setTransform({
        scale,
        translateY,
        parallaxX,
        parallaxY,
      });
    };

    rafRef.current = requestAnimationFrame(updateTransform);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scrollProgress, mousePosition]);


  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <section
      ref={heroRef}
      className="relative w-full h-[calc(100svh-5rem)] md:h-auto flex flex-col md:block"
      aria-label="Hero section"
    >
      {/* TEXT SECTION - 100vh with text at bottom (desktop only) */}
      <div className="hidden md:block relative h-[100svh] w-full">
        <section
          className="
            absolute
            bottom-[10vh]
            left-0
            right-0
            z-0
            flex
            flex-row
            flex-nowrap
            w-full
            items-center
            justify-center
            gap-[3vw]
            overflow-visible
          "
          aria-label="Artist name"
        >
          {/* LEFT SIDE - "REINVENTING" + "BASILE" */}
          <div className="flex flex-col items-end">
            <h2
              className="
                font-header
                text-[1.2vw]
                text-primary
                whitespace-nowrap
                text-right
                w-full
                pr-1
              "
            >
              {taglineWords[0]?.toUpperCase()}
            </h2>

            <h1
              className="
                font-header
                text-[9vw]
                text-primary
                whitespace-nowrap
                leading-none
              "
            >
              {firstName.toUpperCase()}
            </h1>
          </div>

          {/* RIGHT SIDE - "THE" + "FRAME" + "DESCHAMPS" */}
          <div className="flex flex-col items-start">
            <div className="w-full flex items-center justify-between px-1">
              <h2
                className="
                  font-header
                  text-[1.2vw]
                  text-primary
                  whitespace-nowrap
                "
              >
                {taglineWords[1]?.toUpperCase()}
              </h2>

              <h2
                className="
                  font-header
                  text-[1.2vw]
                  text-primary
                  whitespace-nowrap
                "
              >
                {taglineWords[2]?.toUpperCase()}
              </h2>
            </div>

            <h1
              className="
                font-header
                text-[9vw]
                text-primary
                whitespace-nowrap
                leading-none
              "
            >
              {lastName.toUpperCase()}
            </h1>
          </div>
        </section>
      </div>


      {/* MOBILE CONTENT WRAPPER */}
      <div
        className="
          md:hidden
          flex-1
          flex
          flex-col
          items-center
          justify-center
        "
      >
        {/* TOP SPACER with PHOTOS/FILMS centered inside */}
        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            gap-4
          "
        >
          {navCenter.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                font-header
                font-normal
                uppercase
                transition-all
                duration-150
                ${isActive(item.path)
                  ? 'text-[1rem] opacity-100'
                  : 'text-[0.75rem] opacity-100 hover:opacity-70'
                }
              `}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* MOBILE VIDEO */}
        <div
          className="
            w-[90vw]
            max-w-[1400px]
            aspect-video
            rounded-lg
            overflow-hidden
          "
        >
          <video
            ref={mobileVideoRef}
            src="/videos/hero-teaser.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* BOTTOM SPACER - matches top spacer for centering */}
        <div className="flex-1" />
      </div>


      {/* DESKTOP VIDEO SECTION */}
      <div
        className="
          hidden
          md:block
          relative
          md:h-[calc(100svh+150px)]
          w-full
        "
      >
        {/* Sticky wrapper to keep video in viewport while scrolling */}
        <div
          className="
            sticky
            top-0
            h-[100vh]
            w-full
            relative
            pointer-events-none
          "
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: transform.scale === 1 && transform.translateY === 0
                ? 'translate(-50%, -50%)'
                : `translate(-50%, calc(-50% + ${transform.translateY}vh + ${transform.parallaxY}px)) translateX(${transform.parallaxX}px) scale(${transform.scale})`,
              transition: 'transform 0.1s ease-out',
              willChange: 'transform',
              clipPath: 'inset(0px)',
            }}
            className="
              w-[90vw]
              md:w-[80vw]
              lg:w-[70vw]
              max-w-[1400px]
              aspect-video
              rounded-lg
              overflow-hidden
              cursor-pointer
              pointer-events-auto
              z-10
            "
            onClick={() => {
              // Smooth scroll to the position where video is fully enlarged
              smoothScrollTo(1000, false);
            }}
          >
          <video
            ref={desktopVideoRef}
            src="/videos/hero-teaser.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="
              w-full
              h-full
              object-cover
              animate-float
              pointer-events-none
            "
            aria-hidden="true"
          />
          </div>
        </div>
      </div>


      {/* MOBILE TEXT SECTION - Only visible on mobile, after video */}
      <div
        className="
          block
          md:hidden
          w-[90vw]
          mx-auto
          pb-4
        "
      >
        <section
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-0
          "
          aria-label="Artist name"
        >
          <h1
            className="
              font-header
              text-[15vw]
              text-primary
              whitespace-nowrap
              leading-none
            "
          >
            {firstName.toUpperCase()}
          </h1>
          <h1
            className="
              font-header
              text-[15vw]
              text-primary
              whitespace-nowrap
              leading-none
            "
          >
            {lastName.toUpperCase()}
          </h1>
        </section>
      </div>
    </section>
  );
}

export default HeroSection;
