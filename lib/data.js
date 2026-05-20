// ─── Districts ───────────────────────────────────────────────────────────────

export const DISTRICTS = [
  { value: "gaborone",   label: "Gaborone / South East" },
  { value: "kweneng",    label: "Kweneng" },
  { value: "central",    label: "Central" },
  { value: "kgalagadi",  label: "Kgalagadi" },
  { value: "ngamiland",  label: "Ngamiland / North West" },
  { value: "chobe",      label: "Chobe" },
  { value: "northeast",  label: "North East" },
  { value: "southern",   label: "Southern" },
];

// ─── Crops ───────────────────────────────────────────────────────────────────

export const CROPS = [
  { value: "tomato",   label: "Tomato",   heroNote: "Priority crop — high demand, oversupply risk" },
  { value: "cabbage",  label: "Cabbage",  heroNote: "Strong domestic market, seasonal cycles" },
  { value: "onion",    label: "Onion",    heroNote: "Import substitution opportunity" },
  { value: "potato",   label: "Potato",   heroNote: "Consistent demand, input-heavy" },
  { value: "carrot",   label: "Carrot",   heroNote: "Lower competition, niche volumes" },
  { value: "sorghum",  label: "Sorghum",  heroNote: "Drought-resilient, policy-supported" },
  { value: "beans",    label: "Beans",    heroNote: "Protein crop, subsistence + market" },
  { value: "spinach",  label: "Spinach",  heroNote: "Fast turnaround, urban demand" },
];

export const PLANTING_MONTHS = [
  { value: "mar", label: "March" },
  { value: "apr", label: "April" },
  { value: "may", label: "May" },
  { value: "jun", label: "June" },
  { value: "jul", label: "July" },
  { value: "aug", label: "August" },
  { value: "sep", label: "September" },
  { value: "oct", label: "October" },
];

// ─── Supply / Demand signals ─────────────────────────────────────────────────
// status: "go" | "caution" | "nogo"
// supply / demand: 0–100 index (100 = maximum saturation / maximum demand)

