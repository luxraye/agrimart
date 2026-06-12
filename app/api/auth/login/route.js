import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecords, getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body ?? {};
  if (!email?.trim() || !password) {
    return NextResponse.json({ ok: false, error: "Email and password are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }

  // Backfill profile/farm if missing (e.g. user confirmed email after signup)
  if (data.user) {
    const meta = data.user.user_metadata ?? {};
    try {
      await ensureUserRecords(data.user.id, {
        displayName: meta.display_name ?? data.user.email?.split("@")[0] ?? "Farmer",
        district: meta.district ?? "central",
        farmName: meta.farm_name ?? "",
        phone: meta.phone ?? "",
      });
    } catch {
      // non-fatal — session still valid
    }
  }

  const session = await getSessionUser();
  return NextResponse.json({ ok: true, ...session });
}
