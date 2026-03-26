/**
 * PersistentHeroText — "BASILE DESCHAMPS" + "REINVENTING THE FRAME"
 * Lives in Layout.jsx so it never unmounts during route transitions.
 *
 * Two-layer technique for split color:
 * - Black layer (z-10): visible everywhere, extends below video
 * - White layer (z-20): clip-path'd to video area, covers black layer on video
 * Result: white text on video, black text on white background.
 */

import { siteConfig } from '../../data/siteConfig';

function PersistentHeroText() {
  const { firstName, lastName, tagline } = siteConfig.artist;
  const taglineWords = tagline.split(' ');

  const renderText = (color) => (
    <section
      className={`
        absolute
        bottom-[-4.5vw]
        left-1/2
        -translate-x-1/2
        flex
        flex-row
        flex-nowrap
        items-center
        justify-center
        gap-[3vw]
      `}
      aria-label="Artist name"
    >
      {/* LEFT SIDE — "REINVENTING" + "BASILE" */}
      <div className="flex flex-col items-end">
        <h2
          className={`
            font-header text-[1.2vw] ${color}
            whitespace-nowrap text-right w-full pr-1
          `}
        >
          {taglineWords[0]?.toUpperCase()}
        </h2>

        <h1
          className={`
            font-header text-[9vw] ${color}
            whitespace-nowrap leading-none
          `}
        >
          {firstName.toUpperCase()}
        </h1>
      </div>

      {/* RIGHT SIDE — "THE" + "FRAME" + "DESCHAMPS" */}
      <div className="flex flex-col items-start">
        <div className="w-full flex items-center justify-between px-1">
          <h2 className={`font-header text-[1.2vw] ${color} whitespace-nowrap`}>
            {taglineWords[1]?.toUpperCase()}
          </h2>

          <h2 className={`font-header text-[1.2vw] ${color} whitespace-nowrap`}>
            {taglineWords[2]?.toUpperCase()}
          </h2>
        </div>

        <h1
          className={`
            font-header text-[9vw] ${color}
            whitespace-nowrap leading-none
          `}
        >
          {lastName.toUpperCase()}
        </h1>
      </div>
    </section>
  );

  return (
    <>
      {/* Black text layer — extends below video, visible on white background */}
      <div
        className="
          hidden md:block
          absolute
          top-0
          left-0
          right-0
          h-[100svh]
          z-10
          pointer-events-none
        "
        aria-hidden="true"
      >
        {renderText('text-primary')}
      </div>

      {/* White text layer — clipped to video area (container height) */}
      <div
        className="
          hidden md:block
          absolute
          top-0
          left-0
          right-0
          h-[100svh]
          z-20
          pointer-events-none
        "
        style={{ clipPath: 'inset(0 -100vw 0 -100vw)' }}
        aria-hidden="true"
      >
        {renderText('text-white')}
      </div>
    </>
  );
}

export default PersistentHeroText;
