"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Database } from "lucide-react";

import PageHero from "@/components/PageHero";
import SelectField from "@/components/SelectField";
import MetricCard from "@/components/MetricCard";
import SignalBadge from "@/components/SignalBadge";
import SourceIndicator from "@/components/SourceIndicator";
import AiRec from "@/components/AiRec";
import RequireAuth from "@/components/RequireAuth";

import { DISTRICTS, CROPS, PLANTING_MONTHS, currentSeasonYear } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { statusColors } from "@/lib/utils";

const RECS = {
  go:      "Demand is strong relative to declared supply in this district. Good window to plan production — still validate input costs and water availability before scaling.",
  caution: "Market pressure is balanced or mildly competitive. Cross-check with local buyers and aggregators before committing large volumes. Consider phased planting.",
  nogo:    "Declared supply appears high relative to demand this season. Avoid flooding this channel — consider timing delay, crop substitution, or targeting a different market.",
};

function SupplyContent() {
  const { profile } = useAuth();
  const [district, setDistrict] = useState(profile.district || "central");
  const [crop,     setCrop]     = useState("tomato");
  const [month,    setMonth]    = useState("jun");

  const [signal,  setSignal]  = useState(null);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    fetch(`/api/supply-signal?district=${district}&crop=${crop}&season_year=${currentSeasonYear()}`)
      .then((r) => r.json())
      .then((json) => {
        if (reqId.current !== id) return;
        setSignal(json.ok ? json : null);
        setLoading(false);
      })
      .catch(() => {
        if (reqId.current !== id) return;
        setSignal(null);
        setLoading(false);
      });
  }, [district, crop]);

  const sig = signal;
  const pressure = sig ? Math.round(Math.max(0, Math.min(100, sig.demand - sig.supply + 50))) : null;
  const c = statusColors(sig?.status);

  const chartData = sig ? [
    { name: "Supply",          value: sig.supply,  fill: "#b3d9c0" },
    { name: "Demand",          value: sig.demand,  fill: "#35885c" },
    { name: "Net opportunity", value: pressure,    fill: pressure > 60 ? "#35885c" : pressure > 40 ? "#dfae4f" : "#c1442e" },
  ] : [];

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 pb-10">
      <PageHero
        eyebrow="Pre-season intelligence"
        heading="Is this a good season to plant?"
        sub="Live supply signals built from real farmer declarations, FAO production data, and district capacity ceilings."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <SelectField label="District"       id="district" value={district} onChange={setDistrict} options={DISTRICTS} />
        <SelectField label="Crop"           id="crop"     value={crop}     onChange={setCrop}     options={CROPS} />
        <SelectField label="Planting month" id="month"    value={month}    onChange={setMonth}    options={PLANTING_MONTHS} />
      </div>

      {/* Signal + provenance */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {loading ? (
          <div className="skeleton h-8 w-52 rounded-full" />
        ) : sig ? (
          <>
            <SignalBadge status={sig.status} size="lg" />
            <SourceIndicator source={sig.source} farmers={sig.total_farmers} />
          </>
        ) : (
          <p className="text-sm text-ink/40">Signal unavailable — check your connection.</p>
        )}
      </div>

      {!loading && sig && sig.source !== "live" && (
        <div className="flex items-start gap-2.5 text-ink/55 bg-gold-50 border border-gold-300/50 rounded-xl px-4 py-3 mb-4 text-[13px] animate-fade-up">
          <Database size={14} className="mt-0.5 flex-shrink-0 text-gold-600" />
          <span>
            Based on baseline data — live signal builds as farmers submit.
            {sig.total_farmers > 0 && ` ${sig.total_farmers} submission${sig.total_farmers === 1 ? "" : "s"} so far; live signal activates at 3.`}
          </span>
        </div>
      )}

      {!loading && sig?.note && <p className="text-xs text-ink/35 italic mb-4 mt-2">{sig.note}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Market signal"   value={sig?.label ?? "—"}  accent={c.text} loading={loading} />
        <MetricCard label="Supply index"    value={sig?.supply ?? "—"} sub="out of 100" loading={loading} />
        <MetricCard label="Demand index"    value={sig?.demand ?? "—"} sub={sig?.demand_source === "faostat" ? `FAOSTAT ${sig.faostat_year}` : "out of 100"} loading={loading} />
        <MetricCard label="Net opportunity" value={pressure ?? "—"}    sub="pressure score" loading={loading}
          accent={pressure > 60 ? "text-emerald-700" : pressure > 40 ? "text-amber-700" : "text-red-700"} />
      </div>

      <div className="card p-5 mb-2">
        <h2 className="text-sm font-semibold text-ink/80 mb-0.5">Supply vs. demand pressure</h2>
        <p className="text-xs text-ink/35 mb-4">Indicative index — 100 = maximum saturation</p>
        {loading ? (
          <div className="skeleton h-[180px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8a948c" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8a948c" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e7e5de", boxShadow: "0 4px 16px rgba(22,36,28,0.08)" }} cursor={{ fill: "#f4f3ee" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && sig && <AiRec>{RECS[sig.status]}</AiRec>}
    </main>
  );
}

export default function SupplyPage() {
  return <RequireAuth><SupplyContent /></RequireAuth>;
}
