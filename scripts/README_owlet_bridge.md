# Owlet Bridge

This bridge polls the Owlet API and writes snapshots into Supabase table `owlet_readings` for Tombstone.

## 1. Prerequisites

- Run SQL migration first: `supabase/2026-02-08-owlet-readings.sql`
- Python 3.10+
- A Supabase service role key (server-side only)

## 2. Setup

```powershell
cd scripts
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-owlet-bridge.txt
Copy-Item .env.owlet-bridge.example .env.owlet-bridge
```

Edit `scripts/.env.owlet-bridge` with real values.

## 3. Run

```powershell
cd scripts
.\.venv\Scripts\Activate.ps1
Get-Content .env.owlet-bridge | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $name, $value = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($name, $value)
}
python owlet_bridge.py
```

## 4. Verify Data

In Supabase SQL editor:

```sql
select recordedAt, heartRateBpm, oxygenSaturationPct, movementLevel, sleepState
from owlet_readings
order by recordedAt desc
limit 20;
```

## Notes

- Uses deterministic UUID from `DSN:timestamp` to dedupe upserts.
- Runs indefinitely and re-authenticates on recoverable errors.
- Keep this process on a trusted machine; service role key has elevated permissions.
