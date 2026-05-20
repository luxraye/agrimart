import { statusColors } from "@/lib/utils";

const STATUS_LABELS = { go: "Plant window open", caution: "Review before committing", nogo: "Avoid this season" };

export default function SignalBadge({ status }) {
  const c = statusColors(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.text} ${c.bg} border ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
