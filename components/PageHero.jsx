export default function PageHero({ eyebrow, heading, sub, aside }) {
  return (
    <div className="pt-9 pb-7 flex items-end justify-between gap-4 animate-fade-up">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-700/70 font-semibold mb-2">{eyebrow}</p>
        )}
        <h1 className="font-serif text-[2rem] md:text-[2.4rem] leading-[1.12] text-ink mb-2.5">{heading}</h1>
        {sub && <p className="text-[13.5px] text-ink/50 leading-relaxed max-w-xl">{sub}</p>}
      </div>
      {aside && <div className="hidden md:block flex-shrink-0">{aside}</div>}
    </div>
  );
}
