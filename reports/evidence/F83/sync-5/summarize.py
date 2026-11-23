"""F83 sync 5: reads the raw results of proof.mjs (one JSON per run) and writes summary.json (small: the numbers the proof.md quotes) and prints the tables.

  python3 summarize.py <folder of raw/*.json> <summary.json>
"""
import json, sys, glob, os, re

raw = sys.argv[1]
out = sys.argv[2]
summary = {}
for f in sorted(glob.glob(os.path.join(raw, '*.json'))):
    d = json.load(open(f))
    tag = d['tag']
    checks = d['results']
    row = {'part': d['part'], 'engine': d['engine'], 'profile': d['profile'], 'account': d['account'], 'checks': len(checks), 'failed': [{'what': c['what'], 'detail': c['detail'][:200]} for c in checks if not c['ok']]}
    if d['part'] == 'read':
        reads = {}
        for k, r in d['facts'].items():
            probes = r['A_probes'] + r['B_probes']
            def line(side):
                ps = r[side + '_probes']
                loading = [p for p in ps if p['spinner'] or p['words'] or p['blendSpinner']]
                first = next((p for p in ps if p['spinner'] or p['words']), None)
                content = first['spinner'] or first['words'] if first else None
                return {
                    'orangeLineAt': [p['at'] for p in ps if p['barShown'] or p['thin']],
                    'contentTop': content['y'] if content else None, 'contentBottom': content['bottom'] if content else None,
                    'toolbarBottom': first['toolbar']['bottom'] if first and first['toolbar'] else None,
                    'viewportHeight': ps[0]['viewport'][1],
                    'footerYDuringRead': ps[2]['footerY'], 'footerYSettled': r[side + '_settled']['footerY'],
                    'emptyTextDuringRead': any(p['empty'] or p['noMatch'] for p in ps),
                    'settledCards': r[side + '_settled']['cards'], 'settledGroups': r[side + '_settled']['groups'], 'blendCardsSettled': r[side + '_settled']['blendCards'],
                    'shift': {x: r[side + '_shift'][x] for x in ('total', 'beforeTheSwap', 'atTheSwap')}, 'noShiftApi': r[side + '_shift']['none'],
                }
            reads[k] = {'A': line('A'), 'B': line('B'), 'settledPixelsApart': r['settledPixelsApart']}
        row['reads'] = reads
    elif d['part'] == 'create':
        row['stateDifferences'] = {k: v['differs'] for k, v in d['facts'].items() if v['differs']}
        row['pixelChecks'] = [c['detail'] for c in checks if c['what'].endswith(': pixels')]
    elif d['part'] == 'sweep':
        row['routes'] = d['facts']
    elif d['part'] == 'routerbar':
        row['bars'] = d['facts']
    summary[tag] = row
json.dump(summary, open(out, 'w'), indent=1)

print(f'{len(summary)} runs')
for tag, row in summary.items():
    fails = len(row['failed'])
    print(f"{tag:46s} {row['part']:9s} checks {row['checks']:3d} failed {fails}")
