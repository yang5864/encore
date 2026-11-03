import type { Position, StatKey, Stats } from "./types.ts";

export const STAT_KEYS: StatKey[] = ["vocal", "dance", "rap", "visual", "variety", "producing"];
export const STAT_NAMES: Record<StatKey, string> = {
  vocal: "보컬",
  dance: "댄스",
  rap: "랩",
  visual: "비주얼",
  variety: "예능",
  producing: "프로듀싱",
};
export const STAT_COLORS: Record<StatKey, string> = {
  vocal: "#3182f6",
  dance: "#04c75a",
  rap: "#7c5cff",
  visual: "#ff6b9d",
  variety: "#ff9500",
  producing: "#00b8d9",
};

export const POSITIONS: { id: Position; name: string; en: string; description: string }[] = [
  { id: "vocal", name: "메인보컬", en: "MAIN VOCAL", description: "고음 파트와 발라드를 책임져요" },
  { id: "dance", name: "메인댄서", en: "MAIN DANCER", description: "퍼포먼스의 중심, 킬링파트 담당" },
  { id: "rap", name: "래퍼", en: "RAPPER", description: "랩 메이킹과 힙합 콘셉트에 강해요" },
  { id: "visual", name: "비주얼 · 센터", en: "CENTER", description: "카메라가 먼저 찾는 얼굴" },
  { id: "allround", name: "올라운더", en: "ALL-ROUNDER", description: "어떤 콘셉트도 소화하는 팔방미인" },
  { id: "producer", name: "프로듀서돌", en: "SELF-PRODUCING", description: "곡과 가사를 직접 쓰는 아티스트" },
];

const WEIGHTS: Record<Position, Stats> = {
  vocal: { vocal: 0.4, dance: 0.15, rap: 0.05, visual: 0.15, variety: 0.1, producing: 0.15 },
  dance: { vocal: 0.15, dance: 0.4, rap: 0.05, visual: 0.2, variety: 0.1, producing: 0.1 },
  rap: { vocal: 0.1, dance: 0.15, rap: 0.4, visual: 0.1, variety: 0.1, producing: 0.15 },
  visual: { vocal: 0.15, dance: 0.2, rap: 0.05, visual: 0.4, variety: 0.15, producing: 0.05 },
  allround: { vocal: 0.17, dance: 0.17, rap: 0.16, visual: 0.17, variety: 0.16, producing: 0.17 },
  producer: { vocal: 0.2, dance: 0.1, rap: 0.15, visual: 0.05, variety: 0.1, producing: 0.4 },
};

export const DEFAULT_ALLOCATION: Record<Position, Stats> = {
  vocal: { vocal: 58, dance: 38, rap: 24, visual: 42, variety: 36, producing: 42 },
  dance: { vocal: 36, dance: 58, rap: 26, visual: 46, variety: 40, producing: 34 },
  rap: { vocal: 30, dance: 38, rap: 58, visual: 34, variety: 38, producing: 42 },
  visual: { vocal: 36, dance: 44, rap: 24, visual: 58, variety: 44, producing: 34 },
  allround: { vocal: 40, dance: 40, rap: 40, visual: 40, variety: 40, producing: 40 },
  producer: { vocal: 42, dance: 30, rap: 40, visual: 30, variety: 40, producing: 58 },
};

export const ALLOCATION_TOTAL = 240;
export const STAT_MIN = 20;
export const STAT_MAX = 60;
export const STAT_CAP = 99;

export const statWeight = (position: Position, k: StatKey) => WEIGHTS[position][k];

export function overall(stats: Stats, position: Position): number {
  const w = WEIGHTS[position];
  return Math.round(STAT_KEYS.reduce((sum, k) => sum + stats[k] * w[k], 0));
}

export function validateAllocation(stats: Stats): string | null {
  for (const k of STAT_KEYS) {
    const v = stats[k];
    if (!Number.isInteger(v)) return `${STAT_NAMES[k]} 값이 올바르지 않아요`;
    if (v < STAT_MIN || v > STAT_MAX) return `${STAT_NAMES[k]}은(는) ${STAT_MIN}~${STAT_MAX} 사이여야 해요`;
  }
  const total = STAT_KEYS.reduce((s, k) => s + stats[k], 0);
  if (total !== ALLOCATION_TOTAL) return `총합이 ${ALLOCATION_TOTAL}점이어야 해요 (현재 ${total})`;
  return null;
}

export const clampStat = (v: number) => Math.max(0, Math.min(STAT_CAP, v));
