"use client";

import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { Droplets, Sun, Truck, Bug, TrendingUp, BrainCircuit } from "lucide-react";

import PageHero from "@/components/PageHero";
import SelectField from "@/components/SelectField";
import AiRec from "@/components/AiRec";
import RequireAuth from "@/components/RequireAuth";

import { DISTRICTS, CROPS, PLANTING_MONTHS, CROP_RISK, DISTRICT_RISK_MULT } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { clamp, levelColors, riskBarColor } from "@/lib/utils";

const FIELD_INTEL = {
  gaborone:  { moisture: 45, temp: 28, ndvi: 0.65, traffic: { name: "A1 Western Bypass",   speed: 24, status: "red",    msg: "Severe bottleneck" } },
  kweneng:   { moisture: 50, temp: 27, ndvi: 0.70, traffic: { name: "Kweneng ring road",    speed: 58, status: "green",  msg: "Route clear" } },
  central:   { moisture: 55, temp: 26, ndvi: 0.72, traffic: { name: "A2 Palapye corridor",  speed: 52, status: "green",  msg: "Route clear" } },
  kgalagadi: { moisture: 12, temp: 34, ndvi: 0.30, traffic: { name: "Ghanzi trunk",         speed: 68, status: "green",  msg: "Route clear" } },
  ngamiland: { moisture: 62, temp: 24, ndvi: 0.78, traffic: { name: "Maun bypass",          speed: 61, status: "green",  msg: "Route clear" } },
  chobe:     { moisture: 68, temp: 23, ndvi: 0.80, traffic: { name: "Kasane freight line",  speed: 44, status: "yellow", msg: "Moderate delay" } },
  northeast: { moisture: 52, temp: 27, ndvi: 0.68, traffic: { name: "A3 Francistown",       speed: 48, status: "yellow", msg: "Moderate delay" } },
  southern:  { moisture: 42, temp: 29, ndvi: 0.62, traffic: { name: "Southern A2 merge",    speed: 31, status: "red",    msg: "Bottleneck — plan ahead" } },
};
const TWIN_INTEL = { moisture: 18, temp: 33, ndvi: 0.32, isInferred: true,
  traffic: { name: "Node 104 (Limpopo proxy)", speed: 65, status: "green", msg: "Route clear (inferred)" } };

const RISK_ICONS = {
  soil:      { icon: Droplets,   label: "Soil moisture" },
  climate:   { icon: Sun,        label: "Climate stress" },
  logistics: { icon: Truck,      label: "Logistics" },
  pest:      { icon: Bug,        label: "Pest / disease" },
  market:    { icon: TrendingUp, label: "Market volatility" },
};

const INTEL_MODES = [
  { value: "local", label: "Local signals" },
  { value: "twin",  label: "Data twin (inferred)" },
];

function TrafficDot({ status }) {
  const col = status === "red" ? "bg-red-500" : status === "yellow" ? "bg-amber-400" : "bg-emerald-500";
  return <span className={"w-2.5 h-2.5 rounded-full flex-shrink-0 " + col} />;
}

function FieldTag({ val, low, high, lowLabel, midLabel, okLabel }) {
  if (val <= low)  return <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{lowLabel}</span>;
  if (val <= high) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{midLabel}</span>;
  return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{okLabel}</span>;
}

