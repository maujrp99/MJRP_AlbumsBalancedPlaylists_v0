"""F79 · builds the Home's prototypes from the real screen (capture.json) and each level's script.

  python3 build.py              -> design/inception/home-<level>-v1.html (the three levels)
                                   design/proposals/f79-home/reference.html (today's Home, «Referência»)
  python3 build.py --artifact D -> self-contained copies in D (every image inlined), for the comparator Artifact
  python3 build.py --round2 [--artifact D] -> round 2: design/inception/home-transformar-v2.html, the colour pair in
                                   design/proposals/f79-home/previews/, and the comparator (round 2 template)

Every page = the app's own stylesheets + the app's shell (top bar; on the phone, its top and bottom bars) + the Home drawn
by the level's script, state by state (core.js). Images: the covers come from the catalog's addresses in the capture; the
app's own pictures from the published site (in the artifact copy, both are inlined).
"""
import json, os, re, sys, base64, hashlib, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
PROD = 'https://mjrp-playlist-generator.web.app'
LEVELS = {
    'reference': ('Referência · a Home de hoje', 'A tela de hoje, como o app a desenha, em cada estado capturado.'),
    'consolidar': ('Consolidar', 'Mesma estrutura e mesmos componentes; muda o texto (voz de console mantida e clara), a hierarquia, os estados vazios e de erro, a ação principal sempre à vista.'),
    'elevar': ('Elevar', 'Evolui o sistema: buscar primeiro, nomear no fim; a série vira uma bandeja à esquerda com as capas numeradas; passos com equalizador; voz equilibrada.'),
    'transformar': ('Transformar', 'Uma abordagem nova: um palco só, uma busca que entende artista ou lista, a série como uma «base» de capas presa embaixo; voz direta, fogo e equalizador no centro.'),
}
d = json.load(open(os.path.join(HERE, 'capture.json')))


def app_inner(body):
    m = re.search(r'<div id="app"[^>]*>(.*?)</div>\s*<div id="footer-container"', body, re.S)
    if m:
        return m.group(1)
    m = re.search(r'<div id="app"[^>]*>(.*)', body, re.S)   # a body with no footer: everything after #app
    return m.group(1)


def local_to_prod(h):
    """The app's own pictures and styles: from the published site (the local server is not there when the page is opened)."""
    h = re.sub(r'(src|href)="(?:http://127\.0\.0\.1:5010)?/(assets|css)/', lambda m: f'{m.group(1)}="{PROD}/{m.group(2)}/', h)
    return re.sub(r'url\((["\']?)(?:http://127\.0\.0\.1:5010)?/(assets|css)/', lambda m: f'url({m.group(1)}{PROD}/{m.group(2)}/', h)


d['shell'] = local_to_prod(d['shell'])
d['css'] = local_to_prod(d['css'])
ref_app = {s: {w: local_to_prod(app_inner(b)) for w, b in ws.items()} for s, ws in d['reference'].items()}
data = {'albums': d['albums'], 'counts': d['counts']}
COMMON_CSS = """
  #protoBar { background:#1d1408; border-bottom:1px solid #5b3a10; padding:8px 16px; font:12px/1.4 system-ui,sans-serif; color:#d9c7a8; position:relative; z-index:60; }
  #protoBar b { color:#fbbf24; }
  #protoScenarios { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
  #protoScenarios button { background:#16161a; color:#f2f2f3; border:1px solid #2a2a30; border-radius:8px; padding:5px 10px; cursor:pointer; font:600 12px system-ui,sans-serif; }
  #protoScenarios button[aria-pressed="true"] { border-color:#f97316; color:#fdba74; }
  body.framed #protoBar { display:none; }
  #footer-container { display:none; }
  body.proto-wire { filter:grayscale(1); }
  body.proto-wire #protoBar { display:none; }
  body.proto-wire img, body.proto-wire .f79-cover-img { visibility:hidden; }
  body.proto-wire [data-inv] { outline:2px dashed #fff; outline-offset:2px; position:relative; }
  body.proto-wire [data-inv]::before { content:attr(data-inv); position:absolute; top:-10px; left:6px; z-index:99; background:#fff; color:#000; font:700 10px/1.4 ui-monospace,monospace; padding:0 5px; border-radius:4px; white-space:nowrap; }
"""


def read(name):
    p = os.path.join(HERE, name)
    return open(p).read() if os.path.exists(p) else ''


