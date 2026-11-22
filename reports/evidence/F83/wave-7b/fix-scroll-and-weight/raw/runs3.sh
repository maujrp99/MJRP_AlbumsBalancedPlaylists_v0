#!/bin/bash
cd "$(dirname "$0")"
run() { echo "== $*"; env "$@" node judge.mjs 2>/dev/null | cut -c1-300 | head -12; }
for PART in blend many; do
  run ENGINE=chromium PROFILE=3200 PART=$PART A=old B=new
  run ENGINE=chromium PROFILE=3200 PART=$PART A=old B=old RUN=noise
  run ENGINE=chromium PROFILE=3200 PART=$PART A=old B=unfixed RUN=control
done
