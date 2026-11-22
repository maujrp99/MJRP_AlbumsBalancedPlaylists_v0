#!/usr/bin/env python3
"""F79 · the Start screen on the phone, lean: builds the comparator (one self-contained page).

Input: ../caps/snaps.json (capture.mjs: the real /start of `main`, markup + the CSS it loaded, each state, signed in
and out). Output: ../comparator.html and, for the checks, ../caps/frames/<option>-<who>-<state>.html.

«Hoje» is the snapshot as captured. «Enxuta» and the variant are the SAME markup and CSS, with the changes of the
proposal applied in the frame (LEAN_JS) and its CSS (LEAN_CSS, all of it inside the phone query): nothing redrawn.
"""
import base64
import io
import json
import re
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
CAPS = HERE.parent / 'caps'
snaps = json.loads((CAPS / 'snaps.json').read_text())
counts = json.loads((CAPS / 'counts.json').read_text()) if (CAPS / 'counts.json').exists() else None


def data_uri(path, mime, max_w=None):
    raw = path.read_bytes()
    if max_w:
        im = Image.open(path)
        im.thumbnail((max_w, max_w))
        buf = io.BytesIO()
        im.save(buf, 'PNG', optimize=True)
        raw = buf.getvalue()
    return f'data:{mime};base64,' + base64.b64encode(raw).decode()


ASSETS = {
    '/splash/wordmark.jpg': data_uri(ROOT / 'public/splash/wordmark.jpg', 'image/jpeg'),
    '/assets/images/logo.png': data_uri(ROOT / 'public/assets/images/logo.png', 'image/png', 96),
}


TOKENS = {src: f'__ASSET{i}__' for i, src in enumerate(ASSETS)}


def inline(text):
    """The two images of the bar, as a token each (the frame puts the data URI back): one copy in the page."""
    for src, token in TOKENS.items():
        text = text.replace(f'"{src}"', f'"{token}"')
    return text


def assets_back(text):
    for src, token in TOKENS.items():
        text = text.replace(token, ASSETS[src])
    return text


CSS = inline(next(iter(snaps.values()))['css'])
assert all(s['css'] == next(iter(snaps.values()))['css'] for s in snaps.values()), 'the CSS changed between states'
CSS += '\n#toast-container{display:none!important}\n'

STATES = ['empty', 'typing', 'searching', 'results', 'chosen', 'paste', 'failed', 'notfound', 'sheet']
bodies = {}
for who in ('in', 'out'):
    for st in STATES[:-1]:
        s = snaps[f'{who}-{st}']
        bodies[f'{who}-{st}'] = {'html': s['html'], 'body': inline(s['body'])}

# the app's own bottom sheet (components/ui/Sheet.js), as it drew itself with today's sentence
sheet_body = snaps['out-sheet']['body']
SHEET = inline(sheet_body[sheet_body.index('<div class="sheet sheet--bottom" id="whatIsASeries">'):sheet_body.rindex('</body>')])

# ── the proposal, on the phone only ─────────────────────────────────────────────────────────────────────────
LEAN_CSS = r"""
@media (max-width: 767px) {
  /* the title stays, a little smaller: 30 px -> 26 px, four lines -> three */
  html.lean .home-hero h1 { font-size: 26px; }
  /* the sentence of the series leaves the screen; «What is a series?» opens it in the app's bottom sheet */
  html.lean .home-hero p { display: none; }
  html.lean .home-what { display: inline-flex; align-items: center; min-height: 44px; margin: 0 0 8px; padding: 0 2px;
    background: none; border: 0; color: #fff; font: 700 14px/1.45 var(--phone-font-text);
    text-decoration: underline; text-decoration-color: var(--home-flame-a); text-decoration-thickness: 2px; text-underline-offset: 4px; cursor: pointer; }
  html.lean .home-what:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  /* the line under the field is one link, of 44 px */
  html.lean .home-hint { margin-top: 4px; }
  html.lean .home-hint .home-link { display: inline-flex; align-items: center; min-height: 44px; margin: 0; padding: 0 2px; }
  /* the three steps leave the phone; the dock and the numbered covers show the progress */
  html.lean #homeHow { display: none !important; }
  /* the dock comes with the first cover chosen; until then, nothing at the foot but the menu */
  html.lean.dock-empty #homeDockHost { display: none; }
  html.lean.dock-empty #app > .home-page { padding-bottom: 72px; }
  /* the visitor's line comes with the series too: it speaks of saving it */
  html.lean.dock-empty #homeGuestStage { display: none !important; }
}
"""
# the variant, one axis: the title in two lines (each sentence on its own line), sized to the width
VARIANT_CSS = r"""
@media (max-width: 767px) {
  html.lean.two .home-hero h1 { font-size: calc((100vw - 32px) / 18.4); line-height: 1.15; }
  html.lean.two .home-hero h1 > span { display: block; white-space: nowrap; }
}
"""

