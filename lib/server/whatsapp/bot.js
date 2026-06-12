// WhatsApp bot state machine. Parses commands and numbered menus, then calls
// the existing Postgres-backed engines — no business logic is duplicated here.

import { dbSelect, dbUpsert } from "../db";
import { DISTRICTS, CROPS, currentSeasonYear } from "../../data";
import { computeSupplySignal } from "../signals";
import { getRiskScores } from "../riskEngine";
import { getFieldIntel } from "../fieldIntel";
import { formatSupply, formatRisk } from "./format";
import { verifyAndLink, findProfileByWaId } from "./link";

// Best-effort in-memory rate limit: max 10 replies per wa_id per minute.
const RATE_MAX = 10;
const RATE_WINDOW_MS = 60 * 1000;
const rateHits = new Map();

function rateLimited(waId) {
  const now = Date.now();
  const hits = (rateHits.get(waId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateHits.set(waId, hits);
  return hits.length > RATE_MAX;
}

const MENU = [
  "AgriMart Botswana",
  "1  Supply check",
  "2  Risk monitor",
  "3  Link account",
  "",
  "Reply with a number. Send MENU anytime, 0 to go back.",
].join("\n");

const LINK_PROMPT = [
  "Welcome to AgriMart Botswana.",
  "",
  "This number isn't linked yet. Register at the AgriMart web app, add your phone on the Profile page, then generate a 6-digit code.",
  "",
  "Send it here as:  LINK 482910",
].join("\n");

function numberedList(items) {
  return items.map((it, i) => `${i + 1}  ${it.label}`).join("\n");
}

function parseChoice(text, length) {
  const n = Number.parseInt(text, 10);
  return Number.isInteger(n) && n >= 1 && n <= length ? n - 1 : null;
}

function districtPrompt(kind) {
  return `${kind === "supply" ? "Supply check" : "Risk monitor"} — choose a district:\n${numberedList(DISTRICTS)}`;
}
function cropPrompt() {
  return `Choose a crop:\n${numberedList(CROPS)}`;
}

async function loadSession(waId) {
  try {
    const rows = await dbSelect("whatsapp_sessions", { wa_id: waId }, { limit: 1 });
    if (rows[0]) return { step: rows[0].step, context: rows[0].context ?? {} };
  } catch {
    // fall through to default
  }
  return { step: "menu", context: {} };
}

async function saveSession(waId, profileId, step, context) {
  try {
    await dbUpsert(
      "whatsapp_sessions",
      { wa_id: waId, profile_id: profileId, step, context, updated_at: new Date().toISOString() },
      ["wa_id"]
    );
  } catch {
    // session persistence is best-effort; the menu is always reachable
  }
}

async function resetSession(waId, profileId) {
  await saveSession(waId, profileId, "menu", {});
}

/**
 * Handle one inbound text. Returns the reply string to send back, or null when
 * no reply should be sent (rate limited).
 */
export async function handleIncoming(waId, rawText) {
  if (rateLimited(waId)) return null;

  const raw = (rawText ?? "").trim();
  const lower = raw.toLowerCase();

  // LINK works in any state, before linking.
  const linkMatch = raw.match(/^link\s+(\d{6})$/i);
  if (linkMatch) {
    const result = await verifyAndLink(waId, linkMatch[1]);
    if (result.ok) {
      await resetSession(waId, null);
      return `Linked successfully — welcome, ${result.displayName}!\n\n${MENU}`;
    }
    if (result.reason === "expired") return "That code has expired. Generate a new one on your Profile page.";
    return "That code is invalid. Check the 6-digit code on your Profile page and try again.";
  }

  const profile = await findProfileByWaId(waId);
  if (!profile) return LINK_PROMPT;

  if (["menu", "0", "hi", "hello", "start", "help"].includes(lower)) {
    await resetSession(waId, profile.id);
    return MENU;
  }

  const session = await loadSession(waId);

  switch (session.step) {
    case "supply_district":
    case "risk_district": {
      const kind = session.step === "supply_district" ? "supply" : "risk";
      const idx = parseChoice(raw, DISTRICTS.length);
      if (idx == null) return `Please reply with a number 1-${DISTRICTS.length}.\n\n${districtPrompt(kind)}`;
      const district = DISTRICTS[idx].value;
      await saveSession(waId, profile.id, `${kind}_crop`, { district });
      return cropPrompt();
    }

    case "supply_crop": {
      const idx = parseChoice(raw, CROPS.length);
      if (idx == null) return `Please reply with a number 1-${CROPS.length}.\n\n${cropPrompt()}`;
      const crop = CROPS[idx];
      const district = DISTRICTS.find((d) => d.value === session.context.district);
      const signal = await computeSupplySignal({
        district: district.value,
        crop: crop.value,
        seasonYear: currentSeasonYear(),
      });
      await resetSession(waId, profile.id);
      return `${formatSupply(signal, { districtLabel: district.label, cropLabel: crop.label })}\n\nSend MENU for another check.`;
    }

    case "risk_crop": {
      const idx = parseChoice(raw, CROPS.length);
      if (idx == null) return `Please reply with a number 1-${CROPS.length}.\n\n${cropPrompt()}`;
      const crop = CROPS[idx];
      const district = DISTRICTS.find((d) => d.value === session.context.district);
      const [risk, intel] = await Promise.all([
        getRiskScores(district.value, crop.value),
        getFieldIntel(district.value),
      ]);
      await resetSession(waId, profile.id);
      return `${formatRisk(risk, intel, { districtLabel: district.label, cropLabel: crop.label })}\n\nSend MENU for another check.`;
    }

    case "menu":
    default: {
      if (raw === "1") {
        await saveSession(waId, profile.id, "supply_district", {});
        return districtPrompt("supply");
      }
      if (raw === "2") {
        await saveSession(waId, profile.id, "risk_district", {});
        return districtPrompt("risk");
      }
      if (raw === "3") return `You're already linked as ${profile.display_name}.\n\n${MENU}`;
      return `Sorry, I didn't understand that.\n\n${MENU}`;
    }
  }
}
