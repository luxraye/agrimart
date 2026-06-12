// Refresh orchestrators — called by cron routes and the admin panel.
// Each returns { ok, count, duration_ms, ... } and logs to refresh_log.

import { dbSelect, dbUpsert } from "./db";
import { daysSince } from "./fetchJson";
import { logRefresh } from "./refreshLog";
import { refreshFieldIntel } from "./fieldIntel";
import { fetchWaterPoints, fetchTrafficNodes } from "./fetchers/overpass";
import { fetchFaostatProduction } from "./fetchers/faostat";
import { refreshAllRiskScores } from "./riskEngine";

import staticWaterPoints from "../../public/data/water_points.json";
import staticTrafficNodes from "../../public/data/traffic_nodes.json";

export const OSM_KEYS = {
  water_points: "water_points_bw",
  traffic_nodes: "traffic_nodes_bw",
};

// ─── Weather ─────────────────────────────────────────────────────────────────

export async function runWeatherRefresh({ districts, triggeredBy = "admin" } = {}) {
  const t0 = Date.now();
  try {
    const { refreshed, errors } = await refreshFieldIntel(districts);
    const duration = Date.now() - t0;
    await logRefresh({
      source: "open_meteo_weather",
      triggeredBy,
      recordCount: refreshed.length,
      durationMs: duration,
      error: errors.length ? JSON.stringify(errors).slice(0, 500) : null,
    });
    return { ok: true, refreshed, errors, count: refreshed.length, duration_ms: duration };
  } catch (e) {
    const duration = Date.now() - t0;
    await logRefresh({ source: "open_meteo_weather", triggeredBy, recordCount: 0, durationMs: duration, error: e.message });
    return { ok: false, error: e.message, duration_ms: duration };
  }
}

// ─── OSM ─────────────────────────────────────────────────────────────────────

export async function runOsmRefresh({ layer, triggeredBy = "admin" } = {}) {
  const layers = layer ? [layer] : ["traffic_nodes", "water_points"];
  const results = [];

  for (const l of layers) {
    const t0 = Date.now();
    try {
      const data = l === "water_points" ? await fetchWaterPoints() : await fetchTrafficNodes();
      const fetchedAt = new Date().toISOString();
      // cache before returning (quality rule 2)
      await dbUpsert("osm_cache", { key: OSM_KEYS[l], data, fetched_at: fetchedAt }, ["key"]);
      const duration = Date.now() - t0;
      await logRefresh({ source: `osm_${l}`, triggeredBy, recordCount: data.length, durationMs: duration });
      results.push({ ok: true, layer: l, count: data.length, fetched_at: fetchedAt, duration_ms: duration });
    } catch (e) {
      const duration = Date.now() - t0;
      await logRefresh({ source: `osm_${l}`, triggeredBy, recordCount: 0, durationMs: duration, error: e.message });
      results.push({ ok: false, layer: l, error: e.message, duration_ms: duration });
    }
  }
  return results.length === 1 ? results[0] : { ok: results.every((r) => r.ok), results };
}

/**
 * Read an OSM layer: cache → static file fallback (silently when >7 days
 * stale per the freshness rules).
 */
export async function getOsmLayer(layer) {
  const key = OSM_KEYS[layer];
  const fallbackData = layer === "water_points" ? staticWaterPoints : staticTrafficNodes;
  let row = null;
  try {
    const rows = await dbSelect("osm_cache", { key }, { limit: 1 });
    row = rows[0] ?? null;
  } catch {
    row = null;
  }
  if (row?.data?.length && daysSince(row.fetched_at) <= 7) {
    return { layer, data: row.data, fetched_at: row.fetched_at, source: "live" };
  }
  if (row?.data?.length) {
    return { layer, data: row.data, fetched_at: row.fetched_at, source: "cached", stale: true };
  }
  // FALLBACK: replace when OSM Overpass available
  return { layer, data: fallbackData, fetched_at: null, source: "fallback" };
}

// ─── FAOSTAT ─────────────────────────────────────────────────────────────────

export async function runFaostatRefresh({ triggeredBy = "admin" } = {}) {
  const t0 = Date.now();
  try {
    const rows = await fetchFaostatProduction();
    for (const r of rows) {
      await dbUpsert("faostat_cache", {
        crop: r.crop,
        year: r.year,
        production_tonnes: r.production_tonnes,
        area_ha: r.area_ha ?? null,
        source_url: r.source_url,
        fetched_at: new Date().toISOString(),
      }, ["crop", "year"]);
    }
    const duration = Date.now() - t0;
    await logRefresh({ source: "faostat_production", triggeredBy, recordCount: rows.length, durationMs: duration });
    return { ok: true, count: rows.length, duration_ms: duration };
  } catch (e) {
    const duration = Date.now() - t0;
    await logRefresh({ source: "faostat_production", triggeredBy, recordCount: 0, durationMs: duration, error: e.message });
    return { ok: false, error: e.message, duration_ms: duration };
  }
}

// ─── Risk scores ─────────────────────────────────────────────────────────────

export async function runRiskRefresh({ triggeredBy = "admin" } = {}) {
  const t0 = Date.now();
  try {
    const { count, errors } = await refreshAllRiskScores();
    const duration = Date.now() - t0;
    await logRefresh({
      source: "risk_scores",
      triggeredBy,
      recordCount: count,
      durationMs: duration,
      error: errors.length ? JSON.stringify(errors.slice(0, 3)) : null,
    });
    return { ok: true, count, errors: errors.length, duration_ms: duration };
  } catch (e) {
    const duration = Date.now() - t0;
    await logRefresh({ source: "risk_scores", triggeredBy, recordCount: 0, durationMs: duration, error: e.message });
    return { ok: false, error: e.message, duration_ms: duration };
  }
}
