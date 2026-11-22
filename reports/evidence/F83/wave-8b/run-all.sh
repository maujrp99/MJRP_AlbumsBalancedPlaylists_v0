#!/bin/bash
# F83 wave 8b: runs the browser proof over every scenario, engine and profile.
#   run-all.sh <engine> <dist of the parent> <dist of this branch> <dev address of the parent> <dev address of this branch> [control] [profiles...]
# Chromium: 1280, 900, 899. WebKit: 1280, iPhone 14, iPhone SE (the engine of Safari on the computer and on the phones). Each profile runs the scenarios on the BUILT
# sites (the screens that open a notice, a question or the bar), then the `direct*` scenarios on the dev servers of the two trees (the engines called by the page).
ENGINE=$1; OLD=$2; NEW=$3; DEV_OLD=$4; DEV_NEW=$5; CONTROL=${6:-0}
shift 6
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ "$#" -gt 0 ]; then PROFILES="$@"; elif [ "$ENGINE" = "webkit" ]; then PROFILES="1280 iphone14 se"; else PROFILES="1280 900 899"; fi
for PROFILE in $PROFILES; do
  ENGINE=$ENGINE PROFILE=$PROFILE CONTROL=$CONTROL node "$HERE/browser-proof.mjs" "$OLD" "$NEW" 2>&1 | grep -v "^PASS" | tail -40
  ENGINE=$ENGINE PROFILE=$PROFILE CONTROL=$CONTROL node "$HERE/browser-proof.mjs" "$DEV_OLD" "$DEV_NEW" 2>&1 | grep -v "^PASS" | tail -40
done
echo "ALL DONE $ENGINE control=$CONTROL"
