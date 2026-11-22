import gzip, json, glob, os, re
here = os.path.dirname(os.path.abspath(__file__))
rows, fails = [], []
for f in sorted(glob.glob(os.path.join(here, 'raw', 'browser-proof-*.json.gz'))):
    d = json.load(gzip.open(f, 'rt'))
    name = os.path.basename(f)[len('browser-proof-'):-len('.json.gz')]
    worst, events, within = 0.0, 0, 0
    for r in d['results']:
        m = re.search(r'(\d+) of (\d+) events within a frame, the worst ([\d.]+) ms', r['detail']) if 'the timeline: when' in r['what'] else None
        if m:
            within += int(m.group(1)); events += int(m.group(2)); worst = max(worst, float(m.group(3)))
        if not r['ok']:
            fails.append((name, r['what'].split(' · ', 1)[-1], r['detail'][:240].replace('\n', ' ')))
    rows.append((name, d['passed'], d['failed'], events, within, worst))
print('| run | passed | failed | timed events | within a frame | worst (ms) |')
print('|---|---|---|---|---|---|')
for r in rows:
    print('| %s | %d | %d | %d | %d | %.1f |' % r)
print()
print('total passed', sum(r[1] for r in rows), 'failed', sum(r[2] for r in rows), 'timed events', sum(r[3] for r in rows))
for f in fails[:120]:
    print('FAIL', f)
