import { statusColors } from "@/lib/utils";

const STATUS_LABELS = {
  go: "Plant window open",
  caution: "Review before committing",
  nogo: "Avoid this season",
};

export default function SignalBadge({ status, size = "md" }) {
  const c = statusColors(status);
  const pad = size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-semibold ${pad} ${c.text} ${c.bg} border ${c.border}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse-dot`} />
      {STATUS_LABELS[status] ?? "—"}
    </span>
  );
}
