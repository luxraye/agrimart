"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import {
  MapContainer, TileLayer, CircleMarker, Circle,
  Popup, LayerGroup, useMap,
} from "react-leaflet";

const BOTSWANA_CENTER = [-22.3285, 24.6849];
const DEFAULT_ZOOM    = 6;

// Market demand zones — strategy overlay (static by design)
const MARKET_ZONES = [
  { id: "gz-gab",    name: "Greater Gaborone",        lat: -24.6282, lng: 25.9231, r: 38000 },
  { id: "gz-kweneng",name: "Kweneng–South Central",   lat: -24.35,   lng: 25.75,   r: 32000 },
  { id: "gz-fr",     name: "Francistown–NE",          lat: -21.17,   lng: 27.51,   r: 34000 },
  { id: "gz-se",     name: "Selibe Phikwe–Palapye",   lat: -22.52,   lng: 27.2,    r: 28000 },
  { id: "gz-maun",   name: "Maun–Okavango",           lat: -19.98,   lng: 23.42,   r: 30000 },
  { id: "gz-kasane", name: "Kasane–Chobe",            lat: -17.8,    lng: 25.15,   r: 22000 },
  { id: "gz-ghanzi", name: "Ghanzi–Trans-Kalahari",   lat: -21.7,    lng: 21.65,   r: 26000 },
  { id: "gz-tsabong",name: "Tsabong–Southwest",       lat: -26.07,   lng: 22.45,   r: 24000 },
  { id: "gz-central",name: "Central corridor",        lat: -22.0,    lng: 26.5,    r: 35000 },
  { id: "gz-south",  name: "Southern A2 belt",        lat: -25.1,    lng: 25.85,   r: 30000 },
];

function trafficStyle(status) {
  const s = String(status || "green").toLowerCase();
  if (s === "red")    return { color: "#8b3021", fill: "#c1442e", r: 12 };
  if (s === "yellow") return { color: "#a87124", fill: "#dfae4f", r: 9  };
  return                     { color: "#113524", fill: "#35885c", r: 6  };
}

function RecenterButton({ center, zoom }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, zoom)}
      style={{
        position: "absolute", bottom: 90, right: 10, zIndex: 1000,
        background: "white", border: "1px solid rgba(22,36,28,0.08)",
        borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 500,
        color: "#374151", cursor: "pointer", boxShadow: "0 4px 16px rgba(22,36,28,0.12)",
      }}
    >
      Reset view
    </button>
  );
}

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-BW", { day: "numeric", month: "short" });
}

const panelStyle = {
  position: "absolute", zIndex: 1000,
  background: "rgba(255,255,255,0.96)", borderRadius: 14,
  border: "1px solid rgba(22,36,28,0.07)",
  boxShadow: "0 8px 28px rgba(22,36,28,0.12)",
  padding: "12px 14px",
};

export default function AgriMap() {
  const [traffic, setTraffic] = useState({ data: [], fetched_at: null, source: null });
  const [water,   setWater]   = useState({ data: [], fetched_at: null, source: null });
  const [layers,  setLayers]  = useState({ transit: true, hydrology: true, demand: true });

  useEffect(() => {
    // Live OSM layers via the cache API (falls back to bundled static data)
    fetch("/api/fetch/osm?layer=traffic_nodes")
      .then((r) => r.json())
      .then((j) => j.ok && setTraffic({ data: j.data ?? [], fetched_at: j.fetched_at, source: j.source }))
      .catch(() => {});
    fetch("/api/fetch/osm?layer=water_points")
      .then((r) => r.json())
      .then((j) => j.ok && setWater({ data: j.data ?? [], fetched_at: j.fetched_at, source: j.source }))
      .catch(() => {});
  }, []);

  function toggleLayer(key) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const osmDate = fmtDate(traffic.fetched_at ?? water.fetched_at);

  return (
    <div className="relative w-full h-full">
      {/* Layer toggles */}
      <div style={{ ...panelStyle, top: 10, left: 10, display: "flex", flexDirection: "column", gap: 7, minWidth: 158 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
          Map layers
        </p>
        {[
          { key: "transit",   label: "Road network",  dot: "#c1442e" },
          { key: "hydrology", label: "Water sources", dot: "#3b82f6" },
          { key: "demand",    label: "Market zones",  dot: "#35885c" },
        ].map(({ key, label, dot }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "#374151" }}>
            <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)}
              style={{ accentColor: "#1d5639", width: 14, height: 14 }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            {label}
          </label>
        ))}
        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, borderTop: "1px solid #f0efe9", paddingTop: 6 }}>
          Map data: OSM{osmDate ? ` · Updated ${osmDate}` : traffic.source === "fallback" ? " · baseline snapshot" : ""}
        </p>
      </div>

      {/* Legend */}
      <div style={{ ...panelStyle, bottom: 30, left: 10, fontSize: 11, color: "#4b5563" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Road status
        </p>
        {[
          { color: "#c1442e", label: "Severe bottleneck" },
          { color: "#dfae4f", label: "Moderate delay" },
          { color: "#35885c", label: "Route clear" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      <MapContainer
        center={BOTSWANA_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {layers.transit && (
          <LayerGroup>
            {traffic.data.map((node) => {
              const { color, fill, r } = trafficStyle(node.status);
              return (
                <CircleMarker key={node.id}
                  center={[node.lat, node.lng]}
                  radius={r}
                  pathOptions={{ color, fillColor: fill, fillOpacity: 0.9, weight: 2 }}
                >
                  <Popup>
                    <strong style={{ fontSize: 13 }}>{node.name}</strong><br />
                    {node.average_speed != null && (
                      <><span style={{ color: "#6b7280", fontSize: 12 }}>Speed: {node.average_speed} km/h</span><br /></>
                    )}
                    <span style={{ color: "#6b7280", fontSize: 12 }}>
                      {traffic.source === "fallback" ? "Baseline road node" : "Live OSM road node"}
                    </span>
                  </Popup>
                </CircleMarker>
              );
            })}
          </LayerGroup>
        )}

        {layers.hydrology && (
          <LayerGroup>
            {water.data.map((pt) => (
              <CircleMarker key={pt.osm_item}
                center={[pt.latitude, pt.longitude]}
                radius={6}
                pathOptions={{ color: "#1e40af", fillColor: "#60a5fa", fillOpacity: 0.85, weight: 1.5 }}
              >
                <Popup>
                  <strong style={{ fontSize: 13 }}>{pt.name}</strong><br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    {pt.type ? pt.type.replace(/_/g, " ") : "Water source"}
                    {water.source === "fallback" ? " (baseline)" : ""}
                  </span>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {layers.demand && (
          <LayerGroup>
            {MARKET_ZONES.map((z) => (
              <Circle key={z.id}
                center={[z.lat, z.lng]}
                radius={z.r}
                pathOptions={{ color: "#1d5639", fillColor: "#35885c", fillOpacity: 0.08, weight: 1.5, dashArray: "5 5" }}
              >
                <Popup>
                  <strong style={{ fontSize: 13 }}>{z.name}</strong><br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>Market demand zone</span>
                </Popup>
              </Circle>
            ))}
          </LayerGroup>
        )}

        <RecenterButton center={BOTSWANA_CENTER} zoom={DEFAULT_ZOOM} />
      </MapContainer>
    </div>
  );
}
