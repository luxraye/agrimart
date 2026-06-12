// Postgres persistence via Supabase service role.
// All pipeline and farmer data lives in PostgreSQL — no in-memory fallback.

import { getServiceClient } from "./supabase";

function client() {
  const sb = getServiceClient();
  if (!sb) {
    throw new Error(
      "Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return sb;
}

export async function dbSelect(table, filter = {}, { order, limit } = {}) {
  let q = client().from(table).select("*");
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
  if (order) q = q.order(order.column, { ascending: order.ascending ?? false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`db select ${table}: ${error.message}`);
  return data ?? [];
}

export async function dbInsert(table, row) {
  const { data, error } = await client().from(table).insert(row).select().single();
  if (error) throw new Error(`db insert ${table}: ${error.message}`);
  return data;
}

export async function dbUpsert(table, row, conflictKeys) {
  const { data, error } = await client()
    .from(table)
    .upsert(row, { onConflict: conflictKeys.join(",") })
    .select()
    .single();
  if (error) throw new Error(`db upsert ${table}: ${error.message}`);
  return data;
}

export async function dbDelete(table, filter) {
  let q = client().from(table).delete();
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
  const { error } = await q;
  if (error) throw new Error(`db delete ${table}: ${error.message}`);
}

export function persistenceMode() {
  return "supabase";
}
