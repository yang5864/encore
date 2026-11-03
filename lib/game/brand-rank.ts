import type { Career } from "./types.ts";

/**
 * 연도별 아이돌 인기 비교표 (게임 추정 지수, 0~100).
 *
 * 주의: 한국기업평판연구소의 브랜드평판 지수는 2015년 이후에만 존재하고 월 단위이며,
 * 이 표는 그 지수를 그대로 가져온 것이 아니라 당시 음반·음원·대중 인지도를 바탕으로
 * 게임 안에서 "내 캐릭터가 지금 어디쯤인지" 가늠하기 위해 작성한 추정값이다.
 * 실제 인물·그룹의 공식 순위가 아니며, 그룹명은 비교 기준으로만 쓴다.
 */
export type BrandEntry = { name: string; index: number };

export const BRAND_RANKS: Record<number, BrandEntry[]> = {
  2006: [["동방신기", 92], ["비", 80], ["슈퍼주니어", 78], ["보아", 72], ["이효리", 76], ["SS501", 70], ["신화", 65], ["SG워너비", 60], ["빅뱅", 56], ["버즈", 55], ["씨야", 45], ["브라운아이드걸스", 40]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2007: [["원더걸스", 90], ["빅뱅", 88], ["동방신기", 85], ["슈퍼주니어", 80], ["소녀시대", 70], ["비", 70], ["이효리", 65], ["FT아일랜드", 62], ["SS501", 60], ["카라", 50], ["씨야", 48], ["SG워너비", 55]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2008: [["빅뱅", 92], ["원더걸스", 92], ["동방신기", 85], ["소녀시대", 82], ["슈퍼주니어", 82], ["샤이니", 65], ["2PM", 60], ["카라", 60], ["브라운아이드걸스", 55], ["에픽하이", 55], ["다비치", 50], ["손담비", 58]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2009: [["소녀시대", 95], ["슈퍼주니어", 88], ["2NE1", 85], ["빅뱅", 85], ["2PM", 82], ["카라", 80], ["동방신기", 75], ["브라운아이드걸스", 75], ["샤이니", 70], ["티아라", 62], ["애프터스쿨", 60], ["포미닛", 60], ["f(x)", 58]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2010: [["소녀시대", 96], ["2PM", 85], ["카라", 85], ["슈퍼주니어", 85], ["2NE1", 82], ["티아라", 78], ["샤이니", 75], ["빅뱅", 72], ["미쓰에이", 72], ["씨엔블루", 70], ["비스트", 70], ["포미닛", 65], ["f(x)", 62], ["인피니트", 50]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2011: [["소녀시대", 93], ["빅뱅", 88], ["2NE1", 85], ["슈퍼주니어", 85], ["아이유", 85], ["티아라", 82], ["비스트", 80], ["카라", 78], ["2PM", 75], ["f(x)", 72], ["씨스타", 70], ["시크릿", 68], ["인피니트", 68], ["애프터스쿨", 60]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2012: [["싸이", 95], ["빅뱅", 92], ["소녀시대", 90], ["씨스타", 82], ["슈퍼주니어", 82], ["아이유", 80], ["2NE1", 78], ["비스트", 78], ["샤이니", 76], ["인피니트", 75], ["f(x)", 72], ["티아라", 70], ["엑소", 60], ["비투비", 45]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2013: [["엑소", 90], ["소녀시대", 88], ["씨스타", 82], ["빅뱅", 80], ["인피니트", 78], ["샤이니", 78], ["아이유", 78], ["2NE1", 76], ["비스트", 74], ["에이핑크", 70], ["걸스데이", 65], ["크레용팝", 55], ["방탄소년단", 45]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2014: [["엑소", 94], ["소녀시대", 84], ["씨스타", 82], ["에이핑크", 78], ["빅뱅", 75], ["인피니트", 75], ["걸스데이", 72], ["샤이니", 72], ["AOA", 70], ["위너", 60], ["블락비", 60], ["방탄소년단", 58], ["비투비", 52], ["레드벨벳", 48]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2015: [["엑소", 95], ["빅뱅", 94], ["소녀시대", 82], ["씨스타", 78], ["에이핑크", 76], ["AOA", 75], ["방탄소년단", 72], ["샤이니", 72], ["레드벨벳", 70], ["인피니트", 70], ["여자친구", 68], ["아이콘", 65], ["세븐틴", 55], ["트와이스", 50]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2016: [["엑소", 94], ["트와이스", 92], ["방탄소년단", 88], ["빅뱅", 85], ["레드벨벳", 78], ["여자친구", 78], ["아이유", 78], ["아이오아이", 75], ["세븐틴", 70], ["마마무", 70], ["샤이니", 70], ["블랙핑크", 68], ["갓세븐", 65]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2017: [["방탄소년단", 97], ["엑소", 92], ["트와이스", 92], ["워너원", 90], ["아이유", 85], ["레드벨벳", 80], ["블랙핑크", 78], ["세븐틴", 75], ["여자친구", 72], ["마마무", 72], ["뉴이스트", 70], ["갓세븐", 66]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2018: [["방탄소년단", 99], ["워너원", 92], ["블랙핑크", 90], ["트와이스", 90], ["엑소", 86], ["레드벨벳", 82], ["세븐틴", 76], ["마마무", 76], ["아이즈원", 70], ["여자친구", 68], ["갓세븐", 66], ["몬스타엑스", 65], ["NCT", 60]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2019: [["방탄소년단", 99], ["블랙핑크", 90], ["트와이스", 88], ["엑소", 82], ["레드벨벳", 80], ["세븐틴", 78], ["아이즈원", 78], ["마마무", 76], ["NCT", 70], ["있지", 70], ["몬스타엑스", 68], ["갓세븐", 65], ["투모로우바이투게더", 60]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2020: [["방탄소년단", 100], ["블랙핑크", 94], ["트와이스", 84], ["세븐틴", 80], ["아이즈원", 78], ["NCT", 76], ["레드벨벳", 76], ["엑소", 74], ["있지", 72], ["마마무", 72], ["오마이걸", 70], ["(여자)아이들", 68], ["투모로우바이투게더", 62], ["에스파", 55]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2021: [["방탄소년단", 100], ["블랙핑크", 90], ["에스파", 82], ["세븐틴", 82], ["NCT", 82], ["트와이스", 82], ["있지", 74], ["레드벨벳", 74], ["스트레이키즈", 72], ["브레이브걸스", 70], ["투모로우바이투게더", 70], ["오마이걸", 66], ["엔하이픈", 65], ["아이브", 48]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2022: [["방탄소년단", 98], ["아이브", 92], ["블랙핑크", 90], ["뉴진스", 85], ["에스파", 85], ["세븐틴", 85], ["(여자)아이들", 82], ["르세라핌", 80], ["NCT", 80], ["스트레이키즈", 80], ["트와이스", 76], ["있지", 72], ["투모로우바이투게더", 72], ["엔하이픈", 68]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2023: [["뉴진스", 96], ["아이브", 90], ["세븐틴", 90], ["방탄소년단", 88], ["에스파", 86], ["스트레이키즈", 84], ["블랙핑크", 84], ["르세라핌", 82], ["(여자)아이들", 82], ["NCT", 76], ["투모로우바이투게더", 74], ["제로베이스원", 72], ["엔하이픈", 70], ["라이즈", 68]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2024: [["에스파", 92], ["세븐틴", 90], ["뉴진스", 86], ["아이브", 86], ["방탄소년단", 86], ["스트레이키즈", 84], ["데이식스", 80], ["라이즈", 80], ["르세라핌", 78], ["아일릿", 78], ["(여자)아이들", 78], ["베이비몬스터", 76], ["투모로우바이투게더", 76], ["엔하이픈", 76], ["투어스", 74]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2025: [["방탄소년단", 95], ["블랙핑크", 90], ["세븐틴", 88], ["에스파", 88], ["스트레이키즈", 86], ["아이브", 85], ["데이식스", 82], ["라이즈", 80], ["베이비몬스터", 78], ["엔하이픈", 78], ["아일릿", 76], ["투모로우바이투게더", 76], ["뉴진스", 70], ["하츠투하츠", 60], ["키키", 55]].map(([name, index]) => ({ name: name as string, index: index as number })),
  2026: [["방탄소년단", 98], ["블랙핑크", 88], ["에스파", 86], ["세븐틴", 86], ["스트레이키즈", 86], ["아이브", 84], ["라이즈", 82], ["데이식스", 80], ["베이비몬스터", 80], ["엔하이픈", 78], ["투모로우바이투게더", 75], ["아일릿", 74], ["하츠투하츠", 72], ["올데이프로젝트", 70], ["코르티스", 66]].map(([name, index]) => ({ name: name as string, index: index as number })),
};

import { REAL_MONTHS, type RealEntry } from "./brand-rank-real.ts";

export function brandTable(year: number): BrandEntry[] {
  const y = Math.max(2006, Math.min(2026, year));
  return [...(BRAND_RANKS[y] ?? BRAND_RANKS[2026])].sort((a, b) => b.index - a.index);
}

export type RankedEntry = BrandEntry & { rank: number; me: boolean };
export type RankingSource = { kind: "real"; month: string; label: string } | { kind: "estimate"; label: string };
export type Ranking = { entries: RankedEntry[]; source: RankingSource; me: RankedEntry; above: RankedEntry | null; below: RankedEntry | null; total: number; outside: boolean };

/** 상반기=3월, 하반기=9월 실제 자료. 그 달이 없으면 같은 해에서 가장 가까운 달. */
export function realMonthFor(year: number, secondHalf: boolean): string | null {
  const want = secondHalf ? 9 : 3;
  const keys = Object.keys(REAL_MONTHS).filter((k) => k.startsWith(`${year}-`));
  if (!keys.length) return null;
  return keys.sort((a, b) => Math.abs(Number(a.slice(5)) - want) - Math.abs(Number(b.slice(5)) - want) || a.localeCompare(b))[0];
}

/** 인기도(0~100)를 그 달 지수 분포에 끼워 넣는다: 40 → 50위권 바닥, 100 → 1위 수준 (기하 보간). */
export function popularityToRealIndex(popularity: number, rows: RealEntry[]): number {
  const top = rows[0].index;
  const floor = rows[rows.length - 1].index;
  const t = Math.max(0, Math.min(1, (popularity - 40) / 60));
  if (popularity < 40) return Math.round(floor * Math.max(0.05, popularity / 40) * 0.9);
  return Math.round(floor * Math.pow(top / floor, Math.pow(t, 1.6)));
}

const myName = (c: Pick<Career, "name" | "groupName" | "stage">) => (c.stage === "idol" && c.groupName ? `${c.groupName} ${c.name}` : c.name);

/** 그 시즌의 전체 순위(나 포함). 2023년 이후는 실제 월간 자료, 그 전은 게임 추정표. */
export function rankingFor(c: Pick<Career, "popularity" | "name" | "groupName" | "stage">, year: number, secondHalf: boolean): Ranking {
  const month = realMonthFor(year, secondHalf);
  let entries: RankedEntry[];
  let source: RankingSource;
  let outside = false;
  if (month) {
    const rows = REAL_MONTHS[month];
    const mine = { name: myName(c), index: popularityToRealIndex(c.popularity, rows), me: true };
    const all = [...rows.map((r) => ({ name: r.name, index: r.index, me: false })), mine].sort((a, b) => b.index - a.index || (a.me ? 1 : -1));
    entries = all.map((e, i) => ({ ...e, rank: i + 1 }));
    outside = c.popularity < 40;
    const [y, m] = month.split("-");
    source = { kind: "real", month, label: `${y}년 ${Number(m)}월 아이돌 개인 브랜드평판 · 한국기업평판연구소` };
  } else {
    const mine = { name: myName(c), index: Math.round(c.popularity), me: true };
    const all = [...brandTable(year).map((e) => ({ ...e, me: false })), mine].sort((a, b) => b.index - a.index || (a.me ? 1 : -1));
    entries = all.map((e, i) => ({ ...e, rank: i + 1 }));
    outside = entries[entries.length - 1].me && c.popularity < 20;
    source = { kind: "estimate", label: `${year}년 아이돌 인기 비교 · 게임 추정` };
  }
  const i = entries.findIndex((e) => e.me);
  return { entries, source, me: entries[i], above: i > 0 ? entries[i - 1] : null, below: i < entries.length - 1 ? entries[i + 1] : null, total: entries.length, outside };
}

/** @deprecated rankingFor 사용 */
export function rankWithMe(c: Pick<Career, "popularity" | "name" | "groupName" | "stage">, year: number): RankedEntry[] {
  return rankingFor(c, year, false).entries;
}
export function rankNeighbors(c: Pick<Career, "popularity" | "name" | "groupName" | "stage">, year: number) {
  const r = rankingFor(c, year, false);
  return { me: r.me, above: r.above, below: r.below, total: r.total };
}
