// Open-Meteo fetchers. All 8 districts are batched into a single request
// using the multi-location syntax (pipeline quality rule 7).

import { fetchJson } from "../fetchJson";
import { DISTRICT_COORDS, DISTRICT_KEYS } from "../../districtCoords";

const TZ = "Africa/Gaborone";

function coordParams(keys) {
  const lats = keys.map((k) => DISTRICT_COORDS[k].lat).join(",");
  const lngs = keys.map((k) => DISTRICT_COORDS[k].lng).join(",");
  return `latitude=${lats}&longitude=${lngs}`;
}

/** Open-Meteo returns a single object for one location, an array for many. */
function asArray(payload) {
  return Array.isArray(payload) ? payload : [payload];
}

function avg(arr) {
  const vals = (arr ?? []).filter((v) => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function latestNonNull(arr) {
  for (let i = (arr ?? []).length - 1; i >= 0; i--) {
    if (arr[i] != null) return arr[i];
  }
  return null;
}

/**
 * 14-day forecast + current soil moisture for the given districts.
 * Returns { [district]: { moisture, temp, climateAdjust, soilScore, et0Avg, raw } }
 */
export async function fetchForecastBatch(districts = DISTRICT_KEYS) {
  const url =
    `https://api.open-meteo.com/v1/forecast?${coordParams(districts)}` +
    `&daily=temperature_2m_max,precipitation_sum,et0_fao_evapotranspiration` +
    `&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm` +
    `&forecast_days=14&timezone=${TZ}`;

  const payload = asArray(await fetchJson(url));
  const out = {};

  districts.forEach((district, i) => {
    const loc = payload[i];
    if (!loc?.daily) return;

    const tmax = loc.daily.temperature_2m_max ?? [];
    const precip = loc.daily.precipitation_sum ?? [];
    const et0 = loc.daily.et0_fao_evapotranspiration ?? [];

    // Climate adjustment per addendum §2a — capped at ±30 around the base anchor
    let adjust = 0;
    const hotDays = tmax.filter((t) => t != null && t > 32).length;
    if (hotDays > 4) adjust += 30;
    const totalPrecip = precip.reduce((a, b) => a + (b ?? 0), 0);
    if (totalPrecip < 2) adjust += 25;
    const et0Avg = avg(et0);
    if (et0Avg != null && et0Avg > 8) adjust += 15;
    adjust = Math.min(30, Math.max(-30, adjust - 15)); // recentre: benign forecast lowers risk

    // Soil moisture (volumetric m³/m³) → risk score per addendum §2b thresholds
    const sm = latestNonNull(loc.hourly?.soil_moisture_0_to_1cm) ??
               latestNonNull(loc.hourly?.soil_moisture_1_to_3cm);
    let soilScore = null;
    if (sm != null) {
      if (sm > 0.35) soilScore = Math.round(10 + Math.max(0, 0.6 - sm) * 37.5);          // 10–25
      else if (sm >= 0.15) soilScore = Math.round(26 + ((0.35 - sm) / 0.2) * 29);         // 26–55
      else soilScore = Math.round(56 + ((0.15 - Math.max(0, sm)) / 0.15) * 34);           // 56–90
    }

    out[district] = {
      moisture: sm != null ? Math.round(sm * 100) : null, // % for display
      temp: latestNonNull(tmax) != null ? Math.round(tmax[0] * 10) / 10 : null,
      hotDays,
      totalPrecip14d: Math.round(totalPrecip * 10) / 10,
      et0Avg: et0Avg != null ? Math.round(et0Avg * 100) / 100 : null,
      climateAdjust: adjust,
      soilScore,
      raw: {
        daily: loc.daily,
        soil_moisture_latest: sm,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    };
  });

  return out;
}

/**
 * 30-day history (archive API) — used for the ET-based NDVI proxy.
 * Returns { [district]: { precip30d, et0_30d, proxyNdvi } }
 */
export async function fetchHistory30dBatch(districts = DISTRICT_KEYS) {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 864e5);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const url =
    `https://archive-api.open-meteo.com/v1/archive?${coordParams(districts)}` +
    `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
    `&daily=et0_fao_evapotranspiration,precipitation_sum&timezone=${TZ}`;

  const payload = asArray(await fetchJson(url));
  const out = {};

  districts.forEach((district, i) => {
    const loc = payload[i];
    if (!loc?.daily) return;
    const precip30d = (loc.daily.precipitation_sum ?? []).reduce((a, b) => a + (b ?? 0), 0);
    const et0_30d = (loc.daily.et0_fao_evapotranspiration ?? []).reduce((a, b) => a + (b ?? 0), 0);
    const proxyNdvi = et0_30d > 0 ? Math.min(0.9, precip30d / (et0_30d * 2)) : null;
    out[district] = {
      precip30d: Math.round(precip30d * 10) / 10,
      et0_30d: Math.round(et0_30d * 10) / 10,
      proxyNdvi: proxyNdvi != null ? Math.round(proxyNdvi * 100) / 100 : null,
    };
  });

  return out;
}
