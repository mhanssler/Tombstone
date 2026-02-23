#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
env_file="${1:-$script_dir/.env.owlet-bridge}"
python_exe="$script_dir/.venv/bin/python"
bridge_script="$script_dir/owlet_bridge.py"
log_file="$script_dir/owlet_bridge.log"

if [[ ! -x "$python_exe" ]]; then
  echo "Python venv not found at $python_exe" >&2
  exit 1
fi
if [[ ! -f "$bridge_script" ]]; then
  echo "Bridge script not found at $bridge_script" >&2
  exit 1
fi
if [[ ! -f "$env_file" ]]; then
  echo "Bridge env file not found at $env_file" >&2
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[[:space:]]*$ ]] && continue

  name="${line%%=*}"
  value="${line#*=}"
  name="$(printf '%s' "$name" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  value="$(printf '%s' "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

  if [[ "$value" =~ ^\".*\"$ ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  fi

  export "$name=$value"
done < "$env_file"

cd "$script_dir"
exec "$python_exe" -u "$bridge_script" >>"$log_file" 2>&1
