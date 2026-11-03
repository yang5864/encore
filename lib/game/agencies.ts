import type { Career, StatKey, Tier } from "./types.ts";
import { overall } from "./stats.ts";

export type Agency = {
  id: string;
  name: string;
  fullName: string;
  tier: Tier;
  color: string;
  strength: string;
  stat: StatKey;
  /** 성장 배율 */
  training: number;
  /** 팬 유입 배율 */
  reach: number;
  /** 데뷔 평가 기준 OVR */
  threshold: number;
  /** 회수 후 순이익 중 멤버 몫 */
  share: number;
  /** 컴백 제작비 배율 */
  budget: number;
  /** /public/logos/{logo}.png — 없으면 이니셜 마크 */
  logo: string | null;
  /** 2026년 8월 기준 아이돌 기획사 종합 순위 (TOP10만) */
  rank?: number;
};

export const TIERS: Record<Tier, { name: string; short: string; description: string; base: number; difficulty: "쉬움" | "보통" | "어려움" }> = {
  major: { name: "대형 기획사", short: "대형", description: "들어가기 어렵지만 데뷔하면 세계가 무대", base: 0.12, difficulty: "쉬움" },
  mid: { name: "중견 기획사", short: "중견", description: "탄탄한 시스템과 현실적인 데뷔 기회", base: 0.45, difficulty: "보통" },
  indie: { name: "중소 · 부티크 레이블", short: "중소", description: "문은 넓고, 가끔 기적이 숨어 있어요", base: 0.78, difficulty: "어려움" },
  global: { name: "해외 기획사", short: "해외", description: "국경을 넘는 활동, 국내 인지도는 천천히", base: 0.4, difficulty: "보통" },
};

