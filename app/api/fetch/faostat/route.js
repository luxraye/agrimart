import { NextResponse } from "next/server";
import { dbSelect } from "@/lib/server/db";
import { runFaostatRefresh } from "@/lib/server/pipeline";
import { isAuthorizedRequest, isCronRequest, triggeredBy } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/** GET — cached FAOSTAT production rows (latest year per crop). */
export async function GET(request) {
  // Vercel cron hits this path with GET — run the refresh instead of a read
  if (isCronRequest(request)) {
    const result = await runFaostatRefresh({ triggeredBy: "cron" });
    return NextResponse.json(result, { status: 200 });
  }
  try {
    const rows = await dbSelect("faostat_cache", {});
    const latest = {};
    for (const r of rows) {
      if (!latest[r.crop] || r.year > latest[r.crop].year) latest[r.crop] = r;
    }
    return NextResponse.json({ ok: true, crops: Object.values(latest) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/** POST — refresh all 8 crops from FAOSTAT. Cron / admin only. */
export async function POST(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await runFaostatRefresh({ triggeredBy: triggeredBy(request) });
  return NextResponse.json(result, { status: 200 });
}
