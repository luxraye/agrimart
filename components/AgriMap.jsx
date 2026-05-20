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

const CLIMATE_STATIONS = [
  { id: "cs-1", name: "South",      lat: -25.0, lng: 25.5  },
  { id: "cs-2", name: "Central",    lat: -22.5, lng: 26.0  },
  { id: "cs-3", name: "North",      lat: -20.0, lng: 24.0  },
  { id: "cs-4", name: "North-east", lat: -21.0, lng: 27.8  },
  { id: "cs-5", name: "North-west", lat: -19.5, lng: 22.5  },
  { id: "cs-6", name: "Kalahari",   lat: -24.0, lng: 22.0  },
  { id: "cs-7", name: "South-east", lat: -23.0, lng: 28.0  },
  { id: "cs-8", name: "South-west", lat: -26.0, lng: 24.0  },
];

function trafficStyle(status) {
  const s = String(status || "green").toLowerCase();
  if (s === "red")    return { color: "#b91c1c", fill: "#ef4444", r: 12 };
  if (s === "yellow") return { color: "#92400e", fill: "#facc15", r: 9  };
  return                     { color: "#14532d", fill: "#22c55e", r: 7  };
}

function RecenterButton({ center, zoom }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, zoom)}
      style={{
        position: "absolute", bottom: 90, right: 10, zIndex: 1000,
        background: "white", border: "0.5px solid #e5e7eb",
        borderRadius: 8, padding: "6px 10px", fontSize: 12,
        color: "#374151", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      Reset view
    </button>
  );
}

const LAYER_KEYS = ["transit", "hydrology", "demand", "climate"];

export default function AgriMap() {
  const [traffic, setTraffic] = useState([]);
  const [water,   setWater]   = useState([]);
  const [layers,  setLayers]  = useState({ transit: true, hydrology: true, demand: true, climate: false });

  useEffect(() => {
    fetch("/data/traffic_nodes.json").then(r => r.json()).then(setTraffic).catch(() => {});
    fetch("/data/water_points.json").then(r => r.json()).then(setWater).catch(() => {});
  }, []);

  function toggleLayer(key) {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="relative w-full h-full">
      {/* Layer toggles */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 1000,
        background: "white", borderRadius: 12,
        border: "0.5px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        padding: "10px 12px",
        display: "flex", flexDirection: "column", gap: 7,
        minWidth: 140,
      }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
          Map layers
        </p>
        {[
          { key: "transit",   label: "Road traffic",  dot: "#ef4444" },
          { key: "hydrology", label: "Water sources", dot: "#3b82f6" },
          { key: "demand",    label: "Market zones",  dot: "#22c55e" },
          { key: "climate",   label: "Weather pins",  dot: "#a78bfa" },
        ].map(({ key, label, dot }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#374151" }}>
            <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)}
              style={{ accentColor: "#2d6a4f", width: 14, height: 14 }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            {label}
          </label>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 30, left: 10, zIndex: 1000,
        background: "white", borderRadius: 12,
        border: "0.5px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        padding: "10px 12px", fontSize: 11, color: "#4b5563",
      }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Road traffic
        </p>
        {[
          { color: "#ef4444", label: "Severe bottleneck" },
          { color: "#facc15", label: "Moderate delay" },
          { color: "#22c55e", label: "Route clear" },
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
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Traffic nodes */}
        {layers.transit && (
          <LayerGroup>
            {traffic.map(node => {
              const { color, fill, r } = trafficStyle(node.status);
              return (
                <CircleMarker key={node.id}
                  center={[node.lat, node.lng]}
                  radius={r}
                  pathOptions={{ color, fillColor: fill, fillOpacity: 0.9, weight: 2 }}
                >
                  <Popup>
                    <strong style={{ fontSize: 13 }}>{node.name}</strong><br />
                    <span style={{ color: "#6b7280", fontSize: 12 }}>Speed: {node.average_speed} km/h</span><br />
                    <span style={{ color: "#6b7280", fontSize: 12 }}>Horticulture volume: {node.total_volume_horticulture}</span>
                  </Popup>
                </CircleMarker>
              );
            })}
          </LayerGroup>
        )}

        {/* Water points */}
        {layers.hydrology && (
          <LayerGroup>
            {water.map(pt => (
              <CircleMarker key={pt.osm_item}
                center={[pt.latitude, pt.longitude]}
                radius={6}
                pathOptions={{ color: "#1e40af", fillColor: "#60a5fa", fillOpacity: 0.85, weight: 1.5 }}
              >
                <Popup>
                  <strong style={{ fontSize: 13 }}>{pt.name}</strong><br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>Water source</span>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {/* Market demand zones */}
        {layers.demand && (
          <LayerGroup>
            {MARKET_ZONES.map(z => (
              <Circle key={z.id}
                center={[z.lat, z.lng]}
                radius={z.r}
                pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.08, weight: 1.5, dashArray: "5 5" }}
              >
                <Popup>
                  <strong style={{ fontSize: 13 }}>{z.name}</strong><br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>Market demand zone</span>
                </Popup>
              </Circle>
            ))}
          </LayerGroup>
        )}

        {/* Climate stations */}
        {layers.climate && (
          <LayerGroup>
            {CLIMATE_STATIONS.map(cs => (
              <CircleMarker key={cs.id}
                center={[cs.lat, cs.lng]}
                radius={7}
                pathOptions={{ color: "#6d28d9", fillColor: "#a78bfa", fillOpacity: 0.8, weight: 1.5 }}
              >
                <Popup>
                  <strong style={{ fontSize: 13 }}>{cs.name} weather point</strong><br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>Climate monitoring station</span>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        <RecenterButton center={BOTSWANA_CENTER} zoom={DEFAULT_ZOOM} />
      </MapContainer>
    </div>
  );
}
