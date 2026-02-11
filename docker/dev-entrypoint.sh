#!/bin/sh
set -eu

cd /app

# If node_modules volume is empty, install deps once.
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
  npm ci
fi

exec npm run dev -- --host 0.0.0.0 --port 5173

