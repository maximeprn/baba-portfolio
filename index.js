import divider from "./divider.svg";
import heroImage from "./hero-image.png";
import image from "./image.png";
import img from "./img.png";

export const Body = () => {
  const navigationItems = [
    { label: "ABOUT", position: "left" },
    { label: "PHOTOS", position: "center" },
    { label: "FILMS", position: "center" },
    { label: "GET IN TOUCH", position: "right" },
  ];

  const projectData = [
    {
      id: 1,
      title: 'Decathlon "Co-Creation" Olympic Games Campaign',
      description:
        "Morem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus.",
      credits: {
        left: [
          "Direction : Basile Deschamps",
          "DOP : Julien Caldarone/Studio Lamadone",
          "Edit, compositing, color : Lucas Brunier",
          "Music : Basile Deschamps",
        ],
        right: [
          "Production : Pral",
          "Producer @alloalix",
          "Line producer @antoinewatine",
        ],
      },
      image: image,
      imagePosition: "right",
    },
    {
      id: 2,
      title: 'Decathlon "Co-Creation" Olympic Games Campaign',
      description:
        "Morem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus.",
      credits: {
        left: [
          "Direction : Basile Deschamps",
          "DOP : Julien Caldarone/Studio Lamadone",
          "Edit, compositing, color : Lucas Brunier",
          "Music : Basile Deschamps",
        ],
        right: [
          "Production : Pral",
          "Producer @alloalix",
          "Line producer @antoinewatine",
        ],
      },
      image: img,
      imagePosition: "left",
    },
  ];

  return (
    <div className="flex flex-col h-[6000px] items-center gap-5 relative bg-[linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] overflow-x-hidden">
      <header className="flex-col w-[1440px] h-20 justify-center gap-[15px] px-6 py-[15px] flex items-center relative">
        <nav
          className="justify-between px-5 py-0 self-stretch w-full flex-[0_0_auto] flex items-center relative"
          role="navigation"
          aria-label="Main navigation"
        >
          <a
            href="#about"
            className="relative w-fit [font-family:'Public_Sans-Bold',Helvetica] font-bold text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap"
          >
            ABOUT
          </a>

          <div className="inline-flex items-center justify-center gap-[15px] relative flex-[0_0_auto]">
            <a
              href="#photos"
              className="relative w-fit mt-[-1.00px] [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap"
            >
              PHOTOS
            </a>

            <a
              href="#films"
              className="relative w-fit [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-[15px] tracking-[0] leading-[normal] whitespace-nowrap"
            >
              FILMS
            </a>
          </div>

          <a
            href="#contact"
            className="relative w-fit [font-family:'Public_Sans-Bold',Helvetica] font-bold text-black text-xs tracking-[0] leading-[normal] whitespace-nowrap"
          >
            GET IN TOUCH
          </a>
        </nav>
      </header>

      <section
        className="flex flex-col w-[730px] h-[715px] items-center justify-center gap-2.5 px-[60px] py-[120px] relative"
        aria-label="Hero section"
      >
        <img
          className="relative self-stretch w-full aspect-[1.54] object-cover"
          alt="Hero image showcasing Basile Deschamps work"
          src={heroImage}
        />
      </section>

      <section
        className="flex w-[1440px] h-[180px] gap-14 items-center justify-center relative"
        aria-label="Title section"
      >
        <div className="inline-flex gap-[135px] px-0 py-2.5 flex-[0_0_auto] mt-[-7.00px] mb-[-7.00px] items-center justify-center relative">
          <div className="inline-flex flex-[0_0_auto] items-center justify-center relative">
            <div className="flex flex-col w-[445px] items-center justify-around gap-2.5 relative self-stretch">
              <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
                <div className="flex items-center justify-end gap-2.5 px-[5px] py-0 relative self-stretch w-full flex-[0_0_auto]">
                  <h2 className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                    REINVENTING
                  </h2>
                </div>

                <h1 className="relative flex items-center justify-center w-[420px] h-[150px] [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-[140px] text-center tracking-[0] leading-[normal] whitespace-nowrap">
                  BASILE
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[711px] h-[204px] mt-[-12.00px] mb-[-12.00px] flex items-center justify-center relative">
          <div className="flex flex-col w-[445px] items-center justify-around gap-2.5 relative self-stretch">
            <div className="flex flex-col w-[623px] items-end justify-center relative flex-[0_0_auto] ml-[-89.00px] mr-[-89.00px]">
              <div className="w-[623px] justify-between flex-[0_0_auto] flex items-center relative">
                <h2 className="justify-center w-fit mt-[-1.00px] [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-xl text-right tracking-[0] leading-[normal] whitespace-nowrap flex items-center relative">
                  THE
                </h2>

                <h2 className="justify-center w-fit mt-[-1.00px] [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-xl text-right tracking-[0] leading-[normal] whitespace-nowrap flex items-center relative">
                  FRAME
                </h2>
              </div>

              <h1 className="w-[643px] h-[145px] ml-[-20.00px] [font-family:'Steps-Mono-Mono',Helvetica] font-normal text-black text-[140px] text-center tracking-[0] leading-[normal] whitespace-nowrap flex items-center justify-center relative">
                DESCHAMPS
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div
        className="inline-flex flex-col items-start gap-2.5 px-0 py-1 relative flex-[0_0_auto]"
        role="separator"
        aria-hidden="true"
      >
        <img
          className="relative w-[1392px] h-px mt-[-0.50px] mb-[-0.50px] object-cover"
          alt=""
          src={divider}
        />
      </div>

      {projectData.map((project) => (
        <article
          key={project.id}
          className="flex w-[1443.0px] max-h-[650px] h-[653.0px] items-center justify-around px-[70px] py-0 relative ml-[-1.50px] mr-[-1.50px] bg-white border-t [border-top-style:solid] border-b [border-bottom-style:solid]"
        >
          <div className="flex items-center justify-between relative flex-1 grow ml-[-0.50px]">
            {project.imagePosition === "left" && (
              <div className="grid grid-cols-1 grid-rows-1 w-[648px] h-[476px] absolute top-[60px] left-0">
                <img
                  className="justify-self-start relative row-[1_/_2] col-[1_/_2] [align-self:end] w-[616px] h-[452px] aspect-[1.36] object-cover"
                  alt={`Project image for ${project.title}`}
                  src={project.image}
                />
              </div>
            )}

            <div
              className={`inline-flex flex-col h-[596px] items-start justify-center gap-9 px-[38px] py-6 relative flex-[0_0_auto] ${project.imagePosition === "left" ? "ml-auto" : ""}`}
            >
              <header className="inline-flex h-[89px] items-center justify-center relative">
                <h3 className="relative w-fit [font-family:'Funnel_Display-Bold',Helvetica] font-bold text-black text-lg tracking-[2.70px] leading-[normal]">
                  {project.title}
                </h3>
              </header>

              <div className="relative w-[584px] h-[170px]">
                <p className="absolute w-full h-[70.59%] top-0 left-0 [font-family:'American_Typewriter-Regular',Helvetica] font-normal text-black text-sm tracking-[2.10px] leading-6">
                  {project.description}
                </p>
              </div>

              <div className="flex w-[584px] items-start justify-center gap-11 relative flex-[0_0_auto]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'American_Typewriter-Regular',Helvetica] font-normal text-black text-sm tracking-[2.10px] leading-6">
                  {project.credits.left.map((credit, index) => (
                    <p key={index}>
                      {credit}
                      {index < project.credits.left.length - 1 && <br />}
                    </p>
                  ))}
                </div>

                <div className="relative flex-1 h-[120px] mt-[-1.00px] [font-family:'American_Typewriter-Regular',Helvetica] font-normal text-black text-sm tracking-[2.10px] leading-6">
                  {project.credits.right.map((credit, index) => (
                    <p key={index}>
                      {credit}
                      {index < project.credits.right.length - 1 && <br />}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {project.imagePosition === "right" && (
              <div className="grid grid-cols-1 grid-rows-1 w-[648px] h-[476px] absolute top-[60px] left-[652px]">
                <img
                  className="justify-self-end relative row-[1_/_2] col-[1_/_2] [align-self:end] w-[616px] h-[452px] aspect-[1.36] object-cover"
                  alt={`Project image for ${project.title}`}
                  src={project.image}
                />
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};
