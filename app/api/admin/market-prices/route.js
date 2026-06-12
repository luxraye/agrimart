import { NextResponse } from "next/server";
import { dbInsert, dbSelect, persistenceMode } from "@/lib/server/db";
import { applyMarketPriceSignal } from "@/lib/server/riskEngine";
import { isAuthorizedRequest } from "@/lib/server/adminAuth";
import { DISTRICT_KEYS } from "@/lib/districtCoords";
import { CROP_KEYS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const rows = await dbSelect("market_prices", {}, {
      order: { column: "recorded_at" },
      limit: 50,
    });
    return NextResponse.json({ ok: true, prices: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

/** POST — insert a market price observation and run the drop-signal check. */
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

  const { district, crop, price_bwp_kg, source, recorded_at } = body;
  if (!DISTRICT_KEYS.includes(district) || !CROP_KEYS.includes(crop)) {
    return NextResponse.json({ ok: false, error: "valid district and crop required" }, { status: 400 });
  }
  const price = Number(price_bwp_kg);
  if (!price || price <= 0) {
    return NextResponse.json({ ok: false, error: "price must be a positive number" }, { status: 400 });
  }

  try {
    const row = await dbInsert("market_prices", {
      district,
      crop,
      price_bwp_kg: price,
      source: String(source ?? "").slice(0, 200) || "Manual entry",
      recorded_at: recorded_at || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    });

    // In Supabase mode the Postgres trigger applies the drop signal; the JS
    // path covers memory mode so behaviour matches in local dev.
    let signal = { applied: false, reason: "handled by database trigger" };
    if (persistenceMode() === "memory") {
      signal = await applyMarketPriceSignal({ district, crop, price });
    }
    return NextResponse.json({ ok: true, id: row.id, signal });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
