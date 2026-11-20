"""F76 evidence (REQ-12): the screens that are not the phone, before and after, compared.

    python3 reports/evidence/F76/compare.py

For every screenshot at 1280x800 and 852x393 that exists in before/ and in after/ (the viewport,
the whole page `-full`, and the windows `window-*`): the number of pixels that differ and by how much. For every
screen measured in both measures.json: whether the layout (width and height of the page and the
box of each main part: x, y, width, height) is the same. Needs Pillow.
"""
import glob
import json
import os

from PIL import Image, ImageChops

here = os.path.dirname(os.path.abspath(__file__))
NOT_THE_PHONE = ('1280x800', '852x393')


# A blurred glass panel is composited with rounding that changes from one run to the next: a few
# pixels off by one or two levels of 255 in one channel. Counted and printed, and not a difference
# of layout: the limit is 2 levels on at most 100 pixels.
NOISE_LEVELS, NOISE_PIXELS = 2, 100


def pixels_that_differ(a, b):
    """(pixels that differ, the largest difference in one channel, the box around them), or a text when the sizes differ."""
    one, two = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if one.size != two.size:
        return f'sizes differ: {one.size} and {two.size}'
    difference = ImageChops.difference(one, two)
    box = difference.getbbox()
    if box is None:
        return (0, 0, None)
    count = difference.convert('L').point(lambda v: 255 if v else 0).histogram()[255]
    largest = max(high for _, high in difference.getextrema())
    return (count, largest, box)


worst = 0
noise = 0
for before in sorted(glob.glob(os.path.join(here, 'before', '*.png'))):
    name = os.path.basename(before)
    after = os.path.join(here, 'after', name)
    if not any(size in name for size in NOT_THE_PHONE) or not os.path.exists(after):
        continue
    result = pixels_that_differ(before, after)
    if isinstance(result, str):
        worst += 1
        print(f'{name}: {result}')
        continue
    count, largest, box = result
    if count == 0:
        print(f'{name}: identical')
    elif largest <= NOISE_LEVELS and count <= NOISE_PIXELS:
        noise += 1
        print(f'{name}: rounding only ({count} pixels off by at most {largest}/255, inside {box})')
    else:
        worst += 1
        print(f'{name}: {count} PIXELS DIFFER by up to {largest}/255, inside {box}')

for file in ('measures.json', 'windows.json'):
    paths = [os.path.join(here, label, file) for label in ('before', 'after')]
    if not all(os.path.exists(p) for p in paths):
        continue
    before, after = (json.load(open(p)) for p in paths)
    for key in before:
        if not any(size in key for size in NOT_THE_PHONE) or key not in after:
            continue
        # the class names and the role of a window are not layout: F76 adds names the computer has no rule for
        # and a small target is compared by its size: F76 gave the close button of a window a name («Close»)
        skip = ('shell', 'role')
        def layout(measure):
            kept = {k: v for k, v in measure.items() if k not in skip}
            if file == 'windows.json':
                kept['targetsBelow44'] = [target[1:] for target in kept['targetsBelow44']]
            return kept
        same = layout(before[key]) == layout(after[key])
        worst += 0 if same else 1
        print(f'{file} {key}: {"same measures" if same else "MEASURES DIFFER"}')

print('RESULT:', (f'the computer and the phone lying down are the same; {noise} capture(s) with rounding only' if worst == 0 else f'{worst} DIFFERENCES'))
