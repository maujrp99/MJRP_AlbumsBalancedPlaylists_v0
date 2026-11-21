"""UAT-235 previews: turn the captures of the real entry page (one per view, width and pose) into
the comparator's images (WebP, 960 px wide). Usage: build_previews.py <captures dir> <out dir>.
The captures come from the dev server with ?crate=today|a|b|c (and &nogl, or reduced motion)."""
import os, sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
n = 0
for f in sorted(os.listdir(src)):
    if not f.endswith('.png') or f.startswith('g'):
        continue
    im = Image.open(os.path.join(src, f)).convert('RGB')
    w = 960
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, f[:-4] + '.webp'), 'WEBP', quality=78, method=6)
    n += 1
print('images', n)
# the page: the template with the list of images
import json
here = os.path.dirname(os.path.abspath(__file__))
files = sorted(f for f in os.listdir(out) if f.endswith('.webp'))
tpl = open(os.path.join(here, 'uat-235.tpl.html'), encoding='utf-8').read()
open(os.path.join(out, 'uat-235.html'), 'w', encoding='utf-8').write(tpl.replace('%%FILES%%', json.dumps(files)))
print('page', os.path.join(out, 'uat-235.html'))