export const SUPPLY_SIGNALS = {
  tomato: {
    gaborone:  { status: "nogo",    supply: 92, demand: 38, label: "Oversupplied",      note: "Urban glut — high grower concentration" },
    kweneng:   { status: "caution", supply: 62, demand: 68, label: "Balanced",           note: "Seasonal equilibrium; monitor closely" },
    central:   { status: "go",      supply: 28, demand: 82, label: "High demand",        note: "Supply gap vs district population" },
    kgalagadi: { status: "caution", supply: 55, demand: 60, label: "Moderate",           note: "Low volume market — size limit" },
    ngamiland: { status: "go",      supply: 22, demand: 78, label: "Strong gap",         note: "Underserved; logistics are the constraint" },
    chobe:     { status: "go",      supply: 18, demand: 80, label: "Clear opportunity",  note: "Tourism demand; premium price possible" },
    northeast: { status: "caution", supply: 50, demand: 62, label: "Moderate",           note: "Cross-border competition from ZW" },
    southern:  { status: "caution", supply: 58, demand: 65, label: "Near balance",       note: "Monitor RSA import volumes" },
  },
  cabbage: {
    gaborone:  { status: "caution", supply: 70, demand: 65, label: "Slight glut",        note: "Overcrowded with peri-urban growers" },
    kweneng:   { status: "go",      supply: 35, demand: 80, label: "High demand",        note: "Growing urban demand in Molepolole area" },
    central:   { status: "go",      supply: 30, demand: 75, label: "Demand-led",         note: "Franchiso and Palapye growth corridors" },
    kgalagadi: { status: "nogo",    supply: 85, demand: 30, label: "Avoid — saturated",  note: "Small population; already oversupplied" },
    ngamiland: { status: "caution", supply: 50, demand: 58, label: "Moderate",           note: "Cold chain is missing; spoilage risk" },
    chobe:     { status: "go",      supply: 25, demand: 72, label: "Good window",        note: "Hotel / lodge procurement channel" },
    northeast: { status: "go",      supply: 28, demand: 74, label: "Growing demand",     note: "Urban Francistown spillover" },
    southern:  { status: "caution", supply: 60, demand: 64, label: "Near balance",       note: "Phasing planting to avoid glut peak" },
  },
  onion: {
    gaborone:  { status: "go",      supply: 20, demand: 88, label: "Strong — import gap", note: "Import substitution policy tailwind" },
    kweneng:   { status: "go",      supply: 22, demand: 84, label: "High demand",          note: "Low local production vs consumption" },
    central:   { status: "caution", supply: 58, demand: 64, label: "Competitive",          note: "Growing number of entrants this season" },
    kgalagadi: { status: "caution", supply: 48, demand: 55, label: "Low volume",           note: "Limited buyer infrastructure" },
    ngamiland: { status: "go",      supply: 18, demand: 76, label: "Underserved",          note: "Long supply chain from south creates gap" },
    chobe:     { status: "caution", supply: 52, demand: 60, label: "Moderate",             note: "Volatile cross-border pricing" },
    northeast: { status: "go",      supply: 24, demand: 78, label: "Good gap",             note: "Proximity to Zimbabwe reduces import pressure" },
    southern:  { status: "go",      supply: 26, demand: 80, label: "Strong demand",        note: "Near Lobatse processing facilities" },
  },
  potato: {
    gaborone:  { status: "caution", supply: 65, demand: 72, label: "Seasonal",       note: "RSA imports create volatile floor price" },
    kweneng:   { status: "go",      supply: 32, demand: 78, label: "Good window",    note: "Cooling season ideal for potatoes" },
    central:   { status: "go",      supply: 28, demand: 75, label: "Demand-led",     note: "Major population centre, high volume" },
    kgalagadi: { status: "nogo",    supply: 80, demand: 35, label: "Avoid",          note: "Very low population-to-supply ratio" },
    ngamiland: { status: "caution", supply: 55, demand: 62, label: "Balanced",       note: "Seasonal road conditions affect delivery" },
    chobe:     { status: "caution", supply: 50, demand: 58, label: "Moderate",       note: "Consistent but small market" },
    northeast: { status: "go",      supply: 30, demand: 76, label: "High demand",    note: "Francistown wholesale absorbs volume" },
    southern:  { status: "caution", supply: 62, demand: 70, label: "Near balance",   note: "SA import corridor creates price floor" },
  },
  carrot: {
    gaborone:  { status: "go",      supply: 22, demand: 80, label: "Good gap",         note: "Supermarket channel is underserved" },
    kweneng:   { status: "caution", supply: 60, demand: 65, label: "Near balance",     note: "Limited premium channel in area" },
    central:   { status: "go",      supply: 25, demand: 78, label: "Strong demand",    note: "Institutional buyers (schools, hospitals)" },
    kgalagadi: { status: "caution", supply: 52, demand: 56, label: "Limited market",   note: "Small addressable volume" },
    ngamiland: { status: "caution", supply: 48, demand: 55, label: "Moderate",         note: "Long haul reduces margin" },
    chobe:     { status: "go",      supply: 20, demand: 74, label: "Opportunity",      note: "Lodge / hospitality buyers active" },
    northeast: { status: "go",      supply: 22, demand: 72, label: "Growing demand",   note: "Francistown informal market expanding" },
    southern:  { status: "go",      supply: 24, demand: 76, label: "Strong demand",    note: "Near Lobatse / Ramotswa buyers" },
  },
  sorghum: {
    gaborone:  { status: "caution", supply: 60, demand: 62, label: "Stable",              note: "Processing plant demand relatively steady" },
    kweneng:   { status: "go",      supply: 30, demand: 70, label: "Traditional demand",  note: "Cultural and food-security significance" },
    central:   { status: "go",      supply: 28, demand: 72, label: "Policy-supported",    note: "MoA support programmes active" },
    kgalagadi: { status: "go",      supply: 20, demand: 68, label: "Drought-resilient fit", note: "Well-suited to semi-arid conditions" },
    ngamiland: { status: "caution", supply: 55, demand: 60, label: "Moderate",            note: "Limited processing infrastructure" },
    chobe:     { status: "caution", supply: 50, demand: 58, label: "Limited",             note: "Market too small for commercial volumes" },
    northeast: { status: "go",      supply: 26, demand: 70, label: "Good demand",         note: "Traditional use + animal feed channel" },
    southern:  { status: "caution", supply: 58, demand: 64, label: "Near balance",        note: "RSA competition on processed grain" },
  },
  beans: {
    gaborone:  { status: "go",      supply: 24, demand: 82, label: "Strong demand",   note: "Urban protein demand rising" },
    kweneng:   { status: "go",      supply: 28, demand: 78, label: "Good opportunity", note: "Intercrop potential with maize" },
    central:   { status: "caution", supply: 55, demand: 62, label: "Moderate",         note: "Subsistence growers dominate supply" },
    kgalagadi: { status: "caution", supply: 48, demand: 52, label: "Low volume",        note: "Limited commercial channel" },
    ngamiland: { status: "caution", supply: 50, demand: 58, label: "Moderate",          note: "Seasonal only; limited year-round" },
    chobe:     { status: "go",      supply: 20, demand: 70, label: "Opportunity",       note: "Institutional and lodge buyers" },
    northeast: { status: "caution", supply: 52, demand: 60, label: "Balanced",          note: "Cross-border trade with ZW" },
    southern:  { status: "go",      supply: 22, demand: 75, label: "Good gap",          note: "Near processing and packaging facilities" },
  },
  spinach: {
    gaborone:  { status: "go",      supply: 18, demand: 85, label: "Urban demand",       note: "Fast-moving, short cycle; supermarket channel open" },
    kweneng:   { status: "go",      supply: 22, demand: 78, label: "High demand",        note: "Peri-urban informal market active" },
    central:   { status: "caution", supply: 55, demand: 62, label: "Moderate",           note: "Limited cold chain reduces quality window" },
    kgalagadi: { status: "nogo",    supply: 75, demand: 28, label: "Avoid",              note: "Too perishable for distance logistics" },
    ngamiland: { status: "caution", supply: 48, demand: 55, label: "Moderate",           note: "Very short shelf life is the key risk" },
    chobe:     { status: "go",      supply: 16, demand: 76, label: "Good opportunity",   note: "Daily hotel demand; premium pricing" },
    northeast: { status: "go",      supply: 20, demand: 80, label: "Strong demand",      note: "Francistown supermarkets underserved" },
    southern:  { status: "go",      supply: 18, demand: 80, label: "Strong demand",      note: "Gaborone overflow market" },
  },
};

