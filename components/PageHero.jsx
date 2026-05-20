export default function PageHero({ eyebrow, heading, sub }) {
  return (
    <div className="pt-8 pb-6">
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1.5">{eyebrow}</p>
      )}
      <h1 className="font-serif text-3xl font-normal text-gray-900 mb-2 leading-snug">{heading}</h1>
      {sub && <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{sub}</p>}
    </div>
  );
}
