/**
 * ============================================================================
 * PERSISTENT HERO TEXT — Shared across Films & Photos pages
 * ============================================================================
 *
 * Renders "BASILE DESCHAMPS" + "REINVENTING THE FRAME" in the hero area.
 * Lives in Layout.jsx so it never unmounts during route transitions.
 *
 * Desktop only (hidden md:block). Positioned absolutely so it doesn't
 * affect layout flow. Each page's hero media (video / marquee) floats
 * above this text at z-10.
 *
 * ============================================================================
 */

import { siteConfig } from '../../data/siteConfig';

function PersistentHeroText() {
  const { firstName, lastName, tagline } = siteConfig.artist;
  const taglineWords = tagline.split(' ');

  return (
    <div
      className="
        hidden md:block
        absolute
        top-20
        left-0
        right-0
        h-[100svh]
        z-0
        pointer-events-none
      "
      aria-hidden="true"
    >
      <section
        className="
          absolute
          bottom-[10vh]
          left-0
          right-0
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
        {/* LEFT SIDE — "REINVENTING" + "BASILE" */}
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

        {/* RIGHT SIDE — "THE" + "FRAME" + "DESCHAMPS" */}
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
  );
}

export default PersistentHeroText;
