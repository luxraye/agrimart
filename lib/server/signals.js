// Supply/demand signal engine.
//
// Supply side  — live farmer planting intentions, normalised by the district
//                capacity ceiling.
// Demand side  — FAOSTAT national production (cached weekly) blended with the
//                baseline demand calibration for the district.
// Status rule  — supply > demand + 20 → nogo; demand > supply + 10 → go;
//                otherwise caution (addendum §1).

import { dbSelect } from "./db";
import { getCapacityHa } from "./capacity";
import { BASELINE_SUPPLY_SIGNALS } from "../data";

export const MIN_LIVE_SUBMISSIONS = 3;

function clamp(v, lo, hi) {
  return Math.round(Math.max(lo, Math.min(hi, v)));
}

export function statusFromIndices(supply, demand) {
  if (supply > demand + 20) return "nogo";
  if (demand > supply + 10) return "go";
  return "caution";
}

const STATUS_LABELS = {
  go: "Demand-led opportunity",
  caution: "Balanced — monitor",
  nogo: "Oversupply risk",
};

export async function aggregateIntentions({ district, crop, seasonYear }) {
  const filter = { season_year: seasonYear };
  if (district) filter.district = district;
  if (crop) filter.crop = crop;
  let rows = [];
  try {
    rows = await dbSelect("planting_intentions", filter);
  } catch {
    rows = [];
  }
  const totalHa = rows.reduce((a, r) => a + (Number(r.hectares) || 0), 0);
  const farmerKeys = new Set(
    rows.map((r) => (r.user_id ? `user:${r.user_id}` : `row:${r.id}`))
  );
  const marketCounts = {};
  for (const r of rows) {
    if (r.market_target) marketCounts[r.market_target] = (marketCounts[r.market_target] ?? 0) + 1;
  }
  const dominantMarket =
    Object.entries(marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    total_farmers: farmerKeys.size,
    total_ha: Math.round(totalHa * 100) / 100,
    dominant_market: dominantMarket,
    rows,
  };
}

async function demandIndexFor(crop, district) {
  const baseline = BASELINE_SUPPLY_SIGNALS[crop]?.[district]?.demand ?? 60;
  let cached = [];
  try {
    cached = await dbSelect("faostat_cache", {});
  } catch {
    cached = [];
  }
  if (!cached.length) return { demand: baseline, source: "baseline" };

  const byCrop = {};
  for (const row of cached) {
    if (!byCrop[row.crop] || row.year > byCrop[row.crop].year) byCrop[row.crop] = row;
  }
  const mine = byCrop[crop];
  if (!mine || !Number(mine.production_tonnes)) return { demand: baseline, source: "baseline" };

  // National production share → demand pressure proxy, blended 50/50 with the
  // district baseline so district-level texture survives the national figure.
  const max = Math.max(...Object.values(byCrop).map((r) => Number(r.production_tonnes) || 0));
  const share = max > 0 ? Number(mine.production_tonnes) / max : 0.5;
  const national = clamp(25 + share * 70, 5, 95);
  return {
    demand: clamp(national * 0.5 + baseline * 0.5, 5, 95),
    source: "faostat",
    faostatYear: mine.year,
  };
}

/**
 * The live signal for one district+crop. Falls back to the baseline table
 * (clearly flagged) when fewer than MIN_LIVE_SUBMISSIONS farmers have filed.
 */
export async function computeSupplySignal({ district, crop, seasonYear }) {
  const intentions = await aggregateIntentions({ district, crop, seasonYear });
  const baseline = BASELINE_SUPPLY_SIGNALS[crop]?.[district] ?? null;

  if (intentions.total_farmers < MIN_LIVE_SUBMISSIONS) {
    return {
      ...(baseline ?? { status: "caution", supply: 50, demand: 50, label: "No data", note: "" }),
      source: intentions.total_farmers > 0 ? "partial" : "baseline",
      total_farmers: intentions.total_farmers,
      total_ha: intentions.total_ha,
      season_year: seasonYear,
    };
  }

  const capacity = await getCapacityHa(district, crop);
  const supply = clamp((intentions.total_ha / capacity) * 100, 0, 100);
  const { demand, source: demandSource, faostatYear } = await demandIndexFor(crop, district);
  const status = statusFromIndices(supply, demand);

  return {
    status,
    supply,
    demand,
    label: STATUS_LABELS[status],
    note: `${intentions.total_farmers} farmers · ${intentions.total_ha} ha declared vs ${capacity} ha district ceiling`,
    source: "live",
    demand_source: demandSource,
    faostat_year: faostatYear ?? null,
    total_farmers: intentions.total_farmers,
    total_ha: intentions.total_ha,
    capacity_ha: capacity,
    season_year: seasonYear,
  };
}
