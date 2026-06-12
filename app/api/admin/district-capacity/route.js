import { NextResponse } from "next/server";
import { dbUpsert } from "@/lib/server/db";
import { listCapacities } from "@/lib/server/capacity";
import { isAuthorizedRequest } from "@/lib/server/adminAuth";
import { DISTRICT_KEYS } from "@/lib/districtCoords";
import { CROP_KEYS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const rows = await listCapacities();
    return NextResponse.json({ ok: true, capacities: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/** POST { district, crop, max_ha } — calibrate a capacity ceiling. */
export async function POST(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const { district, crop } = body;
  const maxHa = Number(body.max_ha);
  if (!DISTRICT_KEYS.includes(district) || !CROP_KEYS.includes(crop)) {
    return NextResponse.json({ ok: false, error: "valid district and crop required" }, { status: 400 });
  }
  if (!maxHa || maxHa <= 0) {
    return NextResponse.json({ ok: false, error: "max_ha must be positive" }, { status: 400 });
  }
  try {
    await dbUpsert("district_capacity", {
      district,
      crop,
      max_ha: maxHa,
      updated_at: new Date().toISOString(),
    }, ["district", "crop"]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
