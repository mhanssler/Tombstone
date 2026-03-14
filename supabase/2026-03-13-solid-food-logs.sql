-- Solid food logs table for tracking baby solid food introductions.
-- foodItems is stored as JSONB (embedded array of {foodId, name, category, isAllergen, allergenGroup}).

CREATE TABLE IF NOT EXISTS public.solid_food_logs (
  id           TEXT PRIMARY KEY,
  "childId"    TEXT NOT NULL REFERENCES public.children(id),
  "time"       BIGINT NOT NULL,          -- Unix timestamp ms
  "mealType"   TEXT NOT NULL,             -- breakfast | lunch | dinner | snack
  "foodItems"  JSONB NOT NULL DEFAULT '[]',
  notes        TEXT,
  reaction     TEXT,                       -- none | mild | moderate | severe
  "reactionNotes" TEXT,
  "createdAt"  BIGINT NOT NULL,
  "updatedAt"  BIGINT NOT NULL,
  "syncStatus" TEXT NOT NULL DEFAULT 'synced',
  _deleted     BOOLEAN NOT NULL DEFAULT false
);

-- Indexes matching the Dexie schema and common query patterns
CREATE INDEX IF NOT EXISTS idx_solid_food_logs_child_time
  ON public.solid_food_logs ("childId", "time");

CREATE INDEX IF NOT EXISTS idx_solid_food_logs_updated
  ON public.solid_food_logs ("updatedAt");

CREATE INDEX IF NOT EXISTS idx_solid_food_logs_sync
  ON public.solid_food_logs ("syncStatus");

-- RLS: shared family access (matches existing table pattern)
ALTER TABLE public.solid_food_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tombstone shared access" ON public.solid_food_logs;
CREATE POLICY "Tombstone shared access"
  ON public.solid_food_logs
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.solid_food_logs;
