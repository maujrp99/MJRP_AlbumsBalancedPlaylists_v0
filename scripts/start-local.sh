#!/usr/bin/env bash
# Start the server proxy (server/) and a static file server (public/) in background
# Usage: ./scripts/start-local.sh
# Stops previous pids recorded in .local_pids if present

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
PUBLIC_DIR="$ROOT_DIR/public"
LOG_DIR="$ROOT_DIR/.local_logs"
PID_FILE="$ROOT_DIR/.local_pids"

mkdir -p "$LOG_DIR"

echo "Stopping previous local servers if any..."
if [ -f "$PID_FILE" ]; then
  while read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Killing PID $pid" || true
      kill "$pid" || true
    fi
  done < "$PID_FILE" || true
  rm -f "$PID_FILE"
fi

echo "Installing server dependencies (npm ci)..."
cd "$SERVER_DIR"
npm ci --no-audit --no-fund

echo "Starting server (npm start) in background..."
SERVER_LOG="$LOG_DIR/server.log"
npm start > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" >> "$PID_FILE"
echo "Server PID: $SERVER_PID (logs: $SERVER_LOG)"

echo "Starting static server (python http.server) on port 8000 in background..."
cd "$PUBLIC_DIR"
PUBLIC_LOG="$LOG_DIR/public.log"
python3 -m http.server 8000 > "$PUBLIC_LOG" 2>&1 &
PUBLIC_PID=$!
echo "$PUBLIC_PID" >> "$PID_FILE"
echo "Static server PID: $PUBLIC_PID (logs: $PUBLIC_LOG)"

echo "All started. To view logs: tail -f $SERVER_LOG"
echo "To stop servers: ./scripts/stop-local.sh"
