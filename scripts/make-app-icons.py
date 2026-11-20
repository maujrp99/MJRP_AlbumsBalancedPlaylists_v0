"""The icon of the app on the home screen of a phone (F76, REQ-13).

    python3 scripts/make-app-icons.py

Draws the app's logo (public/assets/images/logo.png, which is not square and has no background) in
the middle of a black square, the colour of the app, at the sizes the iPhone (180) and the web
manifest (192, 512) ask for. The logo takes 72% of the square, so a mask that rounds the icon
cuts nothing. Needs Pillow.
"""
from PIL import Image

LOGO = 'public/assets/images/logo.png'
SIZES = (180, 192, 512)
SHARE = 0.72

logo = Image.open(LOGO).convert('RGBA')
for size in SIZES:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    box = int(size * SHARE)
    scale = min(box / logo.width, box / logo.height)
    art = logo.resize((round(logo.width * scale), round(logo.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    canvas.convert('RGB').save(f'public/assets/images/app-icon-{size}.png', optimize=True)
    print(f'app-icon-{size}.png')
