"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * fetched_at timestamp + stale warning + optional refresh button.
 * Used wherever cached values are shown (freshness rules table).
 */
export default function FreshnessTag({ fetchedAt, stale, onRefresh, refreshing }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-ink/40">
      {stale && (
        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
          <AlertTriangle size={11} /> Data may be stale
        </span>
      )}
      <span>Updated {timeAgo(fetchedAt)}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
          className="p-1 rounded-md text-ink/40 hover:text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
        </button>
      )}
    </span>
  );
}
