import type { Career } from "./types.ts";

/** mulberry32 step on the career's stored state. Deterministic per seed + command sequence. */
export function rng(c: Pick<Career, "rngState">): number {
  c.rngState = (c.rngState + 0x6d2b79f5) >>> 0;
  let t = c.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function pick<T>(c: Pick<Career, "rngState">, list: readonly T[]): T {
  return list[Math.floor(rng(c) * list.length)];
}

export function between(c: Pick<Career, "rngState">, min: number, max: number): number {
  return min + rng(c) * (max - min);
}

export function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
