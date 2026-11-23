#!/bin/bash
cd "$(dirname "$0")"
run() { echo "== $*"; env "$@" node judge.mjs 2>/dev/null | cut -c1-300 | head -6; }
for i in 1 2 3; do
  run ENGINE=chromium PROFILE=1280 PART=scroll2 A=old B=old RUN=n$i
  run ENGINE=chromium PROFILE=1280 PART=scroll2 A=old B=new RUN=r$i
  run ENGINE=chromium PROFILE=899 PART=scroll2 A=old B=old RUN=n$i
  run ENGINE=chromium PROFILE=899 PART=scroll2 A=old B=new RUN=r$i
done
