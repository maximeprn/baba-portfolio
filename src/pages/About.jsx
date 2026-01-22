/**
 * ============================================================================
 * ABOUT PAGE
 * ============================================================================
 *
 * Displays information about the artist - biography, background, and approach.
 *
 * URL: /about
 *
 * PAGE STRUCTURE:
 * 1. Page title
 * 2. Artist photo (optional)
 * 3. Biography text
 * 4. Additional sections (approach, clients, etc.)
 *
 * CONTENT NOTE:
 * The actual biography text should be customized for Basile Deschamps.
 * The placeholder text below should be replaced with real content.
 *
 * ============================================================================
 */

// Import site configuration for artist info
import { siteConfig, getActiveSocialLinks } from '../data/siteConfig';


/**
 * About Page Component
 *
 * Displays the artist biography and information.
 *
 * @returns {JSX.Element} The About page
 */
function About() {
  // Get artist info from config
  const { artist, contact } = siteConfig;

  // Get active social links
  const socialLinks = getActiveSocialLinks();


  return (
    // Main page container
    <div
      className="
        flex
        flex-col
        items-center
        w-full
        max-w-container
        px-6
        py-12
      "
    >
      {/* PAGE HEADER */}
      <header className="w-full max-w-3xl mb-12">
        <h1
          className="
            font-header
            text-4xl
            md:text-5xl
            text-center
            mb-4
          "
        >
          ABOUT
        </h1>
      </header>


      {/* MAIN CONTENT */}
      <article className="w-full max-w-3xl flex flex-col gap-12">
        {/* ARTIST NAME & TITLE */}
        <section className="text-center">
          <h2
            className="
              font-title
              text-2xl
              md:text-3xl
              font-bold
              mb-2
            "
          >
            About {artist.name}
          </h2>
          <p className="font-body text-muted italic">
            Sports photographer and filmmaker exploring the poetry of athletic movement
          </p>
        </section>


        {/* BIOGRAPHY SECTION */}
        <section>
          <div
            className="
              font-body
              text-base
              leading-relaxed
              tracking-wide
              space-y-6
            "
          >
            {/* Introduction */}
            <p>
              {artist.name} is a Paris-based photographer and video director who reimagines sports through a lens combining fashion sensibility with athletic authenticity. His work emerged from an unconventional path—not traditional sports photography training, but a collision of circumstance, creative passion, and deep athletic experience.
            </p>

            {/* Cape Town Origins */}
            <p>
              His journey began in Cape Town during the post-Covid shutdown. Working in tourism with unexpected downtime, {artist.firstName} taught himself photography while producing music, drawn to the city's endless outdoor energy—mountain trails, ocean waves, and constant motion. What started as creative experimentation with a photographer friend evolved into a deliberate practice: he began creating fictional campaigns for running and trail brands, mixing sport with fashion aesthetics. That "fake it until you make it" approach eventually caught real attention. His early breakthrough came through an Oakley campaign, followed by work across major sporting and lifestyle brands.
            </p>
          </div>
        </section>


        {/* A LIFELONG ATHLETE'S PERSPECTIVE */}
        <section>
          <h3
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            A Lifelong Athlete's Perspective
          </h3>

          <div
            className="
              font-body
              text-base
              leading-relaxed
              tracking-wide
              space-y-6
            "
          >
            <p>
              {artist.firstName} grew up in Lyon immersed in sport—gymnastics as a teenager (competing at French championship level), horse riding, martial arts, climbing, volleyball, and now running and golf. This intimate understanding of athletic movement informs everything he shoots. He knows what's exceptional because he knows what's possible. He recognizes the insider moments—the subtle style, the technical precision—that separate remarkable from ordinary.
            </p>

            <p>
              This athletic fluency means he can direct with confidence. When he speaks the same language as an athlete, something real happens in the frame.
            </p>
          </div>
        </section>


        {/* REINVENTING THE FRAME */}
        <section>
          <h3
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Reinventing the Frame
          </h3>

          <div
            className="
              font-body
              text-base
              leading-relaxed
              tracking-wide
              space-y-6
            "
          >
            <p>
              {artist.firstName}'s aesthetic philosophy is straightforward but ambitious: extract essence by removing context.
            </p>

            <p>
              Rather than document what happens, he controls light and background to show what movement could be—to reveal pure strength, elegance, pain, and power stripped of distracting environment. Gymnastics doesn't belong in fluorescent gyms. Running doesn't need a stadium. By taking sport out of its expected setting and into a theoretical, aestheticized world, he creates imagery that feels both more truthful and more beautiful than reality.
            </p>

            <p>
              His approach bridges two sensibilities: the strict, gritty beauty of Parisian fashion aesthetics and the softer, more dreamlike abstraction of his Cape Town experience. The result is work that feels contemporary—where sports photography typically documents, his photographs interpret.
            </p>
          </div>
        </section>


        {/* MUSIC AND MEMORY */}
        <section>
          <h3
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Music and Memory
          </h3>

          <div
            className="
              font-body
              text-base
              leading-relaxed
              tracking-wide
              space-y-6
            "
          >
            <p>
              Music shapes how {artist.firstName} sees and shoots. Running feels different on different playlists. A childhood moment chasing a spooked horse gains cinema through memory's soundtrack. He produces sound for his films and believes music is a facilitator of images—it attaches emotion to memory, and sports are intrinsically linked to how we remember ourselves.
            </p>
          </div>
        </section>


        {/* CURRENTLY EXPLORING */}
        <section>
          <h3
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Currently Exploring
          </h3>

          <div
            className="
              font-body
              text-base
              leading-relaxed
              tracking-wide
              space-y-6
            "
          >
            <p>
              Gymnastics as a complete visual language—vault, beam, floor, rings, each discipline offering countless visual possibilities. Water sports and underwater photography, where distortion reveals rather than explains. Extracting poetry from sports that don't obviously contain it, inserting fashion-forward sensibility into disciplines that rarely receive it.
            </p>

            <p>
              The aim is always the same: bigger, better, and true to a singular vision—where fashion discipline meets athletic authenticity, and movement speaks for itself.
            </p>
          </div>
        </section>


        {/* CLIENTS/COLLABORATIONS SECTION
            TODO: Add actual client list
        */}
        <section>
          <h3
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Selected Clients
          </h3>

          {/* Client list - can be expanded */}
          <p className="font-body text-muted leading-relaxed">
            Decathlon, Pral, Studio Lamadone
            {/* Add more clients as needed */}
          </p>
        </section>


        {/* CONTACT INFO SECTION */}
        <section>
          <h3
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Get in Touch
          </h3>

          <div className="flex flex-col gap-4">
            {/* Email */}
            <a
              href={`mailto:${contact.email}`}
              className="
                font-body
                text-base
                hover:text-muted
                transition-colors
                duration-150
              "
            >
              {contact.email}
            </a>

            {/* Location */}
            <p className="font-body text-muted">
              Based in {contact.location}
            </p>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-6 mt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      font-body
                      text-sm
                      hover:text-muted
                      transition-colors
                      duration-150
                    "
                  >
                    {social.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </article>


      {/* BOTTOM SPACING */}
      <div className="h-20" aria-hidden="true" />
    </div>
  );
}

// Export for use in App.jsx router
export default About;
