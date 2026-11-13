import type { Career, Production } from "./types.ts";
import { eraScale, yearOf } from "./format.ts";
import { agencyById } from "./agencies.ts";
import { rivalFor } from "./team.ts";

/**
 * 지표가 서로 얽혀 움직이는 모델. 한 활동(앨범)에서 다섯 가지 점수를 먼저 구하고,
 * 그 점수로 멜론 순위·음악방송 6개·브랜드평판·팬 유입을 각각 다른 비율로 계산한다.
 *
 * - digital   음원: 곡의 힘(완성도) + 대중 인지도 + 화제성 + 팬덤 스트리밍
 * - physical  음반: 팬덤 규모 × 결속 × 기대감
 * - broadcast 방송: 활동 중 방송 출연 횟수 (회사 역량·인기)
 * - social    소셜/영상: 유튜브·인스타 규모 + MV 예산 + 바이럴
 * - vote      투표: 팬덤 × 결속 (해외 팬 가산)
 *
 * 실제 음악방송 집계 비율(디지털 40~65%, 음반 5~15%, 방송 10~20%, 소셜/영상 5~35%, 투표 5~20%)을 방송별로 따른다.
 */
export type Scores = { digital: number; physical: number; broadcast: number; social: number; vote: number };

export type ShowDef = { name: string; w: Scores; /** 그 주 경쟁자 기본 점수(0~100). 케이블 순위제가 조금 열려 있다 */ bar: number };
export const MUSIC_SHOWS: ShowDef[] = [
  { name: "더쇼", w: { digital: 0.1, physical: 0.15, broadcast: 0.05, social: 0.45, vote: 0.25 }, bar: 62 },
  { name: "쇼챔피언", w: { digital: 0.4, physical: 0.1, broadcast: 0.15, social: 0.15, vote: 0.2 }, bar: 64 },
  { name: "엠카운트다운", w: { digital: 0.5, physical: 0.15, broadcast: 0.1, social: 0.15, vote: 0.1 }, bar: 68 },
  { name: "뮤직뱅크", w: { digital: 0.6, physical: 0.05, broadcast: 0.2, social: 0.05, vote: 0.1 }, bar: 70 },
  { name: "쇼! 음악중심", w: { digital: 0.5, physical: 0.1, broadcast: 0.2, social: 0.1, vote: 0.1 }, bar: 70 },
  { name: "인기가요", w: { digital: 0.55, physical: 0.05, broadcast: 0.05, social: 0.3, vote: 0.05 }, bar: 72 },
];

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const log10 = Math.log10;

/** 팬덤 규모를 시대 기준 0~100으로 (5천 → 25, 10만 → 50, 100만 → 75, 500만 → 92) */
export function fandomScale(c: Pick<Career, "fans" | "turn">): number {
  const f = c.fans / eraScale(yearOf(c));
  return clamp(25 * log10(f / 5000 + 1) / log10(2) * 0.5 + 25 * Math.max(0, log10(Math.max(1, f / 5000))) / 1.2, 0, 100);
}

export type ActivityInput = {
  quality: number; // 완성도 0~100 (피로도·제작 방식 반영 뒤)
  production: Production;
  hype: number; // 기대감 배수 (바이럴/실패/결속 반영)
  budget: { mv: number; digital: number; global: number; fan: number };
  rival: boolean;
  /** 콘셉트 피로(−3/회)와 변신 보너스(+5)처럼 음원 차트 반응에만 붙는 보정 */
  chartMod?: number;
};

