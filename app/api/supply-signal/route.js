import { NextResponse } from "next/server";
import { computeSupplySignal } from "@/lib/server/signals";
import { DISTRICT_KEYS } from "@/lib/districtCoords";
import { CROP_KEYS, currentSeasonYear } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * GET ?district=central&crop=tomato — the supply/demand signal, live when
 * ≥3 farmer submissions exist, baseline-flagged otherwise.
 */
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const district = params.get("district");
  const crop = params.get("crop");
  const seasonYear = Number(params.get("season_year")) || currentSeasonYear();

  if (!DISTRICT_KEYS.includes(district) || !CROP_KEYS.includes(crop)) {
    return NextResponse.json({ ok: false, error: "district and crop required" }, { status: 400 });
  }
  try {
    const signal = await computeSupplySignal({ district, crop, seasonYear });
    return NextResponse.json({ ok: true, ...signal });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
