#!/bin/sh
# F79 · round 2 · the wireframes of Transformar v2 (computer and phone), from the prototype in wireframe mode (#wire: grey,
# no images, each inventory item outlined with its ID). Computer: the series panel open (state «reorder»); phone: albums
# chosen (state «chosen»), the dock as the action bar. One headless Chrome per call (shots-v2.sh). Through the queue:
#   python3 <harness>/mjrp-scripts/machine_load.py run --label f79-r2 --wait 3600 -- sh design/proposals/f79-home/build/wireframes-v2.sh <tmp>
set -e
TMP="$1"
sh design/proposals/f79-home/build/shots-v2.sh "$TMP" reorder,chosen design/inception/home-transformar-v2.html wire
cp "$TMP/home-transformar-v2-reorder-1280-wire.png" design/wireframes/home-transformar-v2-desktop.png
cp "$TMP/home-transformar-v2-chosen-393-wire.png" design/wireframes/home-transformar-v2-phone.png