LEAN_JS = r"""
(function () {
  var st = window.__ST, root = document.documentElement;
  root.classList.add('lean');
  if (window.__TWO) root.classList.add('two');
  var h1 = document.querySelector('#homeHero h1');
  if (h1 && !document.querySelector('.home-what')) {
    var what = document.createElement('button');
    what.type = 'button'; what.className = 'home-what'; what.setAttribute('data-what', '');
    what.setAttribute('aria-haspopup', 'dialog');
    what.textContent = 'What is a series?';
    h1.insertAdjacentElement('afterend', what);
  }
  var hint = document.querySelector('#homeHint');
  if (hint) {
    var link = document.createElement('button');
    link.type = 'button'; link.className = 'home-link';
    if (st === 'paste') { link.setAttribute('data-home-mode', 'artist'); link.textContent = 'Search an artist instead'; }
    else { link.setAttribute('data-home-mode', 'paste'); link.textContent = 'or paste a list'; }
    hint.textContent = ''; hint.appendChild(link);
    hint.hidden = st === 'notfound';
  }
  if (!document.querySelector('.home-dock.is-full')) root.classList.add('dock-empty');
  if (st === 'sheet') {
    document.body.insertAdjacentHTML('beforeend', window.__SHEET);
    document.body.style.cssText = 'position: fixed; top: 0px; left: 0px; right: 0px; width: 100%;';
  }
})();
"""

# taps inside a frame move both frames to the next state (the parent decides; nothing navigates)
FRAME_JS = r"""
document.addEventListener('click', function (e) {
  var t = e.target.closest('button, a, input, [data-action], [role="button"], .sheet__backdrop');
  e.preventDefault(); e.stopPropagation();
  if (!t) return;
  var go = null, st = window.__ST;
  if (t.id === 'btnScanArtist') go = 'searching';
  else if (t.id === 'artistScanInput') go = (st === 'empty' || st === 'sheet') ? 'typing' : null;
  else if (t.dataset.homeMode === 'paste') go = 'paste';
  else if (t.dataset.homeMode === 'artist') go = 'empty';
  else if (t.dataset.action === 'pick-album') go = 'chosen';
  else if (t.id === 'btnScanRetry') go = 'searching';
  else if (t.hasAttribute('data-what')) go = 'sheet';
  else if (t.classList.contains('sheet__close') || t.classList.contains('sheet__backdrop')) go = 'empty';
  if (go) parent.postMessage({ f79: go }, '*');
}, true);
document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
"""

HEAD = ('<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap">')


def frame_doc(option, who, st):
    """One frame as a document: option is 'today', 'lean' or 'two'."""
    base_state = 'empty' if st == 'sheet' else st
    if option == 'today' and st == 'sheet':
        st = 'empty'
    b = bodies[f'{who}-{base_state}']
    css = CSS + (LEAN_CSS + VARIANT_CSS if option != 'today' else '')
    pre = f'window.__ST={json.dumps(st)};window.__TWO={json.dumps(option == "two")};window.__SHEET={json.dumps(SHEET)};'
    lean = f'<script>{LEAN_JS}</script>' if option != 'today' else ''
    body = b['body'].replace('</body>', f'<script>{pre}</script>{lean}<script>{FRAME_JS}</script></body>')
    return assets_back(f'<!doctype html><html class="{b["html"]}"><head>{HEAD}<style>{css}</style></head>{body}</html>')


# frames for the checks (file:// pages, one per option, account and state)
(CAPS / 'frames').mkdir(exist_ok=True)
for option in ('today', 'lean', 'two'):
    for who in ('in', 'out'):
        for st in STATES:
            (CAPS / 'frames' / f'{option}-{who}-{st}.html').write_text(frame_doc(option, who, st))

# ── the comparator ───────────────────────────────────────────────────────────────────────────────────────────
payload = {
    'css': CSS, 'lean': LEAN_CSS + VARIANT_CSS, 'leanJs': LEAN_JS, 'frameJs': FRAME_JS, 'sheet': SHEET, 'head': HEAD,
    'bodies': bodies, 'counts': counts, 'assets': {TOKENS[k]: v for k, v in ASSETS.items()},
}
tpl = (HERE / 'comparator.tpl.html').read_text()
out = tpl.replace('/*__DATA__*/null', json.dumps(payload).replace('</', '<\\/'))
(HERE.parent / 'comparator.html').write_text(out)
print('comparator.html', round(len(out) / 1024), 'KB')
