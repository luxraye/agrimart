// Account linking: bind a Meta wa_id to a web-registered profile via a
// short-lived one-time code generated on the Profile page.

import { getServiceClient } from "../supabase";

export const LINK_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REGENERATE_COOLDOWN_MS = 60 * 1000; // 1 code per minute per user

function sixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generate (or refuse, if on cooldown) a link code for a profile.
 * Returns { code, expiresAt } or { error } when debounced / phone missing.
 */
export async function generateLinkCode(profileId) {
  const sb = getServiceClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("phone, whatsapp_link_expires_at, whatsapp_linked_at")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile?.phone) return { error: "Add a phone number to your profile first." };

  // Debounce: a code with >14 min remaining was generated <60s ago.
  if (profile.whatsapp_link_expires_at) {
    const remaining = new Date(profile.whatsapp_link_expires_at).getTime() - Date.now();
    if (remaining > LINK_CODE_TTL_MS - REGENERATE_COOLDOWN_MS) {
      return { error: "Please wait a minute before requesting another code." };
    }
  }

  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS).toISOString();
  const { error } = await sb
    .from("profiles")
    .update({ whatsapp_link_code: code, whatsapp_link_expires_at: expiresAt })
    .eq("id", profileId);
  if (error) return { error: error.message };
  return { code, expiresAt };
}

/** Resolve a linked profile from a wa_id, or null. */
export async function findProfileByWaId(waId) {
  const sb = getServiceClient();
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("whatsapp_wa_id", waId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Verify a 6-digit code and bind the wa_id to that profile. Single-use:
 * clears the code and stamps whatsapp_linked_at on success.
 */
export async function verifyAndLink(waId, code) {
  const sb = getServiceClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("id, display_name, whatsapp_link_expires_at")
    .eq("whatsapp_link_code", code)
    .maybeSingle();

  if (!profile) return { ok: false, reason: "invalid" };
  if (
    !profile.whatsapp_link_expires_at ||
    new Date(profile.whatsapp_link_expires_at).getTime() < Date.now()
  ) {
    return { ok: false, reason: "expired" };
  }

  const { error } = await sb
    .from("profiles")
    .update({
      whatsapp_wa_id: waId,
      whatsapp_linked_at: new Date().toISOString(),
      whatsapp_link_code: null,
      whatsapp_link_expires_at: null,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, reason: "error", message: error.message };

  return { ok: true, displayName: profile.display_name };
}
