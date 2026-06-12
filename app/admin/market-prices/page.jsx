"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CheckCircle2, TrendingDown } from "lucide-react";
import { DISTRICTS, CROPS } from "@/lib/data";

const inputCls =
  "w-full rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-sm text-white " +
  "placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent";

export default function MarketPricesAdmin() {
  const [prices,  setPrices]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [district, setDistrict] = useState("gaborone");
  const [crop,     setCrop]     = useState("tomato");
  const [price,    setPrice]    = useState("");
  const [source,   setSource]   = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(() => {
    fetch("/api/admin/market-prices")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setPrices(json.prices);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district, crop,
          price_bwp_kg: parseFloat(price),
          source,
          recorded_at: date,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Insert failed");
      setFeedback({
        kind: "ok",
        text: json.signal?.applied
          ? "Saved — price drop detected, market risk score raised +15 for this district+crop."
          : "Saved.",
        signal: json.signal?.applied,
      });
      setPrice("");
      setSource("");
      load();
    } catch (err) {
      setFeedback({ kind: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="font-serif text-3xl text-white mb-1">Market prices</h1>
      <p className="text-[13px] text-white/40 mb-6">
        Manual observations in BWP/kg. Entries &gt;20% below the 30-day rolling average automatically
        raise the market risk score for that district+crop.
      </p>

      {/* Entry form */}
      <form onSubmit={handleSubmit} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 mb-6">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45 mb-4">Add entry</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/35 mb-1.5">District</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls}>
              {DISTRICTS.map((d) => <option key={d.value} value={d.value} className="bg-[#13211a]">{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/35 mb-1.5">Crop</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className={inputCls}>
              {CROPS.map((c) => <option key={c.value} value={c.value} className="bg-[#13211a]">{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/35 mb-1.5">Price (BWP/kg)</label>
            <input type="number" min="0.05" step="0.05" required value={price}
              onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 12.50" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/35 mb-1.5">Source</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Gaborone Main Mall observation" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/35 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <button type="submit" disabled={saving || !price}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-[13px] font-semibold rounded-xl transition-colors disabled:opacity-50">
          <Plus size={14} /> {saving ? "Saving…" : "Add entry"}
        </button>
        {feedback && (
          <p className={`mt-3 text-[13px] flex items-center gap-1.5 ${feedback.kind === "ok" ? "text-emerald-300" : "text-red-400"}`}>
            {feedback.kind === "ok" ? (feedback.signal ? <TrendingDown size={14} /> : <CheckCircle2 size={14} />) : null}
            {feedback.text}
          </p>
        )}
      </form>

      {/* Recent entries */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Recent entries</h2>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-[13px] text-white/30">Loading…</p>
        ) : prices.length ? (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-white/30 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">District</th>
                <th className="px-3 py-2.5 font-medium">Crop</th>
                <th className="px-3 py-2.5 font-medium text-right">BWP/kg</th>
                <th className="px-5 py-2.5 font-medium hidden md:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-2.5 text-white/55 whitespace-nowrap">{p.recorded_at}</td>
                  <td className="px-3 py-2.5 text-white/70 capitalize">{p.district}</td>
                  <td className="px-3 py-2.5 text-white/70 capitalize">{p.crop}</td>
                  <td className="px-3 py-2.5 text-emerald-300 font-mono text-right">{Number(p.price_bwp_kg).toFixed(2)}</td>
                  <td className="px-5 py-2.5 text-white/35 hidden md:table-cell">{p.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-[13px] text-white/30">No prices recorded yet.</p>
        )}
      </div>
    </div>
  );
}
