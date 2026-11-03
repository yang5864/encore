import type { Career } from "./types.ts";
import { isLegend } from "./milestones.ts";

/**
 * 아이돌 업계 톱티어: 통신사 광고·명품 앰버서더처럼 소수만 받는 제안의 기준.
 * 브랜드평판 10위 안에 든 적이 있거나, 지금 급성장 중이거나, 이미 레전드.
 */
export function isTopTier(c: Career): boolean {
  if (c.stage !== "idol") return false;
  if ((c.flags.bestRank ?? 999) <= 10) return true;
  if (isLegend(c)) return true;
  return isSurging(c);
}

/** 급성장: 한 시즌에 인기도 +12 이상 또는 팬 60% 이상 증가(팬 10만 이상에서). */
export function isSurging(c: Career): boolean {
  const popJump = c.flags.prevPopularity !== undefined && c.popularity - c.flags.prevPopularity >= 12;
  const fanJump = c.flags.prevFans !== undefined && c.flags.prevFans >= 100000 && c.fans >= c.flags.prevFans * 1.6;
  return popJump || fanJump;
}

export const topTierReason = (c: Career) =>
  (c.flags.bestRank ?? 999) <= 10 ? "브랜드평판 10위 안에 든 적이 있는" : isLegend(c) ? "레전드 반열에 오른" : "지금 가장 빠르게 뜨고 있는";
