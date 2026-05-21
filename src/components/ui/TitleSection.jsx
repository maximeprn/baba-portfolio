/**
 * TitleSection — full-width section heading with optional top border.
 * Used on the Films page to separate "Curated Works" from "Other Projects".
 */
function TitleSection({ title, borderTop = false }) {
  return (
    <div
      className={`self-stretch -mx-4 md:-mx-[100px] px-4 md:px-[72px] h-[100px] flex items-center${
        borderTop ? ' border-t border-black' : ''
      }`}
    >
      {/* 38.25px = 34px base × 1.125 global type scale — see .mdd/docs/16 */}
      {/* ml-4 on mobile aligns the title with the card thumbnails' px-4 inset */}
      <h2 className="font-body font-bold text-[34.25px] md:text-[38.25px] leading-none tracking-normal uppercase ml-4 md:ml-0">
        {title}
      </h2>
    </div>
  );
}

export default TitleSection;
