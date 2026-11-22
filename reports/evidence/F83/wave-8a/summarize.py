import json, glob, os, sys
here = os.path.dirname(os.path.abspath(__file__))
rows, fails, noise = [], [], 0
for f in sorted(glob.glob(os.path.join(here, 'raw', 'browser-proof-*.json'))):
    d = json.load(open(f))
    name = os.path.basename(f)[len('browser-proof-'):-5]
    n_noise = sum(1 for r in d['results'] if 'NOISE' in r['what'])
    noise += n_noise
    rows.append((name, d['passed'], d['failed'], n_noise))
    for r in d['results']:
        logo = (not r['ok']) and 'the pixels of the window' in r['what'] and 'x 16-196, y 21-50' in r['detail']  # the animated flame of the logo (any frame of it differs from another)
        if logo:
            n_noise += 1; noise += 1
            continue
        if not r['ok']:
            fails.append((name, r['what'], r['detail'][:220].replace('\n', ' ')))
print('| run | passed | failed | noise |')
print('|---|---|---|---|')
for r in rows:
    print('| %s | %d | %d | %d |' % r)
print()
print('total passed', sum(r[1] for r in rows), 'failed', sum(r[2] for r in rows), 'noise-classified', noise)
for f in fails[:80]:
    print('FAIL', f)
