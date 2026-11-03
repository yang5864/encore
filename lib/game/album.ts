import type { Album, Career, Concept } from "./types.ts";
import { agencyById } from "./agencies.ts";
import { CONCEPTS } from "./focus.ts";
import { rng } from "./rng.ts";
import { eraScale, yearOf } from "./format.ts";

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

/** 컴백 제작비(억). 티어에 따라 규모가 다르다: 대형 30~50억, 중견 10~20억, 중소 3~6억. */
export function albumCost(c: Career, quality: number): number {
  const a = agencyById(c.agencyId);
  const tierMul = a?.tier === "major" ? 2.0 : a?.tier === "global" ? 1.3 : a?.tier === "mid" ? 1.0 : 0.5;
  const budget = (a?.budget ?? 0.6) * tierMul * (c.flags.independent ? 0.6 : 1);
  // 제작비도 시대에 따라 커진다 (2006년 약 30% → 2021년 이후 100%)
  return Math.round((4 + 16 * (quality / 100)) * budget * eraScale(yearOf(c)) * 10) / 10;
}

/** Creates the album, applies sales/charts/fans/money. Returns the album. */
export const ALBUM_NAME_PATTERN = /^[\p{L}\p{N} _·!'&.:-]{1,20}$/u;

/** 소속사가 제안하는 다음 앨범명. */
export function suggestAlbumName(c: Pick<Career, "albums">): string {
  const index = c.albums.length;
  return `${ALBUM_TITLES[index % ALBUM_TITLES.length]}${index >= ALBUM_TITLES.length ? ` ${Math.floor(index / ALBUM_TITLES.length) + 1}` : ""}`;
}

export function makeAlbum(c: Career, concept: Concept, customName?: string): Album {
  const a = agencyById(c.agencyId);
  const reach = a?.reach ?? 0.8;
  const quality = albumQuality(c, concept);
  const cost = albumCost(c, quality);
  // 흥행은 꼬리가 길다: 대부분 평범하지만 가끔 바이럴로 폭발하고, 가끔은 크게 실패한다
  const roll = rng(c);
  const viral = roll < 0.03 + Math.max(0, quality - 60) / 700;
  const flop = !viral && roll > 0.86 - Math.max(0, 62 - quality) / 120;
  const hype = viral ? 2.5 + rng(c) * 2 : flop ? 0.3 + rng(c) * 0.3 : 0.7 + rng(c) * 0.8;
  if (viral) c.flags.albumViral = c.turn;
  if (flop) c.flags.albumFlop = c.turn;
  const era = eraScale(yearOf(c));
  const prevSales = c.albums.length ? c.albums[c.albums.length - 1].sales : 0;
  // 초동 ≈ 코어 팬덤의 0.8~1.2배(중복 구매 포함) + 대중 유입. 톱 그룹 상한 450만장.
  const sales = Math.min(4500000, Math.round((c.fans * 0.85 + (Math.pow(quality, 1.7) * 4 + c.popularity * 300) * era) * hype * Math.pow(reach, 0.35)));

  const popularity = c.popularity;
  const chartScore = quality * 0.5 + Math.log10(c.fans / era + 100) * 7.5 + popularity * 0.25 + (concept === "fresh" ? 3 : 0) + rng(c) * 12 + (viral ? 18 : flop ? -15 : 0);
  const melon = chartScore >= 78 ? Math.max(1, Math.round(100 - (chartScore - 78) * 5.5)) : null;

  let billboard: number | null = null;
  if (popularity >= 70 && c.fans / era >= 1500000) {
    const globalBoost = c.flags.globalBoost !== undefined && c.turn - c.flags.globalBoost <= 2 ? 6 : 0;
    const globalScore = quality * 0.5 + Math.log10(c.fans / era) * 8 + reach * 4 + globalBoost + rng(c) * 12;
    if (globalScore >= 95) {
      billboard = Math.max(1, Math.min(100, Math.round(100 - (globalScore - 95) * 4)));
      if (billboard > 1 && c.fans / era >= 4000000 && quality >= 85 && rng(c) < 0.35) billboard = 1;
    }
  }

  // 음악방송 1위 (최대 3회)
  let wins = 0;
  if (melon !== null && melon <= 30 || sales / era >= 150000) {
    const p = Math.max(0.08, Math.min(0.9, 0.08 + sales / era / 2500000 + (melon !== null ? Math.max(0, 40 - melon) / 90 : 0)));
    for (let i = 0; i < 3; i++) if (rng(c) < p) wins++;
    if (wins === 0 && rng(c) < 0.5) c.flags.candidate = c.turn + 1; // 다음 턴 시작 시 1위 후보 이벤트
  }

  // 억: 장당 1.5만원 × 총판 배수 2.2 × 유통·제작 공제 후 회사 몫 40% ≈ 장당 1.3만원
  const revenue = Math.round(sales * 0.000132 * 10) / 10;
  const index = c.albums.length;
  const trimmed = (customName ?? "").trim();
  const name = trimmed ? trimmed : suggestAlbumName(c);
  const album: Album = { id: `${c.id}-${index}`, turn: c.turn, name, concept, quality, sales, melon, billboard, wins, cost, revenue };
  c.albums.push(album);
  c.lastReleaseTurn = c.turn;
  c.money.invested += cost;
  c.money.revenue += revenue;
  c.musicWins += wins;
  c.peakMelon = melon === null ? c.peakMelon : Math.min(c.peakMelon ?? 101, melon);
  c.peakBillboard = billboard === null ? c.peakBillboard : Math.min(c.peakBillboard ?? 101, billboard);

  // 팬덤 성장: 신인기엔 활동마다 크게, 300만 이상부터는 완만하게 (실제 톱 그룹 초동 성장 곡선)
  const damp = 1 / (1 + c.fans / era / 2000000);
  const gained = Math.round((sales * 0.16 * (1 + wins * 0.1) + ((melon !== null ? (101 - melon) * 400 : 0) + (billboard !== null ? 250000 : 0)) * era) * Math.pow(reach, 0.35) * damp);
  c.fans += gained;
  if (flop) c.fans = Math.round(c.fans * (0.82 + rng(c) * 0.08));
  c.popularity += (melon !== null ? 4 : 1) + wins * 1 + (billboard !== null ? 4 : 0) + (viral ? 10 : flop ? -6 : 0);
  c.reputation += 2;
  c.health -= 14;
  c.mental -= 6;
  if (prevSales > 0 && sales > prevSales * 4 && sales > 100000 && rng(c) < 0.5) c.flags.salesSpike = c.turn + 1;
  if (concept === "ballad" && c.stats.vocal < 45) c.flags.liveRisk = c.turn + 1;
  for (const k of CONCEPTS.find((x) => x.id === concept)!.stats) c.stats[k] = Math.min(99, c.stats[k] + (rng(c) < 0.5 ? 2 : 1));
  return album;
}

export function albumSummary(a: Album): string {
  const parts = [`초동 ${a.sales.toLocaleString("ko-KR")}장`];
  parts.push(a.melon !== null ? `멜론 최고 ${a.melon}위` : "멜론 차트 밖");
  if (a.wins) parts.push(`음방 1위 ${a.wins}회`);
  if (a.billboard !== null) parts.push(`빌보드 Hot 100 ${a.billboard}위`);
  return parts.join(" · ");
}
