"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { ROADMAP_PHASES, DATA_SOURCES } from "@/lib/data";

const ACCESS_STYLES = {
  open:     { bg: "bg-emerald-50",  text: "text-emerald-700",  label: "Open API" },
  partner:  { bg: "bg-amber-50",    text: "text-amber-700",    label: "Partnership" },
  prop:     { bg: "bg-blue-50",     text: "text-blue-700",     label: "AgriMart asset" },
  pipeline: { bg: "bg-purple-50",   text: "text-purple-700",   label: "Pipeline" },
};

const LAYER_STYLES = {
  "1": { bg: "bg-sky-50",     text: "text-sky-700",     label: "Layer 1 — Open global" },
  "2": { bg: "bg-violet-50",  text: "text-violet-700",  label: "Layer 2 — Institutional" },
  "3": { bg: "bg-emerald-50", text: "text-emerald-700", label: "Layer 3 — Proprietary" },
};

function PhaseIcon({ status, num }) {
  if (status === "done")   return <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />;
  if (status === "active") return <Loader2 size={18} className="text-brand-600 animate-spin flex-shrink-0 mt-0.5" />;
  return (
    <div className="w-5 h-5 rounded-full border-2 border-ink/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-[10px] text-ink/35 font-medium">{num}</span>
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="max-w-2xl mx-auto px-4 pb-12">
      <div className="flex items-center gap-3 pt-6 pb-4 border-b border-ink/[0.06] mb-6">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-ink/[0.05] transition-colors text-ink/50">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-2xl text-ink">Pre-incubation roadmap</h1>
          <p className="text-xs text-ink/40">Internal strategy — 90 days to a validated pilot</p>
        </div>
      </div>

      <div className="mb-7">
        <div className="flex justify-between text-xs text-ink/40 mb-2">
          <span>Progress</span>
          <span className="text-brand-700 font-semibold">Days 1–15 active</span>
        </div>
        <div className="h-1.5 bg-ink/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full" style={{ width: "8%" }} />
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-200/60 rounded-2xl p-5 mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-700 font-semibold mb-1.5">Strategic positioning</p>
        <p className="text-sm text-brand-900 leading-relaxed">
          Position as: <strong>&ldquo;A pre-season crop decision system that helps farmers, buyers, and institutions avoid oversupply, shortage, and climate-related production losses.&rdquo;</strong>
        </p>
        <p className="text-xs text-brand-700/70 mt-2">Not &ldquo;an open-data agriculture platform&rdquo; &mdash; too abstract.</p>
      </div>

      <div className="space-y-3 mb-8">
        {ROADMAP_PHASES.map((phase) => (
          <div key={phase.num}
            className={"card px-5 py-4 flex gap-3.5 " +
              (phase.status === "active" ? "!border-brand-300/60 shadow-lift" : "")}>
            <PhaseIcon status={phase.status} num={phase.num} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">{phase.range}</span>
                {phase.status === "active" && (
                  <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-semibold">Active</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">{phase.title}</h3>
              <p className="text-[13px] text-ink/55 leading-relaxed mb-2.5">{phase.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {phase.deliverables.map(d => (
                  <span key={d} className="text-[11px] text-ink/50 bg-paper border border-ink/[0.06] px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
              <p className="text-xs text-ink/35 italic">
                <span className="font-semibold text-ink/45 not-italic">Success: </span>{phase.metric}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-ink/80 mb-1">Data source matrix</h2>
      <p className="text-xs text-ink/40 mb-3">Three-layer architecture — Layer 1 is live in this build</p>
      <div className="grid grid-cols-1 gap-2.5">
        {DATA_SOURCES.map(src => {
          const ls = LAYER_STYLES[src.layer];
          const as = ACCESS_STYLES[src.access];
          return (
            <div key={src.name} className="card p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={"text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full " + ls.bg + " " + ls.text}>{ls.label}</span>
                <span className={"text-[10px] px-2 py-0.5 rounded-full " + as.bg + " " + as.text}>{as.label}</span>
              </div>
              <p className="text-sm font-semibold text-ink">{src.name}</p>
              <p className="text-xs text-ink/45">{src.desc}</p>
              <p className="text-[11px] text-ink/35">Frequency: {src.freq}</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-ink/25 mt-8">AgriMart internal — not for general distribution</p>
    </main>
  );
}
