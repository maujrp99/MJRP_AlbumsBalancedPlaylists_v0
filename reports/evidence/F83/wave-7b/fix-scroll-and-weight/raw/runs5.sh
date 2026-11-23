#!/bin/bash
# the final commit (88e8a99): the key proofs again
cd "$(dirname "$0")"
run() { echo "== $*"; env "$@" node judge.mjs 2>/dev/null | cut -c1-300 | head -6; }
for P in 1280 900 899 ciphone14; do
  run ENGINE=chromium PROFILE=$P PART=scroll2 A=old B=new RUN=final
done
run ENGINE=webkit PROFILE=1280 PART=scroll2 A=old B=new RUN=final
run REPAINT=1 ENGINE=chromium PROFILE=3200 PART=blend A=old B=new RUN=final-repaint
run ENGINE=chromium PROFILE=3200 PART=blend A=old B=new RUN=final
run ENGINE=chromium PROFILE=3200 PART=many A=old B=new RUN=final
echo ALLDONE
