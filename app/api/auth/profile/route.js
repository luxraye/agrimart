import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, mapProfile } from "@/lib/server/auth";
import { DISTRICT_KEYS } from "@/lib/districtCoords";

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

  const updates = {};
  if (body.displayName != null) updates.display_name = String(body.displayName).trim().slice(0, 120);
  if (body.farmName != null || body.location != null) {
    updates.farm_name = String(body.farmName ?? body.location ?? "").trim().slice(0, 120) || null;
  }
  if (body.district != null) {
    if (!DISTRICT_KEYS.includes(body.district)) {
      return NextResponse.json({ ok: false, error: "Invalid district" }, { status: 400 });
    }
    updates.district = body.district;
  }
  if (body.phone != null) updates.phone = String(body.phone).trim().slice(0, 32) || null;
  updates.updated_at = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    profile: mapProfile({ ...data, email: session.user.email }),
  });
}
