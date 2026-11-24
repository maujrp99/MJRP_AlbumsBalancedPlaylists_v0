#!/bin/bash
# F98: the browser proof on the BUILT site, in the two engines, the two widths and the two languages.
#   reports/evidence/F98/run-all.sh <dist>
# Each run writes raw/run-<engine>-<width>-<language>.txt and raw/browser-proof-<engine>-<width>-<language>.json; the figures go to figures/.
set -u
DIST="${1:?give the folder of the built site}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HERE/raw"
failed=0
for engine in chromium webkit; do
  for width in 1280 390; do
    for language in en pt; do
      ENGINE=$engine WIDTH=$width LANGUAGE=$language node "$HERE/browser-proof.mjs" "$DIST" > "$HERE/raw/run-$engine-$width-$language.txt" 2>&1 || failed=1
      tail -1 "$HERE/raw/run-$engine-$width-$language.txt"
    done
  done
done
exit $failed
