/**
 * 실제 연말 시상식 대상 수상자 (그 해 발매 기준).
 * 출처: Wikipedia "MAMA Award for Artist of the Year", "Melon Music Award for Artist of the Year",
 * "Golden Disc Awards" 대상 표 (2026-11-16 확인). 골든디스크는 다음 해 1월 시상이라도 발매 연도로 적는다.
 * 표에서 아티스트 칸이 빈 해는 같은 줄의 앨범·곡으로 채웠다 (Mr. Simple·Overdose·Blueming·FML).
 * 게임에서는 내가 대상을 놓치면 이 팀이 호명되고, 내가 받으면 이 팀을 제친 것이 된다.
 */
type GoldenDisc = { album: string; digital: string };

const MAMA: Record<number, string> = {
  2006: "동방신기", 2007: "슈퍼주니어", 2008: "빅뱅", 2009: "2PM", 2010: "2NE1", 2011: "소녀시대", 2012: "빅뱅",
  2013: "지드래곤", 2014: "엑소", 2015: "빅뱅", 2016: "방탄소년단", 2017: "방탄소년단", 2018: "방탄소년단",
  2019: "방탄소년단", 2020: "방탄소년단", 2021: "방탄소년단", 2022: "방탄소년단", 2023: "뉴진스", 2024: "세븐틴", 2025: "지드래곤",
};

const MMA: Record<number, string> = {
  2006: "신화", 2007: "신혜성", 2008: "동방신기", 2009: "소녀시대", 2010: "소녀시대", 2011: "비스트", 2012: "비스트",
  2013: "샤이니", 2014: "아이유", 2015: "빅뱅", 2016: "엑소", 2017: "엑소", 2018: "방탄소년단", 2019: "방탄소년단",
  2020: "방탄소년단", 2021: "아이유", 2022: "임영웅", 2023: "뉴진스", 2024: "에스파", 2025: "지드래곤",
};

const GOLDEN_DISC: Record<number, GoldenDisc> = {
  2006: { album: "동방신기", digital: "SG워너비" },
  2007: { album: "SG워너비", digital: "아이비" },
  2008: { album: "동방신기", digital: "쥬얼리" },
  2009: { album: "슈퍼주니어", digital: "소녀시대" },
  2010: { album: "소녀시대", digital: "2AM" },
  2011: { album: "슈퍼주니어", digital: "소녀시대" },
  2012: { album: "슈퍼주니어", digital: "싸이" },
  2013: { album: "엑소", digital: "싸이" },
  2014: { album: "엑소", digital: "태양" },
  2015: { album: "엑소", digital: "빅뱅" },
  2016: { album: "엑소", digital: "트와이스" },
  2017: { album: "방탄소년단", digital: "아이유" },
  2018: { album: "방탄소년단", digital: "아이콘" },
  2019: { album: "방탄소년단", digital: "방탄소년단" },
  2020: { album: "방탄소년단", digital: "아이유" },
  2021: { album: "방탄소년단", digital: "아이유" },
  2022: { album: "방탄소년단", digital: "아이브" },
  2023: { album: "세븐틴", digital: "뉴진스" },
  2024: { album: "세븐틴", digital: "에스파" },
  2025: { album: "스트레이 키즈", digital: "지드래곤" },
};

/**
 * 그 해 그 시상식의 실제 대상 수상자. 골든디스크는 음원(digital) 또는 음반(album) 대상.
 * 아직 열리지 않은 해(2026 이후)나 자료가 없으면 null.
 */
export function realDaesang(show: string, year: number, kind: "album" | "digital" = "album"): string | null {
  if (show === "MAMA") return MAMA[year] ?? null;
  if (show === "MMA") return MMA[year] ?? null;
  if (show === "골든디스크") return GOLDEN_DISC[year]?.[kind] ?? null;
  return null;
}
