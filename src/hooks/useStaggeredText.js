/**
 * ============================================================================
 * USE STAGGERED TEXT HOOK
 * ============================================================================
 *
 * A React hook that creates a scroll-based staggered text animation.
 * Words have random horizontal offsets that animate to center as they
 * scroll into view.
 *
 * ============================================================================
 */

import { useRef, useEffect } from 'react';


/**
 * Base transform offsets for each word type (8 variations)
 */
const BASE_TRANSFORMS = {
  0: 0.3,   // Slight right
  1: -0.9,  // Left
  2: 1.5,   // Right
  3: -2.4,  // Strong left
  4: -0.3,  // Slight left
  5: 1.9,   // Strong right
  6: -1.3,  // Medium left
  7: 0.6,   // Medium right
};


/**
 * Apply easing function to progress value
 */
function applyEasing(progress, easingPower = 3.0) {
  // Smoothstep easing
  if (easingPower <= 2) {
    return progress * progress * (3 - 2 * progress);
  } else {
    return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
  }
}


/**
 * useStaggeredText Hook
 *
 * @param {Object} options - Configuration options
 * @param {string} options.text - The text content to animate
 * @param {number} options.maxOffset - Maximum horizontal offset in em (default: 2.4)
 * @param {number} options.wordSpacing - Minimum space between words in em (default: 0.3)
 * @param {number} options.animationSpeed - Animation response speed (default: 0.15)
 * @returns {Object} { containerRef }
 */
