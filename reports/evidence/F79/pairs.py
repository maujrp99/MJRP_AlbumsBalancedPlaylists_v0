"""F79 · the prototype (left) and the built Home (right), side by side, one image per state and width.
Usage: python3 reports/evidence/F79/pairs.py reports/evidence/F79/shots reports/evidence/F79/pairs
"""
import os
import sys

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for name in sorted(os.listdir(src)):
    if not name.startswith('proto-'):
        continue
    built = os.path.join(src, 'built-' + name[len('proto-'):])
    if not os.path.exists(built):
        continue
    a, b = Image.open(os.path.join(src, name)), Image.open(built)
    gap, head = 16, 28
    pair = Image.new('RGB', (a.width + b.width + gap, max(a.height, b.height) + head), (40, 40, 44))
    pair.paste(a, (0, head))
    pair.paste(b, (a.width + gap, head))
    draw = ImageDraw.Draw(pair)
    draw.text((8, 8), 'prototype (approved v2)', fill=(253, 186, 116))
    draw.text((a.width + gap + 8, 8), 'built (this branch)', fill=(134, 239, 172))
    if pair.width > 1800:
        pair = pair.resize((pair.width // 2, pair.height // 2))
    target = os.path.join(out, 'pair-' + name[len('proto-'):])
    pair.save(target, quality=78)
    print(target)
