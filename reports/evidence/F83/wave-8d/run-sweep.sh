#!/bin/bash
# F83 wave 8d: the sweep of every screen on the BUILT sites, the parent (66cb1ee) against this branch, and the parent against itself (the noise control).
# Reuses the independent judge's script of sync 4 (reports/evidence/F83/sync-4/judge.mjs), unchanged, STRICT (it takes one picture and compares it).
#   F=<scratch>  with  $F/judge/{parent,parent2,new}/dist  (the builds; parent2 is the parent again)
# One run after the other, never two at once.  usage: run-sweep.sh "chromium:1280 webkit:iphone14" [parts]
set -u
F=${F:?scratch}
HERE="$(cd "$(dirname "$0")" && pwd)"
J="$HERE/../sync-4/judge.mjs"
PARTS=${2:-sweep}
for ep in $1; do
  e=${ep%%:*}; p=${ep##*:}
  for part in $PARTS; do
    for pair in "parent new" "parent parent2"; do
      set -- $pair
      WORK="$F/judge" ENGINE=$e PROFILE=$p PART=$part A=$1 B=$2 node "$J" 2>&1 | grep '^{"tag"'
    done
  done
done
