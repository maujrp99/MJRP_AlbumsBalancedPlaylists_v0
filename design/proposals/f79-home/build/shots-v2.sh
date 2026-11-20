#!/bin/sh
# F79 · round 2 · screenshots of Transformar v2 (and the colour pair), one headless Chrome started and closed here.
# Run through the machine's queue:
#   python3 <harness>/mjrp-scripts/machine_load.py run --label f79-r2 --wait 3600 -- sh design/proposals/f79-home/build/shots-v2.sh <out dir> [scenarios] [file] [wire]
set -e
OUT="$1"; SC="${2:-empty,typing,scanning,results,chosen1,chosen,many,reorder,removed,paste,pastereport,notfound,error,noname,creating,created,createfail,guest}"
FILE="${3:-design/inception/home-transformar-v2.html}"; WIRE="$4"
PROFILE="$(mktemp -d)"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check --hide-scrollbars about:blank >/dev/null 2>&1 &
CH=$!
trap 'kill $CH 2>/dev/null; wait $CH 2>/dev/null; rm -rf "$PROFILE"' EXIT
i=0; until curl -s http://127.0.0.1:9333/json/version >/dev/null; do i=$((i+1)); [ $i -gt 50 ] && exit 1; sleep 0.2; done
if [ "$WIRE" = "measure" ]; then
  mkdir -p "$OUT"; node design/proposals/f79-home/build/measure-v2.mjs "$FILE" > "$OUT/measure-v2.json"
else
  node design/proposals/f79-home/build/shots.mjs "$OUT" "$FILE" "$SC" "$WIRE"
fi
