// OSM Overpass fetchers — water points and road/traffic nodes for Botswana.
// Quality rule 6: queries carry [timeout:25] and we never hit Overpass more
// than once per 60 seconds per process.

import { fetchJson } from "../fetchJson";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BBOX = "(-27,19,-17,30)"; // covers Botswana

const rateState = globalThis.__agrimartOverpass ?? (globalThis.__agrimartOverpass = { last: 0 });
const MIN_INTERVAL_MS = 60_000;

async function runOverpass(query) {
  const since = Date.now() - rateState.last;
  if (since < MIN_INTERVAL_MS) {
    const err = new Error(`Overpass rate limit — retry in ${Math.ceil((MIN_INTERVAL_MS - since) / 1000)}s`);
    err.code = "RATE_LIMITED";
    throw err;
  }
  rateState.last = Date.now();
  return fetchJson(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    timeoutMs: 28_000, // Overpass query itself allows 25s
  });
}

const WATER_TYPE_LABELS = {
  spring: "Spring",
  water_well: "Water well",
  borehole: "Borehole",
  water_point: "Water point",
  reservoir: "Reservoir",
};

export async function fetchWaterPoints() {
  const query = `[out:json][timeout:25];
(
  node["natural"="spring"]${BBOX};
  node["man_made"="water_well"]${BBOX};
  node["man_made"="borehole"]${BBOX};
  node["amenity"="water_point"]${BBOX};
  node["water"="reservoir"]${BBOX};
);
out body 200;`;

  const json = await runOverpass(query);
  return (json.elements ?? [])
    .filter((el) => el.lat != null && el.lon != null)
    .map((el) => {
      const type =
        el.tags?.natural === "spring" ? "spring" :
        el.tags?.man_made === "water_well" ? "water_well" :
        el.tags?.man_made === "borehole" ? "borehole" :
        el.tags?.amenity === "water_point" ? "water_point" : "reservoir";
      return {
        osm_item: `osm-${el.id}`,
        name: el.tags?.name || WATER_TYPE_LABELS[type] || "Water source",
        latitude: el.lat,
        longitude: el.lon,
        type,
      };
    });
}

function speedForElement(el) {
  const max = parseInt(el.tags?.maxspeed, 10);
  if (!Number.isNaN(max)) return max;
  if (el.tags?.highway === "trunk") return 80;
  if (el.tags?.highway === "primary") return 60;
  if (el.tags?.highway === "traffic_signals") return 35;
  if (el.tags?.amenity === "fuel") return 50;
  return 55;
}

function nameForElement(el) {
  return (
    el.tags?.name ||
    el.tags?.ref ||
    (el.tags?.highway === "traffic_signals" ? "Signalised junction" :
     el.tags?.amenity === "fuel" ? "Fuel stop" :
     el.tags?.highway ? `${el.tags.highway} road` : "Road node")
  );
}

export async function fetchTrafficNodes() {
  const query = `[out:json][timeout:25];
(
  node["highway"="traffic_signals"]${BBOX};
  node["amenity"="fuel"]${BBOX};
  way["highway"~"^(trunk|primary)$"]${BBOX};
);
out center 50;`;

  const json = await runOverpass(query);
  return (json.elements ?? [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) return null;
      return {
        id: `osm-${el.type}-${el.id}`,
        name: nameForElement(el),
        lat,
        lng,
        // OSM gives no congestion data — default green; admin can override.
        status: "green",
        average_speed: speedForElement(el),
      };
    })
    .filter(Boolean)
    .slice(0, 50);
}
