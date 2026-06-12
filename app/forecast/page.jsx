"use client";

import { useState } from "react";
import { Download, RefreshCw, Megaphone, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import PageHero from "@/components/PageHero";
import SelectField from "@/components/SelectField";
import AiRec from "@/components/AiRec";
import RequireAuth from "@/components/RequireAuth";

import { CROPS, PLANTING_MONTHS, computeForecast } from "@/lib/data";
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
  const { profile, farm, updateFarm } = useAuth();

  const [crop,        setCrop]        = useState(farm.crop        || "tomato");
  const [hectares,    setHectares]    = useState(farm.hectares    || "2");
  const [waterSource, setWaterSource] = useState(farm.waterSource || "borehole");
  const [investment,  setInvestment]  = useState(farm.investment  || "medium");
  const [labor,       setLabor]       = useState(farm.labor       || "family");
  const [soilHealth,  setSoilHealth]  = useState(farm.soilHealth  || "average");
  const [marketTarget,setMarketTarget]= useState(farm.marketTarget|| "local");
  const [horizonMonths,setHorizon]    = useState("6");
  const [plantMonth,  setPlantMonth]  = useState("jun");

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  // Planting intention declaration
  const [declaring, setDeclaring] = useState(false);
  const [declared,  setDeclared]  = useState(null);
  const [declareError, setDeclareError] = useState("");

  function handleChange(setter, farmKey) {
    return (val) => {
      setter(val);
      updateFarm({ [farmKey]: val }).catch(() => {});
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

  async function handleDeclare() {
    setDeclaring(true);
    setDeclareError("");
    try {
      const res = await fetch("/api/planting-intentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: profile.district,
          crop,
          hectares: parseFloat(hectares) || 0,
          planting_month: plantMonth,
          market_target: marketTarget,
          farmer_name: profile.displayName,
          phone: profile.phone,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Submission failed");
      setDeclared(json);
    } catch (e) {
      setDeclareError(e.message);
    } finally {
      setDeclaring(false);
    }
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
    <main className="max-w-5xl mx-auto px-4 md:px-6 pb-10">
      <PageHero
        eyebrow="Farm viability engine"
        heading="Should I plant this?"
        sub="Enter your farm parameters for a personalised viability score — then declare your plan to strengthen the live district supply signal."
      />

      <div className="card p-5 mb-5">
        <h2 className="text-sm font-semibold text-ink/80 mb-4">Farm parameters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <SelectField label="Crop"             id="fc-crop"   value={crop}        onChange={handleChange(setCrop,"crop")}               options={CROPS} />
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Farm size (ha)</label>
            <input type="number" min="0.1" max="50" step="0.5" value={hectares}
              onChange={e => { setHectares(e.target.value); updateFarm({ hectares: e.target.value }).catch(() => {}); }}
              className="field-input" />
          </div>
          <SelectField label="Water source"     id="fc-water"  value={waterSource} onChange={handleChange(setWaterSource,"waterSource")} options={WATER_OPTIONS} />
          <SelectField label="Investment level" id="fc-invest" value={investment}  onChange={handleChange(setInvestment,"investment")}   options={INVEST_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SelectField label="Labour type"   id="fc-labor"  value={labor}        onChange={handleChange(setLabor,"labor")}               options={LABOR_OPTIONS} />
          <SelectField label="Soil health"   id="fc-soil"   value={soilHealth}   onChange={handleChange(setSoilHealth,"soilHealth")}     options={SOIL_OPTIONS} />
          <SelectField label="Market target" id="fc-market" value={marketTarget} onChange={handleChange(setMarketTarget,"marketTarget")} options={MARKET_OPTIONS} />
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Horizon (months)</label>
            <input type="number" min="1" max="24" step="1" value={horizonMonths}
              onChange={e => setHorizon(e.target.value)}
              className="field-input" />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 shadow-card hover:shadow-lift">
          {loading ? <><RefreshCw size={14} className="animate-spin" /> Generating…</> : "Generate crop viability report"}
        </button>
      </div>

      {result && (
        <>
          <div className="card p-5 mb-4 animate-fade-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink/40 mb-1.5">Viability score</p>
                <p className={"text-5xl font-serif leading-none mb-1.5 " + bandColor}>
                  {result.viabilityScore}<span className="text-xl text-ink/20">/100</span>
                </p>
                <p className={"text-sm font-semibold " + bandColor}>{result.revenueBand} outlook</p>
              </div>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-ink border border-ink/10 rounded-lg px-3 py-2 transition-colors hover:bg-paper">
                <Download size={13} /> Export PDF
              </button>
            </div>
            <p className="text-[13.5px] text-ink/60 leading-relaxed mb-4 pt-3 border-t border-ink/[0.05]">{result.summary}</p>
            <div className="mb-4">
              <p className="text-xs font-semibold text-ink/50 mb-2">Risk sub-scores</p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={riskChartData} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8a948c" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8a948c" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e7e5de", boxShadow: "0 4px 16px rgba(22,36,28,0.08)" }} />
                  <Bar dataKey="value" radius={[5,5,0,0]} barSize={36}>
                    {riskChartData.map((entry, i) => <Cell key={i} fill={riskBarColor(entry.value)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-ink/[0.05] pt-3">
              <p className="text-xs font-semibold text-ink/50 mb-2">Watchpoints</p>
              <ul className="space-y-1.5">
                {result.riskBullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-ink/55">
                    <span className="text-gold-500 mt-0.5 flex-shrink-0">▸</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Declare planting intention — feeds the live supply signal */}
          <div className="card p-5 mb-4 border-brand-200/70 bg-gradient-to-br from-white to-brand-50/40">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center">
                <Megaphone size={14} className="text-brand-100" />
              </div>
              <h2 className="text-sm font-semibold text-ink/85">Declare this plan to the network</h2>
            </div>
            <p className="text-[13px] text-ink/50 leading-relaxed mb-4">
              Your declaration is anonymous-by-default and powers the live district supply index every
              farmer sees on the Supply Check page. Three or more declarations switch a district+crop
              from baseline estimates to real data.
            </p>
            {declared ? (
              <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-medium">
                <CheckCircle2 size={16} />
                Declared — {declared.total_farmers} farmer{declared.total_farmers === 1 ? "" : "s"} and {declared.total_ha} ha now declared for this district+crop.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="sm:w-44">
                  <SelectField label="Planting month" id="fc-pmonth" value={plantMonth} onChange={setPlantMonth} options={PLANTING_MONTHS} />
                </div>
                <button onClick={handleDeclare} disabled={declaring}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 bg-white border border-brand-600 text-brand-700 hover:bg-brand-700 hover:text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60">
                  {declaring ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
                  Declare {hectares} ha of {CROPS.find(c => c.value === crop)?.label.toLowerCase()} in {profile.district}
                </button>
              </div>
            )}
            {declareError && <p className="text-sm text-red-600 mt-2">{declareError}</p>}
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
