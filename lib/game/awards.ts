import type { Award, Career } from "./types.ts";
import { rng, pick } from "./rng.ts";
import { eraScale } from "./format.ts";

export const SHOWS = ["MAMA", "MMA", "골든디스크"];
export const SHOW_FULL: Record<string, string> = { MAMA: "MAMA AWARDS", MMA: "멜론뮤직어워드 (MMA)", 골든디스크: "골든디스크 어워즈" };
/** 방송사 연말 가요제 — 시상은 없고 무대만 */
export const YEAR_END_STAGES = ["SBS 가요대전", "KBS 가요대축제", "MBC 가요대제전"];

/** Called once per finished year (after 하반기). Returns awards won this season. */
export function yearEndAwards(c: Career, year: number, lastTwoTurns: [number, number]): Award[] {
  if (c.stage !== "idol" || c.debutTurn === null) return [];
  const era = eraScale(year);
  const thisYear = c.albums.filter((a) => a.turn === lastTwoTurns[0] || a.turn === lastTwoTurns[1]);
  const bestSales = Math.max(0, ...thisYear.map((a) => a.sales)) / era;
  const winsThisYear = thisYear.reduce((s, a) => s + a.wins, 0);
  const melonOne = thisYear.some((a) => a.melon === 1);
  const won: Award[] = [];

  const rookieEligible = c.turn - c.debutTurn <= 3 && !c.awards.some((a) => a.kind === "rookie");
  if (rookieEligible && (bestSales >= 50000 || winsThisYear >= 1)) {
    const show = pick(c, SHOWS);
    won.push({ year, show, name: show === "MAMA" ? "BEST NEW ARTIST" : "올해의 신인", kind: "rookie" });
  }
  if (thisYear.length >= 1 && c.popularity >= 50) {
    won.push({ year, show: pick(c, SHOWS), name: "본상", kind: "bonsang" });
  }
  if (c.fans / era >= 1500000 && (bestSales >= 1000000 || melonOne)) {
    const p = Math.max(0.15, Math.min(0.8, 0.2 + c.fans / era / 8000000 + (melonOne ? 0.2 : 0)));
    if (rng(c) < p) {
      const show = pick(c, SHOWS);
      won.push({ year, show, name: show === "MAMA" ? "올해의 아티스트 (대상)" : "올해의 앨범 (대상)", kind: "daesang" });
    }
  }
  return won;
}

export const daesangCount = (c: Pick<Career, "awards">) => c.awards.filter((a) => a.kind === "daesang").length;
