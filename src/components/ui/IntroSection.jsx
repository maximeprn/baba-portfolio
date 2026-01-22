/**
 * ============================================================================
 * INTRO SECTION COMPONENT
 * ============================================================================
 *
 * Large typography intro text displayed between the hero and film cards.
 * Right-aligned, multi-line display text with staggered animation.
 *
 * ============================================================================
 */

import { useStaggeredText } from '../../hooks/useStaggeredText';

const INTRO_TEXT = "Between Parisian elegance and Cape Town outdoor dreams, Basile Deschamps maps a new imaginary space where sport became a graceful gesture suspended in space and time";

/**
 * IntroSection Component
 *
 * Displays a large introductory quote about the artist with staggered text animation.
 *
 * @returns {JSX.Element} The intro section
 */
function IntroSection() {
  const { containerRef } = useStaggeredText({
    text: INTRO_TEXT,
    maxOffset: 2,
    wordSpacing: 0,
    animationSpeed: 0.1,
    staticWords: 50,
  });

  return (
    <section className="w-full px-0 py-16">
      <p
        ref={containerRef}
        className="
          text-right
          text-[2.5rem]
          leading-[1.1]
          font-medium
          text-primary
          staggered-text
        "
        style={{ fontFamily: 'Helvetica Now Display' }}
      />
    </section>
  );
}

export default IntroSection;
