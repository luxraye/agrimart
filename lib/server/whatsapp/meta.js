// Meta WhatsApp Cloud API client: verify inbound webhook signatures and send
// plain-text replies via the Graph API.

import crypto from "crypto";

const GRAPH_VERSION = "v21.0";

export function isConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Validate the X-Hub-Signature-256 header against the raw request body using
 * WHATSAPP_APP_SECRET. Returns true when the secret is unset (dev convenience)
 * but logs a warning so production misconfiguration is visible.
 */
export function verifySignature(rawBody, signatureHeader) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.warn("[whatsapp] WHATSAPP_APP_SECRET not set — skipping signature check");
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Pull the first inbound text message out of a webhook payload, if any. */
export function parseIncoming(payload) {
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return null;
  return {
    from: message.from,
    type: message.type,
    text: message.type === "text" ? (message.text?.body ?? "") : "",
  };
}

/** Send a plain-text WhatsApp message. Returns true on success. */
export async function sendText(to, body) {
  if (!isConfigured()) {
    console.warn("[whatsapp] access token / phone number id not set — reply not sent");
    return false;
  }
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: body.slice(0, 4096) },
      }),
    });
    if (!res.ok) {
      console.error(`[whatsapp] send failed ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[whatsapp] send error: ${e.message}`);
    return false;
  }
}
