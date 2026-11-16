import type { Career, StatKey } from "./types.ts";
import { STAT_KEYS } from "./stats.ts";
import { START_AGE, ageOf } from "./format.ts";
import { rng } from "./rng.ts";

/** 노화가 시작되는 만 나이 (화면 표기 29살) */
export const AGING_START_AGE = 27;
/** 노화 첫 시즌의 기본 하락량과 시즌마다 붙는 가속 */
export const AGING_BASE = 0.6;
export const AGING_ACCEL = 1.25;
/** 몸을 쓰는 능력이 먼저 꺾인다 */
export const AGING_WEIGHT: Record<StatKey, number> = { dance: 1.3, visual: 1.0, vocal: 0.8, rap: 0.8, variety: 0.3, producing: 0.2 };
/** 그 시즌에 쓰지 않은 능력이 1 떨어질 확률, 그리고 녹·노화로 내려가는 바닥 */
export const RUST_CHANCE = 0.12;
/** 아이돌은 무대에서 여러 능력을 같이 쓰므로 덜 녹슨다 */
export const RUST_CHANCE_IDOL = 0.07;
export const STAT_FLOOR = 20;

/** 노화 n번째 시즌(0부터)에 그 능력이 잃는 양 (소수 포함) */
export function agingLoss(n: number, stat: StatKey): number {
  return n < 0 ? 0 : AGING_BASE * Math.pow(AGING_ACCEL, n) * AGING_WEIGHT[stat];
}

/** 노화가 시작된 뒤 지난 시즌 수. 시작 전이면 음수 */
export const agingSeason = (c: Pick<Career, "turn">) => c.turn - (AGING_START_AGE - START_AGE) * 2;

const lose = (c: Career, stat: StatKey, amount: number) => {
  const whole = Math.floor(amount);
  const drop = whole + (rng(c) < amount - whole ? 1 : 0);
  if (drop > 0) c.stats[stat] = Math.max(Math.min(c.stats[stat], STAT_FLOOR), c.stats[stat] - drop);
};

/** 29살부터 시즌마다 능력이 떨어지고, 떨어지는 폭이 지수로 커진다. */
export function applyAging(c: Career) {
  if (ageOf(c) < AGING_START_AGE) return;
  const n = agingSeason(c);
  for (const k of STAT_KEYS) lose(c, k, agingLoss(n, k));
}

/** 이번 시즌에 쓰지 않은 능력은 가끔 녹슨다. */
export function applyRust(c: Career, used: StatKey[], chance = RUST_CHANCE) {
  for (const k of STAT_KEYS) if (!used.includes(k) && rng(c) < chance) lose(c, k, 1);
}

/** 성장은 잠재력 상한에서 멈춘다 (이미 넘어 있으면 그 값을 지킨다). */
export function gainStat(c: Career, stat: StatKey, amount: number) {
  if (amount <= 0) { c.stats[stat] = Math.max(0, c.stats[stat] + amount); return; }
  const cap = Math.max(c.stats[stat], Math.min(99, c.potential?.[stat] ?? 99));
  c.stats[stat] = Math.min(cap, c.stats[stat] + amount);
}

/** OVR이 인기에 미치는 계수: 65 이상 1.0, 40 이하 0.8. 전성기에는 영향이 없고 실력이 꺾이면 인기도 식는다 */
export const skillFactor = (ovr: number) => 0.8 + 0.2 * Math.max(0, Math.min(1, (ovr - 40) / 25));
