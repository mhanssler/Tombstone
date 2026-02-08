-- Allow Tombstone app (anon key) to read/write owlet_readings.
-- Use only if your app is intentionally running without user auth.

ALTER TABLE IF EXISTS owlet_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON owlet_readings;
DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON owlet_readings;

CREATE POLICY "Allow all for anon and authenticated"
  ON owlet_readings
  FOR ALL
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');
