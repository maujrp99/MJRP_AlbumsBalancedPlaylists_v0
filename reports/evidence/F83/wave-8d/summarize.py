#!/usr/bin/env python3
"""F83 wave 8d: reads the logs of the runs (run-sweep.sh, run-engines.sh) and writes summary.json plus a table for proof.md.
usage: summarize.py <scratch folder F> <out folder>"""
import glob, json, os, re, sys

F, OUT = sys.argv[1], sys.argv[2]
rows = {}

# the sweep, the Blend flow and the page jumps (the judge's script): one JSON line per run, in the sweep*.txt files
for path in sorted(glob.glob(os.path.join(F, 'sweep*.txt'))):
    for line in open(path):
        if line.startswith('{"tag"'):
            d = json.loads(line)
            rows[d['tag']] = {'kind': 'judge', **{k: d[k] for k in ('steps', 'checks', 'failed', 'picturesDiffer', 'maxPx', 'maxIntensity')}}

# the engines: the last "N passed, M failed" line of each log
for path in sorted(glob.glob(os.path.join(F, 'engines', '*.log'))):
    name = os.path.basename(path)[:-4]
    text = open(path, errors='replace').read()
    m = re.findall(r'(\d+) passed, (\d+) failed', text)
    if m:
        rows[name] = {'kind': 'engine', 'passed': int(m[-1][0]), 'failed': int(m[-1][1])}
    elif name.startswith('titles-'):
        line = [l for l in text.splitlines() if l.startswith('{')]
        if line:
            d = json.loads(line[-1])
            rows[name] = {'kind': 'titles', 'routes': d['routes'], 'differ': d['differ']}
    elif name.startswith('musickit-'):
        rows[name] = {'kind': 'musickit', 'tail': text.strip().splitlines()[-1][:200] if text.strip() else ''}
    else:
        rows[name] = {'kind': 'other', 'tail': text.strip().splitlines()[-1][:200] if text.strip() else ''}

os.makedirs(OUT, exist_ok=True)
json.dump(rows, open(os.path.join(OUT, 'summary.json'), 'w'), indent=1, sort_keys=True)
for k, v in sorted(rows.items()):
    print(k, v)
