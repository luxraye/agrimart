"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { Droplets, Sun, Truck, Bug, TrendingUp, Satellite, BrainCircuit } from "lucide-react";

import PageHero from "@/components/PageHero";
import SelectField from "@/components/SelectField";
import AiRec from "@/components/AiRec";
import DataTwinBanner from "@/components/DataTwinBanner";
import RequireAuth from "@/components/RequireAuth";
import FreshnessTag from "@/components/FreshnessTag";

import {
  DISTRICTS, CROPS, PLANTING_MONTHS, INTEL_MODES,
  TWIN_FIELD_INTEL, computeTwinRisk,
} from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { levelColors, riskBarColor } from "@/lib/utils";

const RISK_DIMENSIONS = {
  soil_score:      { icon: Droplets,   label: "Soil moisture" },
  climate_score:   { icon: Sun,        label: "Climate stress" },
  logistics_score: { icon: Truck,      label: "Logistics" },
  pest_score:      { icon: Bug,        label: "Pest / disease" },
  market_score:    { icon: TrendingUp, label: "Market volatility" },
};

function TrafficDot({ status }) {
  const col = status === "red" ? "bg-red-500" : status === "yellow" ? "bg-amber-400" : "bg-emerald-500";
  return <span className={"w-2.5 h-2.5 rounded-full flex-shrink-0 " + col} />;
}

function FieldTag({ val, low, high, lowLabel, midLabel, okLabel }) {
  if (val == null) return <span className="text-[10px] font-semibold text-ink/30 bg-ink/5 px-2 py-0.5 rounded-full">No data</span>;
  if (val <= low)  return <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{lowLabel}</span>;
  if (val <= high) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{midLabel}</span>;
  return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{okLabel}</span>;
}

function IntelValue({ loading, value, suffix = "" }) {
  if (loading) return <div className="skeleton h-7 w-14 mb-1" />;
  return (
    <p className="text-[1.4rem] font-serif text-ink mb-1 leading-none">
      {value != null ? `${value}${suffix}` : "—"}
    </p>
  );
}

