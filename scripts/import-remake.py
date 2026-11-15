#!/usr/bin/env python3
"""
기존 캐릭터 0~5 리메이크 그림을 게임에 연결한다.

입력 (Claude 채팅에서 뽑아 넣은 파일):
  public/art-v6/inbox/remake/avatar-<N>/idle-open.png, idle-closed.png, sing.png, dance.png, mood-sad.png, mood-happy.png
  public/art-v6/inbox/remake/avatar-<N>/awards/<scene>.png   (scene: redcarpet stage seat win cry speech lose, 4프레임 가로 스트립)

하는 일:
  1. 흰 배경을 가장자리부터 지운다 (외곽선 안쪽 흰색은 남는다)
  2. 기존 규칙대로 1254px 정사각 캔버스에 놓는다: 기본 포즈는 키 84%·발 93%, 시상식은 장면마다 4프레임이 같은 배율·같은 발 높이
  3. lib/art/catalog.json을 고친다: 기본 포즈·표정·시상식 7장면을 새 그림으로, 그 밖의 장면 전용 그림은 빼서 새 캐릭터 12명처럼 기본 포즈를 쓰게 한다

사용: python3 scripts/import-remake.py [--avatars 0,1,2] [--dry-run]
"""
import argparse, json, os, sys
from collections import deque
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, "public/art-v6/inbox/remake")
OUT_URL = "/art-v6/characters"
OUT_DIR = os.path.join(ROOT, "public/art-v6/characters")
CATALOG = os.path.join(ROOT, "lib/art/catalog.json")
CANVAS = 1254
SINGLES = ["idle-open", "idle-closed", "sing", "dance", "mood-sad", "mood-happy"]
AWARDS = ["redcarpet", "stage", "seat", "win", "cry", "speech", "lose"]
KEEP_SCENES = {"military-band"}  # 이번 리메이크와 같은 비율로 이미 그려진 장면


def key_white(im: Image.Image, threshold=238) -> Image.Image:
    """가장자리와 이어진 흰 배경만 투명하게. 이미 투명한 그림은 그대로 둔다."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    if px[0, 0][3] == 0 and px[w - 1, h - 1][3] == 0:
        return im
    seen = bytearray(w * h)
    q = deque()
    def bright(p):
        return p[3] > 0 and min(p[0], p[1], p[2]) >= threshold
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        p = px[x, y]
        if not (p[3] == 0 or bright(p)):
            continue
        px[x, y] = (255, 255, 255, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    # 지워진 배경에 붙은 밝은 테두리 한 겹(안티앨리어싱 흔적)도 지운다
    halo = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            p = px[x, y]
            if p[3] and min(p[0], p[1], p[2]) >= 215 and any(px[a, b][3] == 0 for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))):
                halo.append((x, y))
    for x, y in halo:
        px[x, y] = (255, 255, 255, 0)
    return im


def place(im: Image.Image, scale: float, foot_y: float) -> tuple[Image.Image, dict]:
    """bbox를 scale배 해서 캔버스 가운데, 발이 foot_y에 오게 놓는다. 카탈로그 값(height·x·y)도 돌려준다."""
    box = im.getbbox()
    crop = im.crop(box)
    w, h = crop.size
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    left = (CANVAS - nw) // 2
    top = round(foot_y * CANVAS) - nh
    canvas.alpha_composite(crop, (left, max(0, top)))
    b = canvas.getbbox()
    meta = {"height": round((b[3] - b[1]) / CANVAS, 6), "x": round(((b[0] + b[2]) / 2) / CANVAS, 6), "y": round(b[3] / CANVAS, 6)}
    return canvas, meta


def frame_entry(url: str, meta: dict) -> dict:
    return {"url": url, **meta}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--avatars", default="0,1,2,3,4,5")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    catalog = json.load(open(CATALOG))
    done = []
    for n in [int(x) for x in args.avatars.split(",")]:
        src = os.path.join(INBOX, f"avatar-{n}")
        missing = [s for s in SINGLES if not os.path.exists(os.path.join(src, f"{s}.png"))]
        missing += [f"awards/{s}" for s in AWARDS if not os.path.exists(os.path.join(src, "awards", f"{s}.png"))]
        if missing:
            print(f"avatar-{n}: 건너뜀, 없는 파일 {', '.join(missing)}")
            continue
        out = os.path.join(OUT_DIR, f"avatar-{n}")
        os.makedirs(out, exist_ok=True)
        # 기본 포즈: idle-open 키를 기준으로 같은 배율을 모든 단일 그림에 쓴다
        singles = {s: key_white(Image.open(os.path.join(src, f"{s}.png"))) for s in SINGLES}
        ref_h = singles["idle-open"].getbbox()
        scale = 0.84 * CANVAS / (ref_h[3] - ref_h[1])
        metas = {}
        for s, im in singles.items():
            canvas, meta = place(im, scale, 0.93)
            metas[s] = meta
            if not args.dry_run:
                canvas.save(os.path.join(out, f"{s}.png"), optimize=True)
        u = lambda s: frame_entry(f"{OUT_URL}/avatar-{n}/{s}.png", metas[s])
        catalog["avatars"][n] = {
            "idle": [u("idle-open"), u("idle-closed")],
            "sing": [u("sing"), u("idle-open")],
            "dance": [u("dance"), u("idle-open")],
            "mood": {"sad": u("mood-sad"), "happy": u("mood-happy")},
        }
        # 시상식: 스트립을 4등분, 4프레임 중 가장 큰 키에 맞춘 공통 배율
        for scene in AWARDS:
            strip = Image.open(os.path.join(src, "awards", f"{scene}.png")).convert("RGBA")
            fw = strip.width // 4
            frames = [key_white(strip.crop((k * fw, 0, (k + 1) * fw, strip.height))) for k in range(4)]
            tallest = max(f.getbbox()[3] - f.getbbox()[1] for f in frames)
            sc = 0.86 * CANVAS / tallest
            entries = []
            os.makedirs(os.path.join(out, f"awards-{scene}"), exist_ok=True)
            for k, f in enumerate(frames, 1):
                canvas, meta = place(f, sc, 0.94)
                if not args.dry_run:
                    canvas.save(os.path.join(out, f"awards-{scene}", f"{k:02d}.png"), optimize=True)
                entries.append(frame_entry(f"{OUT_URL}/avatar-{n}/awards-{scene}/{k:02d}.png", meta))
            catalog["scenes"][f"awards-{scene}"]["avatars"][str(n)] = entries
        # 옛 비율로 그린 장면 전용 그림은 뺀다: 기본 포즈로 그려진다 (새 캐릭터 12명과 같은 방식)
        dropped = []
        for sid, sc_ in catalog["scenes"].items():
            if sid.startswith("awards-") and sid != "awards-announce":
                continue
            if sid in KEEP_SCENES or sid == "awards-announce":
                continue
            if str(n) in sc_["avatars"]:
                del sc_["avatars"][str(n)]
                dropped.append(sid)
        done.append(n)
        print(f"avatar-{n}: 기본 6장 · 시상식 28장 연결, 옛 장면 {len(dropped)}개 해제")
    if done and not args.dry_run:
        with open(CATALOG, "w") as f:
            json.dump(catalog, f, ensure_ascii=False, separators=(",", ": "))
        print(f"catalog.json 갱신: avatar {', '.join(map(str, done))}")
    elif args.dry_run:
        print("dry-run: 파일과 카탈로그를 쓰지 않았어요")


if __name__ == "__main__":
    sys.exit(main())
