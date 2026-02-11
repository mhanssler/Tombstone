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

## 3. Run (foreground)

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

## 4. Run as a daemon on Windows (Scheduled Task)

Install/update the task:

```powershell
cd scripts
.\install_owlet_bridge_task.ps1 -RunNow
```

If you want it to run under `SYSTEM` instead of your login:

```powershell
.\install_owlet_bridge_task.ps1 -RunNow -UseSystemAccount
```

Manage task lifecycle:

```powershell
.\manage_owlet_bridge_task.ps1 -Action status
.\manage_owlet_bridge_task.ps1 -Action stop
.\manage_owlet_bridge_task.ps1 -Action start
.\manage_owlet_bridge_task.ps1 -Action logs -Tail 200
.\manage_owlet_bridge_task.ps1 -Action remove
```

The task executes `run_owlet_bridge.ps1`, which writes logs to:

- `scripts/owlet_bridge.log`

## 5. Verify Data

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
- For local Docker Supabase, use:
  - `SUPABASE_URL=http://localhost:54321`
  - `SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from .env.docker>`
