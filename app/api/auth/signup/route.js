import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecords } from "@/lib/server/auth";
import { DISTRICT_KEYS } from "@/lib/districtCoords";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, displayName, district, farmName, phone } = body ?? {};

  if (!email?.trim() || !password || password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Email and password (min 8 characters) are required" },
      { status: 400 }
    );
  }
  if (!displayName?.trim()) {
    return NextResponse.json({ ok: false, error: "Your name is required" }, { status: 400 });
  }
  if (district && !DISTRICT_KEYS.includes(district)) {
    return NextResponse.json({ ok: false, error: "Invalid district" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        display_name: displayName.trim(),
        district: district ?? "central",
        farm_name: farmName?.trim() ?? "",
        phone: phone?.trim() ?? "",
      },
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (data.user) {
    try {
      await ensureUserRecords(data.user.id, {
        displayName: displayName.trim(),
        district: district ?? "central",
        farmName: farmName?.trim(),
        phone: phone?.trim(),
      });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    needsConfirmation: !data.session,
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
  });
}
