-- Owlet readings table for synced monitor snapshots
CREATE TABLE IF NOT EXISTS owlet_readings (
  id UUID PRIMARY KEY,
  "childId" UUID NOT NULL REFERENCES children(id),
  "recordedAt" BIGINT NOT NULL,
  "heartRateBpm" INTEGER,
  "oxygenSaturationPct" REAL,
  "movementLevel" REAL,
  "sleepState" TEXT,
  "sockConnected" BOOLEAN,
  "batteryPct" REAL,
  "sourceDeviceId" TEXT,
  "sourceSessionId" TEXT,
  "rawPayload" JSONB,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  syncStatus TEXT DEFAULT 'synced',
  _deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_owlet_readings_child_recorded
  ON owlet_readings("childId", "recordedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_updated
  ON owlet_readings("updatedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_source_session
  ON owlet_readings("sourceSessionId");

ALTER TABLE owlet_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON owlet_readings;
DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON owlet_readings;
CREATE POLICY "Allow all for anon and authenticated"
  ON owlet_readings
  FOR ALL
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');
