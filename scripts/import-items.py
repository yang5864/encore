#!/usr/bin/env python3
"""상점 아이템 그림(일반·프로·마스터)을 흰 배경 제거 후 1254px 정사각 캔버스 가운데(80%)에 놓는다.
입력 public/art-v6/inbox/items/<key>-0N.png → 출력 public/art-v6/items/<key>-0N.png"""
import glob, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
key_white = import_module("import-remake").key_white
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT, CANVAS = os.path.join(ROOT, "public/art-v6/inbox/items"), os.path.join(ROOT, "public/art-v6/items"), 1254
os.makedirs(OUT, exist_ok=True)
n = 0
for p in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    im = key_white(Image.open(p))
    crop = im.crop(im.getbbox())
    s = 0.8 * CANVAS / max(crop.size)
    crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(crop, ((CANVAS - crop.width) // 2, (CANVAS - crop.height) // 2))
    canvas.save(os.path.join(OUT, os.path.basename(p)), optimize=True)
    n += 1
print(f"아이템 {n}장 → public/art-v6/items/")
