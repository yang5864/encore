import type { Career, Concept, Risk, StatKey } from "./types.ts";
import { STAT_KEYS, STAT_NAMES } from "./stats.ts";
import { conditionOf } from "./format.ts";

export type FocusOption = {
  id: string;
  label: string;
  hint: string;
  risk: Risk;
  /** stat selector or concept selector shown under the option */
  picker?: "stat" | "concept";
  disabledReason?: string;
};

export const CONCEPTS: { id: Concept; name: string; description: string; stats: StatKey[] }[] = [
  { id: "fresh", name: "청량", description: "밝고 여름 같은 곡. 비주얼과 댄스가 중요해요", stats: ["visual", "dance"] },
  { id: "girlcrush", name: "걸크러시 · 힙합", description: "강렬한 비트. 랩과 퍼포먼스가 중요해요", stats: ["rap", "dance"] },
  { id: "ballad", name: "보컬 · 발라드", description: "감성 보컬. 보컬과 프로듀싱이 중요해요", stats: ["vocal", "producing"] },
  { id: "performance", name: "퍼포먼스", description: "칼군무와 킬링파트. 댄스가 가장 중요해요", stats: ["dance", "visual"] },
];

export const MAIN_STAT: Record<Career["position"], StatKey> = {
  vocal: "vocal",
  dance: "dance",
  rap: "rap",
  visual: "visual",
  allround: "dance",
  producer: "producing",
};

export function lowestStat(c: Pick<Career, "stats">): StatKey {
  return STAT_KEYS.reduce((min, k) => (c.stats[k] < c.stats[min] ? k : min), STAT_KEYS[0]);
}

export function focusOptions(c: Career): FocusOption[] {
  const cond = conditionOf(c);
  if (c.stage === "retired") return [];
  if (c.hiatusUntil > c.turn) {
    return [{ id: "rest", label: "휴식기", hint: "활동을 쉬면서 컨디션을 회복해요", risk: "safe" }];
  }
  if (c.stage === "free") {
    return [
      { id: "train", label: "학원 수업", hint: "고른 능력이 오르고 나머지도 조금 자라요. 소속 연습생보다 느려요", risk: "safe", picker: "stat" },
      { id: "train:all", label: "독학 올라운드", hint: "모든 능력이 조금씩 올라요", risk: "safe" },
      { id: "rest", label: "휴식", hint: "컨디션을 회복해요. 실력은 오르지 않아요", risk: "safe", disabledReason: cond.level === "good" ? "컨디션이 좋을 땐 필요 없어요" : undefined },
    ];
  }
  if (c.stage === "trainee") {
    return [
      { id: "train", label: "집중 트레이닝", hint: "고른 능력이 크게 오르고 나머지도 조금 자라요. 컨디션이 조금 떨어져요", risk: "safe", picker: "stat" },
      { id: "train:all", label: "올라운드 트레이닝", hint: "모든 능력이 고르게 올라요", risk: "safe" },
      { id: "rest", label: "휴식", hint: "컨디션을 크게 회복해요. 실력은 오르지 않아요", risk: "safe", disabledReason: cond.level === "good" ? "컨디션이 좋을 땐 필요 없어요" : undefined },
    ];
  }
  // idol
  const options: FocusOption[] = [
    { id: "comeback", label: "컴백 준비", hint: "새 앨범을 내요. 초동과 차트 성적이 팬과 인기도를 정해요. 컨디션이 많이 떨어져요", risk: "bold", picker: "concept" },
    { id: "promo", label: "방송 · 예능 활동", hint: "대중 인지도와 예능감이 오르고 출연료가 생겨요", risk: "safe" },
    { id: "fanmeet", label: "팬미팅 · 콘텐츠", hint: "팬덤 결속과 평판이 올라요. 마음이 편해져요", risk: "safe" },
    { id: "overseas", label: "해외 활동", hint: "해외 팬이 크게 늘고 다음 앨범의 해외 차트 가능성이 열려요. 많이 지쳐요", risk: "bold", disabledReason: c.popularity < 55 ? "인기도가 더 필요해요" : undefined },
    { id: "rest", label: "휴식기", hint: "컨디션을 크게 회복해요. 팬이 조금 줄어요", risk: "safe" },
  ];
  if (c.lastReleaseTurn === c.turn) options[0].disabledReason = "이번 반기에 이미 앨범을 냈어요";
  return options;
}

export function focusLabel(focusId: string): string {
  const [kind, arg] = focusId.split(":");
  if (kind === "train") return arg === "all" || !arg ? "올라운드 트레이닝" : `${STAT_NAMES[arg as StatKey]} 집중 트레이닝`;
  if (kind === "comeback") return `컴백 · ${CONCEPTS.find((x) => x.id === arg)?.name ?? ""}`;
  return { promo: "방송 · 예능 활동", fanmeet: "팬미팅 · 콘텐츠", overseas: "해외 활동", rest: "휴식" }[kind] ?? focusId;
}
