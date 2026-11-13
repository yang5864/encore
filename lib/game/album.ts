import type { Album, Career, Concept, Production } from "./types.ts";
import { agencyById } from "./agencies.ts";
import { CONCEPTS } from "./focus.ts";
import { rng } from "./rng.ts";
import { eraScale, yearOf } from "./format.ts";
import { budgetOf, chemistryQuality, rivalFor } from "./team.ts";
import { activityScores, melonRank, billboardRank, winChance, addBuzz, MUSIC_SHOWS } from "./metrics-model.ts";

const ALBUM_TITLES = ["FIRST LIGHT", "BLOOM", "NEON HOUR", "AFTERGLOW", "ORBIT", "MIDNIGHT CALL", "WAVE", "HEARTLINE", "SUPERNOVA", "ENCORE", "PRISM", "DAYBREAK", "GRAVITY", "PARADE", "LANTERN"];

/** 아직 1위 못 한 방송 중 하나를 골라 1위를 더한다. 모두 했으면 null. */
export function addShowWin(c: Career, album: Album, pick: number): string | null {
  const won = new Set(album.shows ?? []);
  const left = MUSIC_SHOWS.filter((s) => !won.has(s.name));
  if (!left.length) return null;
  const show = left[Math.floor(pick * left.length)].name;
  album.shows = [...(album.shows ?? []), show];
  album.wins = album.shows.length;
  c.musicWins += 1;
  return show;
}

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
  const tierMul = a?.tier === "major" ? 2.0 : a?.tier === "global" ? 1.15 : a?.tier === "mid" ? 1.0 : 0.5;
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

/** 같은 콘셉트를 연달아 낸 횟수 (직전 앨범부터 거슬러) */
export function conceptStreak(c: Pick<Career, "albums">, concept: Concept): number {
  let n = 0;
  for (let i = c.albums.length - 1; i >= 0 && c.albums[i].concept === concept; i--) n++;
  return n;
}

export const DEFAULT_PRODUCTION: Production = { producer: "inhouse", promo: "balanced" };

