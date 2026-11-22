"""The scenarios that were run again (after their roteiro was mended) leave the main files: the shell scenario (its flow on the phone was wrong: the question is under the menu's
sheet), the bar (a second slow change races with the screens coming down in the background, parent against parent too) and, in the 899 px run, the scenarios that had no touch to tap
with. Their results are in the `-only-<scenario>` files. The counts of each file are made again."""
import glob, json, os, re
here = os.path.dirname(os.path.abspath(__file__))
for path in sorted(glob.glob(os.path.join(here, 'raw', 'browser-proof-*.json'))):
    name = os.path.basename(path)
    if '-only-' in name or name.endswith('-dev.json') or name.endswith('-dev-control.json'):
        continue
    data = json.load(open(path))
    tag = data['tag']
    kept = []
    for r in data['results']:
        what = r['what']
        if ' · the bar: ' in what or ' · Shell: ' in what or ' · shell · the scenario ran' in what:
            continue
        if tag.startswith('chromium-899') and 'the scenario ran to its end' in what and 'locator.tap: The page does not support tap' in r['detail']:
            continue
        kept.append(r)
    failed = [r for r in kept if not r['ok']]
    data['results'] = kept
    data['passed'] = len(kept) - len(failed)
    data['failed'] = len(failed)
    with open(path, 'w') as out:
        json.dump(data, out, separators=(',', ':'))
print('merged')