export const AGENCIES: Agency[] = [
  // ── 대형 (2026 종합 순위 1~4위)
  { id: "hybe", name: "HYBE", fullName: "HYBE LABELS · 계열 통합", tier: "major", color: "#f5ff00", strength: "프로듀싱 · 해외", stat: "producing", training: 1.25, reach: 1.9, threshold: 64, share: 0.3, budget: 1.5, logo: "hybe", rank: 1 },
  { id: "sm", name: "SM", fullName: "SM Entertainment", tier: "major", color: "#fce1e6", strength: "보컬 · 콘셉트", stat: "vocal", training: 1.3, reach: 1.75, threshold: 64, share: 0.3, budget: 1.5, logo: "sm", rank: 2 },
  { id: "jyp", name: "JYP", fullName: "JYP Entertainment", tier: "major", color: "#00a4e3", strength: "댄스 · 글로벌", stat: "dance", training: 1.25, reach: 1.7, threshold: 61, share: 0.3, budget: 1.4, logo: "jyp", rank: 3 },
  { id: "yg", name: "YG", fullName: "YG Entertainment", tier: "major", color: "#111111", strength: "랩 · 스타성", stat: "rap", training: 1.25, reach: 1.65, threshold: 62, share: 0.3, budget: 1.4, logo: "yg", rank: 4 },
  // ── 중견 (5~9위)
  { id: "starship", name: "STARSHIP", fullName: "Starship Entertainment", tier: "mid", color: "#fd6c2b", strength: "비주얼 · 퍼포먼스", stat: "visual", training: 1.15, reach: 1.4, threshold: 57, share: 0.35, budget: 1.15, logo: "starship", rank: 5 },
  { id: "blacklabel", name: "THE BLACK LABEL", fullName: "THE BLACK LABEL", tier: "mid", color: "#000000", strength: "프로듀싱 · 힙합 R&B", stat: "producing", training: 1.18, reach: 1.35, threshold: 57, share: 0.35, budget: 1.1, logo: "blacklabel", rank: 6 },
  { id: "cube", name: "CUBE", fullName: "Cube Entertainment", tier: "mid", color: "#1a75bb", strength: "프로듀싱 · 개성", stat: "producing", training: 1.12, reach: 1.25, threshold: 55, share: 0.35, budget: 1.0, logo: "cube", rank: 7 },
  { id: "kq", name: "KQ", fullName: "KQ Entertainment", tier: "mid", color: "#1f1f1f", strength: "퍼포먼스 · 월드투어", stat: "dance", training: 1.12, reach: 1.3, threshold: 55, share: 0.35, budget: 1.0, logo: "kq", rank: 8 },
  { id: "fnc", name: "FNC", fullName: "FNC Entertainment", tier: "mid", color: "#e0352b", strength: "밴드 · 보컬", stat: "vocal", training: 1.1, reach: 1.2, threshold: 54, share: 0.35, budget: 0.95, logo: "fnc", rank: 9 },
  // ── 중소 · 부티크 레이블
  { id: "rbw", name: "RBW", fullName: "RBW", tier: "indie", color: "#011e6e", strength: "보컬 · 자체 제작", stat: "vocal", training: 1.08, reach: 1.1, threshold: 52, share: 0.45, budget: 0.8, logo: "rbw" },
  { id: "aomg", name: "AOMG", fullName: "AOMG", tier: "indie", color: "#1a1a1a", strength: "힙합 · 아티스트 자율", stat: "rap", training: 1.05, reach: 0.95, threshold: 50, share: 0.45, budget: 0.65, logo: "aomg" },
  { id: "pnation", name: "P NATION", fullName: "P NATION", tier: "indie", color: "#000000", strength: "퍼포먼스 · 예능", stat: "variety", training: 1.05, reach: 1.0, threshold: 50, share: 0.45, budget: 0.7, logo: "pnation" },
  { id: "dawn", name: "DAWN", fullName: "DAWN Entertainment", tier: "indie", color: "#2b2b2b", strength: "보컬 · 감성", stat: "vocal", training: 1.0, reach: 0.9, threshold: 50, share: 0.45, budget: 0.6, logo: "dawn" },
  // ── 해외
  { id: "avex", name: "avex", fullName: "avex (일본)", tier: "global", color: "#004cad", strength: "일본 활동 · 투어", stat: "variety", training: 1.1, reach: 1.3, threshold: 56, share: 0.35, budget: 1.1, logo: "avex" },
  { id: "88rising", name: "88rising", fullName: "88rising (미국)", tier: "global", color: "#d44f2a", strength: "힙합 · 미국 시장", stat: "rap", training: 1.08, reach: 1.45, threshold: 57, share: 0.35, budget: 1.0, logo: "88rising" },
  { id: "sony", name: "Sony Music", fullName: "Sony Music (글로벌)", tier: "global", color: "#d7000f", strength: "프로듀싱 · 글로벌 유통", stat: "producing", training: 1.1, reach: 1.5, threshold: 58, share: 0.35, budget: 1.2, logo: "sony" },
];

export const agencyById = (id: string | null | undefined) => (id ? AGENCIES.find((a) => a.id === id) ?? null : null);

export const TIER_ORDER: Tier[] = ["major", "mid", "indie", "global"];
export const tierRank = (t: Tier) => (t === "major" ? 3 : t === "mid" ? 2 : t === "global" ? 2 : 1);

/** Spec: tier base + (OVR-45)×0.015, clamp 0.03–0.95. */
export function auditionChance(c: Pick<Career, "stats" | "position">, agencyId: string): number {
  const a = agencyById(agencyId);
  if (!a) return 0;
  const p = TIERS[a.tier].base + (overall(c.stats, c.position) - 45) * 0.015;
  return Math.max(0.03, Math.min(0.95, p));
}

export function chanceLabel(p: number): string {
  if (p < 0.15) return "매우 낮음";
  if (p < 0.35) return "낮음";
  if (p < 0.6) return "보통";
  if (p < 0.8) return "높음";
  return "매우 높음";
}
