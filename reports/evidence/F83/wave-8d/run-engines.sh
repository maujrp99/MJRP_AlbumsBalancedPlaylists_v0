#!/bin/bash
# F83 wave 8d: the engines (notices, questions, the loading bar, the sheets, the export window, the Apple Music calls) and the tab titles, on the BUILT sites,
# the parent (66cb1ee) against this branch, each with the parent against itself as the noise control. It reuses the scripts of the earlier waves, unchanged:
#   wave 8b (sync-4/notices-and-questions.mjs) · wave 8c (wave-8c/browser-proof.mjs) · wave 8a (wave-8a/browser-proof.mjs, recording-built.mjs) · titles.mjs (this folder)
# One run after the other, never two at once; every run's own output goes to $F/engines/<name>.log, and the last lines of each to stdout.
#   F=<scratch>  with  $F/parent-tree/dist (the parent, built) and $F/dist-new (this branch, built)
set -u
F=${F:?scratch}
HERE="$(cd "$(dirname "$0")" && pwd)"
EV="$HERE/.."
P="$F/parent-tree/dist"; N="$F/dist-new"
LOGS="$F/engines"; mkdir -p "$LOGS" "$F/w8b" "$F/w8c"
run() { local name=$1; shift; echo "=== $name"; "$@" > "$LOGS/$name.log" 2>&1; echo "exit $?"; tail -3 "$LOGS/$name.log" | cut -c1-260; }

# 1. wave 8b: the notices, the question windows and the loading bar
for ep in chromium:1280 webkit:iphone14; do
  e=${ep%%:*}; p=${ep##*:}
  run 8b-$e-$p env WORK="$F/w8b" ENGINE=$e PROFILE=$p node "$EV/sync-4/notices-and-questions.mjs" "$P" "$N"
  run 8b-$e-$p-control env WORK="$F/w8b" ENGINE=$e PROFILE=$p CONTROL=1 node "$EV/sync-4/notices-and-questions.mjs" "$P" "$P"
done

# 2. wave 8c: every sheet of every screen (the phone profiles on WebKit, and Chromium at 1280 and 899)
for line in "webkit iphone14 0" "webkit iphone14 1" "webkit se 0" "chromium 899 0" "chromium 1280 0"; do
  set -- $line
  run 8c-$1-$2-control$3 env OUT="$F/w8c" ENGINE=$1 PROFILE=$2 CONTROL=$3 SETTLE=2500 node "$EV/wave-8c/browser-proof.mjs" "$P" "$N"
done

# 3. wave 8a: the export windows (Apple Music, Spotify, JSON file) from the saved playlists and the edit screen; and the calls to MusicKit on the built site
for ep in chromium:1280 webkit:iphone14; do
  e=${ep%%:*}; p=${ep##*:}
  for surface in edit saved; do
    for part in apple spotify json closing; do
      run 8a-$e-$p-$surface-$part env SURFACE=$surface ENGINE=$e PROFILE=$p PART=$part node "$EV/wave-8a/browser-proof.mjs" "$P" "$N"
    done
  done
done
for e in chromium webkit; do
  run musickit-parent-$e env ENGINE=$e node "$EV/wave-8a/recording-built.mjs" "$P"
  run musickit-branch-$e env ENGINE=$e node "$EV/wave-8a/recording-built.mjs" "$N"
done

# 4. the tab title on every route
for ep in chromium:1280 webkit:iphone14; do
  e=${ep%%:*}; p=${ep##*:}
  run titles-$e-$p env ENGINE=$e PROFILE=$p node "$HERE/titles.mjs" "$P" "$N"
done
echo ALLDONE
