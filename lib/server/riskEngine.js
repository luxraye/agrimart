// Five-dimension risk engine (addendum §2).
//   climate   — base anchor ± Open-Meteo forecast adjustment (±30)
//   soil      — live soil moisture thresholds
//   logistics — nearest live traffic node status
//   pest      — STATIC_PENDING_FAMEWS_API (calibrated static)
//   market    — base anchor + market-price drop bumps (market_prices table)

import { dbSelect, dbUpsert } from "./db";
import { hoursSince } from "./fetchJson";
import { getFieldIntel } from "./fieldIntel";
import { BASELINE_CROP_RISK, DISTRICT_RISK_MULT, CROP_KEYS } from "../data";
import { DISTRICT_KEYS } from "../districtCoords";

export const RISK_TTL_HOURS = 24;

function clamp(v, lo = 10, hi = 95) {
  return Math.round(Math.max(lo, Math.min(hi, v)));
}

const LOGISTICS_DELTA = { red: 22, yellow: 10, green: -5 };

export async function computeRiskScores(district, crop, { fieldIntel } = {}) {
  const base = BASELINE_CROP_RISK[crop] ?? BASELINE_CROP_RISK.tomato;
  const mult = DISTRICT_RISK_MULT[district] ?? 1;
  const intel = fieldIntel ?? (await getFieldIntel(district));

  // preserve any market bump applied by the market-price signal
  let existingBump = 0;
  try {
    const rows = await dbSelect("risk_scores", { district, crop }, { limit: 1 });
    existingBump = Number(rows[0]?.market_bump) || 0;
  } catch {
    existingBump = 0;
  }

  const climate = clamp(base.climate * mult + (intel?.climateAdjust ?? 0));
  const soil =
    intel?.soilScore != null
      ? clamp(intel.soilScore * (0.85 + 0.15 * mult))
      : clamp(base.soil * mult); // FALLBACK: replace when Open-Meteo soil moisture available
  const logistics = clamp(
    base.logistics * mult + (LOGISTICS_DELTA[intel?.traffic?.status] ?? 0)
  );
  const pest = clamp(base.pest * mult); // STATIC_PENDING_FAMEWS_API
  const market = clamp(base.market * mult + existingBump);

  return {
    district,
    crop,
    soil_score: soil,
    climate_score: climate,
    logistics_score: logistics,
    pest_score: pest,
    market_score: market,
    market_bump: existingBump,
    meta: {
      live: intel?.source === "live",
      intel_source: intel?.source ?? "fallback",
      intel_fetched_at: intel?.fetchedAt ?? null,
      climate_adjust: intel?.climateAdjust ?? 0,
      traffic_status: intel?.traffic?.status ?? null,
      ndvi: intel?.ndvi ?? null,
    },
    computed_at: new Date().toISOString(),
  };
}

export async function getRiskScores(district, crop, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    try {
      const rows = await dbSelect("risk_scores", { district, crop }, { limit: 1 });
      const row = rows[0];
      if (row && hoursSince(row.computed_at) <= RISK_TTL_HOURS) {
        return { ...row, stale: false };
      }
    } catch {
      // fall through to recompute
    }
  }
  const computed = await computeRiskScores(district, crop);
  try {
    await dbUpsert("risk_scores", computed, ["district", "crop"]);
  } catch {
    // cache write failed — still return the computed value
  }
  return { ...computed, stale: false };
}

/** Recompute all 64 district×crop pairs — daily cron. */
export async function refreshAllRiskScores() {
  let count = 0;
  const errors = [];
  for (const district of DISTRICT_KEYS) {
    let intel = null;
    try {
      intel = await getFieldIntel(district);
    } catch {
      intel = null;
    }
    for (const crop of CROP_KEYS) {
      try {
        const computed = await computeRiskScores(district, crop, { fieldIntel: intel });
        await dbUpsert("risk_scores", computed, ["district", "crop"]);
        count++;
      } catch (e) {
        errors.push({ district, crop, error: e.message });
      }
    }
  }
  return { count, errors };
}

/**
 * Market-price drop signal (addendum §2e): a new price >20% below the 30-day
 * rolling average raises the market score +15 (capped 95). In Supabase mode
 * the Postgres trigger applies this; this JS path covers memory mode.
 */
export async function applyMarketPriceSignal({ district, crop, price }) {
  let rows = [];
  try {
    rows = await dbSelect("market_prices", { district, crop });
  } catch {
    return { applied: false };
  }
  const cutoff = Date.now() - 30 * 864e5;
  const window = rows.filter(
    (r) => new Date(r.recorded_at ?? r.created_at ?? 0).getTime() >= cutoff &&
           Number(r.price_bwp_kg) > 0
  );
  if (window.length < 2) return { applied: false, reason: "insufficient history" };

  const avg = window.reduce((a, r) => a + Number(r.price_bwp_kg), 0) / window.length;
  if (Number(price) >= avg * 0.8) return { applied: false, reason: "within 20% of rolling average" };

  let existing = null;
  try {
    const found = await dbSelect("risk_scores", { district, crop }, { limit: 1 });
    existing = found[0] ?? null;
  } catch {
    existing = null;
  }
  const bump = (Number(existing?.market_bump) || 0) + 15;
  const market = Math.min(95, (Number(existing?.market_score) || 50) + 15);
  await dbUpsert("risk_scores", {
    ...(existing ?? (await computeRiskScores(district, crop))),
    district,
    crop,
    market_score: market,
    market_bump: bump,
    computed_at: new Date().toISOString(),
  }, ["district", "crop"]);
  return { applied: true, market_score: market };
}
