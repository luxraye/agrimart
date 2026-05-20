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
    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-[10px] text-gray-400 font-medium">{num}</span>
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="max-w-2xl mx-auto px-4 pb-10">
      <div className="flex items-center gap-3 pt-5 pb-4 border-b border-gray-100 mb-6">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-xl text-gray-900">Pre-incubation roadmap</h1>
          <p className="text-xs text-gray-400">Internal strategy — 90 days to a validated pilot</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-7">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span className="text-brand-600 font-medium">Days 1–15 active</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-400 rounded-full" style={{ width: "8%" }} />
        </div>
      </div>

      {/* Strategic positioning callout */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6">
        <p className="text-[11px] uppercase tracking-wider text-brand-600 font-medium mb-1.5">Strategic positioning</p>
        <p className="text-sm text-brand-800 leading-relaxed">
          Position as: <strong>&ldquo;A pre-season crop decision system that helps farmers, buyers, and institutions avoid oversupply, shortage, and climate-related production losses.&rdquo;</strong>
        </p>
        <p className="text-xs text-brand-600 mt-2">Not &ldquo;an open-data agriculture platform&rdquo; &mdash; too abstract.</p>
      </div>

      {/* Phases */}
      <div className="space-y-3 mb-8">
        {ROADMAP_PHASES.map((phase) => (
          <div key={phase.num}
            className={"bg-white rounded-2xl border px-4 py-3.5 flex gap-3 " +
              (phase.status === "active" ? "border-brand-200 shadow-sm" : "border-gray-100")}>
            <PhaseIcon status={phase.status} num={phase.num} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400">{phase.range}</span>
                {phase.status === "active" && (
                  <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">Active</span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">{phase.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">{phase.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {phase.deliverables.map(d => (
                  <span key={d} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 italic">
                <span className="font-medium text-gray-500 not-italic">Success: </span>{phase.metric}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <h2 className="text-sm font-medium text-gray-800 mb-1">Data source matrix</h2>
      <p className="text-xs text-gray-400 mb-3">Three-layer architecture</p>
      <div className="grid grid-cols-1 gap-2.5">
        {DATA_SOURCES.map(src => {
          const ls = LAYER_STYLES[src.layer];
          const as = ACCESS_STYLES[src.access];
          return (
            <div key={src.name} className="bg-white border border-gray-100 rounded-xl p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={"text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full " + ls.bg + " " + ls.text}>{ls.label}</span>
                <span className={"text-[10px] px-2 py-0.5 rounded-full " + as.bg + " " + as.text}>{as.label}</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{src.name}</p>
              <p className="text-xs text-gray-400">{src.desc}</p>
              <p className="text-[11px] text-gray-400">Frequency: {src.freq}</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-300 mt-8">AgriMart internal — not for general distribution</p>
    </main>
  );
}
