import type { Career } from "./types.ts";
import { agencyById } from "./agencies.ts";

export const TRAINEE_COST_PER_TURN = 1.5; // 억
export const DEBUT_COST = 35; // 억 × agency.budget — 데뷔 앨범·MV·쇼케이스·마케팅. 대형 신인 기준 50억 안팎
export const MEMBERS_SHARE = 0.2; // 5인조 가정

export type Settlement = { revenue: number; invested: number; unrecovered: number; profit: number; mine: number; share: number };

export function memberShare(c: Career): number {
  const a = agencyById(c.agencyId);
  const base = c.flags.independent ? 0.7 : (a?.share ?? 0.4) + (c.flags.shareBonus ? 0.1 : 0);
  return Math.min(0.8, base);
}

export function settlement(c: Career): Settlement {
  const { revenue, invested } = c.money;
  const unrecovered = Math.max(0, invested - revenue);
  const profit = Math.max(0, revenue - invested);
  const share = memberShare(c);
  const mine = Math.round(profit * share * (c.flags.solo ? 1 : MEMBERS_SHARE) * 10) / 10;
  return { revenue, invested, unrecovered, profit, mine, share };
}

/** Recomputes settled money; returns true the first time the player gets paid. */
export function updateSettlement(c: Career): boolean {
  const s = settlement(c);
  c.money.settled = s.mine;
  if (s.mine > 0 && c.money.firstSettledTurn === null) {
    c.money.firstSettledTurn = c.turn;
    return true;
  }
  return false;
}
