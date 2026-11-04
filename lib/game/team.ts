import type { Career } from "./types.ts";
import { brandTable } from "./brand-rank.ts";
import { yearOf } from "./format.ts";

// ─────────────────────────── 팀 케미 ───────────────────────────

export const CHEM_START = 60;
/** 케미가 앨범 완성도에 주는 보정: 60 기준 ±, 최대 +4 / 최저 −8 */
export const chemistryQuality = (chem: number) => Math.max(-8, Math.min(4, Math.round((chem - 60) / 8)));
export const chemistryLabel = (v: number) => (v >= 75 ? "끈끈함" : v >= 45 ? "보통" : v >= 30 ? "삐걱" : "위기");

// ─────────────────────────── 홍보 예산 ───────────────────────────

export type Budget = { mv: number; digital: number; global: number; fan: number };
export const BUDGET_PRESETS: { id: string; name: string; hint: string; split: Budget }[] = [
  { id: "balanced", name: "균형", hint: "뮤직비디오·음원·해외·팬 콘텐츠를 고르게", split: { mv: 25, digital: 25, global: 25, fan: 25 } },
  { id: "buzz", name: "화제성 올인", hint: "뮤직비디오·마케팅에 절반. 초동과 바이럴에 유리", split: { mv: 50, digital: 20, global: 10, fan: 20 } },
  { id: "chart", name: "음원 차트", hint: "음원 푸시에 절반. 멜론 순위와 음방 1위에 유리", split: { mv: 20, digital: 50, global: 10, fan: 20 } },
  { id: "global", name: "해외 공략", hint: "해외 마케팅에 절반. 빌보드와 해외 팬에 유리", split: { mv: 20, digital: 15, global: 50, fan: 15 } },
  { id: "fandom", name: "팬덤 다지기", hint: "팬 콘텐츠에 절반. 결속이 시즌마다 오르고 초동이 단단해져요", split: { mv: 20, digital: 15, global: 10, fan: 55 } },
];
export const DEFAULT_BUDGET: Budget = BUDGET_PRESETS[0].split;
export const budgetOf = (c: Pick<Career, "budget">): Budget => c.budget ?? DEFAULT_BUDGET;
export const budgetName = (b: Budget) => BUDGET_PRESETS.find((p) => p.split.mv === b.mv && p.split.digital === b.digital && p.split.global === b.global && p.split.fan === b.fan)?.name ?? "직접 배분";

// ─────────────────────────── 라이벌 컴백 ───────────────────────────

function hash(n: number): number {
  let x = n >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * 이번 시즌 컴백이 겹치는 라이벌. 시드·시즌으로 정해져 계획을 고르기 전에 알 수 있다.
 * 약 40% 시즌에 그 해 상위권 그룹 하나가 같은 시기에 컴백한다. 데뷔 전엔 없음.
 */
export function rivalFor(c: Pick<Career, "seed" | "turn" | "stage" | "groupName">): { name: string; strength: number } | null {
  if (c.stage !== "idol") return null;
  const h = hash(c.seed * 131 + c.turn * 7919);
  if (h % 100 >= 40) return null;
  const table = brandTable(yearOf(c)).filter((e) => e.name !== c.groupName).slice(0, 8);
  if (!table.length) return null;
  const e = table[hash(h + 17) % table.length];
  return { name: e.name, strength: e.index };
}
