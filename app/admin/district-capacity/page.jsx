"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { DISTRICTS, CROPS } from "@/lib/data";

export default function DistrictCapacityAdmin() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits,   setEdits]   = useState({});   // "district|crop" → string value
  const [saving,  setSaving]  = useState({});
  const [savedAt, setSavedAt] = useState({});

  const load = useCallback(() => {
    fetch("/api/admin/district-capacity")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setRows(json.capacities);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byDistrict = {};
  for (const r of rows) {
    (byDistrict[r.district] ??= {})[r.crop] = r;
  }

  async function save(district, crop) {
    const key = `${district}|${crop}`;
    const value = Number(edits[key]);
    if (!value || value <= 0) return;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch("/api/admin/district-capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, crop, max_ha: value }),
      });
      const json = await res.json();
      if (json.ok) {
        setSavedAt((s) => ({ ...s, [key]: Date.now() }));
        setEdits((e) => {
          const next = { ...e };
          delete next[key];
          return next;
        });
        load();
      }
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="font-serif text-3xl text-white mb-1">Supply capacity calibration</h1>
      <p className="text-[13px] text-white/40 mb-6 max-w-2xl">
        Estimated maximum cultivatable hectares per district × crop. These ceilings normalise the
        live supply index — adjust them as agronomic ground truth improves.
      </p>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-x-auto">
          <table className="w-full text-[12.5px] min-w-[760px]">
            <thead>
              <tr className="text-left text-white/30 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                <th className="px-5 py-3 font-medium sticky left-0 bg-[#101a14]">District</th>
                {CROPS.map((c) => (
                  <th key={c.value} className="px-3 py-3 font-medium text-right">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISTRICTS.map((d) => (
                <tr key={d.value} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-2.5 text-white/75 font-medium whitespace-nowrap sticky left-0 bg-[#101a14]">
                    {d.label}
                  </td>
                  {CROPS.map((c) => {
                    const key = `${d.value}|${c.value}`;
                    const row = byDistrict[d.value]?.[c.value];
                    const editing = key in edits;
                    const justSaved = savedAt[key] && Date.now() - savedAt[key] < 4000;
                    return (
                      <td key={c.value} className="px-3 py-2 text-right">
                        {editing ? (
                          <span className="inline-flex items-center gap-1">
                            <input
                              type="number" min="1" autoFocus
                              value={edits[key]}
                              onChange={(e) => setEdits((s) => ({ ...s, [key]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && save(d.value, c.value)}
                              className="w-[72px] rounded-lg bg-white/[0.07] border border-emerald-300/30 px-2 py-1 text-right text-white text-[12px]
                                focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
                            />
                            <button onClick={() => save(d.value, c.value)} disabled={saving[key]}
                              className="p-1 rounded-md text-emerald-300 hover:bg-emerald-400/15 transition-colors">
                              <Check size={13} />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setEdits((s) => ({ ...s, [key]: String(row?.max_ha ?? "") }))}
                            className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:bg-white/[0.06]
                              ${justSaved ? "text-emerald-300" : row?.stored ? "text-white/85" : "text-white/40"}`}
                            title={row?.stored ? "Calibrated value" : "Default — click to calibrate"}
                          >
                            <span className="font-mono">{row?.max_ha ?? "—"}</span>
                            <Pencil size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-white/25 mt-3">
        Dimmed values are uncalibrated defaults · click any cell to edit · Enter to save
      </p>
    </div>
  );
}