export function useStaggeredText(options = {}) {
  const {
    text = '',
    maxOffset = 1,
    wordSpacing = 0.1,
    animationSpeed = 0.15,
    animationSmoothing = 0.50,
    animationStart = 0,
    animationEnd = 100,
    delayRange = 0.3,
    staticWords = 50,  // Percentage of words that don't move (0-100)
  } = options;

  const containerRef = useRef(null);
  const wordStatesRef = useRef(new Map());
  const progressStatesRef = useRef(new Map());
  const rafRef = useRef(null);
  const wordDataRef = useRef([]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container || !text) return;

    // Skip animation entirely if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Render text as individual word spans
    // Handle newlines by splitting on them first, then words
    const factor = maxOffset / 2.4;
    let wordIndex = 0;

    // Split by newlines first to preserve line breaks
    const lines = text.split('\n');
    const htmlParts = [];

    // Calculate total words to determine which ones are static
    const allWords = lines.flatMap(line => line.trim().split(' ').filter(w => w.length > 0));
    const totalWords = allWords.length;
    const numStaticWords = Math.floor(totalWords * (staticWords / 100));

    // Create shuffled indices to randomly select static words
    const indices = Array.from({ length: totalWords }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const staticIndices = new Set(indices.slice(0, numStaticWords));

    lines.forEach((line, lineIndex) => {
      const words = line.trim().split(' ').filter(w => w.length > 0);

      words.forEach((word) => {
        const isStatic = staticIndices.has(wordIndex);
        const type = Math.floor(Math.random() * 8);
        const delay = Math.random() * delayRange;

        // Calculate padding based on word type
        let paddingStyle = '';
        const baseSpacing = wordSpacing;

        switch (type) {
          case 0:
            paddingStyle = `padding-right: ${(0.4 * factor + baseSpacing).toFixed(2)}em;`;
            break;
          case 1:
            paddingStyle = `margin-left: ${(0.3 * factor + baseSpacing).toFixed(2)}em; padding-left: ${(1.2 * factor).toFixed(2)}em; padding-right: ${(0.2 * factor + baseSpacing).toFixed(2)}em;`;
            break;
          case 2:
            paddingStyle = `padding-left: ${(0.2 * factor).toFixed(2)}em; padding-right: ${(1.8 * factor + baseSpacing).toFixed(2)}em;`;
            break;
          case 3:
            paddingStyle = `margin-left: ${(0.4 * factor + baseSpacing).toFixed(2)}em; padding-left: ${(2.8 * factor).toFixed(2)}em; padding-right: ${(0.3 * factor + baseSpacing).toFixed(2)}em;`;
            break;
          case 4:
            paddingStyle = `padding-left: ${(0.5 * factor).toFixed(2)}em; padding-right: ${baseSpacing.toFixed(2)}em;`;
            break;
          case 5:
            paddingStyle = `padding-left: ${(0.3 * factor).toFixed(2)}em; padding-right: ${(2.2 * factor + baseSpacing).toFixed(2)}em;`;
            break;
          case 6:
            paddingStyle = `margin-left: ${(0.3 * factor + baseSpacing).toFixed(2)}em; padding-left: ${(1.6 * factor).toFixed(2)}em; padding-right: ${(0.2 * factor + baseSpacing).toFixed(2)}em;`;
            break;
          case 7:
            paddingStyle = `padding-right: ${(0.9 * factor + baseSpacing).toFixed(2)}em;`;
            break;
        }

        // Set initial transform offset (0 for static words, 0 for reduced motion)
        const initialOffset = (isStatic || prefersReducedMotion) ? 0 : (BASE_TRANSFORMS[type] || 0) * factor;

        htmlParts.push(`<span class="word word-${type}" data-delay="${delay}" data-index="${wordIndex}" data-type="${type}" data-static="${isStatic}" style="${paddingStyle} transform: translateX(${initialOffset}em);">${word} </span>`);
        wordIndex++;
      });

      // Add line break after each line except the last
      if (lineIndex < lines.length - 1) {
        htmlParts.push('<br/>');
      }
    });

    container.innerHTML = htmlParts.join('');

    // Skip animation loop if user prefers reduced motion
    if (prefersReducedMotion) return;

    // Animation update function
    function updateAnimation() {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const startY = windowHeight * (animationStart / 100);
      const endY = windowHeight * (animationEnd / 100);
      const range = startY - endY;

      const wordElements = container.querySelectorAll('.word');

      wordElements.forEach((wordEl) => {
        // Skip animation for static words
        const isStatic = wordEl.getAttribute('data-static') === 'true';
        if (isStatic) {
          wordEl.style.transform = 'translateX(0)';
          return;
        }

        const wordRect = wordEl.getBoundingClientRect();
        const wordCenter = wordRect.top + wordRect.height / 2;
        const index = wordEl.getAttribute('data-index');
        const type = parseInt(wordEl.getAttribute('data-type') || 0);
        const wordDelay = parseFloat(wordEl.getAttribute('data-delay')) || 0;

        // Base progress (0 = bottom of animation zone, 1 = top)
        let baseProgress = Math.max(0, Math.min(1, (startY - wordCenter) / range));

        // Apply word delay
        const targetProgress = Math.max(0, Math.min(1,
          (baseProgress - wordDelay) / (1 - wordDelay)
        ));

        // Interpolate animation progress
        const wordKey = `word-${index}`;
        if (!progressStatesRef.current.has(wordKey)) {
          progressStatesRef.current.set(wordKey, 0);
        }

        const currentProgress = progressStatesRef.current.get(wordKey);
        const newProgress = currentProgress + (targetProgress - currentProgress) * animationSpeed;
        progressStatesRef.current.set(wordKey, newProgress);

        // Apply easing
        const easedProgress = applyEasing(newProgress);

        // Calculate target offset
        const originalOffset = (BASE_TRANSFORMS[type] || 0) * factor;
        const targetOffset = originalOffset * (1 - easedProgress);

        // Apply smoothing
        if (!wordStatesRef.current.has(wordKey)) {
          wordStatesRef.current.set(wordKey, originalOffset);
        }

        const currentOffset = wordStatesRef.current.get(wordKey);
        const newOffset = currentOffset + (targetOffset - currentOffset) * (1 - animationSmoothing);
        wordStatesRef.current.set(wordKey, newOffset);

        wordEl.style.transform = `translateX(${newOffset}em)`;
      });

      rafRef.current = requestAnimationFrame(updateAnimation);
    }

    // Start animation loop
    rafRef.current = requestAnimationFrame(updateAnimation);

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      wordStatesRef.current.clear();
      progressStatesRef.current.clear();
    };
  }, [text, maxOffset, wordSpacing, animationSpeed, animationSmoothing, animationStart, animationEnd, delayRange, staticWords]);


  return { containerRef };
}


export default useStaggeredText;
