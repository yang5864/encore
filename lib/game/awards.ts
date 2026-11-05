import type { Award, Career } from "./types.ts";
import { rng, pick } from "./rng.ts";
import { eraScale } from "./format.ts";

export const SHOWS = ["MAMA", "MMA", "골든디스크"];
export const SHOW_FULL: Record<string, string> = { MAMA: "MAMA AWARDS", MMA: "멜론뮤직어워드 (MMA)", 골든디스크: "골든디스크 어워즈" };
/** 방송사 연말 가요제 — 시상은 없고 무대만 */
export const YEAR_END_STAGES = ["SBS 가요대전", "KBS 가요대축제", "MBC 가요대제전"];

type AwardCtx = { gender: Career["gender"]; solo: boolean; melonBest: number; melonOne: boolean };

/** 시상식별 실제 부문 이름. 솔로 아이돌은 그룹 부문 대신 보컬 부문을 받는다. */
export function awardName(show: string, kind: Award["kind"], x: AwardCtx): string {
  if (show === "MAMA") {
    if (kind === "rookie") return "Best New Artist";
    if (kind === "bonsang") return x.solo ? "Best Vocal Performance" : x.gender === "female" ? "Best Female Group" : "Best Male Group";
    return "Artist of the Year";
  }
  if (show === "MMA") return kind === "rookie" ? "신인상" : kind === "bonsang" ? "TOP10" : "올해의 아티스트";
  // 골든디스크: 음원이 강하면 디지털, 아니면 음반 부문
  if (kind === "rookie") return "신인상";
  if (kind === "bonsang") return x.melonBest <= 10 ? "디지털 음원 본상" : "음반 본상";
  return x.melonOne ? "디지털 음원 대상" : "음반 대상";
}

/** Called once per finished year (after 하반기). Returns awards won this season. */
export function yearEndAwards(c: Career, year: number, lastTwoTurns: [number, number]): Award[] {
  if (c.stage !== "idol" || c.debutTurn === null) return [];
  const era = eraScale(year);
  const thisYear = c.albums.filter((a) => a.turn === lastTwoTurns[0] || a.turn === lastTwoTurns[1]);
  const bestSales = Math.max(0, ...thisYear.map((a) => a.sales)) / era;
  const winsThisYear = thisYear.reduce((s, a) => s + a.wins, 0);
  const melonBest = Math.min(999, ...thisYear.map((a) => a.melon ?? 999));
  const melonOne = thisYear.some((a) => a.melon === 1);
  const ctx: AwardCtx = { gender: c.gender, solo: !!c.flags.solo, melonBest, melonOne };
  const won: Award[] = [];
  // 한 해의 시상은 하나의 시상식에서 진행된다 (엔진이 연말 시상식을 하나만 띄운다)
  let yearShow: string | undefined;
  const add = (kind: Award["kind"]) => {
    const show = (yearShow ??= pick(c, SHOWS));
    won.push({ year, show, name: awardName(show, kind, ctx), kind });
  };

  // 신인상: 데뷔 3년 안에 한 번. 성적이 확실해도 경쟁이 치열해 6할만 받는다
  const rookieEligible = c.turn - c.debutTurn <= 3 && !c.awards.some((a) => a.kind === "rookie");
  if (rookieEligible && (bestSales >= 150000 || winsThisYear >= 2 || melonBest <= 10) && rng(c) < 0.6) add("rookie");

  // 본상: 인기도 65 이상 + 올해의 성과가 있어야 하고, 스타여도 못 받는 해가 있다. 해마다 하나까지
  if (thisYear.length >= 1 && c.popularity >= 65 && (melonBest <= 30 || winsThisYear >= 1)) {
    const p = Math.min(0.6, 0.25 + (c.popularity - 65) / 100);
    if (rng(c) < p && !won.some((a) => a.kind === "bonsang")) add("bonsang");
  }

  // 대상: 팬덤·음반·1위 횟수를 모두 갖춘 해에도 확률이 낮다
  const fansEra = c.fans / era;
  if (fansEra >= 2500000 && (bestSales >= 1500000 || melonOne) && winsThisYear >= 3) {
    const p = Math.min(0.45, 0.12 + fansEra / 15000000 + (melonOne ? 0.1 : 0));
    if (rng(c) < p) add("daesang");
  }
  return won;
}

export const daesangCount = (c: Pick<Career, "awards">) => c.awards.filter((a) => a.kind === "daesang").length;