// Fallback signal used when Data Twin mode is active
export const DATA_TWIN_SIGNAL = {
  status: "caution",
  supply: 65,
  demand: 70,
  label: "Regional proxy estimate",
  note: "Limpopo, RSA reference — semi-arid proxy, climate match 92%, soil match 88%",
  isInferred: true,
};

// ─── Risk profiles ────────────────────────────────────────────────────────────
// Base risk scores per crop (0–100; higher = more risk)

export const CROP_RISK = {
  tomato:  { soil: 42, climate: 58, logistics: 35, pest: 62, market: 48 },
  cabbage: { soil: 30, climate: 40, logistics: 28, pest: 38, market: 55 },
  onion:   { soil: 22, climate: 32, logistics: 40, pest: 30, market: 42 },
  potato:  { soil: 35, climate: 45, logistics: 32, pest: 35, market: 38 },
  carrot:  { soil: 28, climate: 36, logistics: 30, pest: 28, market: 42 },
  sorghum: { soil: 18, climate: 22, logistics: 38, pest: 22, market: 50 },
  beans:   { soil: 25, climate: 30, logistics: 35, pest: 32, market: 46 },
  spinach: { soil: 20, climate: 35, logistics: 65, pest: 40, market: 44 },
};

export const DISTRICT_RISK_MULT = {
  gaborone:  1.10,
  kweneng:   0.90,
  central:   0.95,
  kgalagadi: 1.15,
  ngamiland: 0.88,
  chobe:     0.92,
  northeast: 1.00,
  southern:  0.96,
};

