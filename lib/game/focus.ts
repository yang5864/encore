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
  /** "group" | "solo" — idol options are shown in two sections */
  group?: "group" | "solo";
  /** 개인 활동 성공 가능성 라벨 */
  readiness?: { label: string; tone: "danger" | "warn" | "ok" | "info" };
};

export type SoloKind = "acting" | "solo" | "variety" | "producing";
export const SOLO_UNLOCK_TURNS = 6; // 데뷔 3년 뒤부터

/** Which stat carries each individual activity. */
export function soloStat(c: Pick<Career, "position">, kind: SoloKind): StatKey {
  if (kind === "acting") return "visual";
  if (kind === "variety") return "variety";
  if (kind === "producing") return "producing";
  const main = MAIN_STAT[c.position];
  return main === "visual" || main === "variety" ? "vocal" : main;
}

/** Success chance of an individual activity: the carrying stat decides almost everything. */
export function soloChance(c: Pick<Career, "position" | "stats">, kind: SoloKind): number {
  const stat = c.stats[soloStat(c, kind)];
  const helper = kind === "acting" ? c.stats.variety / 500 : kind === "variety" ? c.stats.visual / 600 : kind === "producing" ? c.stats.vocal / 600 : c.stats.producing / 600;
  return Math.max(0.05, Math.min(0.95, (stat - 30) / 60 + helper));
}

export function readinessOf(p: number): { label: string; tone: "danger" | "warn" | "ok" | "info" } {
  if (p < 0.3) return { label: "성공 어려움", tone: "danger" };
  if (p < 0.5) return { label: "도전적", tone: "warn" };
  if (p < 0.75) return { label: "해볼 만함", tone: "ok" };
  return { label: "재능 있음", tone: "info" };
}

export const SOLO_LABELS: Record<SoloKind, { label: string; hint: string }> = {
  acting: { label: "연기 활동", hint: "드라마·영화에 도전해요. 비주얼이 받쳐주면 배우로 자리 잡아요" },
  solo: { label: "솔로 앨범", hint: "내 이름으로 앨범을 내요. 주 포지션 실력이 성적을 정해요" },
  variety: { label: "유튜브 · 예능 고정", hint: "개인 채널과 고정 예능으로 얼굴을 알려요. 예능 수치가 낮으면 묻혀요" },
  producing: { label: "프로듀서 활동", hint: "다른 가수의 곡을 쓰고 프로듀싱해요. 프로듀싱 수치가 핵심이에요" },
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

export const DANGER_LOCK = "컨디션이 위험해요. 이번 시즌은 쉬어야 해요";

/** 컨디션이 위험이면 휴식만 고를 수 있다. 무리하면 부상·활동 중단으로 이어지기 때문. */
function lockWhenDanger(c: Career, options: FocusOption[]): FocusOption[] {
  if (conditionOf(c).level !== "danger") return options;
  return options.map((o) => (o.id === "rest" ? { ...o, disabledReason: undefined, hint: "컨디션이 위험해서 이번 시즌은 쉬어야 해요. 몸과 마음을 크게 회복해요" } : { ...o, disabledReason: DANGER_LOCK }));
}

export function focusOptions(c: Career): FocusOption[] {
  return lockWhenDanger(c, baseOptions(c));
}

function baseOptions(c: Career): FocusOption[] {
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
  // idol. 그룹을 떠났으면 모든 활동이 개인 활동이라 섹션을 나누지 않는다
  const solo = !!c.flags.solo;
  const options: FocusOption[] = [
    { id: "comeback", label: solo ? "솔로 앨범 준비" : "컴백 준비", hint: solo ? "내 이름으로 새 앨범을 내요. 초동과 차트 성적이 팬과 인기도를 정해요. 컨디션이 많이 떨어져요" : "새 앨범을 내요. 초동과 차트 성적이 팬과 인기도를 정해요. 컨디션이 많이 떨어져요", risk: "bold", picker: "concept", group: "group" },
    { id: "promo", label: "방송 · 예능 활동", hint: "대중 인지도와 예능감이 오르고 출연료가 생겨요", risk: "safe", group: "group" },
    { id: "fanmeet", label: "팬미팅 · 콘텐츠", hint: "팬덤 결속과 평판이 올라요. 마음이 편해져요", risk: "safe", group: "group" },
    { id: "overseas", label: "해외 활동", hint: "해외 팬이 크게 늘고 다음 앨범의 해외 차트 가능성이 열려요. 많이 지쳐요", risk: "bold", group: "group", disabledReason: c.popularity < 55 ? "인기도가 더 필요해요" : undefined },
    { id: "rest", label: "휴식기", hint: "컨디션을 크게 회복해요. 팬이 조금 줄어요", risk: "safe", group: "group" },
  ];
  if (c.lastReleaseTurn === c.turn) options[0].disabledReason = "이번 시즌에 이미 앨범을 냈어요";
  if (c.debutTurn !== null && c.turn - c.debutTurn >= SOLO_UNLOCK_TURNS) {
    for (const kind of (solo ? ["acting", "variety", "producing"] : ["solo", "acting", "variety", "producing"]) as SoloKind[]) {
      const p = soloChance(c, kind);
      options.push({ id: `solo:${kind}`, label: SOLO_LABELS[kind].label, hint: SOLO_LABELS[kind].hint, risk: p < 0.5 ? "bold" : "safe", group: "solo", readiness: readinessOf(p) });
    }
  }
  return solo ? options.map((o) => ({ ...o, group: undefined })) : options;
}

export function focusLabel(focusId: string): string {
  const [kind, arg] = focusId.split(":");
  if (kind === "train") return arg === "all" || !arg ? "올라운드 트레이닝" : `${STAT_NAMES[arg as StatKey]} 집중 트레이닝`;
  if (kind === "comeback") return `컴백 · ${CONCEPTS.find((x) => x.id === arg)?.name ?? ""}`;
  if (kind === "solo") return SOLO_LABELS[arg as SoloKind]?.label ?? focusId;
  return { promo: "방송 · 예능 활동", fanmeet: "팬미팅 · 콘텐츠", overseas: "해외 활동", rest: "휴식" }[kind] ?? focusId;
}
