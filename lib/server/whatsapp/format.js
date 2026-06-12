// Plain-text formatters for WhatsApp replies. No business logic here — these
// only render values produced by signals.js / riskEngine.js / fieldIntel.js.

const SUPPLY_STATUS = { go: "GO", caution: "CAUTION", nogo: "NO-GO" };

export function formatSupply(signal, { districtLabel, cropLabel }) {
  const status = SUPPLY_STATUS[signal.status] ?? signal.status?.toUpperCase() ?? "—";
  const farmers = signal.total_farmers ?? 0;
  let source;
  if (signal.source === "live") source = `live (${farmers} farmers declared)`;
  else if (signal.source === "partial") source = `baseline (${farmers} declared, need 3 for live)`;
  else source = `baseline (${farmers} farmers declared)`;

  return [
    `SUPPLY · ${cropLabel} · ${districtLabel}`,
    `Signal: ${status} — ${signal.label ?? ""}`.trimEnd(),
    `Supply ${signal.supply} | Demand ${signal.demand}`,
    `Source: ${source}`,
  ].join("\n");
}

export function formatRisk(risk, intel, { districtLabel, cropLabel }) {
  const dims = [
    { label: "Climate", score: risk.climate_score },
    { label: "Soil", score: risk.soil_score },
    { label: "Logistics", score: risk.logistics_score },
    { label: "Pest", score: risk.pest_score },
    { label: "Market", score: risk.market_score },
  ];
  const watchpoints = [...dims]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((d) => `${d.label} ${d.score}`)
    .join(", ");

  const field =
    intel?.moisture != null && intel?.temp != null
      ? `moisture ${intel.moisture}% · ${intel.temp}°C`
      : "unavailable";

  return [
    `RISK · ${cropLabel} · ${districtLabel}`,
    `Top watchpoints: ${watchpoints}`,
    `Climate ${risk.climate_score} · Soil ${risk.soil_score} · Logistics ${risk.logistics_score}`,
    `Pest ${risk.pest_score} · Market ${risk.market_score}`,
    `Field: ${field}`,
  ].join("\n");
}