function RiskContent() {
  const { profile } = useAuth();
  const [district, setDistrict] = useState(profile.district || "central");
  const [crop,     setCrop]     = useState("tomato");
  const [month,    setMonth]    = useState("jun");
  const [mode,     setMode]     = useState("local");

  const [intel,        setIntel]        = useState(null);
  const [intelLoading, setIntelLoading] = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [risk,         setRisk]         = useState(null);
  const [riskLoading,  setRiskLoading]  = useState(true);
  const reqId = useRef(0);

  const isTwin = mode === "twin";

  const loadIntel = useCallback((d, soft = false) => {
    const id = ++reqId.current;
    if (!soft) setIntelLoading(true);
    fetch(`/api/fetch/weather?district=${d}`)
      .then((r) => r.json())
      .then((json) => {
        if (reqId.current !== id) return;
        setIntel(json.ok ? json : null);
        setIntelLoading(false);
      })
      .catch(() => {
        if (reqId.current !== id) return;
        setIntel(null);
        setIntelLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isTwin) {
      setIntel(TWIN_FIELD_INTEL);
      setIntelLoading(false);
      return;
    }
    loadIntel(district);
  }, [district, isTwin, loadIntel]);

  useEffect(() => {
    if (isTwin) {
      setRisk(computeTwinRisk(district, crop));
      setRiskLoading(false);
      return;
    }
    let active = true;
    setRiskLoading(true);
    fetch(`/api/risk-scores?district=${district}&crop=${crop}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        setRisk(json.ok ? json : null);
        setRiskLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRisk(null);
        setRiskLoading(false);
      });
    return () => { active = false; };
  }, [district, crop, isTwin]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/fetch/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district }),
      });
    } catch {
      // re-read whatever is cached
    }
    loadIntel(district, true);
    setRefreshing(false);
  }

  const scores = risk
    ? Object.fromEntries(Object.keys(RISK_DIMENSIONS).map((k) => [k, Math.round(Number(risk[k]) || 0)]))
    : null;
  const chartData = scores
    ? Object.entries(RISK_DIMENSIONS).map(([key, { label }]) => ({ name: label, value: scores[key] }))
    : [];

  const watchpoints = [];
  if (scores) {
    if (scores.climate_score   >= 55) watchpoints.push("Heat or dry-spell stress is elevated in the 14-day forecast.");
    if (scores.pest_score      >= 55) watchpoints.push("Pest and disease pressure is above average for this crop.");
    if (scores.logistics_score >= 50) watchpoints.push("Transport timing could affect spoilage; plan market access early.");
    if (scores.market_score    >= 50) watchpoints.push("Price volatility is a factor — consider contract buyer arrangements.");
  }
  if (intel?.moisture != null && intel.moisture < 20) watchpoints.push("Soil moisture is critically low — irrigation is essential.");
  if (intel?.temp != null && intel.temp > 32) watchpoints.push("High temperature stress detected — consider shade netting.");
  if (isTwin) watchpoints.push("Scores use baseline anchors from a regional agro-climatic twin — validate on the ground before acting.");
  if (watchpoints.length === 0 && scores) watchpoints.push("Risk profile is manageable for this selection.");

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 pb-10">
      <PageHero
        eyebrow="In-season risk signals"
        heading="What could go wrong?"
        sub="Live climate, soil, and logistics indicators from Open-Meteo, MODIS, and OpenStreetMap — refreshed every six hours."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SelectField label="District"     id="r-district" value={district} onChange={setDistrict} options={DISTRICTS} />
        <SelectField label="Crop"         id="r-crop"     value={crop}     onChange={setCrop}     options={CROPS} />
        <SelectField label="Season month" id="r-month"    value={month}    onChange={setMonth}    options={PLANTING_MONTHS} />
        <SelectField label="Intelligence" id="r-mode"     value={mode}     onChange={setMode}     options={INTEL_MODES} />
      </div>

      {isTwin && <DataTwinBanner className="mb-5" />}

      {/* Field intelligence */}
      <div className="card p-5 mb-5 animate-fade-up">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isTwin ? (
              <BrainCircuit size={14} className="text-violet-600" />
            ) : (
              <Satellite size={14} className="text-brand-600" />
            )}
            <span className="text-[11px] font-semibold text-ink/45 uppercase tracking-[0.14em]">
              Field intelligence{isTwin ? " — data twin" : ""}
            </span>
            {isTwin && (
              <span className="text-[10px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">Inferred</span>
            )}
            {!isTwin && intel?.ndviSource === "proxy" && (
              <span className="text-[10px] text-ink/35 bg-ink/5 px-2 py-0.5 rounded-full">NDVI proxy (ET-based)</span>
            )}
          </div>
          {!intelLoading && !isTwin && (
            <FreshnessTag
              fetchedAt={intel?.fetchedAt}
              stale={intel?.stale}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-[10.5px] text-ink/40 uppercase tracking-[0.12em] mb-1.5">Soil moisture</p>
            <IntelValue loading={intelLoading} value={intel?.moisture} suffix="%" />
            <FieldTag val={intelLoading ? null : intel?.moisture} low={20} high={35} lowLabel="Critical" midLabel="Low" okLabel="OK" />
          </div>
          <div>
            <p className="text-[10.5px] text-ink/40 uppercase tracking-[0.12em] mb-1.5">Max temperature</p>
            <IntelValue loading={intelLoading} value={intel?.temp} suffix="°C" />
            <FieldTag val={intelLoading || intel?.temp == null ? null : 36 - intel.temp} low={3} high={6} lowLabel="Heat warning" midLabel="Elevated" okLabel="OK" />
          </div>
          <div>
            <p className="text-[10.5px] text-ink/40 uppercase tracking-[0.12em] mb-1.5">NDVI vigour</p>
            <IntelValue loading={intelLoading} value={intel?.ndvi != null ? intel.ndvi.toFixed(2) : null} />
            <FieldTag val={intelLoading || intel?.ndvi == null ? null : intel.ndvi * 100} low={40} high={55} lowLabel="Low vigour" midLabel="Moderate" okLabel="Good" />
          </div>
        </div>

        {intelLoading ? (
          <div className="skeleton h-10 w-full" />
        ) : intel?.traffic ? (
          <div className="flex items-center gap-3 bg-paper rounded-xl px-3.5 py-2.5">
            <TrafficDot status={intel.traffic.status} />
            <div className="text-xs">
              <span className="font-semibold text-ink/75">{intel.traffic.name}</span>
              <span className="text-ink/40 ml-1.5">
                {intel.traffic.speed != null ? `${intel.traffic.speed} km/h — ` : ""}{intel.traffic.msg}
                {intel.traffic.distance_km != null ? ` · ${intel.traffic.distance_km} km from district centroid` : ""}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Risk cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-5">
        {Object.entries(RISK_DIMENSIONS).map(([key, { icon: Icon, label }]) => {
          const val = scores?.[key];
          const lc = val != null ? levelColors(val) : null;
          return (
            <div key={key} className="card card-hover p-3.5">
              <Icon size={15} className="text-brand-300 mb-2" />
              <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40 mb-1.5 leading-tight">{label}</p>
              {riskLoading ? (
                <div className="skeleton h-7 w-10 mb-1.5" />
              ) : (
                <p className="text-[1.4rem] font-serif text-ink leading-none mb-1.5">{val ?? "—"}</p>
              )}
              {lc && <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + lc.text + " " + lc.bg}>{lc.label}</span>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink/80 mb-0.5">Risk breakdown</h2>
          <p className="text-xs text-ink/35 mb-3">Score out of 100 — lower is better</p>
          {riskLoading ? (
            <div className="skeleton h-[185px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#8a948c" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fill: "#5b665e" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e7e5de", boxShadow: "0 4px 16px rgba(22,36,28,0.08)" }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={13}>
                  {chartData.map((entry, i) => <Cell key={i} fill={riskBarColor(entry.value)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink/80 mb-0.5">Risk radar</h2>
          <p className="text-xs text-ink/35 mb-2">Expanded = higher risk</p>
          {riskLoading ? (
            <div className="skeleton h-[185px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={185}>
              <RadarChart data={chartData} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
                <PolarGrid stroke="#e3e1da" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#8a948c" }} />
                <Radar dataKey="value" stroke="#1d5639" fill="#56a378" fillOpacity={0.28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e7e5de", boxShadow: "0 4px 16px rgba(22,36,28,0.08)" }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {watchpoints.length > 0 && <AiRec label="Key watchpoints">{watchpoints.join(" ")}</AiRec>}
    </main>
  );
}

export default function RiskPage() {
  return <RequireAuth><RiskContent /></RequireAuth>;
}
