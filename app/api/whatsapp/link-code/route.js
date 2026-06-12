import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getServiceClient } from "@/lib/server/supabase";
import { generateLinkCode } from "@/lib/server/whatsapp/link";

export const dynamic = "force-dynamic";

// Current WhatsApp link status for the Profile page card.
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  const sb = getServiceClient();
  const { data } = await sb
    .from("profiles")
    .select("phone, whatsapp_wa_id, whatsapp_linked_at")
    .eq("id", session.user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    hasPhone: Boolean(data?.phone),
    linked: Boolean(data?.whatsapp_wa_id),
    linkedAt: data?.whatsapp_linked_at ?? null,
    waNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
  });
}

// Generate a one-time link code (web-first identity flow).
export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const result = await generateLinkCode(session.user.id);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    expiresAt: result.expiresAt,
    waNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
  });
}
