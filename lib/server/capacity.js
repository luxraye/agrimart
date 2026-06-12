// District production capacity ceilings — normalise the supply index.
// Admin-editable via /admin/district-capacity; these defaults seed the table
// and act as the fallback when a row is missing.

import { dbSelect } from "./db";
import { DISTRICT_KEYS } from "../districtCoords";
import { CROP_KEYS } from "../data";

// Per-crop base ceiling (ha) × per-district scale ≈ estimated max cultivatable area
const CROP_BASE_HA = {
  tomato: 500, cabbage: 450, onion: 400, potato: 550,
  carrot: 300, sorghum: 1200, beans: 600, spinach: 250,
};

const DISTRICT_SCALE = {
  gaborone: 0.3, kweneng: 0.9, central: 1.6, kgalagadi: 0.4,
  ngamiland: 0.8, chobe: 0.5, northeast: 0.7, southern: 1.0,
};

export function defaultCapacityHa(district, crop) {
  const base = CROP_BASE_HA[crop] ?? 500;
  const scale = DISTRICT_SCALE[district] ?? 1;
  return Math.round(base * scale);
}

export function defaultCapacityRows() {
  const rows = [];
  for (const district of DISTRICT_KEYS) {
    for (const crop of CROP_KEYS) {
      rows.push({ district, crop, max_ha: defaultCapacityHa(district, crop) });
    }
  }
  return rows;
}

export async function getCapacityHa(district, crop) {
  try {
    const rows = await dbSelect("district_capacity", { district, crop }, { limit: 1 });
    if (rows.length && Number(rows[0].max_ha) > 0) return Number(rows[0].max_ha);
  } catch {
    // table may not exist yet — fall through to defaults
  }
  return defaultCapacityHa(district, crop);
}

export async function listCapacities() {
  let stored = [];
  try {
    stored = await dbSelect("district_capacity");
  } catch {
    stored = [];
  }
  const byKey = new Map(stored.map((r) => [`${r.district}|${r.crop}`, r]));
  return defaultCapacityRows().map((def) => {
    const hit = byKey.get(`${def.district}|${def.crop}`);
    return hit
      ? { ...def, max_ha: Number(hit.max_ha), updated_at: hit.updated_at ?? null, stored: true }
      : { ...def, updated_at: null, stored: false };
  });
}