// ─── Forecast engine ──────────────────────────────────────────────────────────

const WATER_M  = { borehole: 1.12, river: 1.00, municipal: 0.95, dam: 1.05, other: 0.88 };
const INVEST_M = { low: 0.82, medium: 1.00, high: 1.15 };
const LABOR_M  = { family: 0.92, mixed: 1.00, hired: 1.08 };
const MARKET_M = { local: 1.00, aggregator: 1.04, export: 1.08 };

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mix(seed, mn, mx) {
  const x = Math.sin(seed) * 10000;
  return mn + (x - Math.floor(x)) * (mx - mn);
}

export function computeForecast(input) {
  const key = JSON.stringify(input);
  const seed = hashStr(key);
  const w   = WATER_M[input.waterSource]  ?? 1;
  const iv  = INVEST_M[input.investment]  ?? 1;
  const lb  = LABOR_M[input.labor]        ?? 1;
  const mk  = MARKET_M[input.marketTarget] ?? 1;
  const ha  = Math.min(50, Math.max(0.1, Number(input.hectares) || 0.5));
  const soil = input.soilHealth === "poor" ? 0.88 : input.soilHealth === "excellent" ? 1.08 : 1;
  const horizon = Math.min(24, Math.max(1, Number(input.horizonMonths) || 6));
  const hf = 1 - Math.min(0.15, horizon * 0.004);

  const baseYield   = mix(seed, 42, 94) * w * iv * lb * soil * hf * mk;
  const scaleHa     = 1 - Math.min(0.12, Math.log10(ha + 1) * 0.06);
  const yieldIndex  = Math.round(Math.min(100, Math.max(15, baseYield * scaleHa)));

  const rs = seed + 7919;
  const mv = Math.round(mix(rs,     12, 38));
  const cs = Math.round(mix(rs + 1,  8, 35));
  const lr = Math.round(mix(rs + 2, 10, 32));

  const viability = Math.round(
    Math.min(100, Math.max(18,
      yieldIndex * 0.55 + (100 - mv) * 0.2 + (100 - cs) * 0.15 + (100 - lr) * 0.1
    ))
  );

  const band = viability >= 72 ? "Strong" : viability >= 52 ? "Moderate" : "Constrained";

  const outlook =
    viability >= 68
      ? `Over the next ${horizon} months, indicators suggest a favourable window for ${input.crop} with your resource profile (${band} outlook).`
      : viability >= 48
      ? `Over ${horizon} months, performance may be mixed (${band}). Tighten input costs and consider staged planting.`
      : `The next ${horizon} months look challenging (${band}). Address water or soil constraints before scaling.`;

  const bullets = [];
  if (mv > 28) bullets.push("Market price swings could narrow margins — consider a forward price arrangement.");
  if (cs > 26) bullets.push("Heat or dry spells may stress the crop during the planning window.");
  if (lr > 26) bullets.push("Transport timing may affect spoilage risk — plan logistics early.");
  if ((WATER_M[input.waterSource] ?? 1) < 0.95) bullets.push("Water reliability is a watchpoint — consider buffer storage or supplemental supply.");
  if (bullets.length === 0) bullets.push("No major red flags — validate locally with an extension officer before scaling.");

  return {
    yieldIndex,
    viabilityScore: viability,
    revenueBand: band,
    horizonMonths: horizon,
    marketVolatility: mv,
    climateStress: cs,
    logisticsRisk: lr,
    summary: outlook,
    riskBullets: bullets.slice(0, 4),
    generatedAt: new Date().toISOString(),
  };
}

// ─── Roadmap phases ───────────────────────────────────────────────────────────

