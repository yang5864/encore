/**
 * 배포 직후 이미지 최적화 캐시를 데운다. 처음 요청이 1초 넘게 걸리는 큰 PNG(아트 프레임)를 미리 변환시켜 둔다.
 * 사용: node scripts/warm-images.mjs https://encore-alpha-peach.vercel.app
 */
import catalog from "../lib/art/catalog.json" with { type: "json" };

const base = process.argv[2];
if (!base) { console.error("base url이 필요해요"); process.exit(1); }
const WIDTHS = { background: [750, 640, 480], frame: [640, 384] };
const urls = new Set();
for (const scene of Object.values(catalog.scenes)) {
  for (const w of WIDTHS.background) urls.add(`${base}/_next/image?url=${encodeURIComponent(scene.background)}&w=${w}&q=75`);
  for (const frames of Object.values(scene.avatars)) for (const f of frames) for (const w of WIDTHS.frame) urls.add(`${base}/_next/image?url=${encodeURIComponent(f.url)}&w=${w}&q=75`);
}
// idle/sing/dance는 프레임 배열, mood는 { sad, happy } 객체
for (const av of catalog.avatars) for (const v of Object.values(av)) for (const f of Array.isArray(v) ? v : Object.values(v ?? {})) if (f?.url) for (const w of WIDTHS.frame) urls.add(`${base}/_next/image?url=${encodeURIComponent(f.url)}&w=${w}&q=75`);
const list = [...urls];
console.log(`warming ${list.length} image variants`);
let ok = 0, fail = 0;
const started = Date.now();
await Promise.all(Array.from({ length: 12 }, async () => {
  while (list.length) {
    const u = list.pop();
    try { const r = await fetch(u, { headers: { Accept: "image/webp,*/*" } }); r.ok ? ok++ : fail++; await r.arrayBuffer(); } catch { fail++; }
  }
}));
console.log(`done: ${ok} ok, ${fail} failed in ${Math.round((Date.now() - started) / 1000)}s`);
