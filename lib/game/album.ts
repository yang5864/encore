import type { Album, Career, Concept } from "./types.ts";
import { agencyById } from "./agencies.ts";
import { CONCEPTS } from "./focus.ts";
import { rng } from "./rng.ts";

const ALBUM_TITLES = ["FIRST LIGHT", "BLOOM", "NEON HOUR", "AFTERGLOW", "ORBIT", "MIDNIGHT CALL", "WAVE", "HEARTLINE", "SUPERNOVA", "ENCORE", "PRISM", "DAYBREAK", "GRAVITY", "PARADE", "LANTERN"];

export function albumQuality(c: Career, concept: Concept): number {
  const s = c.stats;
  const base =
    concept === "fresh" ? s.visual * 0.35 + s.dance * 0.3 + s.vocal * 0.2 + s.variety * 0.15
    : concept === "girlcrush" ? s.rap * 0.35 + s.dance * 0.3 + s.visual * 0.2 + s.producing * 0.15
    : concept === "ballad" ? s.vocal * 0.55 + s.producing * 0.25 + s.visual * 0.2
    : s.dance * 0.5 + s.visual * 0.2 + s.vocal * 0.15 + s.producing * 0.15;
  const a = agencyById(c.agencyId);
  const match = a && CONCEPTS.find((x) => x.id === concept)?.stats.includes(a.stat) ? 3 : 0;
  const condition = Math.min(c.health, c.mental);
  return Math.round(Math.max(10, Math.min(100, base * (0.85 + condition / 600) + match + rng(c) * 8)));
}

export function albumCost(c: Career, quality: number): number {
  const a = agencyById(c.agencyId);
  const budget = (a?.budget ?? 0.6) * (c.flags.independent ? 0.6 : 1);
  return Math.round((8 + 22 * (quality / 100)) * budget * 10) / 10;
}

/** Creates the album, applies sales/charts/fans/money. Returns the album. */
export function makeAlbum(c: Career, concept: Concept): Album {
  const a = agencyById(c.agencyId);
  const reach = a?.reach ?? 0.8;
  const quality = albumQuality(c, concept);
  const cost = albumCost(c, quality);
  const hype = 0.85 + rng(c) * 0.45;
  const prevSales = c.albums.length ? c.albums[c.albums.length - 1].sales : 0;
  const sales = Math.min(4000000, Math.round((c.fans * 0.45 + Math.pow(quality, 1.9) * 3) * hype * Math.sqrt(reach)));

  const popularity = c.popularity;
  const chartScore = quality * 0.5 + Math.log10(c.fans + 100) * 9 + popularity * 0.25 + (concept === "fresh" ? 3 : 0) + rng(c) * 12;
  const melon = chartScore >= 78 ? Math.max(1, Math.round(100 - (chartScore - 78) * 5.5)) : null;

  let billboard: number | null = null;
  if (popularity >= 70 && c.fans >= 500000) {
    const globalBoost = c.flags.globalBoost !== undefined && c.turn - c.flags.globalBoost <= 2 ? 6 : 0;
    const globalScore = quality * 0.5 + Math.log10(c.fans) * 8 + reach * 4 + globalBoost + rng(c) * 12;
    if (globalScore >= 95) {
      billboard = Math.max(1, Math.min(100, Math.round(100 - (globalScore - 95) * 4)));
      if (billboard > 1 && c.fans >= 3000000 && quality >= 85 && rng(c) < 0.35) billboard = 1;
    }
  }

  // 음악방송 1위 (최대 3회)
  let wins = 0;
  if (melon !== null && melon <= 30 || sales >= 50000) {
    const p = Math.max(0.08, Math.min(0.9, 0.08 + sales / 1000000 + (melon !== null ? Math.max(0, 40 - melon) / 120 : 0)));
    for (let i = 0; i < 3; i++) if (rng(c) < p) wins++;
    if (wins === 0 && rng(c) < 0.5) c.flags.candidate = c.turn + 1; // 다음 턴 시작 시 1위 후보 이벤트
  }

  const revenue = Math.round(sales * 0.00025 * 10) / 10; // 억: 장당 약 1.5만원 × 누적 판매 배수 × 유통 후 회사 몫
  const index = c.albums.length;
  const name = `${ALBUM_TITLES[index % ALBUM_TITLES.length]}${index >= ALBUM_TITLES.length ? ` ${Math.floor(index / ALBUM_TITLES.length) + 1}` : ""}`;
  const album: Album = { id: `${c.id}-${index}`, turn: c.turn, name, concept, quality, sales, melon, billboard, wins, cost, revenue };
  c.albums.push(album);
  c.lastReleaseTurn = c.turn;
  c.money.invested += cost;
  c.money.revenue += revenue;
  c.musicWins += wins;
  c.peakMelon = melon === null ? c.peakMelon : Math.min(c.peakMelon ?? 101, melon);
  c.peakBillboard = billboard === null ? c.peakBillboard : Math.min(c.peakBillboard ?? 101, billboard);

  const damp = 1 / (1 + c.fans / 1000000);
  const gained = Math.round((sales * 0.35 * (1 + wins * 0.12) + (melon !== null ? (101 - melon) * 250 : 0) + (billboard !== null ? 200000 : 0)) * Math.sqrt(reach) * damp);
  c.fans += gained;
  c.popularity += (melon !== null ? 4 : 1) + wins * 1 + (billboard !== null ? 4 : 0);
  c.reputation += 2;
  c.health -= 14;
  c.mental -= 6;
  if (prevSales > 0 && sales > prevSales * 4 && sales > 100000 && rng(c) < 0.5) c.flags.salesSpike = c.turn + 1;
  if (concept === "ballad" && c.stats.vocal < 45) c.flags.liveRisk = c.turn + 1;
  for (const k of CONCEPTS.find((x) => x.id === concept)!.stats) c.stats[k] = Math.min(99, c.stats[k] + 1.5);
  return album;
}

export function albumSummary(a: Album): string {
  const parts = [`초동 ${a.sales.toLocaleString("ko-KR")}장`];
  parts.push(a.melon !== null ? `멜론 최고 ${a.melon}위` : "멜론 차트 밖");
  if (a.wins) parts.push(`음방 1위 ${a.wins}회`);
  if (a.billboard !== null) parts.push(`빌보드 Hot 100 ${a.billboard}위`);
  return parts.join(" · ");
}
