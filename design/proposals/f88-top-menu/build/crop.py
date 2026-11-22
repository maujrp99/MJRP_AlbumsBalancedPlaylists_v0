"""F88 round 1: crops the captured app screens (2026-11-21 batch) and the home v4 captures into
the screens the prototype draws its menu over. Run from the repo root: python3 design/proposals/f88-top-menu/build/crop.py"""
from PIL import Image
import os
EV = 'reports/evidence/visual-recheck-batch/2026-11-21/'
SRC = 'design/proposals/f88-top-menu/build/src/'
OUT = 'design/proposals/f88-top-menu/caps/'
os.makedirs(OUT, exist_ok=True)
# (name, file, kind) kind: d-prod = desktop with today's bar (cut 96 px); d-dev = desktop already under the bar;
# p = phone 786x1704 with top bar (96 img px) and tab bar (from 1590); ref = keep whole (today's chrome)
JOBS = [
  ('out-start-d', EV+'shell/prod-start-1280.png', 'd-prod'),
  ('out-albums-d', EV+'shell/prod-albums-1280.png', 'd-prod'),
  ('out-blend-d', EV+'shell/prod-blend-1280.png', 'd-prod'),
  ('out-playlists-d', EV+'shell/prod-savedplaylists-1280.png', 'd-prod'),
  ('out-inventory-d', EV+'shell/prod-inventory-1280.png', 'd-prod'),
  ('in-start-d', EV+'shell/shell-account-top-1280.png', 'd-prod'),
  ('in-albums-d', EV+'albums/grid-all-1280.png', 'd-dev'),
  ('in-blend-d', EV+'playlists/blend-1280.png', 'd-dev'),
  ('in-playlists-d', EV+'playlists/saved-ready-1280.png', 'd-dev'),
  ('in-inventory-d', EV+'inventory/list-1280.png', 'd-dev'),
  ('out-start-p', EV+'shell/prod-start-393.png', 'p'),
  ('out-albums-p', EV+'shell/prod-albums-393.png', 'p'),
  ('out-blend-p', EV+'shell/prod-blend-393.png', 'p'),
  ('out-playlists-p', EV+'shell/prod-savedplaylists-393.png', 'p'),
  ('out-inventory-p', EV+'shell/prod-inventory-393.png', 'p'),
  ('in-start-p', EV+'shell/shell-account-top-393.png', 'p'),
  ('in-albums-p', EV+'albums/grid-all-393.png', 'p'),
  ('in-blend-p', EV+'playlists/blend-393.png', 'p'),
  ('in-playlists-p', EV+'playlists/saved-ready-393.png', 'p'),
  ('in-inventory-p', EV+'inventory/list-393.png', 'p'),
  ('home-in-d', SRC+'home-1280-in.png', 'home-d'),
  ('home-out-d', SRC+'home-1280-out.png', 'home-d'),
  ('home-in-p', SRC+'home-393-in.png', 'home-p'),
  ('home-out-p', SRC+'home-393-out.png', 'home-p'),
  # today's chrome, whole, for «Referência»
  ('ref-out-start-d', EV+'shell/prod-start-1280.png', 'ref'),
  ('ref-out-albums-d', EV+'shell/prod-albums-1280.png', 'ref'),
  ('ref-out-blend-d', EV+'shell/prod-blend-1280.png', 'ref'),
  ('ref-out-playlists-d', EV+'shell/prod-savedplaylists-1280.png', 'ref'),
  ('ref-out-inventory-d', EV+'shell/prod-inventory-1280.png', 'ref'),
  ('ref-in-start-d', EV+'shell/shell-account-top-1280.png', 'ref'),
  ('ref-out-start-p', EV+'shell/prod-start-393.png', 'ref'),
  ('ref-out-albums-p', EV+'shell/prod-albums-393.png', 'ref'),
  ('ref-out-blend-p', EV+'shell/prod-blend-393.png', 'ref'),
  ('ref-out-playlists-p', EV+'shell/prod-savedplaylists-393.png', 'ref'),
  ('ref-out-inventory-p', EV+'shell/prod-inventory-393.png', 'ref'),
  ('ref-in-start-p', EV+'shell/shell-account-top-393.png', 'ref'),
  ('ref-in-albums-p', EV+'albums/grid-all-393.png', 'ref'),
  ('ref-in-blend-p', EV+'playlists/blend-393.png', 'ref'),
  ('ref-in-playlists-p', EV+'playlists/saved-ready-393.png', 'ref'),
  ('ref-in-inventory-p', EV+'inventory/list-393.png', 'ref'),
  ('ref-out-menu-p', EV+'shell/shell-visitor-menu-393.png', 'ref'),
  ('ref-in-menu-p', EV+'shell/shell-account-menu-393.png', 'ref'),
]
for name, f, kind in JOBS:
    im = Image.open(f).convert('RGB')
    if kind == 'd-prod': im = im.crop((0, 96, 1280, 800))
    elif kind == 'p': im = im.crop((0, 96, 786, 1590))
    elif kind == 'home-d': im = im.crop((0, 72, 1280, 800))
    elif kind == 'home-p': im = im.crop((0, 56, 393, 788)).resize((786, 1464), Image.LANCZOS)
    if im.width == 786 and kind != 'home-p': im = im.resize((589, round(im.height * 589 / 786)), Image.LANCZOS)
    elif kind == 'home-p': im = im.resize((589, round(im.height * 589 / 786)), Image.LANCZOS)
    im.save(OUT + name + '.jpg', quality=68, optimize=True, progressive=True)
wm = Image.open(SRC + 'wordmark.jpg').convert('RGB'); wm = wm.resize((450, 75), Image.LANCZOS); wm.save(OUT + 'wordmark.jpg', quality=82)
print(len(JOBS), 'screens')
