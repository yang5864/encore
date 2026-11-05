import { displayName } from "./format.ts";
import type { Career } from "./types.ts";

/**
 * 연도별 아이돌 인기 비교표 (게임 추정 지수, 0~100).
 *
 * 주의: 한국기업평판연구소의 브랜드평판 지수는 2015년 이후에만 존재하고 월 단위이며,
 * 이 표는 그 지수를 그대로 가져온 것이 아니라 당시 음반·음원·대중 인지도를 바탕으로
 * 게임 안에서 "내 캐릭터가 지금 어디쯤인지" 가늠하기 위해 작성한 추정값이다.
 * 실제 인물·그룹의 공식 순위가 아니며, 이름은 비교 기준으로만 쓴다.
 */
export type BrandEntry = { name: string; index: number };

/** 개인 이름 앞의 그룹명 없이 쓰는 솔로 가수 */
export const SOLO_NAMES = ["비", "보아", "이효리", "싸이", "아이유", "손담비"];

/** 그 해 가장 주목받은 개인 30명. 앞사람일수록 인기. 첫 값은 1위 지수, 이후 지수는 순서대로 어긋난 간격으로 내려간다. */
const ROSTER: Record<number, [number, string]> = {
  2006: [88, "동방신기 유노윤호,동방신기 최강창민,동방신기 시아준수,동방신기 믹키유천,동방신기 영웅재중,비,슈퍼주니어 희철,슈퍼주니어 강인,슈퍼주니어 이특,슈퍼주니어 신동,슈퍼주니어 규현,보아,이효리,SS501 김현중,SS501 김규종,SS501 박정민,신화 에릭,신화 이민우,신화 김동완,빅뱅 지드래곤,빅뱅 탑,빅뱅 대성,빅뱅 태양,빅뱅 승리,SG워너비 김용준,씨야 이보람,브라운아이드걸스 나르샤,브라운아이드걸스 가인,에픽하이 타블로,버즈 민경훈"],
  2007: [91, "원더걸스 소희,원더걸스 선예,원더걸스 예은,원더걸스 유빈,빅뱅 지드래곤,빅뱅 탑,빅뱅 태양,빅뱅 대성,빅뱅 승리,동방신기 유노윤호,동방신기 최강창민,동방신기 시아준수,동방신기 믹키유천,동방신기 영웅재중,슈퍼주니어 희철,슈퍼주니어 강인,슈퍼주니어 이특,슈퍼주니어 신동,소녀시대 태연,소녀시대 윤아,소녀시대 유리,소녀시대 제시카,소녀시대 서현,비,이효리,FT아일랜드 이홍기,SS501 김현중,카라 구하라,보아,브라운아이드걸스 나르샤"],
  2008: [92, "빅뱅 지드래곤,빅뱅 탑,빅뱅 태양,빅뱅 대성,빅뱅 승리,원더걸스 소희,원더걸스 선예,원더걸스 유빈,원더걸스 예은,동방신기 유노윤호,동방신기 최강창민,소녀시대 태연,소녀시대 윤아,소녀시대 제시카,소녀시대 써니,소녀시대 서현,슈퍼주니어 이특,슈퍼주니어 희철,슈퍼주니어 강인,샤이니 태민,샤이니 종현,샤이니 온유,2PM 닉쿤,2PM 택연,카라 구하라,카라 한승연,브라운아이드걸스 가인,에픽하이 타블로,손담비,비"],
  2009: [94, "소녀시대 태연,소녀시대 윤아,소녀시대 유리,소녀시대 제시카,소녀시대 서현,소녀시대 티파니,슈퍼주니어 희철,슈퍼주니어 강인,슈퍼주니어 이특,슈퍼주니어 규현,2NE1 씨엘,2NE1 산다라박,2NE1 박봄,2NE1 공민지,빅뱅 지드래곤,빅뱅 태양,빅뱅 탑,2PM 닉쿤,2PM 택연,2PM 준수,카라 구하라,카라 한승연,카라 강지영,샤이니 종현,샤이니 태민,티아라 소연,티아라 지연,브라운아이드걸스 가인,원더걸스 선예,f(x) 설리"],
  2010: [95, "소녀시대 태연,소녀시대 윤아,소녀시대 제시카,소녀시대 서현,소녀시대 수영,2PM 택연,2PM 닉쿤,2PM 준호,카라 구하라,카라 박규리,카라 한승연,슈퍼주니어 규현,슈퍼주니어 이특,슈퍼주니어 은혁,2NE1 씨엘,2NE1 박봄,2NE1 산다라박,티아라 소연,티아라 효민,샤이니 민호,샤이니 태민,빅뱅 지드래곤,빅뱅 탑,미쓰에이 수지,씨엔블루 정용화,비스트 장현승,f(x) 설리,포미닛 현아,인피니트 성규,아이유"],
  2011: [93, "소녀시대 태연,소녀시대 윤아,소녀시대 서현,소녀시대 제시카,빅뱅 지드래곤,빅뱅 대성,빅뱅 탑,2NE1 씨엘,2NE1 산다라박,슈퍼주니어 규현,슈퍼주니어 려욱,아이유,티아라 지연,티아라 은정,비스트 장현승,비스트 윤두준,카라 구하라,카라 한승연,2PM 택연,2PM 닉쿤,f(x) 설리,f(x) 빅토리아,씨스타 효린,씨스타 소유,시크릿 전효성,인피니트 엘,인피니트 성종,애프터스쿨 유이,샤이니 태민,미쓰에이 수지"],
  2012: [95, "싸이,빅뱅 지드래곤,빅뱅 태양,빅뱅 대성,빅뱅 탑,소녀시대 태연,소녀시대 윤아,소녀시대 수영,소녀시대 서현,씨스타 효린,씨스타 소유,슈퍼주니어 시원,슈퍼주니어 려욱,아이유,2NE1 씨엘,2NE1 공민지,비스트 윤두준,샤이니 종현,샤이니 민호,샤이니 태민,인피니트 엘,인피니트 우현,f(x) 크리스탈,티아라 효민,엑소 백현,엑소 수호,비투비 서은광,카라 구하라,2PM 준호,에이핑크 박초롱"],
  2013: [92, "엑소 백현,엑소 수호,엑소 시우민,엑소 첸,엑소 카이,엑소 세훈,소녀시대 태연,소녀시대 윤아,소녀시대 서현,씨스타 효린,씨스타 소유,빅뱅 지드래곤,빅뱅 태양,인피니트 엘,인피니트 성규,샤이니 종현,샤이니 키,아이유,2NE1 씨엘,비스트 장현승,에이핑크 손나은,에이핑크 박초롱,걸스데이 혜리,걸스데이 민아,크레용팝 초아,방탄소년단 정국,슈퍼주니어 려욱,f(x) 루나,엑소 찬열,싸이"],
  2014: [95, "엑소 백현,엑소 찬열,엑소 디오,엑소 카이,엑소 수호,엑소 첸,소녀시대 태연,소녀시대 윤아,소녀시대 서현,씨스타 소유,씨스타 효린,에이핑크 손나은,에이핑크 박초롱,빅뱅 지드래곤,빅뱅 탑,인피니트 엘,걸스데이 혜리,걸스데이 민아,샤이니 태민,AOA 설현,위너 이승훈,블락비 지코,방탄소년단 정국,방탄소년단 지민,비투비 서은광,레드벨벳 아이린,아이유,엑소 세훈,소녀시대 수영,슈퍼주니어 규현"],
  2015: [96, "엑소 백현,엑소 카이,엑소 디오,엑소 찬열,엑소 첸,빅뱅 지드래곤,빅뱅 태양,빅뱅 탑,빅뱅 대성,소녀시대 태연,소녀시대 윤아,씨스타 소유,에이핑크 박초롱,에이핑크 손나은,AOA 설현,방탄소년단 정국,방탄소년단 뷔,방탄소년단 지민,샤이니 민호,레드벨벳 아이린,레드벨벳 웬디,인피니트 엘,여자친구 소원,여자친구 은하,아이콘 바비,세븐틴 에스쿱스,트와이스 나연,트와이스 쯔위,아이유,걸스데이 혜리"],
  2016: [95, "엑소 백현,엑소 카이,엑소 디오,엑소 세훈,트와이스 나연,트와이스 쯔위,트와이스 모모,트와이스 사나,방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 진,빅뱅 지드래곤,빅뱅 태양,레드벨벳 아이린,레드벨벳 슬기,여자친구 소원,여자친구 은하,아이유,아이오아이 전소미,아이오아이 김세정,세븐틴 에스쿱스,세븐틴 민규,마마무 화사,마마무 솔라,샤이니 태민,블랙핑크 제니,갓세븐 잭슨,소녀시대 윤아,에이핑크 손나은"],
  2017: [98, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 진,방탄소년단 RM,엑소 백현,엑소 카이,엑소 세훈,트와이스 나연,트와이스 쯔위,트와이스 사나,트와이스 모모,워너원 강다니엘,워너원 박지훈,워너원 박우진,아이유,레드벨벳 아이린,레드벨벳 조이,블랙핑크 지수,블랙핑크 제니,세븐틴 정한,여자친구 소원,마마무 화사,뉴이스트 민현,갓세븐 잭슨,워너원 옹성우,빅뱅 지드래곤,샤이니 키,엑소 디오,소녀시대 태연"],
  2018: [99, "방탄소년단 정국,방탄소년단 뷔,방탄소년단 지민,방탄소년단 진,방탄소년단 슈가,워너원 강다니엘,워너원 박지훈,워너원 옹성우,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,블랙핑크 리사,트와이스 나연,트와이스 쯔위,트와이스 지효,엑소 백현,엑소 카이,엑소 세훈,레드벨벳 아이린,레드벨벳 슬기,아이유,세븐틴 에스쿱스,세븐틴 민규,마마무 화사,아이즈원 장원영,여자친구 소원,갓세븐 잭슨,몬스타엑스 주헌,NCT 마크,샤이니 태민"],
  2019: [99, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 제이홉,방탄소년단 RM,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,블랙핑크 리사,트와이스 나연,트와이스 모모,트와이스 사나,엑소 백현,엑소 카이,엑소 수호,레드벨벳 아이린,레드벨벳 조이,세븐틴 에스쿱스,세븐틴 정한,아이즈원 장원영,아이즈원 안유진,마마무 화사,마마무 문별,NCT 마크,NCT 재현,있지 유나,몬스타엑스 주헌,투모로우바이투게더 수빈,아이유,갓세븐 잭슨"],
  2020: [100, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 진,방탄소년단 슈가,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,블랙핑크 리사,트와이스 나연,트와이스 사나,트와이스 다현,세븐틴 에스쿱스,세븐틴 민규,아이즈원 장원영,아이즈원 안유진,NCT 마크,NCT 재현,레드벨벳 아이린,레드벨벳 슬기,엑소 백현,있지 유나,있지 예지,마마무 화사,오마이걸 효정,(여자)아이들 소연,투모로우바이투게더 수빈,에스파 카리나,아이유,엑소 카이"],
  2021: [100, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 진,방탄소년단 RM,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,블랙핑크 리사,에스파 카리나,에스파 윈터,에스파 지젤,세븐틴 에스쿱스,세븐틴 민규,NCT 마크,NCT 도영,트와이스 나연,트와이스 모모,있지 유나,레드벨벳 아이린,스트레이키즈 방찬,스트레이키즈 현진,브레이브걸스 유정,투모로우바이투게더 수빈,오마이걸 효정,엔하이픈 정원,아이브 장원영,아이유,엑소 백현,(여자)아이들 소연"],
  2022: [98, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 진,아이브 장원영,아이브 안유진,아이브 레이,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,블랙핑크 리사,뉴진스 민지,뉴진스 하니,에스파 카리나,에스파 윈터,세븐틴 에스쿱스,세븐틴 민규,(여자)아이들 소연,(여자)아이들 미연,르세라핌 김채원,르세라핌 사쿠라,NCT 마크,NCT 도영,스트레이키즈 방찬,스트레이키즈 현진,트와이스 나연,있지 유나,투모로우바이투게더 수빈,엔하이픈 정원,아이유"],
  2023: [97, "뉴진스 민지,뉴진스 하니,뉴진스 해린,뉴진스 다니엘,아이브 장원영,아이브 안유진,세븐틴 에스쿱스,세븐틴 민규,방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,에스파 카리나,에스파 윈터,스트레이키즈 방찬,스트레이키즈 현진,블랙핑크 제니,블랙핑크 로제,르세라핌 김채원,르세라핌 사쿠라,(여자)아이들 소연,(여자)아이들 미연,NCT 마크,투모로우바이투게더 수빈,제로베이스원 성한빈,엔하이픈 정원,라이즈 원빈,아이유,트와이스 나연,있지 유나,아이브 레이"],
  2024: [94, "에스파 카리나,에스파 윈터,세븐틴 에스쿱스,세븐틴 민규,뉴진스 민지,뉴진스 하니,아이브 장원영,아이브 안유진,방탄소년단 정국,방탄소년단 지민,스트레이키즈 방찬,스트레이키즈 현진,데이식스 성진,라이즈 원빈,라이즈 쇼타로,르세라핌 김채원,아일릿 원희,(여자)아이들 소연,베이비몬스터 아사,투모로우바이투게더 수빈,엔하이픈 정원,투어스 신유,블랙핑크 제니,블랙핑크 로제,아이유,트와이스 나연,제로베이스원 성한빈,엑소 백현,NCT 마크,아이브 레이"],
  2025: [96, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,세븐틴 에스쿱스,세븐틴 민규,에스파 카리나,에스파 윈터,스트레이키즈 방찬,스트레이키즈 현진,아이브 장원영,아이브 안유진,데이식스 성진,라이즈 원빈,베이비몬스터 아사,엔하이픈 정원,아일릿 원희,투모로우바이투게더 수빈,뉴진스 민지,하츠투하츠 지우,키키 지유,아이유,르세라핌 김채원,트와이스 나연,(여자)아이들 소연,NCT 마크,투어스 신유,제로베이스원 성한빈"],
  2026: [98, "방탄소년단 정국,방탄소년단 지민,방탄소년단 뷔,방탄소년단 진,블랙핑크 제니,블랙핑크 지수,블랙핑크 로제,블랙핑크 리사,에스파 카리나,에스파 윈터,세븐틴 에스쿱스,세븐틴 민규,스트레이키즈 방찬,스트레이키즈 현진,아이브 장원영,아이브 안유진,라이즈 원빈,데이식스 성진,베이비몬스터 아사,엔하이픈 정원,투모로우바이투게더 수빈,아일릿 원희,하츠투하츠 지우,올데이프로젝트 애니,코르티스 마틴,아이유,키키 지유,트와이스 나연,르세라핌 김채원,뉴진스 민지"],
};

const GAPS = [2, 1, 3, 2, 2, 1, 3, 2, 1, 2, 3, 1, 2, 2, 1, 3, 2, 1, 2, 2, 3, 1, 2, 1, 2, 2, 1, 2, 1];

export const BRAND_RANKS: Record<number, BrandEntry[]> = Object.fromEntries(
  Object.entries(ROSTER).map(([year, [top, names]]) => {
    let index = top;
    return [Number(year), names.split(",").map((name, i) => { if (i > 0) index -= GAPS[i - 1]; return { name, index }; })];
  }),
);

/** 비교 기준이 되는 그룹(솔로 제외), 해당 연도 개인 중 가장 높은 지수 순. */
export function rivalGroups(year: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of brandTable(year)) {
    const g = e.name.includes(" ") ? e.name.slice(0, e.name.indexOf(" ")) : null;
    if (!g || seen.has(g)) continue;
    seen.add(g);
    out.push(g);
    if (out.length >= 8) break;
  }
  return out;
}

export function groupStrength(year: number, group: string): number {
  return brandTable(year).find((e) => e.name.startsWith(`${group} `))?.index ?? 60;
}

import { REAL_MONTHS, REAL_MONTH_NOTES, type RealEntry } from "./brand-rank-real.ts";
import { brandIndex } from "./metrics-model.ts";

export function brandTable(year: number): BrandEntry[] {
  const y = Math.max(2006, Math.min(2026, year));
  return [...(BRAND_RANKS[y] ?? BRAND_RANKS[2026])].sort((a, b) => b.index - a.index);
}

export type RankedEntry = BrandEntry & { rank: number; me: boolean };
export type RankingSource = { kind: "real"; month: string; label: string; note?: string } | { kind: "estimate"; label: string };
export type Ranking = { entries: RankedEntry[]; source: RankingSource; me: RankedEntry; above: RankedEntry | null; below: RankedEntry | null; total: number; outside: boolean };

/** 상반기=6월, 하반기=12월 실제 자료. 그 달이 없으면 같은 해에서 가장 가까운 달(없으면 이전 해 12월 이후 6개월 이내). */
export function realMonthFor(year: number, secondHalf: boolean): string | null {
  const want = secondHalf ? 12 : 6;
  const target = year * 12 + want;
  const keys = Object.keys(REAL_MONTHS).map((k) => ({ k, n: Number(k.slice(0, 4)) * 12 + Number(k.slice(5)) }));
  const near = keys.filter((x) => Math.abs(x.n - target) <= 6).sort((a, b) => Math.abs(a.n - target) - Math.abs(b.n - target) || a.n - b.n)[0];
  return near ? near.k : null;
}

/** 인기도(0~100)를 그 달 지수 분포에 끼워 넣는다: 40 → 50위권 바닥, 100 → 1위 수준 (기하 보간). */
export function popularityToRealIndex(popularity: number, rows: RealEntry[]): number {
  const top = rows[0].index;
  const floor = rows[rows.length - 1].index;
  const t = Math.max(0, Math.min(1, (popularity - 40) / 60));
  if (popularity < 40) return Math.round(floor * Math.max(0.05, popularity / 40) * 0.9);
  return Math.round(floor * Math.pow(top / floor, Math.pow(t, 1.6)));
}

type RankInput = Pick<Career, "popularity" | "name" | "groupName" | "stage"> & Partial<Pick<Career, "albums" | "turn">>;

/**
 * 브랜드 평판은 인기도에 최근 1년 활동 성과를 더해 매긴다.
 * 멜론 상위권·음방 1위·빌보드는 화제성으로 바로 반영돼 순위가 다른 지표와 같이 움직인다.
 */
export function brandPower(c: RankInput): number {
  if (!c.albums?.length || c.turn === undefined) return c.popularity;
  let buzz = 0;
  for (const a of c.albums) {
    if (c.turn - a.turn > 2) continue;
    const fresh = c.turn - a.turn <= 1 ? 1 : 0.5;
    const melon = a.melon === null ? 0 : a.melon <= 5 ? 18 : a.melon <= 10 ? 14 : a.melon <= 30 ? 9 : a.melon <= 60 ? 5 : 2;
    buzz = Math.max(buzz, (melon + Math.min(9, a.wins * 1.5) + (a.billboard !== null ? 8 : 0)) * fresh);
  }
  return Math.min(100, c.popularity + buzz);
}

const myName = (c: Pick<Career, "name" | "groupName" | "stage">) => displayName(c);

/** 그 시즌의 전체 순위(나 포함). 2023년 이후는 실제 월간 자료, 그 전은 게임 추정표. */
export function rankingFor(input: RankInput, year: number, secondHalf: boolean): Ranking {
  const c = { ...input, popularity: brandPower(input) };
  const month = realMonthFor(year, secondHalf);
  let entries: RankedEntry[];
  let source: RankingSource;
  let outside = false;
  if (month) {
    const rows = REAL_MONTHS[month];
    const full = input as Career;
    const index = "fans" in full && "loyalty" in full ? brandIndex(full, rows[0].index) : popularityToRealIndex(c.popularity, rows);
    const mine = { name: myName(c), index, me: true };
    const all = [...rows.map((r) => ({ name: r.name, index: r.index, me: false })), mine].sort((a, b) => b.index - a.index || (a.me ? 1 : -1));
    entries = all.map((e, i) => ({ ...e, rank: i + 1 }));
    outside = index < rows[rows.length - 1].index;
    const [y, m] = month.split("-");
    source = { kind: "real", month, label: `${y}년 ${Number(m)}월 아이돌 개인 브랜드평판 · 한국기업평판연구소`, note: REAL_MONTH_NOTES[month] };
  } else {
    const full = input as Career;
    // 추정표(0~100)에도 같은 모델을 쓴다: 1위 지수를 100으로 보고 환산
    const index = "fans" in full && "loyalty" in full ? Math.round(brandIndex(full, 10000) / 100) : Math.round(c.popularity);
    const mine = { name: myName(c), index, me: true };
    const all = [...brandTable(year).map((e) => ({ ...e, me: false })), mine].sort((a, b) => b.index - a.index || (a.me ? 1 : -1));
    entries = all.map((e, i) => ({ ...e, rank: i + 1 }));
    outside = entries[entries.length - 1].me && index < 20;
    source = { kind: "estimate", label: `${year}년 아이돌 인기 비교 · 게임 추정` };
  }
  const i = entries.findIndex((e) => e.me);
  return { entries, source, me: entries[i], above: i > 0 ? entries[i - 1] : null, below: i < entries.length - 1 ? entries[i + 1] : null, total: entries.length, outside };
}

const sourceKey = (r: Ranking) => (r.source.kind === "real" ? r.source.month : r.source.label);

/**
 * 직전 비교 시점 대비 순위 변동. 양수는 상승, 음수는 하락, null은 새로 진입.
 * 같은 자료를 쓰는 시즌은 건너뛰고 자료가 바뀐 가장 가까운 이전 시점과 비교한다.
 * 내 변동은 지난 시즌 인기도(prevPopularity)로 계산한다.
 */
export function rankChanges(c: RankInput, year: number, secondHalf: boolean, prevPopularity?: number): Map<string, number | null> {
  const now = rankingFor(c, year, secondHalf);
  let y = year;
  let h = secondHalf;
  let prev: Ranking | null = null;
  for (let i = 0; i < 8; i++) {
    if (h) h = false;
    else { y -= 1; h = true; }
    if (y < 2006) break;
    const r = rankingFor({ ...c, popularity: prevPopularity ?? c.popularity, turn: c.turn === undefined ? undefined : c.turn - 1, albums: c.albums?.filter((a) => c.turn === undefined || a.turn < c.turn) }, y, h);
    if (sourceKey(r) !== sourceKey(now)) { prev = r; break; }
  }
  const out = new Map<string, number | null>();
  if (!prev) return out;
  const before = new Map(prev.entries.map((e) => [e.me ? "@me" : e.name, e.rank]));
  for (const e of now.entries) {
    const key = e.me ? "@me" : e.name;
    if (e.me && prevPopularity === undefined) continue;
    const was = before.get(key);
    out.set(key, was === undefined ? null : was - e.rank);
  }
  return out;
}

/** @deprecated rankingFor 사용 */
export function rankWithMe(c: Pick<Career, "popularity" | "name" | "groupName" | "stage">, year: number): RankedEntry[] {
  return rankingFor(c, year, false).entries;
}
export function rankNeighbors(c: Pick<Career, "popularity" | "name" | "groupName" | "stage">, year: number) {
  const r = rankingFor(c, year, false);
  return { me: r.me, above: r.above, below: r.below, total: r.total };
}