export function makeAlbum(c: Career, concept: Concept, customName?: string, production: Production = DEFAULT_PRODUCTION): Album {
  const a = agencyById(c.agencyId);
  const reach = a?.reach ?? 0.8;
  const streak = conceptStreak(c, concept); // 이번 앨범 전까지 같은 콘셉트 연속 수
  const switched = streak === 0 && c.albums.length > 0 && conceptStreak(c, c.albums[c.albums.length - 1].concept) >= 2;
  let quality = albumQuality(c, concept);
  // 매너리즘: 같은 콘셉트를 세 번째부터는 완성도가 깎이고 기대감이 식는다. 변신은 첫 앨범에 화제성을 준다
  const fatigue = Math.min(3, Math.max(0, streak - 1));
  quality = Math.max(10, quality - fatigue * 4);
  // 제작 방식
  if (production.producer === "star") quality = Math.min(100, quality + 10);
  if (production.producer === "self") quality = Math.max(10, quality + (c.stats.producing >= 70 ? 6 : c.stats.producing >= 55 ? 3 : -6));
  let cost = albumCost(c, quality);
  if (production.producer === "star") cost = Math.round(cost * 1.6 * 10) / 10;
  if (production.producer === "self") cost = Math.round(cost * 0.7 * 10) / 10;
  if (!c.flags.solo) quality = Math.max(10, Math.min(100, quality + chemistryQuality(c.chemistry)));
  const budget = budgetOf(c);
  const rival = rivalFor(c);
  if (c.flags.budgetBonus) { quality = Math.min(100, quality + 3); }
  if (c.flags.budgetCut) { quality = Math.max(10, quality - 3); }
  // 흥행은 꼬리가 길다: 대부분 평범하지만 가끔 바이럴로 폭발하고, 가끔은 크게 실패한다
  const roll = rng(c);
  const viral = roll < 0.03 + Math.max(0, quality - 60) / 700;
  const flop = !viral && roll > 0.86 - Math.max(0, 62 - quality) / 120;
  let hype = viral ? 2.5 + rng(c) * 2 : flop ? 0.3 + rng(c) * 0.3 : 0.7 + rng(c) * 0.8;
  hype *= 1 - fatigue * 0.08; // 또 그 콘셉트? 초동 기대가 식는다
  hype *= 0.75 + c.loyalty / 400; // 팬덤 결속: 50이면 0.875, 100이면 1.0, 0이면 0.75
  if (production.promo === "physical") hype *= 1.2;
  if (production.promo === "digital") hype *= 0.85;
  if (production.promo === "global") hype *= 0.9;
  hype *= 1 + (budget.mv - 25) / 200; // 뮤직비디오·마케팅 예산
  if (rival) hype *= 0.9; // 같은 시기 라이벌 컴백과 초동을 나눠 갖는다
  if (viral) c.flags.albumViral = c.turn;
  if (flop) c.flags.albumFlop = c.turn;
  const era = eraScale(yearOf(c));
  const prevSales = c.albums.length ? c.albums[c.albums.length - 1].sales : 0;
  // 초동 ≈ 코어 팬덤의 0.8~1.2배(중복 구매 포함) + 대중 유입. 톱 그룹 상한 450만장.
  const sales = Math.min(4500000, Math.round((c.fans * 0.85 + (Math.pow(quality, 1.7) * 4 + c.popularity * 300) * era) * hype * Math.pow(reach, 0.35)));

  // ── 다섯 점수 → 멜론 · 빌보드 · 음악방송 6개 (방송별 집계 비율이 다르다)
  // 매너리즘은 차트에서도 식고(−3/회), 두 번 이상 이어간 콘셉트를 바꾸면 변신 화제로 차트가 반응한다(+5)
  const activity = { quality, production, hype, budget, rival: !!rival, chartMod: (switched ? 5 : 0) - fatigue * 3 };
  const scores = activityScores(c, activity);
  const melon = melonRank(c, scores, !!rival, rng(c));
  const billboard = billboardRank(c, scores, activity, rng(c));
  const rookie = c.albums.length; // 0: 데뷔 앨범, 1: 두 번째
  const shows = MUSIC_SHOWS.filter((show) => rng(c) < winChance(c, scores, show, !!rival, rookie) * (1 + (c.flags.stageBonus ?? 0))).map((show) => show.name);
  if (rival) c.flags.rivalClash = c.turn; // 결과 문구용
  const wins = shows.length;
  const nearMiss = MUSIC_SHOWS.some((show) => winChance(c, scores, show, !!rival, rookie) >= 0.25);
  if (wins === 0 && nearMiss && rng(c) < 0.6) c.flags.candidate = c.turn + 1; // 다음 턴 시작 시 1위 후보 이벤트
  delete c.flags.stageBonus;

  // 억: 장당 1.5만원 × 총판 배수 2.2 × 유통·제작 공제 후 회사 몫 40% ≈ 장당 1.3만원
  const revenue = Math.round(sales * 0.000132 * 10) / 10;
  const index = c.albums.length;
  const trimmed = (customName ?? "").trim();
  const name = trimmed ? trimmed : suggestAlbumName(c);
  const album: Album = { id: `${c.id}-${index}`, turn: c.turn, name, concept, quality, sales, melon, billboard, wins, shows, cost, revenue, production, scores };
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
  // 팬덤 결속이 낮으면 새 팬이 머물지 않는다 (0 → 절반, 100 → 그대로). 음반 집중은 팬 유입이 크다
  c.fans += Math.round(gained * (0.5 + c.loyalty / 200) * (production.promo === "physical" ? 1.25 : 1));
  if (flop) c.fans = Math.round(c.fans * (0.82 + rng(c) * 0.08));
  c.popularity += (melon !== null ? Math.max(1, (60 - melon) / 15) : 0.5) + wins * 0.8 + (billboard !== null ? 4 : 0) + (viral ? 8 : flop ? -5 : 0);
  // 화제성·미디어: 컴백 자체 + 성적. 1위·바이럴·빌보드는 크게 튄다
  addBuzz(c, 14 + (melon !== null ? Math.max(0, 40 - melon) / 2 : 0) + wins * 5 + (billboard !== null ? 20 : 0) + (viral ? 30 : flop ? -8 : 0) + (budget.mv - 25) / 5);
  c.flags.mediaHeat = Math.min(100, (c.flags.mediaHeat ?? 0) + 25 + wins * 6 + (melon !== null && melon <= 10 ? 15 : 0) + (viral ? 25 : 0) + (billboard !== null ? 20 : 0));
  c.reputation += 2;
  if (production.producer === "self") { c.reputation += c.stats.producing >= 55 ? 3 : -2; c.stats.producing = Math.min(99, c.stats.producing + 2); }
  // 음반 집중은 팬을 챙기는 활동, 그 외 컴백은 팬덤이 조금 식는다. 1위·바이럴은 팬덤을 다시 묶는다
  c.loyalty = Math.max(0, Math.min(100, c.loyalty + (production.promo === "physical" ? 3 : -2) + (wins > 0 ? 2 : 0) + (viral ? 4 : 0)));
  delete c.flags.budgetBonus;
  delete c.flags.budgetCut;
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
  if (a.wins) parts.push(`음방 1위 ${a.wins}회${a.shows?.length ? ` (${a.shows.join(" · ")})` : ""}`);
  if (a.billboard !== null) parts.push(`빌보드 Hot 100 ${a.billboard}위`);
  return parts.join(" · ");
}
