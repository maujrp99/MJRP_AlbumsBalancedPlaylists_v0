"""F79 · the wireframes of the Home, one per level and per screen (computer 1280 x 900, phone 393 x 852), in the state
«albums chosen». Low fidelity on purpose: boxes, the screen's real words, the inventory IDs of info-arch.md § A Home (F79);
no palette. The boxes are placed where the prototypes draw them (measured on their screenshots of 2026-11-20).

Drawn with Pillow, without a browser: the machine's queue for headless Chrome was held for over an hour on the day, and a
wireframe does not need a render. (`wireframes.sh` draws the same from the prototypes in #wire mode, when the queue is free.)

Usage: python3 wireframes.py   -> design/wireframes/home-<level>-v1-desktop.png and -phone.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, '..', '..', '..', 'wireframes'))
FONT = '/System/Library/Fonts/Helvetica.ttc'
MONO = '/System/Library/Fonts/Menlo.ttc'

DESK_SHELL = [(None, (16, 16, 1264, 90), 'Top bar of the app: logo · Home · Music Series · The Blending Menu · Playlists · Inventory')]
PHONE_SHELL = [(None, (0, 0, 393, 48), 'Top bar: logo · Home · menu'), (None, (0, 796, 393, 852), 'Tab bar: Home · Albums · Blend · Playlists · Inventory')]


def grid(box, cols, rows, gap, chosen=(), numbered=False):
    x0, y0, x1, y1 = box
    w = (x1 - x0 - gap * (cols - 1)) / cols
    out = []
    for r in range(rows):
        for c in range(cols):
            i = r * cols + c
            x = x0 + c * (w + gap)
            y = y0 + r * (w + gap + 34)
            if y + w > y1:
                continue
            n = chosen.index(i) + 1 if i in chosen else 0
            out.append(('cover', (int(x), int(y), int(x + w), int(y + w)), (str(n) if numbered and n else ('+' if not n else '+'))))
    return out


LEVELS = {
    'consolidar': {
        'desktop': DESK_SHELL + [
            (None, (0, 122, 450, 900), ''),
            ('HOME-01', (48, 150, 410, 232), 'Build a series · A series is the set of albums you want to hear together. The Blend turns it into playlists.'),
            ('HOME-02', (48, 262, 402, 372), '01 // NAME YOUR SERIES · You can rename it later · [Floyd, the long ones]'),
            ('HOME-03', (232, 406, 388, 438), 'By artist | Paste a list'),
            ('HOME-04', (66, 466, 384, 530), '02 // FIND ALBUMS · [Pink Floyd] [Scan]'),
            ('HOME-09', (48, 618, 402, 770), '03 // YOUR SERIES · album rows with remove (x) (drag to reorder)'),
            ('HOME-10', (318, 640, 402, 660), '4 albums'),
            ('HOME-12', (48, 782, 402, 800), 'Next: open it in the Blend to make playlists.'),
            ('HOME-11', (48, 812, 402, 860), 'Create series ->'),
            ('HOME-06', (474, 130, 1260, 170), '02 // PICK ALBUMS FROM THE DISCOGRAPHY · Studio 17 · EPs · Singles 15 · Live 5 · Compendiums 15 · Other'),
            ('HOME-08', (852, 176, 980, 196), '-> Pink Floyd'),
            ('HOME-07', (474, 200, 1256, 900), ''),
        ],
        'desktop_grid': ((484, 210, 1246, 900), 5, 3, 24, (0, 2, 3, 5), False),
        'phone': PHONE_SHELL + [
            ('HOME-01', (16, 56, 377, 128), 'Build a series · A series is the set of albums you want to hear together.'),
            ('HOME-02', (16, 140, 377, 230), '01 // NAME YOUR SERIES · [Floyd, the long ones]'),
            ('HOME-03', (30, 300, 364, 344), 'By artist | Paste a list'),
            ('HOME-04', (30, 352, 364, 410), '02 // FIND ALBUMS · [Pink Floyd] [Scan]'),
            ('HOME-06', (16, 430, 377, 560), '02 // PICK ALBUMS · Studio · EPs · Singles · Live · Compendiums · Other'),
            ('HOME-07', (16, 570, 377, 726), ''),
            ('HOME-17', (0, 730, 393, 796), '4 albums chosen · «Floyd, the long ones» · tap to review or rename · [Create series]'),
        ],
        'phone_grid': ((24, 580, 369, 726), 2, 1, 14, (0,), True),
    },
    'elevar': {
        'desktop': DESK_SHELL + [
            ('HOME-09', (24, 122, 404, 876), ''),
            (None, (44, 140, 200, 158), '// YOUR SERIES'),
            ('HOME-02', (44, 172, 384, 238), 'Name · [Floyd, the long ones]'),
            ('HOME-01', (44, 246, 384, 284), 'A series is the set of albums you want to hear together. The Blend turns it into balanced playlists.'),
            ('HOME-10', (44, 298, 250, 318), 'equalizer meter · 4 albums · 1 artist'),
            ('HOME-19', (44, 346, 384, 580), '1..4 numbered rows: cover · title · year · up · down · remove'),
            ('HOME-12', (44, 772, 384, 792), 'Next: open it in the Blend to make playlists.'),
            ('HOME-11', (44, 802, 384, 856), 'Create series ->'),
            ('HOME-15', (428, 122, 1252, 188), '1 · Find albums  |  2 · Pick  |  3 · Create the series (lit like an equalizer)'),
            ('HOME-03', (448, 222, 654, 260), 'By artist | Paste a list'),
            ('HOME-04', (444, 282, 1236, 350), 'Artist · [e.g. Pink Floyd] [Scan]'),
            ('HOME-08', (428, 388, 1100, 420), 'Pink Floyd · 17 studio albums, newest first. Click a cover to add it; click again to take it out.'),
            ('HOME-18', (1170, 394, 1252, 416), 'Add all 17'),
            ('HOME-06', (428, 436, 996, 472), 'Studio 17 · EPs · Singles 15 · Live 5 · Compilations 15 · Other'),
            ('HOME-07', (428, 490, 1252, 900), ''),
        ],
        'desktop_grid': ((428, 494, 1252, 900), 5, 2, 20, (0, 2, 3, 5), True),
        'phone': PHONE_SHELL + [
            ('HOME-03', (48, 84, 346, 128), 'By artist | Paste a list'),
            ('HOME-04', (44, 140, 372, 216), 'Artist · [Pink Floyd] [Scan]'),
            ('HOME-08', (32, 246, 362, 330), 'Pink Floyd · 17 studio albums, newest first. Tap a cover to add it.'),
            ('HOME-18', (32, 346, 110, 366), 'Add all 17'),
            ('HOME-06', (32, 388, 362, 486), 'Studio 17 · EPs · Singles 15 · Live 5 · Compilations 15 · Other'),
            ('HOME-07', (32, 508, 362, 726), ''),
            ('HOME-17', (0, 728, 393, 796), 'covers · 4 albums · Floyd, the long ones · Tap to review, reorder or rename · [Create series]'),
        ],
        'phone_grid': ((32, 512, 362, 726), 2, 1, 14, (0,), True),
    },
    'transformar': {
        'desktop': DESK_SHELL + [
            ('HOME-04', (260, 150, 1020, 214), '[Pink Floyd] (an artist, or paste a list) [Search]'),
            ('HOME-03', (400, 230, 880, 252), 'Type an artist to see the discography, or paste a list of albums from many artists.'),
            ('HOME-16', (354, 268, 926, 294), 'live equalizer (moves while searching)'),
            ('HOME-08', (74, 322, 560, 360), 'Pink Floyd · 17 studio albums · newest first'),
            ('HOME-06', (616, 328, 1206, 364), 'Studio · 17 | EPs | Singles · 15 | Live · 5 | Compilations · 15 | Other'),
            ('HOME-07', (74, 380, 1206, 770), ''),
            ('HOME-09', (74, 778, 1206, 882), ''),
            ('HOME-10', (90, 798, 244, 862), 'pile of the chosen covers'),
            ('HOME-02', (258, 804, 680, 832), 'Floyd, the long ones (named in place)'),
            ('HOME-19', (258, 838, 560, 856), '4 albums from 1 artist · change the order'),
            ('HOME-12', (990, 792, 1194, 808), 'Next: the Blend makes the playlists'),
            ('HOME-11', (990, 814, 1194, 868), 'Create series ->'),
        ],
        'desktop_grid': ((74, 384, 1206, 770), 6, 2, 18, (0, 2, 3, 5), True),
        'phone': PHONE_SHELL + [
            ('HOME-04', (16, 64, 377, 120), '[Pink Floyd] [Search]'),
            ('HOME-03', (16, 130, 377, 166), 'Type an artist, or paste a list'),
            ('HOME-16', (16, 176, 377, 198), 'live equalizer'),
            ('HOME-08', (16, 214, 377, 250), 'Pink Floyd · 17 studio albums · newest first'),
            ('HOME-06', (16, 258, 377, 350), 'Studio · 17 | EPs | Singles · 15 | Live · 5 | Compilations · 15 | Other'),
            ('HOME-07', (16, 362, 377, 700), ''),
            ('HOME-09', (0, 708, 393, 796), ''),
            ('HOME-10', (10, 724, 76, 780), 'pile'),
            ('HOME-02', (84, 724, 250, 760), 'Floyd, the long ones · 4 albums'),
            ('HOME-11', (258, 726, 384, 778), 'Create series'),
        ],
        'phone_grid': ((16, 366, 377, 700), 2, 2, 14, (0,), True),
    },
}


def draw(level, screen):
    spec = LEVELS[level]
    size = (1280, 900) if screen == 'desktop' else (393, 852)
    small = screen == 'phone'
    img = Image.new('RGB', size, (238, 238, 238))
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT, 11 if small else 13)
    tag = ImageFont.truetype(MONO, 10, index=1)
    for kind, box, num in grid(*spec[f'{screen}_grid']):
        d.rectangle(box, fill=(214, 214, 214), outline=(120, 120, 120))
        if num:
            r = 14 if num == '+' else 16
            cx, cy = box[2] - 22, box[1] + 22
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255) if num == '+' else (60, 60, 60), outline=(60, 60, 60))
            d.text((cx, cy), num, font=f, fill=(0, 0, 0) if num == '+' else (255, 255, 255), anchor='mm')
    for inv, box, words in spec[screen]:
        dashed = inv is not None
        d.rectangle(box, outline=(0, 0, 0), width=2 if dashed else 1)
        if words:
            x0, y0, x1, y1 = box
            line, lines = '', []
            for w in words.split(' '):
                t = (line + ' ' + w).strip()
                if d.textlength(t, font=f) > (x1 - x0 - 12) and line:
                    lines.append(line); line = w
                else:
                    line = t
            lines.append(line)
            for i, ln in enumerate(lines[: max(1, (y1 - y0 - 8) // 15)]):
                d.text((x0 + 6, y0 + 6 + i * 15), ln, font=f, fill=(20, 20, 20))
        if inv:
            w = d.textlength(inv, font=tag) + 10
            d.rectangle((box[0] + 4, box[1] - 7, box[0] + 4 + w, box[1] + 7), fill=(0, 0, 0))
            d.text((box[0] + 9, box[1]), inv, font=tag, fill=(255, 255, 255), anchor='lm')
    title = f'F79 · Home · {level} v1 · {"computer 1280" if screen == "desktop" else "phone 393"} · state: albums chosen · wireframe'
    d.text((8, size[1] - 14 if screen == 'desktop' else 52), title, font=ImageFont.truetype(FONT, 10), fill=(90, 90, 90))
    path = os.path.join(OUT, f'home-{level}-v1-{screen}.png')
    img.save(path)
    print('written', os.path.relpath(path, os.path.join(OUT, '..', '..')))


for level in LEVELS:
    for screen in ('desktop', 'phone'):
        draw(level, screen)
