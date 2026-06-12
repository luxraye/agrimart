// Data provenance indicator (addendum §"component-level changes").
// live → green · partial → amber · baseline/fallback → gray

const CONFIG = {
  live:     { dot: "bg-emerald-500", text: "text-emerald-700" },
  partial:  { dot: "bg-amber-500",   text: "text-amber-700" },
  baseline: { dot: "bg-gray-400",    text: "text-ink/45" },
  cached:   { dot: "bg-sky-500",     text: "text-sky-700" },
  fallback: { dot: "bg-gray-400",    text: "text-ink/45" },
};

export default function SourceIndicator({ source, farmers, className = "" }) {
  const c = CONFIG[source] ?? CONFIG.baseline;
  const label =
    source === "live"     ? `Live data · ${farmers} farmer${farmers === 1 ? "" : "s"}` :
    source === "partial"  ? `Partial data · ${farmers} farmer${farmers === 1 ? "" : "s"} — baseline supplemented` :
    source === "cached"   ? "Cached data" :
    "Baseline estimate · No live submissions yet";

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${c.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${source === "live" ? "animate-pulse-dot" : ""}`} />
      {label}
    </span>
  );
}
