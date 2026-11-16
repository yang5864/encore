/**
 * 장면 그림을 화면 크기에 맞춘 WebP로 미리 만들어 둔다 (public/art-web/…).
 * 런타임 이미지 최적화는 크기마다 첫 요청이 1초 넘게 걸려서, 이벤트가 뜰 때 그림이 늦게 나왔다.
 * 원본 PNG가 바뀐 파일만 다시 만들고, 내용 해시를 lib/art/web-manifest.json에 적는다 (주소 뒤 ?v= 로 캐시를 갈아 끼운다).
 * 사용: node scripts/build-art-web.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import sharp from "sharp";
import catalog from "../lib/art/catalog.json" with { type: "json" };

const BG_WIDTH = 960; // 화면 최대 폭 480px × 2배
const FRAME_SIDE = 480; // 캐릭터 프레임 긴 변 (화면에서 약 125px × 3배)
const MANIFEST = "lib/art/web-manifest.json";

const backgrounds = new Set();
const frames = new Set();
for (const scene of Object.values(catalog.scenes)) {
  backgrounds.add(scene.background);
  for (const list of Object.values(scene.avatars)) for (const f of list) frames.add(f.url);
}
for (const av of catalog.avatars) for (const v of Object.values(av)) for (const f of Array.isArray(v) ? v : Object.values(v ?? {})) if (f?.url) frames.add(f.url);

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
const next = {};
let built = 0, bytes = 0;
for (const [url, kind] of [...[...backgrounds].map((u) => [u, "bg"]), ...[...frames].map((u) => [u, "frame"])]) {
  const src = `public${url}`;
  if (!existsSync(src)) continue;
  const out = `public/art-web${url.replace(/\.png$/, ".webp")}`;
  const hash = createHash("sha1").update(readFileSync(src)).digest("hex").slice(0, 8);
  next[url] = hash;
  if (manifest[url] !== hash || !existsSync(out)) {
    mkdirSync(dirname(out), { recursive: true });
    const img = sharp(src);
    await (kind === "bg" ? img.resize({ width: BG_WIDTH, withoutEnlargement: true }).webp({ quality: 74 }) : img.resize({ width: FRAME_SIDE, height: FRAME_SIDE, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 })).toFile(out);
    built++;
  }
  bytes += statSync(out).size;
}
writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(next).sort()), null, 0) + "\n");
console.log(`art-web: ${Object.keys(next).length} files (${built} rebuilt), ${(bytes / 1e6).toFixed(1)} MB`);
