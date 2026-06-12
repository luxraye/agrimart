import { NextResponse } from "next/server";
import { dbSelect } from "@/lib/server/db";
import { isAuthorizedRequest } from "@/lib/server/adminAuth";
import { currentSeasonYear } from "@/lib/data";

export const dynamic = "force-dynamic";

/** GET ?season_year= — aggregated planting intentions for the admin panel. */
export async function GET(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const seasonYear =
    Number(new URL(request.url).searchParams.get("season_year")) || currentSeasonYear();

  try {
    const rows = await dbSelect("planting_intentions", { season_year: seasonYear });

    const byPair = new Map();
    for (const r of rows) {
      const key = `${r.district}|${r.crop}`;
      if (!byPair.has(key)) {
        byPair.set(key, {
          district: r.district,
          crop: r.crop,
          farmers: 0,
          total_ha: 0,
          markets: {},
        });
      }
      const agg = byPair.get(key);
      agg.farmers += 1;
      agg.total_ha += Number(r.hectares) || 0;
      if (r.market_target) agg.markets[r.market_target] = (agg.markets[r.market_target] ?? 0) + 1;
    }

    const groups = [...byPair.values()]
      .map((g) => ({
        ...g,
        total_ha: Math.round(g.total_ha * 100) / 100,
        dominant_market:
          Object.entries(g.markets).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      }))
      .sort((a, b) => b.total_ha - a.total_ha);

    return NextResponse.json({
      ok: true,
      season_year: seasonYear,
      total_farmers: rows.length,
      total_ha: Math.round(rows.reduce((a, r) => a + (Number(r.hectares) || 0), 0) * 100) / 100,
      groups,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
