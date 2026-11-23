#!/bin/bash
# F83 wave 8c: runs the browser proof, one run after the other (two runs at once load the machine and the page positions drift by a pixel).
#   run-all.sh <dist of the parent> <dist of this branch> <out folder>
# Each line is  engine profile mode  with mode `real` (parent against this branch) or `control` (parent against parent: the noise).
OLD=$1; NEW=$2; OUT=$3
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
while read -r ENGINE PROFILE MODE; do
  [ -z "$ENGINE" ] && continue
  CONTROL=0; [ "$MODE" = "control" ] && CONTROL=1
  LOG="$OUT/$ENGINE-$PROFILE-$MODE.log"
  ENGINE=$ENGINE PROFILE=$PROFILE CONTROL=$CONTROL OUT=$OUT SETTLE=2500 node "$HERE/browser-proof.mjs" "$OLD" "$NEW" > "$LOG" 2>&1
  grep -h "passed, " "$LOG"
done <<'LIST'
webkit iphone14 real
webkit iphone14 control
webkit se real
webkit se control
chromium 899 real
chromium 899 control
chromium pixel real
chromium pixel control
webkit 1280 real
chromium 1280 real
chromium 900 real
LIST
echo "ALL DONE"