def page(level, inline=None):
    title, say = LEVELS[level]
    css = d['css']
    shell = d['shell'].replace('<!--HOME-->', '<div id="f79-root"></div>')
    js = read('core.js') + '\n' + read('reference.js') + '\n' + (read(f'{level}.js') if level != 'reference' else '')
    payload = dict(data, refApp=ref_app)
    proposal = '' if level == 'reference' else ' <b>O texto é uma proposta do agente</b>, não do copy deck.'
    html = f"""<!doctype html>
<html lang="en" class="{d['htmlClass']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Home · {title} · F79 v1</title>
<!-- F79 · design round 1 · {title}. Built by design/proposals/f79-home/build/build.py from the real Home captured on
     2026-11-20 (its HTML and its stylesheets, the artist «Pink Floyd» scanned on the local site). Not product code. -->
{''.join(f'<link rel="stylesheet" href="{h}">' for h in d['links'])}
<style>
{css}
</style>
<style>{COMMON_CSS}</style>
<style>
{read(f'{level}.css')}
</style>
</head>
<body class="{d['bodyClass']} f79-{level}">
<div id="protoBar"><b>F79 · a Home · {title}.</b> {say}{proposal} Escolha o estado:
  <div id="protoScenarios" role="group" aria-label="Estados"></div></div>
{shell}
<script>window.DATA = {json.dumps(payload)};</script>
<script>
{js}
</script>
</body>
</html>
"""
    # The app's own pictures: from the published site; in the artifact copy, inlined
    html = re.sub(r'(src|href)="(?:http://127\.0\.0\.1:5010)?/(assets|css)/', lambda m: f'{m.group(1)}="{PROD}/{m.group(2)}/', html)
    html = re.sub(r'url\((["\']?)(?:http://127\.0\.0\.1:5010)?/(assets|css)/', lambda m: f'url({m.group(1)}{PROD}/{m.group(2)}/', html)
    if inline is not None:
        html = re.sub(r'(?<=["\'(])(https://[^"\')\s]+\.(?:jpg|jpeg|png|svg|webp)(?:/[^"\')\s]*\.jpg)?)', lambda m: data_uri(m.group(1), inline), html)
    return html


def data_uri(url, cache):
    f = os.path.join(cache, hashlib.md5(url.encode()).hexdigest())
    if not os.path.exists(f):
        local = url.replace(PROD + '/', os.path.join(ROOT, 'public') + '/')
        try:
            raw = open(local, 'rb').read() if local != url and os.path.exists(local) else urllib.request.urlopen(url, timeout=20).read()
        except Exception as exc:
            print('  could not inline', url, exc)
            return url
        open(f, 'wb').write(raw)
    raw = open(f, 'rb').read()
    kind = 'image/png' if raw[:4] == b'\x89PNG' else ('image/svg+xml' if raw.lstrip()[:1] == b'<' else 'image/jpeg')
    return f'data:{kind};base64,' + base64.b64encode(raw).decode()


# Round 2 (after the owner chose Transformar): v2 and the colour pair. Its own core (core-v2.js) and level files, so the
# round-1 pages above rebuild byte-identical. The v2 pages do not carry the captured screens of today (refApp): they
# never draw the «Referência».
ROUND2 = {
    'transformar-v2': ('Transformar · v2', 'Rodada 2 da direção escolhida: a base que abre para reordenar e remover (com Undo), o nome sugerido, «Add all», o depois de criar e todos os estados.',
                       ['transformar-v2.css'], 'design/inception/home-transformar-v2.html'),
    'flame-2stops': ('Prévia A · fogo de duas paradas', 'Prévia de cor: o degradê declarado, #f97316 → #dc2626 (é o da v2). Compare com a prévia B.',
                     ['transformar-v2.css'], 'design/proposals/f79-home/previews/home-transformar-v2-flame-2stops.html'),
    'flame-3stops': ('Prévia B · fogo com #fdba74', 'Prévia de cor: o degradê da v1, com a terceira parada #fdba74, fora das cores declaradas. Compare com a prévia A.',
                     ['transformar-v2.css', 'preview-flame-3stops.css'], 'design/proposals/f79-home/previews/home-transformar-v2-flame-3stops.html'),
}


