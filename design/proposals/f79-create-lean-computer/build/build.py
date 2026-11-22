#!/usr/bin/env python3
"""F79 · the Create screen on the COMPUTER, lean: builds the comparator (one self-contained page).

Reused from design/proposals/f79-start-lean/build/build.py (the phone's preview), adapted to the computer.
Input: $F79C_RAW/snaps.json (capture.mjs: the real /start of `main` at 1440 x 900, markup + the CSS it loaded, each
state, signed in and out). Output: ../comparator.html and, for the checks, $F79C_RAW/frames/<option>-<who>-<state>.html.

«Hoje» is the snapshot as captured. «Enxuta» and the variant are the SAME markup and CSS, with the changes of the
proposal applied in the frame (LEAN_JS) and its CSS (LEAN_CSS, all of it inside the computer's query, min-width
900 px: the phone is not touched). Nothing redrawn.
"""
import base64
import io
import json
import os
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
RAW = Path(os.environ.get('F79C_RAW', HERE.parent / 'raw'))
CAPS = HERE.parent / 'caps'
snaps = json.loads((RAW / 'snaps.json').read_text())
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
    for src, token in TOKENS.items():
        text = text.replace(f'"{src}"', f'"{token}"')
    return text


def assets_back(text):
    for src, token in TOKENS.items():
        text = text.replace(token, ASSETS[src])
    return text


first = next(iter(snaps.values()))['css']
assert all(s['css'] == first for s in snaps.values()), 'the CSS changed between states'
CSS = inline(first) + '\n#toast-container{display:none!important}\n'

STATES = ['empty', 'typing', 'searching', 'results', 'chosen', 'paste', 'failed', 'notfound', 'what']
bodies = {}
for who in ('in', 'out'):
    for st in STATES[:-1]:
        s = snaps[f'{who}-{st}']
        bodies[f'{who}-{st}'] = {'html': s['html'], 'body': inline(s['body'])}

# ── the proposal, on the computer only (≥ 900 px; the phone is up to 899 px) ─────────────────────────────────
LEAN_CSS = r"""
@media (min-width: 900px) {
  /* before anything is found, the stage sits a little lower: the screen has the room the steps and the empty dock left */
  html.lean.calm .home-stage.is-big { padding-top: clamp(44px, calc(19vh - 30px), 150px); }
  /* the sentence of the series leaves the first screen; «What is a series?» opens it in place, under the link */
  html.lean .home-hero h1 { margin-bottom: 6px; }
  html.lean .home-hero p { display: none; }
  html.lean.what-open .home-hero p { display: block; margin: 0 auto 18px; }
  html.lean .home-what { display: inline-flex; align-items: center; min-height: 44px; margin: 0 0 14px; padding: 0 4px;
    background: none; border: 0; color: #fff; font: 700 15px 'Syne', sans-serif; cursor: pointer;
    text-decoration: underline; text-decoration-color: var(--home-flame-a); text-decoration-thickness: 2px; text-underline-offset: 4px; }
  html.lean.what-open .home-what { margin-bottom: 6px; }
  html.lean .home-what:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  /* the line under the field is one link */
  html.lean .home-hint .home-link { display: inline-flex; align-items: center; min-height: 44px; margin: -8px 0; padding: 0 2px; }
  /* the three steps leave the computer */
  html.lean #homeHow { display: none !important; }
  /* the dock comes with the first cover chosen; until then, nothing at the foot */
  html.lean.dock-empty #homeDockHost { display: none; }
  html.lean.dock-empty #app > .home-page { padding-bottom: 48px; }
}
"""
# the variant, one axis: the three steps stay, as one quiet line under the equalizer (today's words)
VARIANT_CSS = r"""
@media (min-width: 900px) {
  html.lean.steps #homeHow:not([hidden]) { display: flex !important; justify-content: center; flex-wrap: wrap; gap: 6px 28px; max-width: 1000px; margin: 26px auto 0; }
  html.lean.steps #homeHow li { padding: 0; background: none; border: 0; border-radius: 0; align-items: center; gap: 8px; }
  html.lean.steps .home-how__n { width: 24px; height: 24px; font-size: 12px; }
  html.lean.steps .home-how span strong { display: inline; font-size: 14px; }
  html.lean.steps .home-how span { font-size: 14px; color: var(--home-soft); white-space: nowrap; }
}
"""

