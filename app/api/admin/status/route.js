import { NextResponse } from "next/server";
import { dbSelect } from "@/lib/server/db";
import { recentRefreshes } from "@/lib/server/refreshLog";
import { isAuthorizedRequest } from "@/lib/server/adminAuth";
import { OSM_KEYS } from "@/lib/server/pipeline";

export const dynamic = "force-dynamic";

async function safeCount(table, filter = {}) {
  try {
    const rows = await dbSelect(table, filter);
    return rows.length;
  } catch {
    return 0;
  }
}

async function lastFetched(table, filter = {}) {
  try {
    const rows = await dbSelect(table, filter, {
      order: { column: "fetched_at" },
      limit: 1,
    });
    return rows[0]?.fetched_at ?? null;
  } catch {
    return null;
  }
}

/** GET — dashboard status grid: per-source last fetch + record counts. */
export async function GET(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [
    weatherCount, weatherAt,
    waterRow, trafficRow,
    faostatCount, faostatAt,
    pricesCount, riskCount,
    intentionsCount, log,
  ] = await Promise.all([
    safeCount("field_intel_cache"),
    lastFetched("field_intel_cache"),
    dbSelect("osm_cache", { key: OSM_KEYS.water_points }, { limit: 1 }).catch(() => []),
    dbSelect("osm_cache", { key: OSM_KEYS.traffic_nodes }, { limit: 1 }).catch(() => []),
    safeCount("faostat_cache"),
    lastFetched("faostat_cache"),
    safeCount("market_prices"),
    safeCount("risk_scores"),
    safeCount("planting_intentions"),
    recentRefreshes(15),
  ]);

  const riskAt = await (async () => {
    try {
      const rows = await dbSelect("risk_scores", {}, { order: { column: "computed_at" }, limit: 1 });
      return rows[0]?.computed_at ?? null;
    } catch {
      return null;
    }
  })();
  const priceAt = await (async () => {
    try {
      const rows = await dbSelect("market_prices", {}, { order: { column: "created_at" }, limit: 1 });
      return rows[0]?.created_at ?? null;
    } catch {
      return null;
    }
  })();
  const intentionAt = await (async () => {
    try {
      const rows = await dbSelect("planting_intentions", {}, { order: { column: "created_at" }, limit: 1 });
      return rows[0]?.created_at ?? null;
    } catch {
      return null;
    }
  })();

  return NextResponse.json({
    ok: true,
    persistence: "supabase",
    sources: [
      { id: "weather",    label: "Open-Meteo weather",  table: "field_intel_cache", refreshPath: "/api/fetch/weather",            frequency: "Every 6h",  count: weatherCount,                      lastFetch: weatherAt },
      { id: "osm_water",  label: "OSM water points",    table: "osm_cache",         refreshPath: "/api/fetch/osm?layer=water_points",  frequency: "Weekly", count: waterRow[0]?.data?.length ?? 0,  lastFetch: waterRow[0]?.fetched_at ?? null },
      { id: "osm_traffic",label: "OSM traffic nodes",   table: "osm_cache",         refreshPath: "/api/fetch/osm?layer=traffic_nodes", frequency: "Daily",  count: trafficRow[0]?.data?.length ?? 0, lastFetch: trafficRow[0]?.fetched_at ?? null },
      { id: "faostat",    label: "FAOSTAT production",  table: "faostat_cache",     refreshPath: "/api/fetch/faostat",            frequency: "Weekly",    count: faostatCount,                      lastFetch: faostatAt },
      { id: "prices",     label: "Market prices",       table: "market_prices",     refreshPath: null,                            frequency: "On change", count: pricesCount,                       lastFetch: priceAt },
      { id: "risk",       label: "Risk scores",         table: "risk_scores",       refreshPath: "/api/risk-scores",              frequency: "Daily",     count: riskCount,                         lastFetch: riskAt },
      { id: "intentions", label: "Planting intentions", table: "planting_intentions", refreshPath: null,                          frequency: "Real-time", count: intentionsCount,                   lastFetch: intentionAt },
    ],
    refreshLog: log,
  });
}
