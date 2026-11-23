#!/bin/bash
# F83 wave 8c: the second round of the browser proof (after the timeline comparison was made to compare what the eye sees): the iPhone 14 again, and the
# controls (parent against parent) of the three computer widths, whose pictures showed a few pixels apart in the first round.
#   run-extra.sh <dist of the parent> <dist of this branch> <out folder>
OLD=$1; NEW=$2; OUT=$3
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
while read -r ENGINE PROFILE CONTROL; do
  [ -z "$ENGINE" ] && continue
  LOG="$OUT/$ENGINE-$PROFILE-$CONTROL-b.log"
  ENGINE=$ENGINE PROFILE=$PROFILE CONTROL=$CONTROL RUN=b OUT=$OUT SETTLE=2500 node "$HERE/browser-proof.mjs" "$OLD" "$NEW" > "$LOG" 2>&1
  grep -h "passed, " "$LOG"
done <<'LIST'
webkit iphone14 0
chromium 1280 1
webkit 1280 1
chromium 900 1
chromium 1280 0
LIST
echo "ALL DONE"
