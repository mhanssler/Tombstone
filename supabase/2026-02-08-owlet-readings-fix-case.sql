-- Fix Owlet column casing to match Tombstone payload keys.
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='childid') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN childid TO "childId"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='recordedat') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN recordedat TO "recordedAt"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='heartratebpm') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN heartratebpm TO "heartRateBpm"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='oxygensaturationpct') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN oxygensaturationpct TO "oxygenSaturationPct"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='movementlevel') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN movementlevel TO "movementLevel"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='sleepstate') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN sleepstate TO "sleepState"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='sockconnected') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN sockconnected TO "sockConnected"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='batterypct') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN batterypct TO "batteryPct"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='sourcedeviceid') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN sourcedeviceid TO "sourceDeviceId"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='sourcesessionid') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN sourcesessionid TO "sourceSessionId"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='rawpayload') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN rawpayload TO "rawPayload"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='createdat') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN createdat TO "createdAt"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='updatedat') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN updatedat TO "updatedAt"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owlet_readings' AND column_name='syncstatus') THEN
    EXECUTE 'ALTER TABLE owlet_readings RENAME COLUMN syncstatus TO "syncStatus"';
  END IF;
END
$$;

DROP INDEX IF EXISTS idx_owlet_readings_child_recorded;
DROP INDEX IF EXISTS idx_owlet_readings_updated;
DROP INDEX IF EXISTS idx_owlet_readings_source_session;

CREATE INDEX IF NOT EXISTS idx_owlet_readings_child_recorded
  ON owlet_readings("childId", "recordedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_updated
  ON owlet_readings("updatedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_source_session
  ON owlet_readings("sourceSessionId");
