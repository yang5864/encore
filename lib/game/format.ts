import type { Career } from "./types.ts";

export const START_YEAR = 2006;
export const START_AGE = 12;
export const MAX_TURN = (32 - START_AGE) * 2 + 1; // 32세 하반기 = 2026년 하반기

export const ageOf = (c: Pick<Career, "turn">) => START_AGE + Math.floor(c.turn / 2);
export const yearOf = (c: Pick<Career, "turn">) => START_YEAR + Math.floor(c.turn / 2);
export const isSecondHalf = (c: Pick<Career, "turn">) => c.turn % 2 === 1;
export const periodLabel = (c: Pick<Career, "turn">) => `${yearOf(c)}년 ${isSecondHalf(c) ? "하반기" : "상반기"}`;

export function fanText(n: number): string {
  if (n < 10000) return `${Math.round(n).toLocaleString("ko-KR")}명`;
  if (n < 100000000) {
    const man = n / 10000;
    return `${man >= 100 ? Math.round(man).toLocaleString("ko-KR") : man.toFixed(1).replace(/\.0$/, "")}만명`;
  }
  return `${(n / 100000000).toFixed(1).replace(/\.0$/, "")}억명`;
}

/** 억 단위 금액. */
export function wonText(eok: number): string {
  const sign = eok < 0 ? "-" : "";
  const v = Math.abs(eok);
  if (v >= 10000) return `${sign}${(v / 10000).toFixed(1).replace(/\.0$/, "")}조원`;
  if (v >= 100) return `${sign}${Math.round(v).toLocaleString("ko-KR")}억원`;
  if (v >= 1) return `${sign}${v.toFixed(1).replace(/\.0$/, "")}억원`;
  if (v === 0) return "0원";
  return `${sign}${Math.round(v * 10000).toLocaleString("ko-KR")}만원`;
}

export type ReputationBand = { id: "scandal" | "caution" | "normal" | "liked" | "national"; label: string; min: number; max: number; color: string };
export const REPUTATION_BANDS: ReputationBand[] = [
  { id: "scandal", label: "논란", min: -100, max: -20, color: "#f04452" },
  { id: "caution", label: "주의", min: -20, max: 0, color: "#ff9500" },
  { id: "normal", label: "보통", min: 0, max: 25, color: "#8b95a1" },
  { id: "liked", label: "호감", min: 25, max: 60, color: "#3182f6" },
  { id: "national", label: "국민호감", min: 60, max: 100, color: "#7c5cff" },
];

export function reputationBand(v: number): ReputationBand {
  return REPUTATION_BANDS.find((b) => v < b.max) ?? REPUTATION_BANDS[REPUTATION_BANDS.length - 1];
}
export const reputationLabel = (v: number) => reputationBand(v).label;
/** 0–100 progress inside the current band. */
export function reputationProgress(v: number): number {
  const b = reputationBand(v);
  return Math.max(0, Math.min(100, ((v - b.min) / (b.max - b.min)) * 100));
}

export type Condition = { level: "good" | "tired" | "danger"; label: string; color: string; value: number };
export function conditionOf(c: Pick<Career, "health" | "mental">): Condition {
  const value = Math.round(Math.min(c.health, c.mental));
  if (value >= 55) return { level: "good", label: "좋음", color: "#04c75a", value };
  if (value >= 30) return { level: "tired", label: "지침", color: "#ff9500", value };
  return { level: "danger", label: "위험", color: "#f04452", value };
}

/** 그룹명 + 이름. 솔로로 전향해도 데뷔한 그룹명을 함께 보여준다. */
export function displayName(c: { name: string; groupName?: string; stage?: Career["stage"] }): string {
  const group = (c.groupName ?? "").trim();
  if (!group || group === c.name || c.stage === "free" || c.stage === "trainee") return c.name;
  return `${group} ${c.name}`;
}

export const STAGE_NAMES: Record<Career["stage"], string> = { free: "지망생", trainee: "연습생", idol: "아이돌", retired: "은퇴" };

export const pct = (n: number) => `${Math.round(n)}%`;

/** Lifecycle phase label, after the industry's usual 5-stage framing. */
export function careerPhase(c: Pick<Career, "stage" | "turn" | "debutTurn" | "flags" | "contractEnd">): string {
  if (c.stage === "free") return "지망생";
  if (c.stage === "trainee") return c.flags.debutEval !== undefined ? "프리 데뷔" : "연습생";
  if (c.stage === "retired") return "은퇴";
  const since = c.debutTurn === null ? 0 : c.turn - c.debutTurn;
  if (c.flags.renewed) return "2막";
  if (since < 2) return "신인기";
  if (since < 6) return "도약기";
  if (since < 12) return "전성기";
  return "재계약기";
}

/** 시대 보정: 음반·팬덤 규모는 2006년 약 30% → 2021년 이후 100%. 인기도(0~100)는 시대와 무관하다. */
export function eraScale(year: number): number {
  if (year <= 2012) return 0.3;
  if (year <= 2017) return 0.3 + ((year - 2012) / 5) * 0.3;
  if (year <= 2021) return 0.6 + ((year - 2017) / 4) * 0.4;
  return 1;
}
