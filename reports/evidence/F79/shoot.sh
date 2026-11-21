#!/bin/sh
# F79 · the browser proof: one headless Chrome started and closed here, the built Home (a local dev server of the branch,
# never production) and the approved prototype captured side by side. Run through the machine's queue:
#   python3 <harness>/mjrp-scripts/machine_load.py run --label f79-proof --wait 3600 -- sh reports/evidence/F79/shoot.sh <out dir> <site url> [states] [proto|built|both]
set -e
OUT="$1"; SITE="${2:-http://127.0.0.1:5079}"; STATES="$3"; WHICH="${4:-both}"; PORT=9379
PROFILE="$(mktemp -d)"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=$PORT --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check --hide-scrollbars about:blank >/dev/null 2>&1 &
CH=$!
trap 'kill $CH 2>/dev/null; wait $CH 2>/dev/null; rm -rf "$PROFILE"' EXIT
i=0; until curl -s http://127.0.0.1:$PORT/json/version >/dev/null; do i=$((i+1)); [ $i -gt 50 ] && exit 1; sleep 0.2; done
node reports/evidence/F79/shoot.mjs "$OUT" "$SITE" "$PORT" "$STATES" "$WHICH"
