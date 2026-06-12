-- ════════════════════════════════════════════════════════════════════════════
-- AgriMart v4 — Supabase schema
-- Run in the Supabase SQL editor (or psql) against a fresh project.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Farmer accounts (extends Supabase auth.users) ───────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  district      TEXT NOT NULL DEFAULT 'central',
  farm_name     TEXT,
  phone         TEXT,
  whatsapp_wa_id            TEXT UNIQUE,      -- Meta sender ID once linked
  whatsapp_linked_at        TIMESTAMPTZ,
  whatsapp_link_code        TEXT,             -- one-time 6-digit code
  whatsapp_link_expires_at  TIMESTAMPTZ,      -- code TTL (15 min)
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Idempotent upgrade for existing projects
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_wa_id           TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_linked_at       TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_link_code       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_link_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS farm_settings (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  crop          TEXT NOT NULL DEFAULT 'tomato',
  hectares      NUMERIC NOT NULL DEFAULT 2,
  water_source  TEXT NOT NULL DEFAULT 'borehole',
  investment    TEXT NOT NULL DEFAULT 'medium',
  labor         TEXT NOT NULL DEFAULT 'family',
  soil_health   TEXT NOT NULL DEFAULT 'average',
  market_target TEXT NOT NULL DEFAULT 'local',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp conversation state (service-role only; the webhook owns it)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  wa_id       TEXT PRIMARY KEY,
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  step        TEXT NOT NULL DEFAULT 'menu',  -- menu | supply_district | supply_crop | risk_district | risk_crop
  context     JSONB DEFAULT '{}'::jsonb,     -- { district }
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Real farmer planting declarations: the proprietary supply-side signal
CREATE TABLE IF NOT EXISTS planting_intentions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  season_year     INTEGER NOT NULL,
  district        TEXT NOT NULL,
  crop            TEXT NOT NULL,
  hectares        NUMERIC NOT NULL CHECK (hectares > 0),
  planting_month  TEXT,
  market_target   TEXT,
  farmer_name     TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intentions_lookup
  ON planting_intentions (season_year, district, crop);
CREATE INDEX IF NOT EXISTS idx_intentions_user
  ON planting_intentions (user_id, season_year);

-- Manually-observed market prices (admin panel entry)
CREATE TABLE IF NOT EXISTS market_prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district      TEXT NOT NULL,
  crop          TEXT NOT NULL,
  price_bwp_kg  NUMERIC NOT NULL CHECK (price_bwp_kg > 0),
  source        TEXT,
  recorded_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prices_lookup ON market_prices (district, crop, recorded_at);

-- Computed five-dimension risk scores per district × crop (TTL 24h)
CREATE TABLE IF NOT EXISTS risk_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district         TEXT NOT NULL,
  crop             TEXT NOT NULL,
  soil_score       NUMERIC,
  climate_score    NUMERIC,
  logistics_score  NUMERIC,
  pest_score       NUMERIC,
  market_score     NUMERIC,
  market_bump      NUMERIC DEFAULT 0,  -- raised by the market-price drop trigger
  meta             JSONB,
  computed_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (district, crop)
);

-- ─── Data pipeline cache tables (addendum) ───────────────────────────────────

-- District production capacity ceilings (used to normalise supply index)
-- Admin-editable via the admin panel
CREATE TABLE IF NOT EXISTS district_capacity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district    TEXT NOT NULL,
  crop        TEXT NOT NULL,
  max_ha      NUMERIC NOT NULL DEFAULT 500,   -- estimated max cultivatable hectares
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(district, crop)
);

-- FAO FAOSTAT production data cache
CREATE TABLE IF NOT EXISTS faostat_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop        TEXT NOT NULL,
  year        INTEGER NOT NULL,
  production_tonnes NUMERIC,
  area_ha     NUMERIC,
  source_url  TEXT,
  fetched_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crop, year)
);

-- Open-Meteo field intelligence cache (per district, TTL 6h)
CREATE TABLE IF NOT EXISTS field_intel_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district    TEXT NOT NULL UNIQUE,
  moisture    NUMERIC,
  temp        NUMERIC,
  ndvi        NUMERIC,
  raw_response JSONB,
  fetched_at  TIMESTAMPTZ DEFAULT now()
);

-- MODIS NDVI cache (per district, TTL 7d)
CREATE TABLE IF NOT EXISTS ndvi_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district    TEXT NOT NULL UNIQUE,
  ndvi_value  NUMERIC,
  pixel_date  DATE,
  fetched_at  TIMESTAMPTZ DEFAULT now()
);

-- OSM feature cache (water points, traffic nodes)
CREATE TABLE IF NOT EXISTS osm_cache (
  key         TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ DEFAULT now()
);

-- Refresh audit log (quality rule 9)
CREATE TABLE IF NOT EXISTS refresh_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL,
  triggered_by  TEXT NOT NULL DEFAULT 'admin',  -- 'cron' | 'admin'
  record_count  INTEGER DEFAULT 0,
  duration_ms   INTEGER DEFAULT 0,
  error         TEXT,
  run_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── Market price → risk score auto-signal ───────────────────────────────────
