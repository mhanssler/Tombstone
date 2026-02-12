# Owlet Bridge

This bridge polls the Owlet API and writes snapshots into Supabase table `owlet_readings` for Tombstone.

## 1. Prerequisites

- Run SQL migration first: `supabase/2026-02-08-owlet-readings.sql`
- Python 3.10+
- A Supabase service role key (server-side only)

## Key Placement Rules

Use these exact mappings:

| Purpose | Env var | Allowed location |
| --- | --- | --- |
| Supabase URL | `SUPABASE_URL` | `scripts/.env.owlet-bridge` and frontend `VITE_SUPABASE_URL` |
| Bridge writer key | `SUPABASE_SERVICE_ROLE_KEY` | `scripts/.env.owlet-bridge` only |
| Frontend key | `VITE_SUPABASE_ANON_KEY` | Frontend/Vercel only (never in bridge writer var) |

Do not swap key types:

- Bridge writes require `service_role`.
- Frontend uses `anon`.
- If `service_role` is exposed in client-side env, rotate it immediately.

## 2. Setup

```powershell
cd scripts
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-owlet-bridge.txt
Copy-Item .env.owlet-bridge.example .env.owlet-bridge
```

Edit `scripts/.env.owlet-bridge` with real values.

Minimum required values:

```env
OWLET_EMAIL=you@example.com
OWLET_PASSWORD=your-owlet-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

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

## Troubleshooting

- `Supabase upsert failed (401): Invalid API key`
  - URL/key mismatch, typo, or rotated key.
  - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` belong to the same Supabase project.
- `Supabase upsert failed (401): ... code 42501 ... row-level security`
  - Usually means anon/authenticated key was used for bridge writes.
  - Set `SUPABASE_SERVICE_ROLE_KEY` to the actual service role key.
