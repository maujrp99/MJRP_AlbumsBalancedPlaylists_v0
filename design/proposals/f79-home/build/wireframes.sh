#!/bin/sh
# F79 · the wireframes of every screen of each level (computer and phone), from the prototypes in wireframe mode (#wire:
# grey, no images, each inventory item outlined with its ID). Needs headless Chrome on port 9333; run through the machine's
# queue: python3 <harness>/mjrp-scripts/machine_load.py run --label f79-home -- sh design/proposals/f79-home/build/wireframes.sh <tmp>
set -e
TMP="$1"
for L in consolidar elevar transformar; do
  node design/proposals/f79-home/build/shots.mjs "$TMP" "design/inception/home-$L-v1.html" chosen wire
  cp "$TMP/home-$L-v1-chosen-1280-wire.png" "design/wireframes/home-$L-v1-desktop.png"
  cp "$TMP/home-$L-v1-chosen-393-wire.png" "design/wireframes/home-$L-v1-phone.png"
done
