#!/bin/bash
# F83 sync 5: every browser run of the proof, one after the other (never two at once), on the BUILT sites. Needs, in $F (the scratch folder):
#   dist-main    `main` (a6bc310, hand-made), built      dist-new     this branch, built      dist-parent  the parent (a1ac74f), built
# and OUT (the result folder). Each run's servers are the script's own, on random ports of 127.0.0.1, closed when it ends. Nothing is left running.
set -u
F=${F:?the scratch folder}
OUT=${OUT:?the result folder}
HERE="$(cd "$(dirname "$0")" && pwd)"
LOG="$F/run-all.log"
: > "$LOG"
run() { echo "=== $*" >> "$LOG"; env WORK="$F" OUT="$OUT" "$@" node "$HERE/proof.mjs" >> "$LOG" 2>&1; echo "--- exit $?" >> "$LOG"; }
M="$F/dist-main"; N="$F/dist-new"; P="$F/dist-parent"

# A. the lean Create screen: `main` against the branch (and `main` against itself, the noise control)
for e in chromium webkit; do
  for s in 1280x800 1440x900 1920x1080; do
    img=""; [ "$e-$s" = "chromium-1280x800" ] || [ "$e-$s" = "webkit-1440x900" ] && img=1
    run ENGINE=$e PROFILE=$s PART=create A=$M B=$N TAG=create-$e-$s IMG=$img
  done
  for s in 1280x800 1440x900; do run ENGINE=$e PROFILE=$s PART=create A=$M B=$N ACCOUNT=1 TAG=create-$e-$s-account; done
  for s in iphone393 iphone375; do
    img=""; [ "$e-$s" = "webkit-iphone393" ] && img=1
    run ENGINE=$e PROFILE=$s PART=create A=$M B=$N TAG=create-$e-$s IMG=$img
  done
  run ENGINE=$e PROFILE=iphone393 PART=create A=$M B=$N ACCOUNT=1 TAG=create-$e-iphone393-account
  run ENGINE=$e PROFILE=1280x800 PART=create A=$M B=$M TAG=control-create-$e-1280x800
done
run ENGINE=webkit PROFILE=iphone393 PART=create A=$M B=$M TAG=control-create-webkit-iphone393

# B and C: the series read held 1.5 s, two series with albums: `main` against the branch (the position, the shift, the settled screens)
for e in chromium webkit; do
  for s in 1280x720 1366x768 1440x900 iphone393 iphone375; do
    img=""; [ "$e-$s" = "chromium-1280x720" ] || [ "$e-$s" = "webkit-iphone393" ] && img=1
    run ENGINE=$e PROFILE=$s PART=read A=$M B=$N TAG=read-$e-$s IMG=$img
  done
done
for ep in chromium:1280x720 webkit:1280x720 webkit:iphone393; do
  run ENGINE=${ep%%:*} PROFILE=${ep##*:} PART=read A=$M B=$M TAG=control-read-${ep%%:*}-${ep##*:}
done
# B: the orange line: the PARENT (which draws it while the series are read) against the branch
for ep in chromium:1280x720 webkit:1280x720 webkit:iphone393 webkit:iphone375; do
  run ENGINE=${ep%%:*} PROFILE=${ep##*:} PART=read A=$P B=$N TAG=line-${ep%%:*}-${ep##*:}
done

# the branch against its parent: a regression sweep of every screen, with the parent against itself as the control
for ep in chromium:1280x800 webkit:1280x800 webkit:iphone393 webkit:iphone375; do
  e=${ep%%:*}; s=${ep##*:}
  run ENGINE=$e PROFILE=$s PART=sweep A=$P B=$N TAG=sweep-$e-$s
  run ENGINE=$e PROFILE=$s PART=sweep A=$P B=$P TAG=control-sweep-$e-$s
done
# the router's bar for a screen file held 2 s: the parent and the branch
for ep in chromium:1280x800 webkit:iphone393; do
  run ENGINE=${ep%%:*} PROFILE=${ep##*:} PART=routerbar A=$P B=$N TAG=routerbar-${ep%%:*}-${ep##*:}
done
echo "ALL DONE" >> "$LOG"
