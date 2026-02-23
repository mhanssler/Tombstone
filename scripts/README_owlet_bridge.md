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

## 2. Setup (Windows PowerShell)

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

## 3. Setup (Ubuntu/Linux)

```bash
cd scripts
python3 -m venv .venv
./.venv/bin/pip install -r requirements-owlet-bridge.txt
cp .env.owlet-bridge.example .env.owlet-bridge
chmod +x run_owlet_bridge.sh
```

Edit `scripts/.env.owlet-bridge` with real values.

## 4. Run (foreground, Windows PowerShell)

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

## 5. Run (foreground, Ubuntu/Linux)

```bash
cd scripts
./run_owlet_bridge.sh
```

## 6. Run as a daemon on Windows (Scheduled Task)

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

## 7. Run as a daemon on Ubuntu/Linux (systemd user service)

Create a user service:

```bash
REPO_PATH="$HOME/code/Tombstone" # adjust if your clone is elsewhere
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/owlet-bridge.service <<'EOF'
[Unit]
Description=Owlet Bridge (Tombstone)
Wants=network-online.target
After=network-online.target
ConditionPathExists=__REPO_PATH__/scripts/.env.owlet-bridge

[Service]
Type=simple
WorkingDirectory=__REPO_PATH__/scripts
ExecStart=__REPO_PATH__/scripts/run_owlet_bridge.sh
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF
sed -i "s|__REPO_PATH__|$REPO_PATH|g" ~/.config/systemd/user/owlet-bridge.service
```

Enable boot persistence and start:

```bash
loginctl enable-linger "$USER"
systemctl --user daemon-reload
systemctl --user enable --now owlet-bridge.service
```

Manage service:

```bash
systemctl --user status owlet-bridge.service --no-pager
systemctl --user restart owlet-bridge.service
journalctl --user -u owlet-bridge.service -f
```

## 8. Verify Data

In Supabase SQL editor:

```sql
select recordedAt, heartRateBpm, oxygenSaturationPct, movementLevel, sleepState
from owlet_readings
order by recordedAt desc
limit 20;
```

Quick one-command health check:

```powershell
cd scripts
.\check_owlet_pipeline.ps1
```

Optional custom freshness threshold (minutes):

```powershell
.\check_owlet_pipeline.ps1 -StaleMinutes 10
```

This script validates:
- latest `owlet_readings.recordedAt` is fresh enough
- recent row count within the threshold window
- current `sleepState` and `sockConnected` values

Exit codes:
- `0` healthy/fresh
- `1` stale data
- `2` no rows found
- `3` cannot reach Supabase endpoint

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
