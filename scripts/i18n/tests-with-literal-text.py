#!/usr/bin/env python3
"""F81 — which tests compare literal interface text (they break when the text moves to a dictionary or the CMS edits it).

  python3 scripts/i18n/tests-with-literal-text.py rows.json [--json out.json]

A test file counts a deck text when the English text (>= 8 characters, no `{}`) appears in it as a quoted string.
It over-counts (a fixture that happens to share a phrase) and under-counts (text built in the test, regexes).
"""
import json, sys, re, pathlib, collections
rows = json.load(open(sys.argv[1]))['rows']
texts = {r['en']: r['id'] for r in rows if len(r['en']) >= 8 and '{}' not in r['en']}
root = pathlib.Path(__file__).resolve().parents[2]
hits = collections.OrderedDict()
for f in sorted(list((root / 'test').rglob('*.test.*')) + list((root / 'test').rglob('*.spec.*'))):
    src = f.read_text(encoding='utf-8', errors='ignore')
    found = sorted({i for t, i in texts.items() if re.search(r'([\'"`])[^\'"`\n]*' + re.escape(t) + r'[^\'"`\n]*\1', src)})
    if found: hits[str(f.relative_to(root))] = found
out = {'files_total': len(list((root / 'test').rglob('*.test.*'))), 'files_with_literal_text': len(hits),
       'texts_pinned': len({i for v in hits.values() for i in v}), 'files': hits}
if '--json' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in out.items() if k != 'files'}))
for f, v in sorted(hits.items(), key=lambda kv: -len(kv[1]))[:12]: print(len(v), f)