export const ROADMAP_PHASES = [
  {
    num: 1, range: "Days 1–15", title: "Problem validation", status: "active",
    desc: "30 stakeholder interviews across farmers, aggregators, input suppliers, and government officers. Test willingness to pay for a crop-risk report before the season begins.",
    deliverables: ["30 interviews", "Problem ranking", "1-page mock report", "First crop shortlist"],
    metric: "At least 10 people say the report would affect their planting or buying decisions.",
  },
  {
    num: 2, range: "Days 16–30", title: "Data source validation", status: "upcoming",
    desc: "Build a data availability matrix. Generate a basic risk score from open data — no software yet. Map tomato, cabbage, and onion production calendars for key districts.",
    deliverables: ["Data source matrix", "3 crop calendars", "Weather + market prototype", "Horticulture data map"],
    metric: "Generate a risk score from available data without writing a single line of app code.",
  },
  {
    num: 3, range: "Days 31–45", title: "Manual MVP", status: "upcoming",
    desc: "Farmer intake form and 10 manually generated Crop Validation Reports for real farmers. Observe whether the advice changes actual planting decisions.",
    deliverables: ["Intake form", "Report template", "10 manual reports", "Feedback interviews"],
    metric: "At least 3 users ask for another report or offer to pay.",
  },
  {
    num: 4, range: "Days 46–60", title: "Business model testing", status: "upcoming",
    desc: "Test three price points: P50–150 per farmer report, P1,500–5,000 per monthly crop intelligence report, and P10,000+ for district or association dashboard pilots.",
    deliverables: ["3 pricing tests", "Institutional pitch deck", "Farmer WTP survey", "Intelligence sample report"],
    metric: "At least one institution agrees to a pilot discussion.",
  },
  {
    num: 5, range: "Days 61–75", title: "MVP prototype", status: "upcoming",
    desc: "This dashboard. A simple risk scoring model, data pipeline sketch, and WhatsApp/USSD flow. A user should understand the recommendation in under 2 minutes.",
    deliverables: ["Dashboard (this app)", "Risk model v1", "Data pipeline sketch", "USSD flow design"],
    metric: "Users understand the recommendation in under 2 minutes without guidance.",
  },
  {
    num: 6, range: "Days 76–90", title: "Pilot design", status: "upcoming",
    desc: "Pilot proposal, partner shortlist, grant/investor one-pager, and business model canvas. Target: one signed letter of intent or strong written expression of interest.",
    deliverables: ["Pilot proposal", "Partner shortlist", "Investor one-pager", "Data governance plan"],
    metric: "One signed LOI or strong written expression of interest.",
  },
];

export const DATA_SOURCES = [
  { layer: "1", layerLabel: "Open global",    name: "Open-Meteo",              freq: "Daily",           access: "open",    desc: "Weather history, rainfall anomalies, temperature risk" },
  { layer: "1", layerLabel: "Open global",    name: "NASA / ESA Sentinel",     freq: "Weekly",          access: "open",    desc: "Satellite vegetation indices, soil moisture, crop monitoring" },
  { layer: "1", layerLabel: "Open global",    name: "FAO FAOSTAT",             freq: "Annual",          access: "open",    desc: "National crop production baselines, import/export trends" },
  { layer: "2", layerLabel: "Institutional",  name: "NARDI / BUAN",            freq: "Per research cycle", access: "partner", desc: "Agronomic research, extension officer knowledge, varietal data" },
  { layer: "2", layerLabel: "Institutional",  name: "MoA import permits",      freq: "Monthly",         access: "partner", desc: "Horticulture import/export permit volumes — shortage signals" },
  { layer: "2", layerLabel: "Institutional",  name: "District agriculture offices", freq: "Seasonal",  access: "partner", desc: "Extension officer intel, planting season data, local pricing" },
  { layer: "3", layerLabel: "Proprietary",    name: "Farmer intention data",   freq: "Real-time",       access: "prop",    desc: "Planting intentions, farm size, crop choice, expected harvest" },
  { layer: "3", layerLabel: "Proprietary",    name: "BOTSAT-1 (pipeline)",     freq: "Future",          access: "pipeline", desc: "High-resolution national satellite imagery for Botswana" },
];
