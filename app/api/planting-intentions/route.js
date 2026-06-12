import { NextResponse } from "next/server";
import { dbInsert } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { aggregateIntentions } from "@/lib/server/signals";
import { DISTRICT_KEYS } from "@/lib/districtCoords";
import { CROP_KEYS, currentSeasonYear } from "@/lib/data";

export const dynamic = "force-dynamic";

/** GET ?district=&crop=&season_year= — aggregated intentions. */
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const district = params.get("district") || undefined;
  const crop = params.get("crop") || undefined;
  const seasonYear = Number(params.get("season_year")) || currentSeasonYear();

  try {
    const agg = await aggregateIntentions({ district, crop, seasonYear });
    return NextResponse.json({
      ok: true,
      district: district ?? "all",
      crop: crop ?? "all",
      season_year: seasonYear,
      total_farmers: agg.total_farmers,
      total_ha: agg.total_ha,
      dominant_market: agg.dominant_market,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/** POST — authenticated farmer planting declaration (stored in Postgres). */
export async function POST(request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to declare planting intentions" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const { district, crop, hectares, planting_month, market_target } = body ?? {};
  const profile = session.profile;

  if (!DISTRICT_KEYS.includes(district)) {
    return NextResponse.json({ ok: false, error: "valid district required" }, { status: 400 });
  }
  if (!CROP_KEYS.includes(crop)) {
    return NextResponse.json({ ok: false, error: "valid crop required" }, { status: 400 });
  }
  const ha = Number(hectares);
  if (!ha || ha <= 0 || ha > 10000) {
    return NextResponse.json({ ok: false, error: "hectares must be between 0 and 10,000" }, { status: 400 });
  }

  try {
    const row = await dbInsert("planting_intentions", {
      user_id: session.user.id,
      district,
      crop,
      hectares: ha,
      planting_month: planting_month ?? null,
      market_target: market_target ?? null,
      farmer_name: profile.displayName || null,
      phone: profile.phone || null,
      season_year: currentSeasonYear(),
      created_at: new Date().toISOString(),
    });
    const agg = await aggregateIntentions({ district, crop, seasonYear: currentSeasonYear() });
    return NextResponse.json({
      ok: true,
      id: row.id,
      total_farmers: agg.total_farmers,
      total_ha: agg.total_ha,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
