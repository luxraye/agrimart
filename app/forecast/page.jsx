"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import PageHero from "@/components/PageHero";
import SelectField from "@/components/SelectField";
import AiRec from "@/components/AiRec";
import RequireAuth from "@/components/RequireAuth";

import { CROPS, computeForecast } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { riskBarColor } from "@/lib/utils";

const WATER_OPTIONS  = [{ value:"borehole",label:"Borehole" },{ value:"river",label:"River / stream" },{ value:"municipal",label:"Municipal" },{ value:"dam",label:"Dam / reservoir" },{ value:"other",label:"Other / seasonal" }];
const INVEST_OPTIONS = [{ value:"low",label:"Low (subsistence)" },{ value:"medium",label:"Medium (commercial)" },{ value:"high",label:"High (intensive)" }];
const LABOR_OPTIONS  = [{ value:"family",label:"Family labour" },{ value:"mixed",label:"Mixed" },{ value:"hired",label:"Hired labour" }];
const SOIL_OPTIONS   = [{ value:"poor",label:"Poor" },{ value:"average",label:"Average" },{ value:"excellent",label:"Excellent" }];
const MARKET_OPTIONS = [{ value:"local",label:"Local market" },{ value:"aggregator",label:"Aggregator / cooperative" },{ value:"export",label:"Export / institutional" }];

const NEXT_STEPS = {
  export:     "Contact an aggregator or export certification body before the season. Request a formal crop validation report.",
  aggregator: "Reach out to your cooperative before planting to confirm purchase intent and pricing expectations.",
  local:      "Run a 1-hectare trial before scaling. Track actual yield vs this forecast to calibrate future reports.",
};

function ForecastContent() {
  const { farm, updateFarm } = useAuth();

  const [crop,        setCrop]        = useState(farm.crop        || "tomato");
  const [hectares,    setHectares]    = useState(farm.hectares    || "2");
  const [waterSource, setWaterSource] = useState(farm.waterSource || "borehole");
  const [investment,  setInvestment]  = useState(farm.investment  || "medium");
  const [labor,       setLabor]       = useState(farm.labor       || "family");
  const [soilHealth,  setSoilHealth]  = useState(farm.soilHealth  || "average");
  const [marketTarget,setMarketTarget]= useState(farm.marketTarget|| "local");
  const [horizonMonths,setHorizon]    = useState("6");

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(setter, farmKey) {
    return (val) => {
      setter(val);
      updateFarm({ [farmKey]: val });
    };
  }

  function handleGenerate() {
    setLoading(true);
    setTimeout(() => {
      const r = computeForecast({
        crop: CROPS.find(c => c.value === crop)?.label || crop,
        hectares: parseFloat(hectares) || 2,
        waterSource, investment, labor, soilHealth, marketTarget,
        horizonMonths: parseInt(horizonMonths) || 6,
      });
      setResult(r);
      setLoading(false);
    }, 450);
  }

  async function handleExport() {
    if (!result) return;
    const { exportForecastPDF } = await import("@/lib/pdfReport");
    exportForecastPDF({
      input: { crop: CROPS.find(c => c.value === crop)?.label || crop, hectares: parseFloat(hectares)||2, waterSource, investment, labor, soilHealth, marketTarget, horizonMonths: parseInt(horizonMonths)||6 },
      result,
    });
  }

  const bandColor = !result ? "" :
    result.revenueBand === "Strong" ? "text-emerald-700" :
    result.revenueBand === "Moderate" ? "text-amber-700" : "text-red-700";

  const riskChartData = result ? [
    { name: "Market volatility", value: result.marketVolatility },
    { name: "Climate stress",    value: result.climateStress    },
    { name: "Logistics risk",    value: result.logisticsRisk    },
  ] : [];

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 pb-6">
      <PageHero eyebrow="Farm viability engine" heading="Should I plant this?" sub="Enter your farm parameters to get a personalised crop viability score. Your inputs are saved automatically." />

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Farm parameters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
          <SelectField label="Crop"             id="fc-crop"   value={crop}        onChange={handleChange(setCrop,"crop")}               options={CROPS} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Farm size (ha)</label>
            <input type="number" min="0.1" max="50" step="0.5" value={hectares}
              onChange={e => { setHectares(e.target.value); updateFarm({ hectares: e.target.value }); }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <SelectField label="Water source"     id="fc-water"  value={waterSource} onChange={handleChange(setWaterSource,"waterSource")} options={WATER_OPTIONS} />
          <SelectField label="Investment level" id="fc-invest" value={investment}  onChange={handleChange(setInvestment,"investment")}   options={INVEST_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          <SelectField label="Labour type"   id="fc-labor"  value={labor}        onChange={handleChange(setLabor,"labor")}               options={LABOR_OPTIONS} />
          <SelectField label="Soil health"   id="fc-soil"   value={soilHealth}   onChange={handleChange(setSoilHealth,"soilHealth")}     options={SOIL_OPTIONS} />
          <SelectField label="Market target" id="fc-market" value={marketTarget} onChange={handleChange(setMarketTarget,"marketTarget")} options={MARKET_OPTIONS} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Horizon (months)</label>
            <input type="number" min="1" max="24" step="1" value={horizonMonths}
              onChange={e => setHorizon(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
          {loading ? <><RefreshCw size={14} className="animate-spin" /> Generating…</> : "Generate crop viability report"}
        </button>
      </div>

      {result && (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Viability score</p>
                <p className={"text-5xl font-medium leading-none mb-1 " + bandColor}>
                  {result.viabilityScore}<span className="text-xl text-gray-300">/100</span>
                </p>
                <p className={"text-sm font-medium " + bandColor}>{result.revenueBand} outlook</p>
              </div>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 transition-colors">
                <Download size={13} /> Export PDF
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4 pt-3 border-t border-gray-50">{result.summary}</p>
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Risk sub-scores</p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={riskChartData} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "none" }} />
                  <Bar dataKey="value" radius={[4,4,0,0]} barSize={36}>
                    {riskChartData.map((entry, i) => <Cell key={i} fill={riskBarColor(entry.value)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-gray-50 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Watchpoints</p>
              <ul className="space-y-1.5">
                {result.riskBullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-500">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <AiRec label="Next steps">{NEXT_STEPS[marketTarget] || NEXT_STEPS.local}</AiRec>
        </>
      )}
    </main>
  );
}

export default function ForecastPage() {
  return <RequireAuth><ForecastContent /></RequireAuth>;
}
