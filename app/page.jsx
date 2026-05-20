"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Info } from "lucide-react";

import PageHero from "@/components/PageHero";
import SelectField from "@/components/SelectField";
import MetricCard from "@/components/MetricCard";
import SignalBadge from "@/components/SignalBadge";
import AiRec from "@/components/AiRec";
import RequireAuth from "@/components/RequireAuth";

import { DISTRICTS, CROPS, PLANTING_MONTHS, SUPPLY_SIGNALS, DATA_TWIN_SIGNAL } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { statusColors } from "@/lib/utils";

const RECS = {
  go:      "Demand is strong relative to current supply in this district. Good window to plan production — still validate input costs and water availability before scaling.",
  caution: "Market pressure is balanced or mildly competitive. Cross-check with local buyers and aggregators before committing large volumes. Consider phased planting.",
  nogo:    "Supply appears high relative to demand this season. Avoid flooding this channel — consider timing delay, crop substitution, or targeting a different market.",
};

const INTEL_MODES = [
  { value: "local", label: "Local signals" },
  { value: "twin",  label: "Data twin (inferred)" },
];

function SupplyContent() {
  const { profile } = useAuth();
  const [district, setDistrict] = useState(profile.district || "central");
  const [crop,     setCrop]     = useState("tomato");
  const [month,    setMonth]    = useState("jun");
  const [mode,     setMode]     = useState("local");

  const sig = mode === "twin"
    ? DATA_TWIN_SIGNAL
    : (SUPPLY_SIGNALS[crop]?.[district] ?? SUPPLY_SIGNALS.tomato.central);

  const pressure = Math.round(Math.max(0, Math.min(100, sig.demand - sig.supply + 50)));
  const c = statusColors(sig.status);

  const chartData = [
    { name: "Supply",          value: sig.supply,  fill: "#b7e4c7" },
    { name: "Demand",          value: sig.demand,  fill: "#52b788" },
    { name: "Net opportunity", value: pressure,    fill: pressure > 60 ? "#52b788" : pressure > 40 ? "#e9c46a" : "#e63946" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 pb-6">
      <PageHero
        eyebrow="Pre-season intelligence"
        heading="Is this a good season to plant?"
        sub="Select your district, crop, and planting window to see supply-demand signals before committing inputs."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <SelectField label="District"          id="district" value={district} onChange={setDistrict} options={DISTRICTS} />
        <SelectField label="Crop"              id="crop"     value={crop}     onChange={setCrop}     options={CROPS} />
        <SelectField label="Planting month"    id="month"    value={month}    onChange={setMonth}    options={PLANTING_MONTHS} />
        <SelectField label="Intelligence mode" id="mode"     value={mode}     onChange={setMode}     options={INTEL_MODES} />
      </div>

      {mode === "twin" && (
        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm">
          <Info size={15} className="mt-0.5 flex-shrink-0" />
          <span>Regional proxy active — Limpopo, RSA (semi-arid, climate match 92%). Results are inferred, not live local data.</span>
        </div>
      )}

      {sig.note && <p className="text-xs text-gray-400 italic mb-3">{sig.note}</p>}

      <div className="mb-4"><SignalBadge status={sig.status} /></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <MetricCard label="Market signal"   value={sig.label}  accent={c.text} />
        <MetricCard label="Supply index"    value={sig.supply} sub="out of 100" />
        <MetricCard label="Demand index"    value={sig.demand} sub="out of 100" />
        <MetricCard label="Net opportunity" value={pressure}   sub="pressure score"
          accent={pressure > 60 ? "text-emerald-700" : pressure > 40 ? "text-amber-700" : "text-red-700"} />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-2">
        <h2 className="text-sm font-medium text-gray-800 mb-0.5">Supply vs. demand pressure</h2>
        <p className="text-xs text-gray-400 mb-4">Indicative index — 100 = maximum saturation</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "none" }} cursor={{ fill: "#f9fafb" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <AiRec>{RECS[sig.status]}</AiRec>
    </main>
  );
}

export default function SupplyPage() {
  return <RequireAuth><SupplyContent /></RequireAuth>;
}
