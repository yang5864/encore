import type { Career, StatKey } from "./types.ts";

/** 예술고 전공. 합격하면 전공 능력이 빨리 자란다. */
export type ArtsMajor = { id: string; name: string; description: string; stats: StatKey[] };
export const ARTS_MAJORS: ArtsMajor[] = [
  { id: "music", name: "실용음악과", description: "보컬·랩·작곡 실기. 음악 능력이 빨리 자라요", stats: ["vocal", "rap", "producing"] },
  { id: "dance", name: "실용무용과", description: "현대무용·스트리트 실기. 댄스가 빨리 자라요", stats: ["dance"] },
  { id: "broadcast", name: "방송연예과", description: "연기·카메라 실기. 비주얼과 예능이 빨리 자라요", stats: ["visual", "variety"] },
  { id: "musical", name: "뮤지컬과", description: "노래와 춤을 같이 봐요. 보컬과 댄스가 빨리 자라요", stats: ["vocal", "dance"] },
];
/** 합격선: 전공 능력 × 0.5 + 실기 점수 × 0.5 */
export const ARTS_PASS = 60;
/** 예고 전공 능력 성장 배율 */
export const ARTS_GROWTH = 1.2;

export const artsMajorById = (id: string) => ARTS_MAJORS.find((m) => m.id === id) ?? null;
/** 다니는 예고의 전공 (flags.artsMajor = 전공 순번 + 1) */
export const artsMajorOf = (c: Pick<Career, "schoolId" | "flags">) => (c.schoolId === "arts" ? ARTS_MAJORS[(c.flags.artsMajor ?? 0) - 1] ?? null : null);

/** 전공 능력: 전공 과목 중 가장 높은 두 능력의 평균 (과목이 하나면 그 능력) */
export function majorAbility(c: Pick<Career, "stats">, major: ArtsMajor): number {
  const top = major.stats.map((k) => c.stats[k]).sort((a, b) => b - a).slice(0, 2);
  return top.reduce((s, v) => s + v, 0) / top.length;
}

/** 입시 총점 (0~100) */
export const artsTotal = (c: Pick<Career, "stats">, major: ArtsMajor, score: number) => Math.round(majorAbility(c, major) * 0.5 + Math.max(0, Math.min(100, score)) * 0.5);
/** 합격하려면 실기에서 받아야 하는 점수 */
export const artsNeeded = (c: Pick<Career, "stats">, major: ArtsMajor) => Math.max(0, Math.min(100, Math.ceil(ARTS_PASS * 2 - majorAbility(c, major))));