/** 한 활동의 다섯 점수. */
export function activityScores(c: Career, a: ActivityInput): Scores {
  const ag = agencyById(c.agencyId);
  const reach = ag?.reach ?? 0.8;
  const fandom = fandomScale(c);
  const loyal = c.loyalty / 100;
  const hypeBoost = clamp((a.hype - 1) * 40, -20, 40); // 바이럴이면 크게, 실패면 깎임

  const digital = clamp(
    0.42 * a.quality + 0.22 * c.popularity + 0.2 * c.buzz + 0.16 * fandom * (0.6 + 0.4 * loyal)
      // 유명 프로듀서 곡은 음원 차트에서 먼저 반응한다 (히트메이커 프리미엄)
      + (a.production.promo === "digital" ? 6 : a.production.promo === "physical" ? -3 : 0) + (a.production.producer === "star" ? 3 : 0) + (a.chartMod ?? 0) + (a.budget.digital - 25) / 5 + hypeBoost * 0.6,
  );
  const physical = clamp(0.55 * fandom + 25 * loyal + 10 * (a.hype - 0.85) + (a.production.promo === "physical" ? 10 : a.production.promo === "digital" ? -4 : 0) + (a.budget.mv - 25) / 8);
  const broadcast = clamp(35 + 25 * Math.pow(reach / 1.9, 0.5) + 0.3 * c.popularity + (a.production.promo === "global" ? -8 : 0));
  const social = clamp(0.35 * clamp(20 * log10((c.metrics?.youtube ?? 0) / eraScale(yearOf(c)) / 1000 + 1)) + 0.25 * c.buzz + 0.2 * c.popularity + (a.budget.mv - 25) / 4 + hypeBoost * 0.5 + 0.2 * fandom * loyal);
  const vote = clamp(0.6 * fandom * (0.4 + 0.6 * loyal) + 0.25 * c.buzz + (c.flags.globalBoost !== undefined && c.turn - c.flags.globalBoost <= 2 ? 8 : 0) + (a.budget.fan - 25) / 6);
  return { digital: Math.round(digital), physical: Math.round(physical), broadcast: Math.round(broadcast), social: Math.round(social), vote: Math.round(vote) };
}

export const showScore = (s: Scores, show: ShowDef) =>
  s.digital * show.w.digital + s.physical * show.w.physical + s.broadcast * show.w.broadcast + s.social * show.w.social + s.vote * show.w.vote;

/** 방탄소년단과 컴백이 겹치면 음방·차트 경쟁 바가 크게 올라간다. */
export const BTS_RIVAL_BONUS = { show: 12, melon: 5 };
export const isBtsRival = (name?: string | null) => !!name && name.includes("방탄소년단");
/** 라이벌 이름: 직접 넘기지 않으면 이번 시즌의 라이벌(rivalFor)을 읽는다 */
function rivalNameOf(c: Career, rival: boolean, given?: string): string | undefined {
  if (!rival) return undefined;
  if (given !== undefined) return given;
  return rivalFor(c)?.name;
}

/**
 * 방송별 1위 확률. 내 점수와 그 주 경쟁자 점수 차이의 로지스틱.
 * 경쟁자 점수는 시대(2010년대 중반 이후 경쟁 심화)·라이벌 컴백·신인 여부로 올라간다.
 */
export function winChance(c: Career, s: Scores, show: ShowDef, rival: boolean, rookie: number, rivalName?: string): number {
  const year = yearOf(c);
  const eraBar = year >= 2016 ? 6 : year >= 2012 ? 3 : 0;
  const bts = rival && isBtsRival(rivalNameOf(c, rival, rivalName)) ? BTS_RIVAL_BONUS.show : 0;
  const bar = show.bar + eraBar + (rival ? 9 : 0) + bts + (rookie === 0 ? 10 : rookie === 1 ? 5 : 0);
  const gap = showScore(s, show) - bar - 4;
  return clamp(1 / (1 + Math.exp(-gap / 5)), 0.01, 0.9);
}

/** 멜론 TOP100 최고 순위. 음원 점수가 경쟁 바(시대별)보다 얼마나 높은지로 정한다. null이면 차트 밖. */
export function melonRank(c: Career, s: Scores, rival: boolean, noise: number, rivalName?: string): number | null {
  const year = yearOf(c);
  const bts = rival && isBtsRival(rivalNameOf(c, rival, rivalName)) ? BTS_RIVAL_BONUS.melon : 0;
  const bar = 62 + (year >= 2016 ? 6 : year >= 2012 ? 3 : 0) + (rival ? 3 : 0) + bts;
  const edge = s.digital + 0.15 * s.social + noise * 10 - bar; // 0이면 100위 언저리
  if (edge < 0) return null;
  // 0 → 100위, 10 → 50위, 20 → 15위, 28 → 3위, 32+ → 1위
  const rank = Math.round(100 * Math.exp(-edge / 8.5));
  return clamp(rank, 1, 100);
}

