import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC = new Set(["/login", "/about"]);

function handleAdmin(request) {
  const { pathname, searchParams } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return null;
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (request.cookies.get("x-admin-token")?.value === secret) {
    return NextResponse.next();
  }

  if (searchParams.get("token") === secret) {
    const clean = new URL(pathname, request.url);
    const res = NextResponse.redirect(clean);
    res.cookies.set("x-admin-token", secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    return res;
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const adminResult = handleAdmin(request);
  if (adminResult) return adminResult;

  // Supabase session refresh on every matched request
  const { supabaseResponse, user } = await updateSession(request);

  const isPublic = PUBLIC.has(pathname);
  const isAuthPage = pathname === "/login";

  if (!user && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};
