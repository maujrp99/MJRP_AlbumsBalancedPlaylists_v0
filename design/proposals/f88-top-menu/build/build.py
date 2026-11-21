"""F88 round 1 build: fills proto.tpl.html into
 - design/proposals/f88-top-menu/comparator.html (published: every image inlined, one file)
 - design/inception/f88-top-menu-elevar-v1.html and -transformar-v1.html (the prototype of each level, images by path)
Run from the repo root after crop.py: python3 design/proposals/f88-top-menu/build/build.py"""
import base64, json, os
B = 'design/proposals/f88-top-menu/'
tpl = open(B + 'build/proto.tpl.html').read()
notes = open(B + 'build/notes.html').read()
caps = sorted(f[:-4] for f in os.listdir(B + 'caps') if f.endswith('.jpg'))


def fill(img, lock):
    return tpl.replace('__IMG__', json.dumps(img)).replace('__LOCK__', json.dumps(lock)).replace('__NOTES__', notes.replace('`', "'"))


inline = {k: 'data:image/jpeg;base64,' + base64.b64encode(open(B + 'caps/' + k + '.jpg', 'rb').read()).decode() for k in caps}
page = fill(inline, None)
# the Artifact wraps the page in its own skeleton: publish the content without doctype, html, head and body
for tag in ('<!doctype html>\n', '<html lang="pt-BR">\n', '<head>\n', '</head>\n', '<body>\n', '</body>\n', '</html>\n'):
    page = page.replace(tag, '', 1)
page = page.replace('<meta charset="utf-8">\n', '').replace('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n', '')
page = page.replace('<title>Menu do Album Blender</title>\n', '', 1)
page = '<title>Menu do Album Blender</title>\n' + page
open(B + 'comparator.html', 'w').write(page)
rel = {k: '../proposals/f88-top-menu/caps/' + k + '.jpg' for k in caps}
for lv in ('elevar', 'transformar'):
    open(f'design/inception/f88-top-menu-{lv}-v1.html', 'w').write(fill(rel, lv))
print('ok', len(caps), os.path.getsize(B + 'comparator.html') // 1024, 'KB')
