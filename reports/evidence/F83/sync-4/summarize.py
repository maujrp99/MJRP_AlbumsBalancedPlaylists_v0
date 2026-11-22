#!/usr/bin/env python3
"""F83 sync 4: gathers what run-all.sh wrote (judge/out/*.json and judge/raw/*.json in the scratch folder) into small files of the evidence folder:
summary.json (one row per run: checks, failed, the biggest picture difference, and each failure cut short), observed.json (what the pages said: the
menu, the breadcrumb, the footer, the words of the button of the empty albums screen and the entry page), raw/*.json.gz (the notices run, compressed).

  python3 summarize.py <scratch folder with judge/> <evidence folder>
"""
import glob, gzip, json, os, shutil, sys

scratch, evidence = sys.argv[1], sys.argv[2]
out = os.path.join(scratch, 'judge', 'out')
rows, observed = [], {}
for path in sorted(glob.glob(os.path.join(out, '*.json'))):
    name = os.path.basename(path)[:-5]
    if 'keep' in name or name.startswith('crop'):
        continue
    d = json.load(open(path))
    summary = d['summary']
    row = {'run': name, **{k: v for k, v in summary.items() if k != 'tag'}}
    row['failures'] = [f"{f['what'][:110]} | {f['detail'][:140].replace(chr(10), ' ')}" for f in d.get('failed', [])]
    rows.append(row)
    if 'observed' in d and name.endswith('main-vs-react'):
        observed[name] = {k: v['B'] for k, v in d['observed'].items() if not k.startswith('hosts')}
json.dump(rows, open(os.path.join(evidence, 'summary.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(observed, open(os.path.join(evidence, 'observed.json'), 'w'), indent=1, ensure_ascii=False)
os.makedirs(os.path.join(evidence, 'raw'), exist_ok=True)
for path in sorted(glob.glob(os.path.join(scratch, 'judge', 'raw', '*.json'))):
    target = os.path.join(evidence, 'raw', os.path.basename(path) + '.gz')
    with open(path, 'rb') as src, gzip.open(target, 'wb') as dst:
        shutil.copyfileobj(src, dst)
print(len(rows), 'runs summarized')
