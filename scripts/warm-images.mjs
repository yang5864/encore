/**
 * 배포 직후 CDN 캐시를 데운다: 장면 그림(화면용 WebP, public/art-web)을 한 번씩 받아 엣지에 올려 둔다.
 * 사용: node scripts/warm-images.mjs https://encore-alpha-peach.vercel.app
 */
import manifest from "../lib/art/web-manifest.json" with { type: "json" };

const base = process.argv[2];
if (!base) { console.error("base url이 필요해요"); process.exit(1); }
const list = Object.entries(manifest).map(([url, hash]) => `${base}/art-web${url.replace(/\.png$/, ".webp")}?v=${hash}`);
console.log(`warming ${list.length} images`);
let ok = 0, fail = 0;
const started = Date.now();
await Promise.all(Array.from({ length: 12 }, async () => {
  while (list.length) {
    const u = list.pop();
    try { const r = await fetch(u); r.ok ? ok++ : fail++; await r.arrayBuffer(); } catch { fail++; }
  }
}));
console.log(`done: ${ok} ok, ${fail} failed in ${Math.round((Date.now() - started) / 1000)}s`);
