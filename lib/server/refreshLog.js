import { dbInsert, dbSelect } from "./db";

/** Quality rule 9 — every refresh is logged. Never throws. */
export async function logRefresh({ source, triggeredBy, recordCount, durationMs, error }) {
  try {
    await dbInsert("refresh_log", {
      source,
      triggered_by: triggeredBy ?? "admin",
      record_count: recordCount ?? 0,
      duration_ms: Math.round(durationMs ?? 0),
      error: error ?? null,
      run_at: new Date().toISOString(),
    });
  } catch {
    // logging must never break a refresh
  }
}

export async function recentRefreshes(limit = 20) {
  try {
    return await dbSelect("refresh_log", {}, { order: { column: "run_at" }, limit });
  } catch {
    return [];
  }
}
