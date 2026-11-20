#!/usr/bin/env python3
"""F76 TASK-05/06: the computer did not change (REQ-12).

    python3 reports/evidence/F76/harness/home-blend-compare.py

Compares, scene by scene, reports/evidence/F76/home-blend/before/*-1280x800.png (the base branch,
feat/f76-mobile-redesign) with after/ (this branch), pixel by pixel, and the layout measures of
measures.json. Prints one line per scene: the share of pixels that differ and the largest
difference of a channel, and whether the measures are equal.
"""
import json
import pathlib
from PIL import Image, ImageChops

HERE = pathlib.Path(__file__).resolve().parent.parent / 'home-blend'


def pixel_diff(a, b):
    one, two = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if one.size != two.size:
        return 1.0, 255
    diff = ImageChops.difference(one, two)
    changed = sum(1 for p in diff.getdata() if max(p) > 8)
    return changed / (one.size[0] * one.size[1]), max(max(p) for p in diff.getdata())


def main():
    before = json.loads((HERE / 'before' / 'measures.json').read_text())
    after = json.loads((HERE / 'after' / 'measures.json').read_text())
    keys = ('scrollWidth', 'scrollHeight', 'textBelow12', 'fieldsBelow16', 'targetsBelow44', 'innerScrollers', 'boxes')
    for shot in sorted((HERE / 'before').glob('*-1280x800.png')):
        scene = shot.stem
        share, worst = pixel_diff(shot, HERE / 'after' / shot.name)
        same = all(before.get(scene, {}).get(k) == after.get(scene, {}).get(k) for k in keys)
        print(f'{scene:28} pixels changed {share:7.3%}  worst channel {worst:3}  measures {"equal" if same else "DIFFER"}')


if __name__ == '__main__':
    main()