-- After any insert into market_prices: if the new price is >20% below the
-- 30-day rolling average for that crop+district, market_score += 15 (cap 95).

CREATE OR REPLACE FUNCTION apply_market_price_signal()
RETURNS TRIGGER AS $$
DECLARE
  rolling_avg NUMERIC;
  sample_count INTEGER;
BEGIN
  SELECT AVG(price_bwp_kg), COUNT(*)
    INTO rolling_avg, sample_count
    FROM market_prices
   WHERE crop = NEW.crop
     AND district = NEW.district
     AND recorded_at >= CURRENT_DATE - INTERVAL '30 days'
     AND id <> NEW.id;

  IF sample_count >= 2 AND NEW.price_bwp_kg < rolling_avg * 0.8 THEN
    INSERT INTO risk_scores (district, crop, market_score, market_bump, computed_at)
    VALUES (NEW.district, NEW.crop, LEAST(95, 50 + 15), 15, now())
    ON CONFLICT (district, crop) DO UPDATE
      SET market_score = LEAST(95, COALESCE(risk_scores.market_score, 50) + 15),
          market_bump  = COALESCE(risk_scores.market_bump, 0) + 15,
          computed_at  = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_market_price_signal ON market_prices;
CREATE TRIGGER trg_market_price_signal
  AFTER INSERT ON market_prices
  FOR EACH ROW EXECUTE FUNCTION apply_market_price_signal();

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Cache tables: service-role write, authenticated read-only.
-- planting_intentions: anyone may insert (anonymous farmer submissions),
-- reads are aggregate-only through the API (service role).

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE planting_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_capacity   ENABLE ROW LEVEL SECURITY;
ALTER TABLE faostat_cache       ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_intel_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndvi_cache          ENABLE ROW LEVEL SECURITY;
ALTER TABLE osm_cache           ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_log         ENABLE ROW LEVEL SECURITY;

-- Authenticated (and anon) clients may read cached intelligence
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'risk_scores','district_capacity','faostat_cache',
    'field_intel_cache','ndvi_cache','osm_cache'
  ] LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_read" ON %I;
       CREATE POLICY "%s_read" ON %I FOR SELECT TO authenticated, anon USING (true);',
      t, t, t, t
    );
  END LOOP;
END $$;

-- Profiles: users read/update own row only
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Farm settings: users read/write own row
DROP POLICY IF EXISTS "farm_select_own" ON farm_settings;
CREATE POLICY "farm_select_own" ON farm_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "farm_upsert_own" ON farm_settings;
CREATE POLICY "farm_upsert_own" ON farm_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Planting intentions: authenticated farmers insert own; aggregates via service role API
DROP POLICY IF EXISTS "intentions_insert" ON planting_intentions;
CREATE POLICY "intentions_insert" ON planting_intentions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "intentions_select_own" ON planting_intentions;
CREATE POLICY "intentions_select_own" ON planting_intentions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- market_prices, refresh_log and whatsapp_sessions: service-role only (no client policies)

-- ─── Seed: district capacity defaults ────────────────────────────────────────
-- Reasonable agronomic starting points; calibrate via /admin/district-capacity.

INSERT INTO district_capacity (district, crop, max_ha) VALUES
  ('gaborone','tomato',150),('gaborone','cabbage',135),('gaborone','onion',120),('gaborone','potato',165),('gaborone','carrot',90),('gaborone','sorghum',360),('gaborone','beans',180),('gaborone','spinach',75),
  ('kweneng','tomato',450),('kweneng','cabbage',405),('kweneng','onion',360),('kweneng','potato',495),('kweneng','carrot',270),('kweneng','sorghum',1080),('kweneng','beans',540),('kweneng','spinach',225),
  ('central','tomato',800),('central','cabbage',720),('central','onion',640),('central','potato',880),('central','carrot',480),('central','sorghum',1920),('central','beans',960),('central','spinach',400),
  ('kgalagadi','tomato',200),('kgalagadi','cabbage',180),('kgalagadi','onion',160),('kgalagadi','potato',220),('kgalagadi','carrot',120),('kgalagadi','sorghum',480),('kgalagadi','beans',240),('kgalagadi','spinach',100),
  ('ngamiland','tomato',400),('ngamiland','cabbage',360),('ngamiland','onion',320),('ngamiland','potato',440),('ngamiland','carrot',240),('ngamiland','sorghum',960),('ngamiland','beans',480),('ngamiland','spinach',200),
  ('chobe','tomato',250),('chobe','cabbage',225),('chobe','onion',200),('chobe','potato',275),('chobe','carrot',150),('chobe','sorghum',600),('chobe','beans',300),('chobe','spinach',125),
  ('northeast','tomato',350),('northeast','cabbage',315),('northeast','onion',280),('northeast','potato',385),('northeast','carrot',210),('northeast','sorghum',840),('northeast','beans',420),('northeast','spinach',175),
  ('southern','tomato',500),('southern','cabbage',450),('southern','onion',400),('southern','potato',550),('southern','carrot',300),('southern','sorghum',1200),('southern','beans',600),('southern','spinach',250)
ON CONFLICT (district, crop) DO NOTHING;
