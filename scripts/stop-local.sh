#!/usr/bin/env bash
# Stop processes started by scripts/start-local.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT_DIR/.local_pids"

if [ -f "$PID_FILE" ]; then
  echo "Stopping local processes listed in $PID_FILE"
  while read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Killing PID $pid"
      kill "$pid" || true
    fi
  done < "$PID_FILE" || true
  rm -f "$PID_FILE"
  echo "Stopped. You can remove logs in .local_logs if desired."
else
  echo "No pid file found at $PID_FILE. Nothing to stop."
fi