LEAN_JS = r"""
(function () {
  var st = window.__ST, root = document.documentElement;
  root.classList.add('lean');
  if (window.__STEPS) root.classList.add('steps');
  if (st === 'empty' || st === 'typing' || st === 'what') root.classList.add('calm');
  var what = document.querySelector('.home-what');
  if (what) {
    what.setAttribute('data-what', '');
    what.removeAttribute('aria-haspopup');
    var p = document.querySelector('#homeHero p');
    if (p) { p.id = 'homeWhatText'; what.setAttribute('aria-controls', 'homeWhatText'); }
    what.setAttribute('aria-expanded', String(st === 'what'));
    if (st === 'what') root.classList.add('what-open');
  }
  var input = document.querySelector('#artistScanInput');
  if (input) input.setAttribute('placeholder', 'Type an artist');
  var hint = document.querySelector('#homeHint');
  if (hint) {
    var link = document.createElement('button');
    link.type = 'button'; link.className = 'home-link';
    if (st === 'paste') { link.setAttribute('data-home-mode', 'artist'); link.textContent = 'Search an artist instead'; }
    else { link.setAttribute('data-home-mode', 'paste'); link.textContent = 'or paste a list'; }
    hint.textContent = ''; hint.appendChild(link);
    hint.hidden = st === 'notfound';
  }
  if (!document.querySelector('.home-dock.is-full, .home-dock.is-done')) root.classList.add('dock-empty');
})();
"""

# clicks inside a frame move both frames to the next state (the parent decides; nothing navigates)
FRAME_JS = r"""
document.addEventListener('click', function (e) {
  var t = e.target.closest('button, a, input, [data-action], [role="button"]');
  e.preventDefault(); e.stopPropagation();
  if (!t) return;
  var go = null, st = window.__ST;
  if (t.id === 'btnScanArtist') go = 'searching';
  else if (t.id === 'artistScanInput') go = (st === 'empty' || st === 'what') ? 'typing' : null;
  else if (t.dataset.homeMode === 'paste') go = 'paste';
  else if (t.dataset.homeMode === 'artist') go = 'empty';
  else if (t.dataset.action === 'pick-album') go = 'chosen';
  else if (t.id === 'btnScanRetry') go = 'searching';
  else if (t.hasAttribute('data-what')) go = st === 'what' ? 'empty' : 'what';
  if (go) parent.postMessage({ f79c: go }, '*');
}, true);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && window.__ST === 'what') parent.postMessage({ f79c: 'empty' }, '*'); });
document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
"""

HEAD = ('<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap">')


def frame_doc(option, who, st):
    """One frame as a document: option is 'today', 'lean' or 'steps' (the variant)."""
    base_state = 'empty' if st == 'what' else st
    if option == 'today' and st == 'what':
        st = 'empty'
    b = bodies[f'{who}-{base_state}']
    css = CSS + (LEAN_CSS + VARIANT_CSS if option != 'today' else '')
    pre = f'window.__ST={json.dumps(st)};window.__STEPS={json.dumps(option == "steps")};'
    lean = f'<script>{LEAN_JS}</script>' if option != 'today' else ''
    body = b['body'].replace('</body>', f'<script>{pre}</script>{lean}<script>{FRAME_JS}</script></body>')
    return assets_back(f'<!doctype html><html class="{b["html"]}"><head>{HEAD}<style>{css}</style></head>{body}</html>')


# frames for the checks (file:// pages, one per option, account and state), outside git
(RAW / 'frames').mkdir(exist_ok=True)
for option in ('today', 'lean', 'steps'):
    for who in ('in', 'out'):
        for st in STATES:
            (RAW / 'frames' / f'{option}-{who}-{st}.html').write_text(frame_doc(option, who, st))

payload = {
    'css': CSS, 'lean': LEAN_CSS + VARIANT_CSS, 'leanJs': LEAN_JS, 'frameJs': FRAME_JS, 'head': HEAD,
    'bodies': bodies, 'counts': counts, 'assets': {TOKENS[k]: v for k, v in ASSETS.items()},
}
tpl = (HERE / 'comparator.tpl.html').read_text()
out = tpl.replace('/*__DATA__*/null', json.dumps(payload).replace('</', '<\\/'))
(HERE.parent / 'comparator.html').write_text(out)
print('comparator.html', round(len(out) / 1024), 'KB')
