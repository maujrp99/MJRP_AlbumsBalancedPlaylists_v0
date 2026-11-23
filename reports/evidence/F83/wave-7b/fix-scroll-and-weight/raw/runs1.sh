#!/bin/bash
cd "$(dirname "$0")"
run() { echo "== $*"; env "$@" node judge.mjs 2>/dev/null | cut -c1-400 | head -8; }
for P in 1280 900 899 ciphone14; do
  run ENGINE=chromium PROFILE=$P PART=scroll2 A=old B=new
  run ENGINE=chromium PROFILE=$P PART=scroll2 A=old B=unfixed
done
run ENGINE=webkit PROFILE=1280 PART=scroll2 A=old B=new
run ENGINE=webkit PROFILE=iphone14 PART=scroll2 A=old B=new
