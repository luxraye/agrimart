import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** POST { password } — sets the x-admin-token cookie when correct. */
export async function POST(request) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_SECRET is not configured on the server" },
      { status: 500 }
    );
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (body.password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("x-admin-token", process.env.ADMIN_SECRET, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12h session
    path: "/",
  });
  return res;
}

/** DELETE — sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("x-admin-token", "", { maxAge: 0, path: "/" });
  return res;
}
