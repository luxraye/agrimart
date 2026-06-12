import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, mapFarm } from "@/lib/server/auth";
import { CROP_KEYS } from "@/lib/data";

const WATER = new Set(["borehole", "river", "municipal", "dam", "other"]);
const INVEST = new Set(["low", "medium", "high"]);
const LABOR = new Set(["family", "mixed", "hired"]);
const SOIL = new Set(["poor", "average", "excellent"]);
const MARKET = new Set(["local", "aggregator", "export"]);

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (body.crop != null) {
    if (!CROP_KEYS.includes(body.crop)) return NextResponse.json({ ok: false, error: "Invalid crop" }, { status: 400 });
    updates.crop = body.crop;
  }
  if (body.hectares != null) {
    const ha = Number(body.hectares);
    if (!ha || ha <= 0 || ha > 10000) return NextResponse.json({ ok: false, error: "Invalid hectares" }, { status: 400 });
    updates.hectares = ha;
  }
  if (body.waterSource != null) {
    if (!WATER.has(body.waterSource)) return NextResponse.json({ ok: false, error: "Invalid water source" }, { status: 400 });
    updates.water_source = body.waterSource;
  }
  if (body.investment != null) {
    if (!INVEST.has(body.investment)) return NextResponse.json({ ok: false, error: "Invalid investment" }, { status: 400 });
    updates.investment = body.investment;
  }
  if (body.labor != null) {
    if (!LABOR.has(body.labor)) return NextResponse.json({ ok: false, error: "Invalid labor" }, { status: 400 });
    updates.labor = body.labor;
  }
  if (body.soilHealth != null) {
    if (!SOIL.has(body.soilHealth)) return NextResponse.json({ ok: false, error: "Invalid soil health" }, { status: 400 });
    updates.soil_health = body.soilHealth;
  }
  if (body.marketTarget != null) {
    if (!MARKET.has(body.marketTarget)) return NextResponse.json({ ok: false, error: "Invalid market target" }, { status: 400 });
    updates.market_target = body.marketTarget;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_settings")
    .upsert({ user_id: session.user.id, ...updates }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, farm: mapFarm(data) });
}
