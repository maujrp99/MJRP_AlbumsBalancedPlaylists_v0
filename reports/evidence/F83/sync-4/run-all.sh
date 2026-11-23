#!/bin/bash
# F83 sync 4: every browser run of the proof, one after the other, on the BUILT sites. Needs, in $F (the scratch folder):
#   dist-main       `main` (336385a), built
#   dist-new        this branch, built
#   dist-parent     the parent (3877aaf), built
#   dist-parentwords the parent with only the words of «Create» and the plus/Syne files of `main` put in, built (the reference that shows
#                   the rest of the branch changed nothing; `parent` itself differs from the branch in the words on purpose)
#   judge/{parent,parent2,parentwords,new,main,main2}/dist -> the dists above (the judge reads <side>/dist)
# Servers are the scripts' own, on random ports of 127.0.0.1, closed when each script ends. Nothing is left running.
set -u
F=${F:?the scratch folder}
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
LOG="$F/judge/run-all.log"
: > "$LOG"
run() { echo "=== $*" >> "$LOG"; "$@" >> "$LOG" 2>&1; echo "--- exit $?" >> "$LOG"; }

PROFILES_ALL="chromium:1280 webkit:1280 webkit:iphone14 webkit:se"

# 1. `main` against the React line: the menu, the empty albums screen, the home; and `main` against itself (the noise)
for part in menu empty home; do
  for ep in $PROFILES_ALL; do
    e=${ep%%:*}; p=${ep##*:}
    run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=$part A="$F/dist-main" B="$F/dist-new" TAG=main-vs-react node main-vs-react.mjs
    run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=$part A="$F/dist-main" B="$F/dist-main" TAG=main-vs-main node main-vs-react.mjs
  done
done

# 2. the branch against its parent: every screen (the sweep), the Blend flow and the page-jump sequences
for ep in $PROFILES_ALL; do
  e=${ep%%:*}; p=${ep##*:}
  run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=sweep A=parentwords B=new node judge.mjs
  run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=sweep A=parent B=parent2 node judge.mjs
  run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=sweep A=parent B=new node judge.mjs
done
for ep in chromium:1280 webkit:iphone14; do
  e=${ep%%:*}; p=${ep##*:}
  for part in blend scroll2; do
    run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=$part A=parentwords B=new node judge.mjs
    run env WORK="$F/judge" ENGINE=$e PROFILE=$p PART=$part A=parent B=parent2 node judge.mjs
  done
done

# 3. the notices, the question windows and the loading bar (wave 8b): the parent-with-the-words against the branch, and the parent against itself
for ep in chromium:1280 webkit:iphone14; do
  e=${ep%%:*}; p=${ep##*:}
  run env WORK="$F/judge" ENGINE=$e PROFILE=$p node notices-and-questions.mjs "$F/dist-parentwords" "$F/dist-new"
  run env WORK="$F/judge" ENGINE=$e PROFILE=$p CONTROL=1 node notices-and-questions.mjs "$F/dist-parent" "$F/dist-parent"
done
echo "ALL DONE" >> "$LOG"
