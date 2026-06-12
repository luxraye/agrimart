import { NextResponse } from "next/server";
import { verifySignature, parseIncoming, sendText } from "@/lib/server/whatsapp/meta";
import { handleIncoming } from "@/lib/server/whatsapp/bot";

export const dynamic = "force-dynamic";

// Meta verification handshake.
export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Inbound messages. Always ACK 200 quickly — never 5xx (avoids Meta retry storms).
export async function POST(request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(raw, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const message = parseIncoming(payload);
    if (message?.from) {
      if (message.type !== "text") {
        await sendText(message.from, "Text only for now — send MENU to begin.");
      } else {
        const reply = await handleIncoming(message.from, message.text);
        if (reply) await sendText(message.from, reply);
      }
    }
  } catch (e) {
    console.error(`[whatsapp] webhook handler error: ${e.message}`);
  }

  return NextResponse.json({ ok: true });
}
