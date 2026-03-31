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
      <h2 className="font-body font-bold text-[34px] leading-none tracking-normal uppercase">
        {title}
      </h2>
    </div>
  );
}

export default TitleSection;