def page2(key, inline=None):
    title, say, css_files, _ = ROUND2[key]
    shell = d['shell'].replace('<!--HOME-->', '<div id="f79-root"></div>')
    js = read('core-v2.js') + '\n' + read('transformar-v2.js')
    level_css = ''.join(read(f) + '\n' for f in css_files)
    html = f"""<!doctype html>
<html lang="en" class="{d['htmlClass']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Home · {title} · F79</title>
<!-- F79 · design round 2 · {title}. Built by design/proposals/f79-home/build/build.py --round2 from the real Home captured
     on 2026-11-20 (its HTML and its stylesheets, the artist «Pink Floyd» scanned on the local site). Not product code. -->
{''.join(f'<link rel="stylesheet" href="{h}">' for h in d['links'])}
<style>
{d['css']}
</style>
<style>{COMMON_CSS}</style>
<style>
{level_css}
</style>
</head>
<body class="{d['bodyClass']} f79-transformar f79-v2">
<div id="protoBar"><b>F79 · a Home · {title}.</b> {say} <b>O texto é uma proposta do agente</b>, não do copy deck. Escolha o estado:
  <div id="protoScenarios" role="group" aria-label="Estados"></div></div>
{shell}
<script>window.DATA = {json.dumps(data)};</script>
<script>
{js}
</script>
</body>
</html>
"""
    html = re.sub(r'(src|href)="(?:http://127\.0\.0\.1:5010)?/(assets|css)/', lambda m: f'{m.group(1)}="{PROD}/{m.group(2)}/', html)
    html = re.sub(r'url\((["\']?)(?:http://127\.0\.0\.1:5010)?/(assets|css)/', lambda m: f'url({m.group(1)}{PROD}/{m.group(2)}/', html)
    if inline is not None:
        html = re.sub(r'(?<=["\'(])(https://[^"\')\s]+\.(?:jpg|jpeg|png|svg|webp)(?:/[^"\')\s]*\.jpg)?)', lambda m: data_uri(m.group(1), inline), html)
    return html


def round2(art=None):
    """v2, the two previews and the round-2 comparator; nothing of round 1 is written."""
    os.makedirs(os.path.join(ROOT, 'design', 'proposals', 'f79-home', 'previews'), exist_ok=True)
    cache = None
    if art:
        cache = os.path.join(art, '.cache'); os.makedirs(cache, exist_ok=True)
    for key, (_, _, _, out) in ROUND2.items():
        html = page2(key, inline=cache)
        path = os.path.join(art, f'{key}.html') if art else os.path.join(ROOT, out)
        open(path, 'w').write(html)
        print('written', path if art else out, len(html) // 1024, 'KB')
    if art:
        files = {lv: f'{lv}.html' for lv in list(LEVELS) + list(ROUND2)}
        open(os.path.join(art, 'comparator.html'), 'w').write(read('comparator-v2.template.html').replace('/*FILES*/', json.dumps(files)))
        return
    files = {'reference': 'reference.html', **{lv: f'../../inception/home-{lv}-v1.html' for lv in LEVELS if lv != 'reference'},
             'transformar-v2': '../../inception/home-transformar-v2.html',
             'flame-2stops': 'previews/home-transformar-v2-flame-2stops.html', 'flame-3stops': 'previews/home-transformar-v2-flame-3stops.html'}
    cmp_html = read('comparator-v2.template.html').replace('/*FILES*/', json.dumps(files))
    cmp_html = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + cmp_html.replace('<header', '</head>\n<body>\n<header', 1) + '\n</body>\n</html>\n'
    open(os.path.join(ROOT, 'design', 'proposals', 'f79-home', 'comparator.html'), 'w').write(cmp_html)
    print('written design/proposals/f79-home/comparator.html')


if __name__ == '__main__' and '--round2' in sys.argv:
    round2(sys.argv[sys.argv.index('--artifact') + 1] if '--artifact' in sys.argv else None)
    sys.exit(0)

if __name__ == '__main__':
    if '--artifact' in sys.argv:
        out = sys.argv[sys.argv.index('--artifact') + 1]
        cache = os.path.join(out, '.cache'); os.makedirs(cache, exist_ok=True)
        for level in LEVELS:
            html = page(level, inline=cache)
            open(os.path.join(out, f'{level}.html'), 'w').write(html)
            print(level, len(html) // 1024, 'KB', 'external images left:', len(re.findall(r'src="https://', html)))
        files = {lv: f'{lv}.html' for lv in LEVELS}
        open(os.path.join(out, 'comparator.html'), 'w').write(read('comparator.template.html').replace('/*FILES*/', json.dumps(files)))
    else:
        for level in LEVELS:
            path = os.path.join(ROOT, 'design', 'proposals', 'f79-home', 'reference.html') if level == 'reference' \
                else os.path.join(ROOT, 'design', 'inception', f'home-{level}-v1.html')
            if level != 'reference' and not os.path.exists(os.path.join(HERE, f'{level}.js')):
                continue
            open(path, 'w').write(page(level))
            print('written', os.path.relpath(path, ROOT), len(open(path).read()) // 1024, 'KB')
        files = {'reference': 'reference.html', **{lv: f'../../inception/home-{lv}-v1.html' for lv in LEVELS if lv != 'reference'}}
        cmp_html = read('comparator.template.html').replace('/*FILES*/', json.dumps(files))
        cmp_html = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + cmp_html.replace('<header', '</head>\n<body>\n<header', 1) + '\n</body>\n</html>\n'
        open(os.path.join(ROOT, 'design', 'proposals', 'f79-home', 'comparator.html'), 'w').write(cmp_html)
        print('written design/proposals/f79-home/comparator.html')
        # Since round 2 the comparator of the area is round 2's (it keeps round 1 folded as «decididos»): write it last
        round2()
