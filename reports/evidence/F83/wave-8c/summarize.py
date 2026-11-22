#!/usr/bin/env python3
"""Reads raw/browser-proof-*.json (the output of browser-proof.mjs, one per profile and run) and prints one row per run and the failures, each shortened.

  summarize.py [raw folder]            the table
  summarize.py [raw folder] --failures the failures too (the first 220 characters of each)
  summarize.py [raw folder] --times    the slide and the worst timeline delta of every step, for the report
"""
import glob
import gzip
import json
import os
import re
import sys

raw = next((a for a in sys.argv[1:] if not a.startswith('--')), os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw'))
rows = []
for path in sorted(glob.glob(os.path.join(raw, 'browser-proof-*.json*'))):
    data = json.load(gzip.open(path, 'rt') if path.endswith('.gz') else open(path))
    rows.append((os.path.basename(path), data))
total_passed = total_failed = 0
for name, data in rows:
    print(f"{data['tag']:34} passed {data['passed']:5}  failed {data['failed']:4}   {name}")
    total_passed += data['passed']
    total_failed += data['failed']
print(f"{'TOTAL':34} passed {total_passed:5}  failed {total_failed:4}")
if '--failures' in sys.argv:
    for name, data in rows:
        for r in data['results']:
            if not r['ok']:
                print(f"- [{data['tag']}] {r['what'][:200]} :: {re.sub(r'\\s+', ' ', r['detail'])[:220]}")
if '--times' in sys.argv:
    for name, data in rows:
        for r in data['results']:
            if 'the slide, from' in r['what'] or 'the timeline: when' in r['what']:
                print(f"[{data['tag']}] {r['what'].split(' · ', 1)[1][:150]} :: {r['detail'][:120]}")
