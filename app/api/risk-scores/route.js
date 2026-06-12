import { NextResponse } from "next/server";
import { getRiskScores } from "@/lib/server/riskEngine";
import { runRiskRefresh } from "@/lib/server/pipeline";
import { isAuthorizedRequest, isCronRequest, triggeredBy } from "@/lib/server/adminAuth";
import { DISTRICT_KEYS } from "@/lib/districtCoords";
import { CROP_KEYS } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * GET ?district=central&crop=tomato — risk scores (cached ≤24h, recomputed on
 * demand). GET ?refresh=all with cron/admin auth recomputes all 64 pairs.
 */
export async function GET(request) {
  const params = new URL(request.url).searchParams;

  if (params.get("refresh") === "all") {
    if (!isCronRequest(request) && !isAuthorizedRequest(request)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const result = await runRiskRefresh({ triggeredBy: triggeredBy(request) });
    return NextResponse.json(result, { status: 200 });
  }

  const district = params.get("district");
  const crop = params.get("crop");
  if (!DISTRICT_KEYS.includes(district) || !CROP_KEYS.includes(crop)) {
    return NextResponse.json({ ok: false, error: "district and crop required" }, { status: 400 });
  }
  try {
    const scores = await getRiskScores(district, crop);
    return NextResponse.json({ ok: true, ...scores });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/** POST — force a full recompute (admin panel "Refresh now"). */
export async function POST(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await runRiskRefresh({ triggeredBy: triggeredBy(request) });
  return NextResponse.json(result, { status: 200 });
}
