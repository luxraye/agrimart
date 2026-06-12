// Every external API call must abort after 10 seconds (pipeline quality rule 1).
const DEFAULT_TIMEOUT_MS = 10_000;

// Some providers (e.g. Overpass) reject requests without a User-Agent
const USER_AGENT = "AgriMart/4.0 (Botswana crop intelligence; data pipeline)";

export async function fetchJson(url, { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url.slice(0, 120)}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

export function daysSince(iso) {
  return hoursSince(iso) / 24;
}
