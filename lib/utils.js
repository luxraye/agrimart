export function clamp(v, lo, hi) {
  return Math.round(Math.max(lo, Math.min(hi, v)));
}

export function statusColors(status) {
  return {
    go:      { text: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500" },
    caution: { text: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500"   },
    nogo:    { text: "text-red-700",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500"     },
  }[status] || { text: "text-ink/50", bg: "bg-ink/5", border: "border-ink/10", dot: "bg-ink/30" };
}

export function levelColors(v) {
  if (v < 40) return { text: "text-emerald-700", bg: "bg-emerald-50", label: "Low" };
  if (v < 65) return { text: "text-amber-700",   bg: "bg-amber-50",   label: "Moderate" };
  return        { text: "text-red-700",     bg: "bg-red-50",     label: "High" };
}

export function riskBarColor(v) {
  if (v < 40) return "#35885c";
  if (v < 65) return "#dfae4f";
  return "#c1442e";
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BW", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-BW", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
