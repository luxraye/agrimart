"use client";

import { useEffect, useState } from "react";
import { Download, Users, Layers, Megaphone } from "lucide-react";
import { DISTRICTS, CROPS, currentSeasonYear } from "@/lib/data";

const label = (list, v) => list.find((x) => x.value === v)?.label ?? v;

export default function IntentionsAdmin() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const year = currentSeasonYear();

  useEffect(() => {
    fetch(`/api/admin/intentions?season_year=${year}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year]);

  const maxHa = Math.max(1, ...(data?.groups ?? []).map((g) => g.total_ha));

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Planting intentions</h1>
          <p className="text-[13px] text-white/40">Season {year} — read-only aggregation of farmer declarations.</p>
        </div>
        <a href={`/api/admin/export/intentions?format=csv&season_year=${year}`}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/80 text-[13px] font-medium rounded-xl transition-colors no-underline">
          <Download size={14} /> Export CSV
        </a>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
        {[
          { icon: Users,     label: "Total farmers",      value: data?.total_farmers ?? "—" },
          { icon: Layers,    label: "Declared hectares",  value: data?.total_ha ?? "—" },
          { icon: Megaphone, label: "District+crop pairs", value: data?.groups?.length ?? "—" },
        ].map(({ icon: Icon, label: l, value }) => (
          <div key={l} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
            <Icon size={15} className="text-emerald-300/60 mb-2.5" />
            <p className="text-2xl font-serif text-white mb-0.5">{loading ? "…" : value}</p>
            <p className="text-[11px] uppercase tracking-wider text-white/35">{l}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Breakdown by district × crop
          </h2>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-[13px] text-white/30">Loading…</p>
        ) : data?.groups?.length ? (
          <div className="divide-y divide-white/[0.04]">
            {data.groups.map((g) => (
              <div key={`${g.district}|${g.crop}`} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-2 text-[13px]">
                  <span className="text-white/80 font-medium">
                    {label(CROPS, g.crop)} · {label(DISTRICTS, g.district)}
                  </span>
                  <span className="text-white/40">
                    {g.farmers} farmer{g.farmers === 1 ? "" : "s"} · {g.total_ha} ha
                    {g.dominant_market ? ` · mostly ${g.dominant_market}` : ""}
                  </span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400/80 to-emerald-300/60"
                    style={{ width: `${Math.max(3, (g.total_ha / maxHa) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-6 text-[13px] text-white/30">
            No declarations yet for season {year}. Farmers declare from the My Farm page.
          </p>
        )}
      </div>
    </div>
  );
}
