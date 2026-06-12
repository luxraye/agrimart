"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Database, CheckCircle2, XCircle, CloudCog } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const COOLDOWN_MS = 5000; // quality rule 5 — debounce refresh buttons

function timeAgo(iso) {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function freshnessColor(iso, frequency) {
  if (!iso) return "text-white/30";
  const hrs = (Date.now() - new Date(iso).getTime()) / 36e5;
  const limit =
    frequency === "Every 6h" ? 6 :
    frequency === "Daily" ? 24 :
    frequency === "Weekly" ? 24 * 7 : Infinity;
  return hrs > limit ? "text-amber-400" : "text-emerald-300";
}

export default function AdminDashboard() {
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState({});      // sourceId → true while refreshing
  const [cooldown, setCooldown] = useState({});    // sourceId → true during post-success cooldown
  const [toast,   setToast]   = useState(null);
  const toastTimer = useRef(null);

  const load = useCallback(() => {
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setStatus(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(kind, text) {
    clearTimeout(toastTimer.current);
    setToast({ kind, text });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  async function refresh(source) {
    if (!source.refreshPath || busy[source.id] || cooldown[source.id]) return;
    setBusy((b) => ({ ...b, [source.id]: true }));
    try {
      const res = await fetch(source.refreshPath, { method: "POST" });
      const json = await res.json();
      const ok = json.ok ?? (json.results ?? []).every((r) => r.ok);
      if (ok) {
        const count = json.count ?? json.refreshed?.length ??
          (json.results ?? []).reduce((a, r) => a + (r.count ?? 0), 0);
        showToast("ok", `${source.label}: refreshed ${count ?? ""} records in ${json.duration_ms ?? "—"}ms`);
        setCooldown((c) => ({ ...c, [source.id]: true }));
        setTimeout(() => setCooldown((c) => ({ ...c, [source.id]: false })), COOLDOWN_MS);
      } else {
        showToast("err", `${source.label}: ${json.error ?? json.results?.find((r) => !r.ok)?.error ?? "refresh failed"}`);
      }
    } catch (e) {
      showToast("err", `${source.label}: ${e.message}`);
    } finally {
      setBusy((b) => ({ ...b, [source.id]: false }));
      load();
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Data pipeline</h1>
          <p className="text-[13px] text-white/40">Source freshness, record counts, and manual refresh controls.</p>
        </div>
        {status && (
          <div className="flex items-center gap-2 text-[11.5px] px-3 py-1.5 rounded-full border text-emerald-300 border-emerald-300/25 bg-emerald-400/10">
            <CloudCog size={13} />
            PostgreSQL · Supabase
          </div>
        )}
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {loading && !status &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        {status?.sources.map((s) => (
          <div key={s.id} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13.5px] font-semibold text-white/90">{s.label}</p>
                <p className="text-[11px] text-white/30 font-mono mt-0.5">{s.table}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/35 bg-white/[0.05] px-2 py-0.5 rounded-full whitespace-nowrap">
                {s.frequency}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-serif text-white">{s.count}</span>
              <span className="text-[11px] text-white/30">records</span>
              <span className={`text-[11px] ml-auto ${freshnessColor(s.lastFetch, s.frequency)}`}>
                {timeAgo(s.lastFetch)}
              </span>
            </div>
            {s.refreshPath ? (
              <button
                onClick={() => refresh(s)}
                disabled={busy[s.id] || cooldown[s.id]}
                className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium
                  bg-emerald-400/10 text-emerald-300 border border-emerald-300/20
                  hover:bg-emerald-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} className={busy[s.id] ? "animate-spin" : ""} />
                {busy[s.id] ? "Refreshing…" : cooldown[s.id] ? "Cooling down…" : "Refresh now"}
              </button>
            ) : (
              <p className="mt-auto text-center text-[11px] text-white/25 py-2">
                {s.id === "intentions" ? "Farmer-submitted · real-time" : "Manual entry"}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Refresh log */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
          <Database size={13} className="text-white/30" />
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Refresh log</h2>
        </div>
        {status?.refreshLog?.length ? (
          <table className="w-full text-[12.5px]">
            <tbody>
              {status.refreshLog.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-2.5 text-white/70 font-mono">{row.source}</td>
                  <td className="px-3 py-2.5 text-white/35 hidden sm:table-cell">{row.triggered_by}</td>
                  <td className="px-3 py-2.5 text-white/55">{row.record_count} rec</td>
                  <td className="px-3 py-2.5 text-white/35 hidden md:table-cell">{row.duration_ms}ms</td>
                  <td className="px-3 py-2.5">
                    {row.error
                      ? <span className="text-red-400 inline-flex items-center gap-1"><XCircle size={11} /> error</span>
                      : <span className="text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 size={11} /> ok</span>}
                  </td>
                  <td className="px-5 py-2.5 text-white/35 text-right whitespace-nowrap">{formatDateTime(row.run_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-[13px] text-white/30">No refreshes logged yet — hit a “Refresh now” button above.</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-lift animate-fade-up
          ${toast.kind === "ok" ? "bg-emerald-500 text-emerald-950" : "bg-red-500 text-white"}`}>
          {toast.kind === "ok" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
