#!/usr/bin/env python3
"""F76 TASK-03: the computer (1280x800) before and after, pixel by pixel and by measures; and the
phone's numbers before and after.   python3 reports/evidence/F76/album-window/compare.py"""
import json
import os
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
SCREENS = ['album', 'inventory', 'rank']


def load(label):
    with open(os.path.join(HERE, label, 'measures.json')) as handle:
        return json.load(handle)


def pixels(screen):
    before = Image.open(os.path.join(HERE, 'before', f'{screen}-1280x800.png')).convert('RGB')
    after = Image.open(os.path.join(HERE, 'after', f'{screen}-1280x800.png')).convert('RGB')
    diff = ImageChops.difference(before, after)
    changed = sum(1 for p in diff.getdata() if max(p) > 16)
    return before.size == after.size, diff.getbbox(), changed


def main():
    before, after = load('before'), load('after')
    for screen in SCREENS:
        same_size, box, changed = pixels(screen)
        key = f'{screen}-1280x800'
        keys = ['docScrollWidth', 'targets', 'targetsBelow44', 'scrollingBoxes', 'textBelow12', 'fieldsBelow16', 'boxes']
        differs = [k for k in keys if before[key][k] != after[key][k]]
        print(f'1280x800 {screen}: same size {same_size}, pixels changed (>16) {changed}, box {box}, measures that differ {differs}')
    for screen in SCREENS:
        key = f'{screen}-393x852'
        b, a = before[key], after[key]
        print(f'393x852 {screen}: tracks fully visible {b["tracksFullyVisible"]} -> {a["tracksFullyVisible"]}; '
              f'targets < 44 {len(b["targetsBelow44"])} -> {len(a["targetsBelow44"])}; text < 12 {len(b["textBelow12"])} -> {len(a["textBelow12"])}; '
              f'scrolling boxes {b["scrollingBoxes"]} -> {a["scrollingBoxes"]}; narrowest title {b["narrowestTitlePx"]} -> {a["narrowestTitlePx"]}')
        if b['albumTitle'] or a['albumTitle']:
            print(f'    album title box (w x h) {b["albumTitle"] and (b["albumTitle"]["width"], b["albumTitle"]["height"])} -> {a["albumTitle"] and (a["albumTitle"]["width"], a["albumTitle"]["height"])}')
        print(f'    targets < 44 before: {b["targetsBelow44"][:6]}')


if __name__ == '__main__':
    main()
