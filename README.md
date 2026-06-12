# AgriMart v4 — Live Data Pipeline

**Pre-season crop decision system for Botswana horticulture**, now powered end-to-end by live data:
no hardcoded intelligence values are shown to users.

| Signal | Source | Refresh |
|---|---|---|
| Supply index | Real farmer planting declarations ÷ district capacity ceiling | Real-time |
| Demand index | FAO FAOSTAT national production (area 20 = Botswana) | Weekly |
| Climate / soil risk | Open-Meteo forecast + soil moisture (8 districts, 1 batched call) | Every 6 h |
| NDVI vigour | NASA MODIS MOD13Q1 250 m pixel, ET-proxy fallback | Weekly |
| Roads & water | OSM Overpass (Botswana bbox) | Daily / weekly |
| Market volatility | Manual price entries + automatic drop-signal (+15 when >20 % below 30-day average) | On change |
| Pest pressure | Calibrated static (`STATIC_PENDING_FAMEWS_API`) | — |

---

## Quick start

```bash
yarn install
cp .env.example .env.local   # fill in Supabase keys (required)
yarn dev
# → http://localhost:3000/login
```

### Setup (required)

1. Create a [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor (tables, RLS, triggers, capacity seeds).
3. In Supabase **Authentication → Providers**, enable Email.
4. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus `ADMIN_SECRET` / `CRON_SECRET`.
5. `yarn dev` → create an account at `/login` → open `/admin` and **Refresh now** on each data source.

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Email + password sign-in / sign-up (Supabase Auth → PostgreSQL) |
| `/` | Profile | Supply Check — live supply/demand signal with provenance badge (live / partial / baseline) |
| `/risk` | Profile | Risk Monitor — live field intelligence (soil moisture, temp, NDVI, nearest road node) + 5-dimension risk engine |
| `/map` | Profile | Leaflet map — live OSM roads & water sources, market zones |
| `/forecast` | Profile | My Farm — viability engine, PDF export, **planting declaration** (feeds the supply signal) |
| `/profile` | Profile | Edit profile, sign out (hidden roadmap: tap logo 5×) |
| `/admin` | `ADMIN_SECRET` | Ops console — source freshness grid, refresh buttons, market prices, capacity calibration, intentions export |

## API routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/supply-signal` | GET | Live supply/demand signal per district+crop |
| `/api/planting-intentions` | GET, POST | Aggregate / submit farmer declarations |
| `/api/risk-scores` | GET, POST | 5-dimension risk (cached 24 h); `?refresh=all` for cron |
| `/api/fetch/weather` | GET, POST | Field intel cache read / Open-Meteo refresh |
| `/api/fetch/osm` | GET, POST | OSM layer cache read / Overpass refresh |
| `/api/fetch/faostat` | GET, POST | FAOSTAT cache read / refresh |
| `/api/whatsapp/webhook` | GET, POST | Meta Cloud API: verify handshake / inbound farmer messages |
| `/api/whatsapp/link-code` | GET, POST | Link status / generate one-time account-link code (authenticated) |
| `/api/admin/*` | — | Console: status, market prices, capacity, intentions, CSV export, login |

Cron routes accept `Authorization: Bearer ${CRON_SECRET}` (Vercel cron sends GET — handled).
All refresh routes return `{ ok, count, duration_ms }` with HTTP 200 even on failure and log to
`refresh_log`.

## Data freshness rules

| Data | Max age | When stale |
|---|---|---|
| Open-Meteo weather | 6 h | ⚠ badge shown, last value still displayed |
| OSM water/traffic | 7 d | Static fallback used silently |
| FAOSTAT | 90 d | Last cached value, no warning |
| Risk scores | 24 h | Recomputed on demand |
| Market prices | none | recorded_at always shown |
| NDVI | 7 d | ET-based proxy used, noted in UI |

## WhatsApp farmer channel

Linked farmers can query **Supply Check** and **Risk Monitor** from WhatsApp using a
numbered text menu — the bot calls the same Postgres-backed engines as the web app.

**Identity (web-first + link code):**

1. Farmer registers at `/login` and saves a phone number on the Profile page.
2. Profile page generates a 6-digit link code (15-minute TTL, single use).
3. Farmer messages the AgriMart WhatsApp number: `LINK 482910`.
4. The bot binds the Meta `wa_id` to the profile. Only linked numbers can run Supply / Risk flows.

**Bot commands:** `MENU` / `HELP` (main menu), `1` Supply check, `2` Risk monitor,
`3` Link status, `0` back, `LINK <code>` to connect an account.

### Meta / Vercel setup

1. Create a Meta WhatsApp Business app and add a phone number.
2. Set the webhook URL to `https://<your-domain>/api/whatsapp/webhook` and subscribe to the `messages` field.
3. Use the same string for `WHATSAPP_VERIFY_TOKEN` in `.env` and in the Meta webhook config.
4. Add to Vercel (or `.env.local`): `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, and optionally `NEXT_PUBLIC_WHATSAPP_NUMBER`.
5. Local dev: expose the webhook with an ngrok/cloudflared tunnel.

Inbound posts are validated against `WHATSAPP_APP_SECRET` (`X-Hub-Signature-256`). The webhook
always returns `200` quickly to avoid Meta retry storms; non-text messages get a "text only" reply.

## Architecture

```
agrimart/
├── app/
│   ├── page.jsx                 Supply Check (live signal + provenance)
│   ├── risk/                    Risk Monitor (live field intel, skeletons, staleness)
│   ├── map/ · forecast/ · profile/ · login/ · about/
│   ├── admin/                   Ops console (dark theme, ADMIN_SECRET gate)
│   └── api/                     Pipeline + admin routes
├── components/                  UI kit (SourceIndicator, FreshnessTag, …)
├── lib/
│   ├── data.js                  Static product data + clearly-flagged baselines
│   ├── districtCoords.js        District centroids (Open-Meteo / MODIS lookups)
│   └── server/
│       ├── fetchers/            openMeteo · overpass · faostat · modis
│       ├── signals.js           Supply/demand engine
│       ├── riskEngine.js        5-dimension risk engine
│       ├── fieldIntel.js        Per-district intel composition + caching
│       ├── whatsapp/            Cloud API client, formatters, bot state machine, account linking
│       ├── pipeline.js          Refresh orchestrators + refresh_log
│       └── db.js                Supabase (service-role) persistence layer
├── supabase/schema.sql          Tables, RLS, market-price trigger, capacity seeds
├── middleware.js                /admin gate (cookie or ?token=)
└── vercel.json                  5 cron schedules
```

---

*AgriMart v4 — Botswana 2026. All external APIs are free; no keys required (MODIS key optional).*