function RiskContent() {
  const { profile } = useAuth();
  const [district, setDistrict] = useState(profile.district || "central");
  const [crop,     setCrop]     = useState("tomato");
  const [month,    setMonth]    = useState("jun");
  const [mode,     setMode]     = useState("local");

  const base   = CROP_RISK[crop]            || CROP_RISK.tomato;
  const mult   = DISTRICT_RISK_MULT[district] || 1;
  const scores = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, clamp(v * mult, 10, 95)]));
  const field  = mode === "twin" ? TWIN_INTEL : (FIELD_INTEL[district] || FIELD_INTEL.central);
  const chartData = Object.entries(RISK_ICONS).map(([key, { label }]) => ({ name: label, value: scores[key] }));

  const watchpoints = [];
  if (scores.climate   >= 55) watchpoints.push("Heat or dry-spell stress is elevated.");
  if (scores.pest      >= 55) watchpoints.push("Pest and disease pressure is above average.");
  if (scores.logistics >= 50) watchpoints.push("Transport timing could affect spoilage; plan market access early.");
  if (scores.market    >= 50) watchpoints.push("Price volatility is a factor — consider contract buyer arrangements.");
  if (field.moisture   <  20) watchpoints.push("Soil moisture is critically low — irrigation is essential.");
  if (field.temp       >  32) watchpoints.push("High temperature stress detected — consider shade netting.");
  if (watchpoints.length === 0) watchpoints.push("Risk profile is manageable for this selection.");

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 pb-6">
      <PageHero eyebrow="In-season risk signals" heading="What could go wrong?" sub="Risk indicators across climate, soil, and logistics for your active planting window." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <SelectField label="District"     id="r-district" value={district} onChange={setDistrict} options={DISTRICTS} />
        <SelectField label="Crop"         id="r-crop"     value={crop}     onChange={setCrop}     options={CROPS} />
        <SelectField label="Season month" id="r-month"    value={month}    onChange={setMonth}    options={PLANTING_MONTHS} />
        <SelectField label="Intelligence" id="r-mode"     value={mode}     onChange={setMode}     options={INTEL_MODES} />
      </div>

      {/* Field intelligence */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit size={14} className="text-brand-600" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Field intelligence{field.isInferred ? " — data twin" : ""}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Soil moisture</p>
            <p className="text-xl font-medium text-gray-900 mb-1">{field.moisture}%</p>
            <FieldTag val={field.moisture} low={20} high={35} lowLabel="Critical" midLabel="Low" okLabel="OK" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Temperature</p>
            <p className="text-xl font-medium text-gray-900 mb-1">{field.temp}°C</p>
            <FieldTag val={36 - field.temp} low={3} high={6} lowLabel="Heat warning" midLabel="Elevated" okLabel="OK" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">NDVI vigour</p>
            <p className="text-xl font-medium text-gray-900 mb-1">{field.ndvi.toFixed(2)}</p>
            <FieldTag val={field.ndvi * 100} low={40} high={55} lowLabel="Low vigour" midLabel="Moderate" okLabel="Good" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
          <TrafficDot status={field.traffic.status} />
          <div className="text-xs">
            <span className="font-medium text-gray-700">{field.traffic.name}</span>
            <span className="text-gray-400 ml-1.5">{field.traffic.speed} km/h — {field.traffic.msg}</span>
          </div>
        </div>
      </div>

      {/* Risk cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 mb-4">
        {Object.entries(RISK_ICONS).map(([key, { icon: Icon, label }]) => {
          const val = scores[key];
          const lc = levelColors(val);
          return (
            <div key={key} className="bg-white border border-gray-100 rounded-2xl p-3">
              <Icon size={15} className="text-gray-300 mb-1.5" />
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 leading-tight">{label}</p>
              <p className="text-xl font-medium text-gray-900">{val}</p>
              <span className={"text-[10px] px-1.5 py-0.5 rounded-full " + lc.text + " " + lc.bg}>{lc.label}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-gray-800 mb-0.5">Risk breakdown</h2>
          <p className="text-xs text-gray-400 mb-3">Score out of 100 — lower is better</p>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "none" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                {chartData.map((entry, i) => <Cell key={i} fill={riskBarColor(entry.value)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-gray-800 mb-0.5">Risk radar</h2>
          <p className="text-xs text-gray-400 mb-2">Expanded = higher risk</p>
          <ResponsiveContainer width="100%" height={185}>
            <RadarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Radar dataKey="value" stroke="#2d6a4f" fill="#52b788" fillOpacity={0.25} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "none" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AiRec label="Key watchpoints">{watchpoints.join(" ")}</AiRec>
    </main>
  );
}

export default function RiskPage() {
  return <RequireAuth><RiskContent /></RequireAuth>;
}
