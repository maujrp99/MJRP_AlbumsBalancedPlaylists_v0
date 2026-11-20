"""Assemble design/inception/splash-crate-v2.html from the template, the logo of v1 and the captured covers."""
import base64, json, os, re, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = sys.argv[1]
tpl = open(os.path.join(HERE, 'splash-v2.tpl.html'), encoding='utf-8').read()
v1 = open(os.path.join(REPO, 'design/inception/splash-crate-v1.html'), encoding='utf-8').read()
logo = re.search(r'class="logo" src="(data:image/[^"]+)"', v1).group(1)
meta = {m['k']: m for m in json.load(open(os.path.join(HERE, 'covers/meta.json'), encoding='utf-8'))}
ORDER = ['crimson', 'harvest', 'dsotm', 'low', 'pcl', 'dummy', 'illmatic',
         'edge', 'homogenic', 'mezzanine', 'aeroplane', 'pitty', 'desire', 'tpab']
FIX = {  # links the iTunes search did not resolve to the right album: Apple Music search until the app's own album id is used
    'dsotm': 'https://music.apple.com/us/search?term=Pink%20Floyd%20The%20Dark%20Side%20of%20the%20Moon',
    'homogenic': 'https://music.apple.com/us/search?term=Bj%C3%B6rk%20Homogenic',
}
albums, imgs, total = [], [], 0
for i, k in enumerate(ORDER):
    m = meta[k]
    raw = open(os.path.join(HERE, 'covers', k + '.webp'), 'rb').read()
    total += len(raw)
    link = FIX.get(k, m['link'])
    albums.append(dict(k=k, t=m['title'], a=m['artist'], y=m['year'], href=link))
    alt = f"{m['title']} by {m['artist']} ({m['year']}), album cover"
    imgs.append(f'<img class="sl s{i}" style="--p:{i}" data-i="{i}" data-k="{k}" alt="{html.escape(alt)}" width="360" height="360" decoding="async" src="data:image/webp;base64,{base64.b64encode(raw).decode()}">')
out = (tpl.replace('%%LOGO%%', logo)
          .replace('%%COVERS%%', '\n        '.join(imgs))
          .replace('%%ALBUMS%%', json.dumps(albums, ensure_ascii=False)))
dst = os.path.join(REPO, 'design/inception/splash-crate-v2.html')
open(dst, 'w', encoding='utf-8').write(out)
print('covers raw bytes', total, 'page bytes', len(out.encode('utf-8')))
