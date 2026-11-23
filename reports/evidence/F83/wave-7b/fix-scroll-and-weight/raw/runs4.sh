#!/bin/bash
cd "$(dirname "$0")"
run() { echo "== $*"; env "$@" node judge.mjs 2>/dev/null | cut -c1-300 | head -6; }
run REPAINT=1 ENGINE=chromium PROFILE=3200 PART=blend A=old B=new RUN=repaint
run REPAINT=1 ENGINE=chromium PROFILE=3200 PART=many A=old B=new RUN=repaint
run REPAINT=1 ENGINE=chromium PROFILE=3200 PART=many A=old B=unfixed RUN=repaint-control
run ENGINE=chromium PROFILE=3200 PART=many A=old B=new
run ENGINE=chromium PROFILE=3200 PART=many A=old B=old RUN=noise
run ENGINE=chromium PROFILE=3200 PART=many A=old B=unfixed RUN=control
run ENGINE=webkit PROFILE=1280 PART=blend A=old B=new
run ENGINE=webkit PROFILE=1280 PART=blend A=old B=old RUN=noise
run ENGINE=webkit PROFILE=iphone14 PART=blend A=old B=new
echo ALLDONE
