#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.owlet-bridge"
LOG_FILE="$SCRIPT_DIR/owlet_bridge.log"
SERVICE_NAME="my-daemon"
STALE_MINUTES=5

usage() {
  cat <<'USAGE'
Usage: check_owlet_pipeline.sh [options]

Options:
  --env-file <path>       Path to bridge env file (default: scripts/.env.owlet-bridge)
  --log-file <path>       Path to bridge log file (default: scripts/owlet_bridge.log)
  --service <name>        systemd service name (default: my-daemon)
  --stale-minutes <int>   Freshness threshold in minutes (default: 5)
  -h, --help              Show this help

Exit codes:
  0 healthy/fresh
  1 stale Supabase data
  2 no Supabase rows found
  3 Supabase unreachable/API failure
  4 daemon not running
  5 config/env problem
  6 no recent upsert found in log
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --log-file)
      LOG_FILE="${2:-}"
      shift 2
      ;;
    --service)
      SERVICE_NAME="${2:-}"
      shift 2
      ;;
    --stale-minutes)
      STALE_MINUTES="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 5
      ;;
  esac
done

if ! [[ "$STALE_MINUTES" =~ ^[0-9]+$ ]]; then
  echo "Invalid --stale-minutes value: $STALE_MINUTES" >&2
  exit 5
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "FAIL: Bridge env file not found: $ENV_FILE"
  exit 5
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "FAIL: systemctl not available on this host."
  exit 5
fi

if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "FAIL: Service is not active: $SERVICE_NAME"
  systemctl status "$SERVICE_NAME" --no-pager -l | sed -n '1,20p' || true
  exit 4
fi

LOG_CHECK_OUTPUT="$(python3 - "$LOG_FILE" "$STALE_MINUTES" <<'PY'
import os
import re
import sys
from datetime import datetime

log_path = sys.argv[1]
stale_minutes = int(sys.argv[2])
marker = "INFO Upserted"

if not os.path.exists(log_path):
    print(f"FAIL: Bridge log not found: {log_path}")
    sys.exit(6)

def find_last_matching_line(path: str, text: str) -> str | None:
    chunk_size = 8192
    with open(path, "rb") as f:
        f.seek(0, os.SEEK_END)
        pos = f.tell()
        remainder = b""
        while pos > 0:
            read_size = min(chunk_size, pos)
            pos -= read_size
            f.seek(pos)
            block = f.read(read_size)
            data = block + remainder
            lines = data.splitlines()
            if pos > 0:
                remainder = lines[0] if lines else b""
                lines = lines[1:]
            else:
                remainder = b""
            for raw in reversed(lines):
                line = raw.decode("utf-8", errors="replace")
                if text in line:
                    return line
    return None

line = find_last_matching_line(log_path, marker)
if not line:
    print(f"FAIL: No 'Upserted' entries found in log: {log_path}")
    sys.exit(6)

match = re.match(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+INFO\s+Upserted", line)
if not match:
    print(f"FAIL: Could not parse latest upsert log timestamp.\nLine: {line}")
    sys.exit(6)

ts = datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S,%f")
age_min = (datetime.now() - ts).total_seconds() / 60.0
print(f"Latest upsert log age: {age_min:.1f} minutes (threshold: {stale_minutes})")
if age_min > stale_minutes:
    print(f"FAIL: Latest upsert log is stale (> {stale_minutes} minutes).")
    sys.exit(6)
sys.exit(0)
PY
)"
LOG_CHECK_CODE=$?
echo "$LOG_CHECK_OUTPUT"
if [[ $LOG_CHECK_CODE -ne 0 ]]; then
  exit $LOG_CHECK_CODE
fi

python3 - "$ENV_FILE" "$STALE_MINUTES" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests

env_file = Path(sys.argv[1])
stale_minutes = int(sys.argv[2])

def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        values[name] = value
    return values

def fail(msg: str, code: int) -> None:
    print(msg)
    raise SystemExit(code)

values = load_env(env_file)
supabase_url = values.get("SUPABASE_URL", "").rstrip("/")
service_key = values.get("SUPABASE_SERVICE_ROLE_KEY", "")
child_id = values.get("TOMBSTONE_CHILD_ID", "").strip()

if not supabase_url:
    fail("FAIL: Missing SUPABASE_URL in env file.", 5)
if not service_key:
    fail("FAIL: Missing SUPABASE_SERVICE_ROLE_KEY in env file.", 5)

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
}

latest_url = (
    f"{supabase_url}/rest/v1/owlet_readings"
    "?select=id,childId,recordedAt,updatedAt,sleepState,sockConnected,heartRateBpm,oxygenSaturationPct"
    "&order=recordedAt.desc.nullslast&limit=1"
)
if child_id:
    latest_url += f"&childId=eq.{quote(child_id)}"

try:
    latest_resp = requests.get(latest_url, headers=headers, timeout=20)
except Exception as exc:
    fail(f"FAIL: Could not reach Supabase REST endpoint.\nURL: {supabase_url}\nError: {exc}", 3)

if latest_resp.status_code >= 400:
    body_preview = latest_resp.text.strip().replace("\n", " ")[:220]
    fail(
        "FAIL: Supabase query failed.\n"
        f"URL: {supabase_url}\n"
        f"Status: {latest_resp.status_code}\n"
        f"Body: {body_preview}",
        3,
    )

rows = latest_resp.json()
if not rows:
    msg = "FAIL: No owlet_readings rows found."
    if child_id:
        msg += f"\nChecked childId: {child_id}"
    fail(msg, 2)

row = rows[0]
recorded_at = int(row["recordedAt"])
recorded_dt = datetime.fromtimestamp(recorded_at / 1000.0, tz=timezone.utc)
now_utc = datetime.now(timezone.utc)
age_min = (now_utc - recorded_dt).total_seconds() / 60.0
is_fresh = age_min <= stale_minutes

window_start_ms = int((now_utc.timestamp() * 1000) - (stale_minutes * 60 * 1000))
recent_url = (
    f"{supabase_url}/rest/v1/owlet_readings"
    f"?select=id&recordedAt=gte.{window_start_ms}&order=recordedAt.desc.nullslast&limit=200"
)
if child_id:
    recent_url += f"&childId=eq.{quote(child_id)}"

recent_count = 0
try:
    recent_resp = requests.get(recent_url, headers=headers, timeout=20)
    if recent_resp.status_code < 400:
        recent_count = len(recent_resp.json())
    else:
        print(
            "WARN: Could not query recent window; continuing with latest row only.\n"
            f"Status: {recent_resp.status_code}"
        )
except Exception as exc:
    print(f"WARN: Could not query recent window; continuing with latest row only.\nError: {exc}")

status = "PASS" if is_fresh else "FAIL"
print(f"{status}: Owlet pipeline health check")
print(f"Service: active")
print(f"Latest recordedAt (UTC): {recorded_dt.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Age: {age_min:.1f} minutes (threshold: {stale_minutes} minutes)")
print(f"Rows in last {stale_minutes} minutes: {recent_count}")
print(f"Latest sleepState: {row.get('sleepState') if row.get('sleepState') is not None else 'unknown'}")
sock = row.get("sockConnected")
print(f"Latest sockConnected: {sock if sock is not None else 'unknown'}")
if row.get("heartRateBpm") is not None:
    print(f"Latest HR: {row.get('heartRateBpm')} bpm")
if row.get("oxygenSaturationPct") is not None:
    print(f"Latest SpO2: {row.get('oxygenSaturationPct')}%")
if child_id:
    print(f"childId filter: {child_id}")

raise SystemExit(0 if is_fresh else 1)
PY
