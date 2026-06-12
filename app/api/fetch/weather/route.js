import { NextResponse } from "next/server";
import { dbSelect } from "@/lib/server/db";
import { hoursSince } from "@/lib/server/fetchJson";
import { getFieldIntel, FIELD_INTEL_TTL_HOURS } from "@/lib/server/fieldIntel";
import { runWeatherRefresh } from "@/lib/server/pipeline";
import { isAuthorizedRequest, isCronRequest, triggeredBy } from "@/lib/server/adminAuth";
import { DISTRICT_KEYS } from "@/lib/districtCoords";

export const dynamic = "force-dynamic";

/** GET ?district=central — cached field intel (refreshes inline if missing). */
export async function GET(request) {
  // Vercel cron hits this path with GET — run the refresh instead of a read
  if (isCronRequest(request)) {
    const result = await runWeatherRefresh({ triggeredBy: "cron" });
    return NextResponse.json(result, { status: 200 });
  }

  const district = new URL(request.url).searchParams.get("district");

  try {
    if (district) {
      if (!DISTRICT_KEYS.includes(district)) {
        return NextResponse.json({ ok: false, error: "unknown district" }, { status: 400 });
      }
      const intel = await getFieldIntel(district);
      return NextResponse.json({ ok: true, ...intel });
    }
    const rows = await dbSelect("field_intel_cache", {});
    return NextResponse.json({
      ok: true,
      districts: rows.map((r) => ({
        district: r.district,
        moisture: r.moisture,
        temp: r.temp,
        ndvi: r.ndvi,
        fetched_at: r.fetched_at,
        stale: hoursSince(r.fetched_at) > FIELD_INTEL_TTL_HOURS,
      })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/** POST { district? } — refresh one or all districts. Cron / admin only. */
export async function POST(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const districts =
    body.district && DISTRICT_KEYS.includes(body.district) ? [body.district] : undefined;

  const result = await runWeatherRefresh({ districts, triggeredBy: triggeredBy(request) });
  return NextResponse.json(result, { status: 200 }); // never non-200 for cron
}
