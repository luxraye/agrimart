export default function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      <p className={`text-2xl font-medium leading-none mb-1 ${accent || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
