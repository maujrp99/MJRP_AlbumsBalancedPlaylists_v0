"""Makes the raw files of the browser proof small (the evidence stays under 1 MB): a passed check keeps what it checked and the start of its detail; a failed one keeps all of it."""
import glob, gzip, json, os
here = os.path.dirname(os.path.abspath(__file__))
total = 0
for path in sorted(glob.glob(os.path.join(here, 'raw', 'browser-proof-*.json'))):
    data = json.load(open(path))
    for result in data['results']:
        if result['ok']:
            result['detail'] = result['detail'][:80]
    with gzip.open(path + '.gz', 'wt') as out:
        json.dump(data, out, separators=(',', ':'))
    total += os.path.getsize(path + '.gz')
print('raw files (gzip): %d bytes' % total)
