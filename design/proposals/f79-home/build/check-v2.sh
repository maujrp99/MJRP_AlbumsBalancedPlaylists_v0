#!/bin/sh
# F79 · round 2 · everything that needs a browser, in one turn of the machine's queue, one Chrome at a time: the captures of
# every state (both widths), the measures, the wireframes. Usage, from the repository root:
#   python3 <harness>/mjrp-scripts/machine_load.py run --label f79-r2 --wait 3600 -- sh design/proposals/f79-home/build/check-v2.sh <tmp>
set -e
TMP="$1"
B=design/proposals/f79-home/build
sh $B/shots-v2.sh "$TMP/shots"
sh $B/shots-v2.sh "$TMP" all design/inception/home-transformar-v2.html measure
sh $B/shots-v2.sh "$TMP/previews" empty,scanning design/proposals/f79-home/previews/home-transformar-v2-flame-3stops.html
sh $B/wireframes-v2.sh "$TMP/wire"
