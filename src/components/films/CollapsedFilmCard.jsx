/**
 * Collapsed Film Card — single-row summary with shutter-opening animation.
 * On click: text slides up, bottom edge slides down revealing FeaturedFilmCard content.
 */

import { useRef, useState, useCallback } from 'react';
import FeaturedFilmCard from './FeaturedFilmCard';
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

function CollapsedFilmCard({ film, index = 0, onFilmClick }) {
  const [phase, setPhase] = useState('collapsed'); // 'collapsed' | 'animating' | 'expanded'
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const { scrollTo, getScrollPosition } = useSmoothScrollContext();
  const { title, description, year, category } = film;

  const shortDescription = description.split(' ').slice(0, 5).join(' ') + '...';
  const isExpandingRef = useRef(false);

  const handleClick = useCallback(() => {
    if (phase !== 'collapsed' || isExpandingRef.current) return;
    isExpandingRef.current = true;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // Skip animation for reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('expanded');
      container.style.height = 'auto';
      container.style.overflow = '';
      return;
    }

    const targetHeight = content.scrollHeight;

    // Lock starting height (read actual collapsed height for mobile)
    const collapsedHeight = container.offsetHeight;
    container.style.height = `${collapsedHeight}px`;
    container.getBoundingClientRect(); // force reflow

    setPhase('animating');

    requestAnimationFrame(() => {
      // 1. Set target height without transition so page height updates for scroll calc
      container.style.transition = 'none';
      container.style.height = `${targetHeight}px`;
      container.getBoundingClientRect(); // force reflow

      // 2. Compute scroll target to center the video element on screen
      const videoEl = content.querySelector('video')?.parentElement;
      const currentScroll = getScrollPosition();
      if (videoEl) {
        const videoRect = videoEl.getBoundingClientRect();
        const videoAbsoluteTop = videoRect.top + currentScroll;
        const targetScroll = videoAbsoluteTop - (window.innerHeight / 2) + (videoRect.height / 2);
        scrollTo(targetScroll, { ease: 0.05 });
      }

      // 3. Snap back to collapsed, then animate to target (no paint between — single rAF)
      container.style.height = `${collapsedHeight}px`;
      container.getBoundingClientRect(); // force reflow
      container.style.transition = 'height 1200ms cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.height = `${targetHeight}px`;
    });
  }, [phase, scrollTo, getScrollPosition]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== containerRef.current || e.propertyName !== 'height') return;
    setPhase('expanded');
    const container = containerRef.current;
    if (container) {
      container.style.transition = 'none';
      container.style.height = 'auto';
    }
  }, []);

  return (
    <article
      ref={containerRef}
      onClick={phase === 'collapsed' ? handleClick : undefined}
      onKeyDown={phase === 'collapsed' ? handleKeyDown : undefined}
      onTransitionEnd={handleTransitionEnd}
      role={phase === 'collapsed' ? 'button' : undefined}
      tabIndex={phase === 'collapsed' ? 0 : undefined}
      aria-expanded={phase !== 'collapsed'}
      aria-label={phase === 'collapsed' ? `Expand ${title} film details` : undefined}
      className={`w-full bg-white relative ${phase === 'collapsed' ? 'cursor-pointer hover:opacity-70 transition-opacity duration-150 md:h-9' : ''}`}
      style={{
        overflow: phase !== 'expanded' ? 'hidden' : undefined,
      }}
    >
      {/* Collapsed text overlay — normal flow on mobile (sizes container), absolute on desktop */}
      {phase !== 'expanded' && (
        <div
          className={`${phase === 'collapsed' ? 'relative md:absolute' : 'absolute'} top-0 left-0 right-0 bg-white z-10`}
          style={{
            transition: 'transform 500ms ease-out, opacity 500ms ease-out',
            transform: phase === 'animating' ? 'translateY(-100%)' : 'translateY(0)',
            opacity: phase === 'animating' ? 0 : 1,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 px-4 lg:px-0 py-2 md:py-0 md:h-9">
            <p className="flex-1 font-header text-xs font-medium tracking-[1.8px] uppercase leading-[1.3]">
              {title}
            </p>
            <p className="font-body text-xs tracking-[0.6px] leading-7 shrink-0 hidden md:block">
              {shortDescription}
            </p>
            <p className="flex-1 font-header text-[10px] font-medium tracking-[1.5px] text-right uppercase whitespace-pre-wrap">
              {year}  •  {category}
            </p>
          </div>
        </div>
      )}

      {/* FeaturedFilmCard content — absolute when collapsed so it doesn't affect height */}
      <div ref={contentRef} className={phase === 'collapsed' ? 'absolute top-0 left-0 right-0' : ''}>
        <FeaturedFilmCard film={film} index={index} onFilmClick={onFilmClick} />
      </div>
    </article>
  );
}

export default CollapsedFilmCard;
