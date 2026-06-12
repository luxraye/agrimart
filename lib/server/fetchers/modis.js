// NASA MODIS NDVI via the ORNL MODIS Web Service (free). When unreachable,
// callers fall back to the Open-Meteo ET-based proxy from fetchHistory30dBatch.

import { fetchJson } from "../fetchJson";

const BASE = "https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset";

function modisDate(d) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  const doy = Math.floor((d - start) / 864e5);
  return `A${d.getUTCFullYear()}${String(doy).padStart(3, "0")}`;
}

/**
 * Latest NDVI for a 250m pixel at the given coordinates.
 * Returns { ndvi, pixelDate } or null when no usable data.
 */
export async function fetchModisNdvi(lat, lng) {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 864e5); // MOD13Q1 is a 16-day composite

  const headers = {};
  // Optional — MODIS_API_KEY (NASA EarthData token) raises rate limits
  if (process.env.MODIS_API_KEY) headers.Authorization = `Bearer ${process.env.MODIS_API_KEY}`;

  const url =
    `${BASE}?latitude=${lat}&longitude=${lng}` +
    `&startDate=${modisDate(start)}&endDate=${modisDate(end)}` +
    `&kmAboveBelow=0&kmLeftRight=0&band=250m_16_days_NDVI`;

  const json = await fetchJson(url, { headers });
  const subset = Array.isArray(json?.subset) ? json.subset : [];

  for (let i = subset.length - 1; i >= 0; i--) {
    const entry = subset[i];
    const raw = Array.isArray(entry?.data) ? entry.data[0] : entry?.data;
    const value = Number(raw);
    if (!Number.isNaN(value) && value > -2000) {
      // MOD13Q1 NDVI scale factor is 0.0001
      return {
        ndvi: Math.round(value * 0.0001 * 100) / 100,
        pixelDate: entry.calendar_date ?? null,
      };
    }
  }
  return null;
}
