export function clamp(v, lo, hi) {
  return Math.round(Math.max(lo, Math.min(hi, v)));
}

export function statusColors(status) {
  return {
    go:      { text: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500" },
    caution: { text: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500"   },
    nogo:    { text: "text-red-700",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500"     },
  }[status] || {};
}

export function levelColors(v) {
  if (v < 40) return { text: "text-emerald-700", bg: "bg-emerald-50", label: "Low" };
  if (v < 65) return { text: "text-amber-700",   bg: "bg-amber-50",   label: "Moderate" };
  return        { text: "text-red-700",     bg: "bg-red-50",     label: "High" };
}

export function riskBarColor(v) {
  if (v < 40) return "#52b788";
  if (v < 65) return "#e9c46a";
  return "#e63946";
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-BW", { day: "numeric", month: "long", year: "numeric" });
}
