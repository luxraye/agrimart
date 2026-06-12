// FAO FAOSTAT production fetcher — demand-side anchor for the supply index.
// Free, no key. Element 5510 = production quantity (tonnes).

import { fetchJson } from "../fetchJson";
import { FAO_CROP_CODES, FAO_AREA_BOTSWANA } from "../../data";

// Legacy public host (per addendum). FAO has been migrating to
// faostatservices.fao.org which requires an account token — when
// FAOSTAT_API_TOKEN is configured we fall back to it automatically.
const LEGACY_BASE = "https://fenixservices.fao.org/faostat/api/v1/en/data/QCL";
const AUTH_BASE = "https://faostatservices.fao.org/api/v1/en/data/QCL";

async function fetchFromFao(items, years) {
  const legacyUrl =
    `${LEGACY_BASE}?area=${FAO_AREA_BOTSWANA}&item=${items}&year=${years}` +
    `&element=5510&outputType=json`;
  try {
    return { json: await fetchJson(legacyUrl, { timeoutMs: 10_000 }), url: legacyUrl };
  } catch (legacyError) {
    if (!process.env.FAOSTAT_API_TOKEN) throw legacyError;
    const authUrl =
      `${AUTH_BASE}?area=${FAO_AREA_BOTSWANA}&item=${items}&year=${years}` +
      `&element=2510&output_type=objects`;
    const json = await fetchJson(authUrl, {
      timeoutMs: 10_000,
      headers: { Authorization: `Bearer ${process.env.FAOSTAT_API_TOKEN}` },
    });
    return { json, url: authUrl };
  }
}

/**
 * Fetches the most recent production figures for all 8 crops in one request.
 * Returns [{ crop, year, production_tonnes, source_url }]
 */
export async function fetchFaostatProduction() {
  const items = Object.values(FAO_CROP_CODES).join(",");
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => thisYear - 1 - i).join(",");

  const { json, url } = await fetchFromFao(items, years);
  // FAOSTAT nests results in a `data` array (quality rule 8)
  const rows = Array.isArray(json?.data) ? json.data : [];

  const codeToCrop = Object.fromEntries(
    Object.entries(FAO_CROP_CODES).map(([crop, code]) => [String(code), crop])
  );

  const latest = {};
  for (const row of rows) {
    const crop = codeToCrop[String(row["Item Code"] ?? row.itemCode ?? row.item_code)];
    if (!crop) continue;
    const year = Number(row.Year ?? row.year);
    const value = Number(row.Value ?? row.value);
    if (!year || Number.isNaN(value)) continue;
    if (!latest[crop] || year > latest[crop].year) {
      latest[crop] = { crop, year, production_tonnes: value, source_url: url };
    }
  }
  return Object.values(latest);
}
