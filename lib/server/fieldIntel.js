// Field intelligence — live Open-Meteo + MODIS/proxy NDVI + nearest traffic
// node, cached per district in field_intel_cache (TTL 6h, addendum §3).

import { dbSelect, dbUpsert } from "./db";
import { hoursSince, daysSince } from "./fetchJson";
import { fetchForecastBatch, fetchHistory30dBatch } from "./fetchers/openMeteo";
import { fetchModisNdvi } from "./fetchers/modis";
import { DISTRICT_COORDS, DISTRICT_KEYS } from "../districtCoords";

import staticTrafficNodes from "../../public/data/traffic_nodes.json";

export const FIELD_INTEL_TTL_HOURS = 6;
export const NDVI_TTL_DAYS = 7;

// ─── NDVI ────────────────────────────────────────────────────────────────────

export async function getNdvi(district, { allowFetch = true } = {}) {
  let cached = null;
  try {
    const rows = await dbSelect("ndvi_cache", { district }, { limit: 1 });
    cached = rows[0] ?? null;
  } catch {
    cached = null;
  }
  if (cached && daysSince(cached.fetched_at) <= NDVI_TTL_DAYS) {
    return { ndvi: Number(cached.ndvi_value), source: cached.pixel_date ? "modis" : "proxy", fetchedAt: cached.fetched_at };
  }
  if (!allowFetch) {
    return cached
      ? { ndvi: Number(cached.ndvi_value), source: "stale-cache", fetchedAt: cached.fetched_at }
      : null;
  }

  const { lat, lng } = DISTRICT_COORDS[district];
  // 1) real MODIS pixel
  try {
    const modis = await fetchModisNdvi(lat, lng);
    if (modis?.ndvi != null) {
      await dbUpsert("ndvi_cache", {
        district,
        ndvi_value: modis.ndvi,
        pixel_date: modis.pixelDate,
        fetched_at: new Date().toISOString(),
      }, ["district"]);
      return { ndvi: modis.ndvi, source: "modis", fetchedAt: new Date().toISOString() };
    }
  } catch {
    // MODIS unreachable — proxy below (addendum: log note)
    console.info(`[ndvi] MODIS unavailable for ${district}; using ET-based proxy`);
  }
  // 2) ET-based proxy from 30-day history
  try {
    const hist = await fetchHistory30dBatch([district]);
    const proxy = hist[district]?.proxyNdvi;
    if (proxy != null) {
      await dbUpsert("ndvi_cache", {
        district,
        ndvi_value: proxy,
        pixel_date: null,
        fetched_at: new Date().toISOString(),
      }, ["district"]);
      return { ndvi: proxy, source: "proxy", fetchedAt: new Date().toISOString() };
    }
  } catch {
    // both sources down
  }
  return cached
    ? { ndvi: Number(cached.ndvi_value), source: "stale-cache", fetchedAt: cached.fetched_at }
    : null;
}

// ─── Weather refresh ─────────────────────────────────────────────────────────

/** Fetch Open-Meteo for the given districts (one batched call) and cache. */
export async function refreshFieldIntel(districts = DISTRICT_KEYS) {
  const weather = await fetchForecastBatch(districts);
  const refreshed = [];
  const errors = [];

  for (const district of districts) {
    const w = weather[district];
    if (!w) {
      errors.push({ district, error: "no data returned" });
      continue;
    }
    let ndvi = null;
    try {
      ndvi = await getNdvi(district);
    } catch {
      ndvi = null;
    }
    try {
      await dbUpsert("field_intel_cache", {
        district,
        moisture: w.moisture,
        temp: w.temp,
        ndvi: ndvi?.ndvi ?? null,
        raw_response: {
          ...w.raw,
          hotDays: w.hotDays,
          totalPrecip14d: w.totalPrecip14d,
          et0Avg: w.et0Avg,
          climateAdjust: w.climateAdjust,
          soilScore: w.soilScore,
          ndviSource: ndvi?.source ?? null,
        },
        fetched_at: new Date().toISOString(),
      }, ["district"]);
      refreshed.push(district);
    } catch (e) {
      errors.push({ district, error: e.message });
    }
  }
  return { refreshed, errors };
}

// ─── Traffic helper ──────────────────────────────────────────────────────────

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const TRAFFIC_MSG = {
  green: "Route clear",
  yellow: "Moderate delay",
  red: "Severe bottleneck — plan ahead",
};

export async function nearestTrafficNode(district) {
  const { lat, lng } = DISTRICT_COORDS[district];
  let nodes = null;
  let source = "live";
  try {
    const rows = await dbSelect("osm_cache", { key: "traffic_nodes_bw" }, { limit: 1 });
    if (rows[0]?.data?.length) {
      nodes = rows[0].data;
      if (daysSince(rows[0].fetched_at) > 7) source = "cached";
    }
  } catch {
    nodes = null;
  }
  if (!nodes?.length) {
    // FALLBACK: replace when OSM Overpass cache available
    nodes = staticTrafficNodes;
    source = "fallback";
  }
  let best = null;
  let bestDist = Infinity;
  for (const n of nodes) {
    const d = haversineKm(lat, lng, n.lat, n.lng);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  if (!best) return null;
  const status = best.status ?? "green";
  return {
    name: best.name,
    speed: best.average_speed ?? null,
    status,
    msg: TRAFFIC_MSG[status] ?? TRAFFIC_MSG.green,
    distance_km: Math.round(bestDist),
    source,
  };
}

// ─── Public read path ────────────────────────────────────────────────────────

/**
 * Cached field intel for one district. Refreshes inline when the cache is
 * missing; when merely stale it returns the last value flagged stale (the
 * caller may trigger a background refresh).
 */
export async function getFieldIntel(district) {
  let row = null;
  try {
    const rows = await dbSelect("field_intel_cache", { district }, { limit: 1 });
    row = rows[0] ?? null;
  } catch {
    row = null;
  }

  if (!row) {
    try {
      await refreshFieldIntel([district]);
      const rows = await dbSelect("field_intel_cache", { district }, { limit: 1 });
      row = rows[0] ?? null;
    } catch {
      row = null;
    }
  }

  const traffic = await nearestTrafficNode(district);

  if (!row) {
    // FALLBACK: replace when Open-Meteo available — must carry staleness warning
    return {
      district,
      moisture: null,
      temp: null,
      ndvi: null,
      traffic,
      source: "fallback",
      stale: true,
      fetchedAt: null,
    };
  }

  const stale = hoursSince(row.fetched_at) > FIELD_INTEL_TTL_HOURS;
  return {
    district,
    moisture: row.moisture != null ? Number(row.moisture) : null,
    temp: row.temp != null ? Number(row.temp) : null,
    ndvi: row.ndvi != null ? Number(row.ndvi) : null,
    climateAdjust: row.raw_response?.climateAdjust ?? 0,
    soilScore: row.raw_response?.soilScore ?? null,
    ndviSource: row.raw_response?.ndviSource ?? null,
    hotDays: row.raw_response?.hotDays ?? null,
    totalPrecip14d: row.raw_response?.totalPrecip14d ?? null,
    et0Avg: row.raw_response?.et0Avg ?? null,
    traffic,
    source: stale ? "cached" : "live",
    stale,
    fetchedAt: row.fetched_at,
  };
}
