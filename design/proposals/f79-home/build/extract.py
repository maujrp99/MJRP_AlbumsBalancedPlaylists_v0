"""F79 · reads the captures of the real Home (headless Chrome on the local site, 2026-11-20) and writes capture.json:
the app's stylesheets, the page shell (top bar, phone bars) with the Home taken out, today's Home in each captured state at
1280 and 393 px (the «Referência»), and the albums of the scanned discography (the prototypes' data).

Usage: python3 extract.py <folder with the captures>   (the captures are *.json written by the capture script)
"""
import json, re, sys, os

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
STATES = ['empty', 'scanning', 'results', 'chosen', 'bulk', 'notfound']


def load(name):
    with open(os.path.join(SRC, name + '.json')) as f:
        return json.load(f)


def clean(body):
    body = re.sub(r'<script\b.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<div id="globalProgress"[^>]*><div[^>]*></div></div>', '', body, count=1, flags=re.S)
    return body


def app_inner(body):
    """The Home inside #app (everything between <div id="app" ...> and the footer container)."""
    m = re.search(r'(<div id="app"[^>]*>)(.*?)(</div>\s*<div id="footer-container")', body, re.S)
    return m.group(1), m.group(2)


ref = {}
for state in STATES:
    for w in (1280, 393):
        try:
            d = load(f'{state}-{w}')
        except FileNotFoundError:
            continue
        ref.setdefault(state, {})[str(w)] = clean(d['body'])

base = load('empty-393')
open_tag, inner = app_inner(clean(base['body']))
shell = clean(base['body']).replace(open_tag + inner, open_tag + '<!--HOME-->', 1)

# The albums of the scan: the cards of the discography grid, in the order the app draws them (newest first)
res = load('results-1280')['body']
albums = []
for m in re.finditer(r'data-action="pick-album" data-id="(\d+)">(.*?)</p></div></div>', res, re.S):
    card = m.group(2)
    badges = re.findall(r'uppercase tracking-wider">([^<]+)</span>', card)
    albums.append({
        'id': m.group(1),
        'title': re.search(r'<h3[^>]*title="([^"]*)"', card).group(1),
        'year': re.search(r'<p class="text-gray-400 text-xs truncate mt-0.5">([^<]*)', card + '</p>').group(1),
        'cover': re.search(r'src="([^"]+)"', card).group(1),
        'badges': badges,
    })
counts = {}
for key in ('Albums', 'EPs', 'Singles', 'Live', 'Compilations', 'Uncategorized'):
    m = re.search(rf'id="btnFilter{key}Count"[^>]*>([^<]*)<', res)
    counts[key] = m.group(1).strip('() ') if m else ''

out = {'note': 'Captured from the local site (http://127.0.0.1:5010/home) on 2026-11-20 by headless Chrome, as a visitor; artist «Pink Floyd».',
       'css': base['css'], 'links': base['links'], 'htmlClass': base['htmlClass'], 'bodyClass': base['bodyClass'],
       'shell': shell, 'reference': ref, 'albums': albums, 'counts': counts}
with open(os.path.join(HERE, 'capture.json'), 'w') as f:
    json.dump(out, f)
print('albums', len(albums), 'counts', counts, 'states', {k: list(v) for k, v in ref.items()}, 'KB', os.path.getsize(os.path.join(HERE, 'capture.json')) // 1024)
