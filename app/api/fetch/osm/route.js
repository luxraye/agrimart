import { NextResponse } from "next/server";
import { getOsmLayer, runOsmRefresh } from "@/lib/server/pipeline";
import { isAuthorizedRequest, isCronRequest, triggeredBy } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

const LAYERS = ["water_points", "traffic_nodes"];

/** GET ?layer=water_points — cached layer with fetched_at + source. */
export async function GET(request) {
  const layer = new URL(request.url).searchParams.get("layer");

  // Vercel cron hits this path with GET — run the refresh instead of a read
  if (isCronRequest(request)) {
    const result = await runOsmRefresh({
      layer: LAYERS.includes(layer) ? layer : undefined,
      triggeredBy: "cron",
    });
    return NextResponse.json(result, { status: 200 });
  }

  if (!LAYERS.includes(layer)) {
    return NextResponse.json(
      { ok: false, error: `layer must be one of: ${LAYERS.join(", ")}` },
      { status: 400 }
    );
  }
  try {
    const result = await getOsmLayer(layer);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/**
 * POST { layer? } — run Overpass refresh for one or both layers.
 * Also accepts ?layer= so Vercel cron paths work as configured.
 */
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
  const layer =
    (LAYERS.includes(body.layer) && body.layer) ||
    (LAYERS.includes(new URL(request.url).searchParams.get("layer")) &&
      new URL(request.url).searchParams.get("layer")) ||
    undefined;

  const result = await runOsmRefresh({ layer, triggeredBy: triggeredBy(request) });
  return NextResponse.json(result, { status: 200 });
}
