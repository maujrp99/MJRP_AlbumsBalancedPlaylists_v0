"""Wireframes of the round-3 previews (the home with the menu as the bar), with the inventory IDs of
docs/specs/info-arch.md § Inventário. Usage: python3 -I wireframes.py <repo root>.
Writes design/wireframes/splash-menu-bar-v3-{desktop,phone}.png (v3, the Portuguese copy revised; the layout is v2's)."""
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

STORY = [  # id, text, height, kind (v3: the copy revised; orange = the text changed)
    ('SPL-23', 'Lado A · 1 — Inicie: título e frase («O Blender monta a série.»); com conta, «Começar uma série →» (SPL-25)', 70, 'new'),
    ('SPL-06', 'Lado A · 2 — Álbuns: «Ranqueie as faixas do seu jeito.» (para cima ou para baixo; a playlist pode seguir a ordem); o cartão «Seu ranking · exemplo» com The Velvet Underground & Nico e as faixas reais (SPL-27); o caixote puxa a banana', 120, 'new'),
    ('SPL-16', 'Lado A · 3 — Blend: «Junte a série numa playlist só.»; com conta, «Gerar uma playlist →»', 70, 'new'),
    ('SPL-17', 'Faixa curta «Vire o disco» + uma linha: no lado B, playlists e inventário; o caixote gira', 50, 'n'),
    ('SPL-24', 'Lado B · 1 — Playlists: «Guarde as playlists que você curtiu.»; exportar para o Spotify ou a Apple Music; com conta, «Ver suas playlists →»', 70, 'new'),
    ('SPL-08', 'Lado B · 2 — Inventário: «Conte as mídias físicas da sua estante.» (vinil, CD, fita cassete); com conta, «Abrir o inventário →»', 70, 'new'),
    ('SPL-10', 'O convite: «Coloque sua primeira série para tocar.»; sem conta «Abrir o app» · «Entrar»; com conta «Inicie»', 70, 'new'),
]
HERO = [('SPL-02', 'Sobretítulo e título do MJRP: «Mergulhe nos álbuns que você ama. Seus álbuns do momento, numa playlist balanceada.»; com conta: «De volta aos discos», «Sua próxima série começa aqui.» (SPL-22)', 110, 'new'),
        ('SPL-03', 'A frase do MJRP: «Monte séries com seus álbuns do momento, ranqueie suas faixas e gere playlists equilibradas.»', 60, 'new'),
        ('SPL-04', 'Sem conta «Abrir o app» · «Entrar»; com conta «Inicie» · «Suas playlists»', 50, 'n')]
TOP = ''
BAR = ''
STAGE = 'Palco preso: caixote 3D com 15 capas reais (a banana na frente); cada história puxa um disco; na faixa da virada o caixote gira. Atrás, o leito de brasas (SPL-18). No canto, o ícone de pausar (SPL-26, 44 px)'

def desktop(key, title, place):
    W, x2, wl = 1280, 560, 500
    b = [(16, 60, W - 32, 34, 'SPL-12', 'Faixa do protótipo: «Sem conta» · «Com conta» · PT · EN (só no protótipo)', 'n')]
    y = 104
    if place == 'header':
        b.append((16, y, W - 32, 58, 'SPL-01', 'Topo preso: logotipo · a barra é o menu (SPL-20): Inicie · Álbuns · Blend | virada | Playlists · Inventário · à direita, sem conta «Entrar» · «Abrir o app»; com conta só «Inicie» (SPL-21)', 'new')); y += 68
    else:
        b.append((16, y, W - 32, 40, 'SPL-01', TOP, 'n')); y += 50
        if place == 'thread':
            b.append((16, y, W - 32, 48, 'SPL-20', 'Sob o topo: a faixa atual + ' + BAR, 'new')); y += 58
    top = y; yl = y
    for sid, t, h, k in HERO + STORY:
        b.append((16, yl, wl, h, sid, t, k)); yl += h + 10
    b.append((x2, top, W - x2 - 16, 540, 'SPL-05', STAGE, 'id'))
    b.append((x2, top + 550, W - x2 - 16, 60, 'SPL-15', 'Legenda do disco puxado: título · artista · ano · «Ouça no Apple Music»', 'n'))
    b.append((16, yl + 10, W - 32, 50, 'SPL-11', 'Rodapé: sem conta «Abrir o app» · «Entrar»; com conta o menu · crédito das capas, em português', 'n'))
    H = yl + 80
    if place == 'bottom':
        b.append((16, H, W - 32, 56, 'SPL-20', 'Barra de baixo, presa, igual no celular: a faixa atual + ' + BAR + '; uma agulha marca onde se está', 'new')); H += 76
    page(f'splash-menu-{key}-v3-desktop.png', f'{title} — splash-menu-{key}-v3 · computador 1280',
         'Wireframe da v3, o texto revisado (2026-11-21). IDs do inventário em docs/specs/info-arch.md. Laranja: o texto muda nesta versão.', W, H, b)

def phone(key, title, note):
    W, w = 393, 361
    b = [(16, 60, w, 40, 'SPL-01', 'Topo: logotipo · sem conta «Entrar»; com conta «Inicie» (SPL-21)', 'n')]
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
    page(f'splash-menu-{key}-v3-phone.png', f'{title} · celular 393', 'v3, o texto revisado. Laranja: o texto muda nesta versão.', W, y, b)

PH = 'Barra de baixo, presa: barras contínuas e os 5 rótulos de 12 px (Inicie · Álbuns · Blend · Playlists · Inventário), alvos 72 × 56 px'
desktop('bar', 'A barra é o menu · em português', 'header'); phone('bar', 'A barra é o menu · em português', PH)
