"""Wireframes of the round-3 previews (the home with the menu as the bar), with the inventory IDs of
docs/specs/info-arch.md § Inventário. Usage: python3 -I wireframes.py <repo root>.
Writes design/wireframes/splash-menu-{stops,bar,deck}-v1-{desktop,phone}.png."""
import os, sys
from PIL import Image, ImageDraw, ImageFont

REPO = sys.argv[1]
OUT = os.path.join(REPO, 'design/wireframes')

def font(size, bold=False):
    for p in ['/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
              '/Library/Fonts/Arial.ttf']:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

F, FB, FS = font(14), font(13, True), font(13)
FILL = {'n': '#f2f2f2', 'new': '#fde9d4', 'id': '#ede2d4'}

def wrap(d, text, w):
    lines, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if d.textlength(t, font=F) > w and cur:
            lines.append(cur); cur = word
        else:
            cur = t
    if cur: lines.append(cur)
    return lines

def box(d, x, y, w, h, sid, text, kind='n'):
    d.rounded_rectangle([x, y, x + w, y + h], 8, fill=FILL[kind], outline='#111', width=2)
    tw = d.textlength(sid, font=FB) + 12
    d.rounded_rectangle([x + 8, y + 8, x + 8 + tw, y + 28], 4, fill='#111')
    d.text((x + 14, y + 11), sid, font=FB, fill='#fff')
    for i, line in enumerate(wrap(d, text, w - tw - 30)):
        d.text((x + tw + 18, y + 10 + i * 19), line, font=F, fill='#111')

def page(name, title, sub, W, H, boxes):
    im = Image.new('RGB', (W, H), '#fff'); d = ImageDraw.Draw(im)
    d.text((16, 12), title, font=font(16, True), fill='#111')
    d.text((16, 34), sub, font=FS, fill='#555')
    for b in boxes: box(d, *b)
    im.save(os.path.join(OUT, name)); print(name)

STORY = [  # id, text, height, kind
    ('SPL-23', 'Side A · 1 — Start: título e frase; com conta, «Open Start →» (SPL-25)', 70, 'new'),
    ('SPL-06', 'Side A · 2 — Albums: título, frase e o exemplo ilustrativo (fictício); com conta, «Open Albums →»', 110, 'id'),
    ('SPL-16', 'Side A · 3 — Blend: título e frase; com conta, «Open Blend →»', 70, 'n'),
    ('SPL-17', 'Flip the record: o caixote gira para o lado B', 60, 'n'),
    ('SPL-24', 'Side B · 1 — Playlists: título e frase; com conta, «Open Playlists →»', 70, 'new'),
    ('SPL-08', 'Side B · 2 — Inventory: título e frase; com conta, «Open Inventory →»', 70, 'id'),
    ('SPL-10', 'O convite: sem conta «Open the app» · «Sign in»; com conta «Start»', 70, 'n'),
]
HERO = [('SPL-02', 'Sobretítulo e título; com conta: «Welcome back», «Back to the crate. Start a new series.» (SPL-22)', 110, 'new'),
        ('SPL-03', 'A frase do que o produto é (sem conta) ou do que fazer agora (com conta)', 60, 'n'),
        ('SPL-04', 'Sem conta «Open the app» · «Sign in»; com conta «Start» · «Your playlists»', 50, 'n')]
TOP = 'Topo preso: logotipo · sem conta «Sign in» · «Open the app»; com conta só «Start» com o fogo (SPL-21)'
BAR = 'Barra-menu: UMA fila contínua de barras, 5 partes = Start · Albums · Blend | FLIP | Playlists · Inventory; o fogo enche com a leitura; clicar leva à história'
STAGE = 'Palco preso: caixote 3D com 15 capas reais (a banana na frente); cada história puxa um disco; no FLIP o caixote gira. Atrás, o leito de brasas (SPL-18). No canto de cima, o ícone de pausar (SPL-26, 44 px)'

def desktop(key, title, place):
    W, x2, wl = 1280, 560, 500
    b = [(16, 60, W - 32, 34, 'SPL-12', 'Faixa do protótipo: «Signed out» · «Signed in» (só no protótipo)', 'n')]
    y = 104
    if place == 'header':
        b.append((16, y, W - 32, 58, 'SPL-01', 'Topo preso: logotipo · a barra-menu (SPL-20) no meio · à direita, sem conta «Sign in» · «Open the app»; com conta só «Start» (SPL-21)', 'new')); y += 68
    else:
        b.append((16, y, W - 32, 40, 'SPL-01', TOP, 'n')); y += 50
        if place == 'thread':
            b.append((16, y, W - 32, 48, 'SPL-20', 'Sob o topo: a faixa atual + ' + BAR, 'new')); y += 58
    top = y; yl = y
    for sid, t, h, k in HERO + STORY:
        b.append((16, yl, wl, h, sid, t, k)); yl += h + 10
    b.append((x2, top, W - x2 - 16, 540, 'SPL-05', STAGE, 'id'))
    b.append((x2, top + 550, W - x2 - 16, 60, 'SPL-15', 'Legenda do disco puxado: título · artista · ano · «Listen on Apple Music»', 'n'))
    b.append((16, yl + 10, W - 32, 50, 'SPL-11', 'Rodapé: sem conta «Open the app» · «Sign in»; com conta o menu (Start · Albums · Blend · Playlists · Inventory) · crédito das capas', 'n'))
    H = yl + 80
    if place == 'bottom':
        b.append((16, H, W - 32, 56, 'SPL-20', 'Barra de baixo, presa, igual no celular: a faixa atual + ' + BAR + '; uma agulha marca onde se está', 'new')); H += 76
    page(f'splash-menu-{key}-v1-desktop.png', f'{title} — splash-menu-{key}-v1 · computador 1280',
         'Wireframe da rodada 3 (2026-11-21). IDs do inventário em docs/specs/info-arch.md. Laranja: novo nesta rodada.', W, H, b)

def phone(key, title, note):
    W, w = 393, 361
    b = [(16, 60, w, 40, 'SPL-01', 'Topo: logotipo · sem conta «Sign in»; com conta «Start» (SPL-21)', 'n')]
    y = 110
    for sid, t, h, k in HERO:
        b.append((16, y, w, h + 20, sid, t, k)); y += h + 30
    b.append((16, y, w, 120, 'SPL-05', 'Caixote em CSS (sem 3D) com o ícone de pausar (SPL-26, 44 px) no canto', 'id')); y += 130
    for sid, t, h, k in STORY:
        if sid != 'SPL-10':
            b.append((16, y, w, 40, 'SPL-19', 'O disco da história, com crédito e link', 'n')); y += 46
        b.append((16, y, w, h + 30, sid, t, k)); y += h + 40
    b.append((16, y, w, 50, 'SPL-11', 'Rodapé', 'n')); y += 60
    b.append((16, y, w, 76, 'SPL-20', note, 'new')); y += 90
    page(f'splash-menu-{key}-v1-phone.png', f'{title} · celular 393', 'Rodada 3. Laranja: novo.', W, y, b)

PH = 'Barra de baixo, presa: as barras contínuas e os 5 rótulos de 12 px (Start · Albums · Blend · Playlists · Inventory), alvos 72 × 56 px'
desktop('stops', 'A · Fio com paradas', 'thread'); phone('stops', 'A · Fio com paradas', PH)
desktop('bar', 'B · O menu é a barra', 'header'); phone('bar', 'B · O menu é a barra', PH)
desktop('deck', 'C · Barra embaixo', 'bottom'); phone('deck', 'C · Barra embaixo', PH + '; e a agulha')
