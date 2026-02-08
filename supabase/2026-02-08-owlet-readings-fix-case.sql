-- Fix Owlet column casing to match Tombstone app payload keys.
-- Run this if you created owlet_readings with unquoted camelCase names.

ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN childid TO "childId";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN recordedat TO "recordedAt";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN heartratebpm TO "heartRateBpm";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN oxygensaturationpct TO "oxygenSaturationPct";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN movementlevel TO "movementLevel";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN sleepstate TO "sleepState";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN sockconnected TO "sockConnected";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN batterypct TO "batteryPct";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN sourcedeviceid TO "sourceDeviceId";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN sourcesessionid TO "sourceSessionId";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN rawpayload TO "rawPayload";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN createdat TO "createdAt";
ALTER TABLE IF EXISTS owlet_readings RENAME COLUMN updatedat TO "updatedAt";

DROP INDEX IF EXISTS idx_owlet_readings_child_recorded;
DROP INDEX IF EXISTS idx_owlet_readings_updated;
DROP INDEX IF EXISTS idx_owlet_readings_source_session;

CREATE INDEX IF NOT EXISTS idx_owlet_readings_child_recorded
  ON owlet_readings("childId", "recordedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_updated
  ON owlet_readings("updatedAt");

CREATE INDEX IF NOT EXISTS idx_owlet_readings_source_session
  ON owlet_readings("sourceSessionId");
