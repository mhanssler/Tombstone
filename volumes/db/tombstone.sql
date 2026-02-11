-- Tombstone app schema for local/self-hosted Supabase.
-- This runs as part of the Supabase Postgres init/migrations flow.
-- Keep it idempotent so container rebuilds are safe.

BEGIN;

-- Used by Supabase internally; safe to enable.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core entities
CREATE TABLE IF NOT EXISTS public.children (
  "id" uuid PRIMARY KEY,
  "name" text NOT NULL,
  "birthDate" text,
  "photoUri" text,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  "id" uuid PRIMARY KEY,
  "childId" uuid NOT NULL REFERENCES public.children("id"),
  "startTime" bigint NOT NULL,
  "endTime" bigint,
  "type" text NOT NULL,
  "location" text,
  "notes" text,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.feeding_sessions (
  "id" uuid PRIMARY KEY,
  "childId" uuid NOT NULL REFERENCES public.children("id"),
  "startTime" bigint NOT NULL,
  "endTime" bigint,
  "type" text NOT NULL,
  "amount" integer,
  "vitaminD" boolean,
  "notes" text,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.pump_sessions (
  "id" uuid PRIMARY KEY,
  "childId" uuid NOT NULL REFERENCES public.children("id"),
  "startTime" bigint NOT NULL,
  "endTime" bigint,
  "amount" integer,
  "notes" text,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.diaper_changes (
  "id" uuid PRIMARY KEY,
  "childId" uuid NOT NULL REFERENCES public.children("id"),
  "time" bigint NOT NULL,
  "type" text NOT NULL,
  "notes" text,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.growth_measurements (
  "id" uuid PRIMARY KEY,
  "childId" uuid NOT NULL REFERENCES public.children("id"),
  "date" text NOT NULL,
  "weightKg" real,
  "heightCm" real,
  "headCircumferenceCm" real,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

-- Owlet readings (used by scripts/owlet_bridge.py and the app)
CREATE TABLE IF NOT EXISTS public.owlet_readings (
  "id" uuid PRIMARY KEY,
  "childId" uuid NOT NULL REFERENCES public.children("id"),
  "recordedAt" bigint NOT NULL,
  "heartRateBpm" integer,
  "oxygenSaturationPct" real,
  "movementLevel" real,
  "sleepState" text,
  "sockConnected" boolean,
  "batteryPct" real,
  "sourceDeviceId" text,
  "sourceSessionId" text,
  "rawPayload" jsonb,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "syncStatus" text DEFAULT 'synced',
  "_deleted" boolean DEFAULT false
);

-- Helpful indexes for sync and stats queries
CREATE INDEX IF NOT EXISTS idx_children_updatedAt ON public.children ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_child_start ON public.sleep_sessions ("childId", "startTime");
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_updatedAt ON public.sleep_sessions ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_child_start ON public.feeding_sessions ("childId", "startTime");
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_updatedAt ON public.feeding_sessions ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_pump_sessions_child_start ON public.pump_sessions ("childId", "startTime");
CREATE INDEX IF NOT EXISTS idx_pump_sessions_updatedAt ON public.pump_sessions ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_diaper_changes_child_time ON public.diaper_changes ("childId", "time");
CREATE INDEX IF NOT EXISTS idx_diaper_changes_updatedAt ON public.diaper_changes ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_growth_measurements_child_date ON public.growth_measurements ("childId", "date");
CREATE INDEX IF NOT EXISTS idx_growth_measurements_updatedAt ON public.growth_measurements ("updatedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_child_recorded
  ON public.owlet_readings ("childId", "recordedAt");
CREATE INDEX IF NOT EXISTS idx_owlet_readings_updated
  ON public.owlet_readings ("updatedAt");
CREATE INDEX IF NOT EXISTS idx_owlet_readings_source_session
  ON public.owlet_readings ("sourceSessionId");

-- RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pump_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaper_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owlet_readings ENABLE ROW LEVEL SECURITY;

-- Policies: app tables require an authenticated user (Supabase Auth).
DO $$
BEGIN
  -- children
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_authenticated_all\" ON public.children';
  EXECUTE 'CREATE POLICY \"tombstone_authenticated_all\" ON public.children FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';

  -- sleep_sessions
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_authenticated_all\" ON public.sleep_sessions';
  EXECUTE 'CREATE POLICY \"tombstone_authenticated_all\" ON public.sleep_sessions FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';

  -- feeding_sessions
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_authenticated_all\" ON public.feeding_sessions';
  EXECUTE 'CREATE POLICY \"tombstone_authenticated_all\" ON public.feeding_sessions FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';

  -- pump_sessions
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_authenticated_all\" ON public.pump_sessions';
  EXECUTE 'CREATE POLICY \"tombstone_authenticated_all\" ON public.pump_sessions FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';

  -- diaper_changes
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_authenticated_all\" ON public.diaper_changes';
  EXECUTE 'CREATE POLICY \"tombstone_authenticated_all\" ON public.diaper_changes FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';

  -- growth_measurements
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_authenticated_all\" ON public.growth_measurements';
  EXECUTE 'CREATE POLICY \"tombstone_authenticated_all\" ON public.growth_measurements FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';

  -- owlet_readings: allow anon and authenticated (intended for optional no-auth setups / ingestion scripts).
  EXECUTE 'DROP POLICY IF EXISTS \"tombstone_owlet_all\" ON public.owlet_readings';
  EXECUTE 'CREATE POLICY \"tombstone_owlet_all\" ON public.owlet_readings FOR ALL USING (auth.role() = ''anon'' OR auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''anon'' OR auth.role() = ''authenticated'')';
END
$$;

COMMIT;

