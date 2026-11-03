import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const v3 = read("../public/art-v3/manifest.json");
const v4 = read("../public/art-v4/manifest.json");
const exists = (url) => existsSync(new URL(`../public${url}`, import.meta.url));
const frame = (f) => {
  const bounds = f.visibleBoundsAlphaAbove128 ?? f.alphaBounds;
  return {
    url: f.url,
    height: Number(((bounds[3] - bounds[1]) / f.height).toFixed(6)),
    x: f.footAnchor.x,
    y: f.footAnchor.y,
  };
};

const avatars = Object.values(v3.characters).map((a) =>
  Object.fromEntries(["idle", "sing", "dance"].map((action) => [action,
    [frame(a.frames[`${action}-01`]), frame(action === "idle" && a.frames["blink-closed"] ? a.frames["blink-closed"] : a.frames[`${action}-02`])],
  ])),
);
const scenes = Object.fromEntries(v4.events.map((event) => [event.id, {
  background: event.background.url,
  avatars: Object.fromEntries(event.avatars.map((a) => [a.avatar,
    a.frames.filter((f) => f.status === "ready" && exists(f.url)).map(frame),
  ])),
}]));
const catalog = { avatars, scenes };
mkdirSync(new URL("../lib/art", import.meta.url), { recursive: true });
writeFileSync(new URL("../lib/art/catalog.json", import.meta.url), `${JSON.stringify(catalog)}\n`);
console.log(`Art catalog: ${Object.keys(scenes).length} backgrounds, ${Object.values(scenes).reduce((n, s) => n + Object.values(s.avatars).flat().length, 0)} event frames`);