/** 빌보드 Hot 100 진입 순위. 해외 팬·소셜·해외 마케팅이 받쳐야 한다. */
export function billboardRank(c: Career, s: Scores, a: ActivityInput, noise: number): number | null {
  const fans = c.fans / eraScale(yearOf(c));
  if (c.popularity < 70 || fans < 1500000) return null;
  const globalBoost = c.flags.globalBoost !== undefined && c.turn - c.flags.globalBoost <= 2 ? 6 : 0;
  const score = 0.4 * s.social + 0.3 * s.digital + 0.3 * s.vote + globalBoost + (a.production.promo === "global" ? 8 : 0) + (a.budget.global - 25) / 4 + noise * 10;
  if (score < 92) return null;
  const rank = Math.round(100 * Math.exp(-(score - 92) / 5));
  return clamp(rank, 1, 100);
}

// ─────────────────────────── 화제성 ───────────────────────────

/** 시즌마다 화제성은 절반 가까이 식는다. 활동이 없으면 금방 잊힌다 */
export const BUZZ_DECAY = 0.55;
export const buzzOf = (c: Pick<Career, "buzz">) => c.buzz ?? 0;
export function addBuzz(c: Career, amount: number) {
  c.buzz = clamp((c.buzz ?? 0) + amount);
}

// ─────────────────────────── 브랜드평판 지수 ───────────────────────────

/**
 * 브랜드평판지수(월간 실측 스케일)를 네 하위 지수로 조립한다.
 * 참여(팬덤 활동) · 미디어(최근 뉴스: 컴백·수상·논란) · 소통(SNS 규모와 증가) · 커뮤니티(화제성).
 * 민감하게 움직인다: 큰 사건이 있던 시즌엔 수백만 점대로 튀고, 조용하면 수십만 점대로 내려앉는다.
 */
export function brandIndex(c: Career, topIndex: number): number {
  const fandom = fandomScale(c) / 100;
  const participation = fandom * (0.5 + 0.5 * c.loyalty / 100);
  const media = clamp(c.flags.mediaHeat ?? 0) / 100; // 시즌 사건으로 쌓이고 식는다
  const comm = clamp(20 * log10((c.metrics?.instagram ?? 0) / eraScale(yearOf(c)) / 10000 + 1)) / 100 * (0.6 + 0.4 * clamp(c.flags.snsGrowth ?? 0, 0, 50) / 50);
  const community = buzzOf(c) / 100;
  // 참여 30 · 미디어 30 · 소통 15 · 커뮤니티 25, 모두 높아야 1위권. 보통 때는 하위 두 지수가 작아 지수가 크게 꺼진다
  const composite = 0.3 * participation + 0.3 * media + 0.15 * comm + 0.25 * community;
  const pop = c.popularity / 100;
  const raw = topIndex * Math.pow(composite, 1.35) * (0.55 + 0.45 * pop) * 1.25;
  // 같은 값이 겹치지 않도록 시드·시즌 기반의 작은 흔들림
  const jitter = 0.94 + ((c.seed * 7 + c.turn * 13) % 97) / 97 * 0.12;
  return Math.round(raw * jitter);
}

// ─────────────────────────── 돌발 이벤트 ───────────────────────────

/** 돌발 사건 풀. 인기가 높을수록 노출이 많아 자주 터진다 */
export const INCIDENT_IDS = ["live-controversy", "chartfraud", "hate", "dating", "member-bullying", "member-dui", "hiatus-health", "injury"];
export const INCIDENT_COOLDOWN = 4; // 같은 사건은 4시즌 뒤에나 (반복 가능한 사건만)
export const INCIDENT_GLOBAL_GAP = 1; // 사건 직후 다음 시즌은 조용하다
export function incidentChance(c: Career): number {
  if (c.stage !== "idol") return 0.06;
  return clamp(0.17 + c.popularity / 400 + (c.loyalty < 30 ? 0.04 : 0), 0.12, 0.38);
}
