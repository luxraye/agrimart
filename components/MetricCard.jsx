export default function MetricCard({ label, value, sub, accent, loading }) {
  return (
    <div className="card p-4">
      <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink/40 font-medium mb-2">{label}</p>
      {loading ? (
        <div className="skeleton h-7 w-16 mb-1" />
      ) : (
        <p className={`text-[1.55rem] font-serif leading-none mb-1 ${accent || "text-ink"}`}>{value}</p>
      )}
      {sub && <p className="text-[11px] text-ink/35">{sub}</p>}
    </div>
  );
}
