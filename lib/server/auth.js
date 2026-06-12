import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "./supabase";

const DEFAULT_FARM = {
  crop: "tomato",
  hectares: 2,
  water_source: "borehole",
  investment: "medium",
  labor: "family",
  soil_health: "average",
  market_target: "local",
};

export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name ?? "",
    farmName: row.farm_name ?? "",
    district: row.district ?? "central",
    location: row.farm_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? null,
  };
}

export function mapFarm(row) {
  if (!row) return { ...DEFAULT_FARM, hectares: "2" };
  return {
    crop: row.crop ?? "tomato",
    hectares: String(row.hectares ?? 2),
    waterSource: row.water_source ?? "borehole",
    investment: row.investment ?? "medium",
    labor: row.labor ?? "family",
    soilHealth: row.soil_health ?? "average",
    marketTarget: row.market_target ?? "local",
  };
}

/** Authenticated user + profile + farm from cookie session. */
export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: farm } = await supabase
    .from("farm_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email },
    profile: mapProfile(profile ? { ...profile, email: user.email } : {
      id: user.id,
      display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Farmer",
      district: user.user_metadata?.district ?? "central",
      farm_name: user.user_metadata?.farm_name ?? "",
      phone: user.user_metadata?.phone ?? "",
      email: user.email,
    }),
    farm: mapFarm(farm),
  };
}

/** Service-role profile + farm bootstrap after signup. */
export async function ensureUserRecords(userId, { displayName, district, farmName, phone }) {
  const sb = getServiceClient();
  const now = new Date().toISOString();

  await sb.from("profiles").upsert({
    id: userId,
    display_name: displayName,
    district: district ?? "central",
    farm_name: farmName ?? null,
    phone: phone ?? null,
    updated_at: now,
  }, { onConflict: "id" });

  const { data: existing } = await sb.from("farm_settings").select("user_id").eq("user_id", userId).maybeSingle();
  if (!existing) {
    await sb.from("farm_settings").insert({ user_id: userId, ...DEFAULT_FARM });
  }
}
