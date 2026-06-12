// Auth for /admin pages, admin API routes and Vercel cron routes.
// - Admin: x-admin-token cookie, ?token= query param, or Authorization header
//   checked against ADMIN_SECRET.
// - Cron: Authorization: Bearer ${CRON_SECRET}.
// In local dev with neither secret configured, access is allowed so the
// pipeline can be exercised without setup.

import { cookies } from "next/headers";

export function devOpenAccess() {
  return (
    !process.env.ADMIN_SECRET &&
    !process.env.CRON_SECRET &&
    process.env.NODE_ENV !== "production"
  );
}

function bearerToken(request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function cookieToken(request) {
  const raw = request.headers.get("cookie") ?? "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith("x-admin-token="));
  return hit ? decodeURIComponent(hit.slice("x-admin-token=".length)) : null;
}

/** For API routes — accepts either the admin secret or the cron secret. */
export function isAuthorizedRequest(request) {
  if (devOpenAccess()) return true;
  const token =
    bearerToken(request) ??
    request.headers.get("x-admin-token") ??
    cookieToken(request) ??
    new URL(request.url).searchParams.get("token");
  if (!token) return false;
  if (process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET) return true;
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true;
  return false;
}

/** Vercel cron calls routes with GET — detect them via the CRON_SECRET bearer. */
export function isCronRequest(request) {
  const token = bearerToken(request);
  return Boolean(token && process.env.CRON_SECRET && token === process.env.CRON_SECRET);
}

export function triggeredBy(request) {
  const token = bearerToken(request);
  return token && process.env.CRON_SECRET && token === process.env.CRON_SECRET
    ? "cron"
    : "admin";
}

/** For server components under /admin. */
export async function isAdminSession() {
  if (devOpenAccess()) return true;
  if (!process.env.ADMIN_SECRET) return false;
  const store = await cookies();
  return store.get("x-admin-token")?.value === process.env.ADMIN_SECRET;
}
