#!/bin/bash
# F83 wave 8a: runs the browser proof over every surface, engine and profile. Usage: run-all.sh <engine> <dist of the parent> <dist of this branch> [control]
# Chromium: 1280, 900, 899, iPhone 14, iPhone SE. WebKit: 1280, iPhone 14, iPhone SE (the engine of Safari on the computer and on the phones).
ENGINE=$1; OLD=$2; NEW=$3; CONTROL=${4:-0}
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ "$ENGINE" = "webkit" ]; then PROFILES="1280 iphone14 se"; else PROFILES="1280 900 899 iphone14 se"; fi
for SURFACE in edit saved; do
  for PROFILE in $PROFILES; do
    for PART in apple spotify json closing; do
      SURFACE=$SURFACE ENGINE=$ENGINE PROFILE=$PROFILE CONTROL=$CONTROL PART=$PART node "$HERE/browser-proof.mjs" "$OLD" "$NEW" 2>&1 | grep -v "^PASS" | tail -25
    done
  done
done
echo "ALL DONE $ENGINE control=$CONTROL"
