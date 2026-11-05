export type StatKey = "vocal" | "dance" | "rap" | "visual" | "variety" | "producing";
export type Stats = Record<StatKey, number>;
export type Position = "vocal" | "dance" | "rap" | "visual" | "allround" | "producer";
export type Gender = "female" | "male";
export type Stage = "free" | "trainee" | "idol" | "retired";
export type Tier = "major" | "mid" | "indie" | "global";
export type Risk = "safe" | "bold";
export type SchoolId = "arts" | "general" | "ged";
export type Concept = "fresh" | "girlcrush" | "ballad" | "performance";
/** 타이틀 제작 방식 */
export type Producer = "inhouse" | "star" | "self";
/** 프로모션 비중 */
export type Promo = "balanced" | "digital" | "physical" | "global";
export type Production = { producer: Producer; promo: Promo };
/** 회사가 1년 단위로 거는 목표 */
export type Kpi = { kind: "sales" | "melon" | "wins" | "fans" | "billboard"; target: number; deadline: number; label: string };

export type Effects = Partial<Record<StatKey, number>> & {
  health?: number;
  mental?: number;
  trust?: number;
  fans?: number;
  /** multiply current fans (e.g. 1.2 = +20%) */
  fansMul?: number;
  popularity?: number;
  reputation?: number;
  /** 억 단위 매출 */
  revenue?: number;
};

export type Requirement = { stat: StatKey; value: number } | { reputation: number } | { popularity: number };

export type ChoiceDef = {
  id: string;
  label: string;
  /** Plain-language consequence; never digits. */
  hint: string;
  risk: Risk;
  effects?: Effects;
  chance?: number;
  success?: Effects;
  fail?: Effects;
  successText?: string;
  failText?: string;
  requires?: Requirement;
  /** engine operation hook, e.g. "debut", "school:arts", "military:army" */
  op?: string;
  /** opens the contract sheet with signature before resolving */
  sign?: boolean;
};

export type EventKind = "story" | "scheduled" | "state" | "hidden";
export type EventStage = "free" | "trainee" | "idol" | "any";

export type GameEventDef = {
  id: string;
  stage: EventStage;
  kind: EventKind;
  title: string;
  text: string;
  scene: string;
  repeatable?: boolean;
  /** Public events generate community reactions. */
  public?: boolean;
  weight?: number;
  when?: (c: Career) => boolean;
  choices: ChoiceDef[];
};

export type ActiveEvent = {
  id: string;
  title: string;
  text: string;
  scene: string;
  public?: boolean;
  choices: ChoiceDef[];
};

export type ChangeFormat = "int" | "fans" | "won" | "rep" | "pct" | "count";
export type Change = { key: string; label: string; before: number; after: number; fmt: ChangeFormat };
export type Comment = { author: string; text: string; likes: number };
export type Tone = "good" | "bad" | "neutral" | "milestone";

export type TurnResult = {
  headline: string;
  text: string;
  scene?: string;
  tone: Tone;
  changes: Change[];
  comments: Comment[];
  milestones: MilestoneId[];
  notes: string[];
  /** 이번 결과에서 받은 상 (폭죽 효과용) */
  awards?: Award[];
  /** 축하 연출: 음방 1위는 꽃가루, 대상은 금빛 가루, 그 외 수상은 폭죽 */
  celebrate?: "win" | "daesang" | "award";
  /** 전체 화면 축하 연출 내용 (대상·그래미·스타디움 투어) */
  spotlight?: { chip: string; title: string; subtitle: string; stats?: string[] };
};

export type Album = {
  id: string;
  turn: number;
  name: string;
  concept: Concept;
  quality: number;
  sales: number;
  melon: number | null;
  billboard: number | null;
  wins: number;
  production?: Production;
  /** 활동 점수 (음원·음반·방송·소셜·투표) */
  scores?: { digital: number; physical: number; broadcast: number; social: number; vote: number };
  /** 1위한 음악방송 이름 */
  shows?: string[];
  cost: number;
  revenue: number;
};

export type AwardKind = "rookie" | "bonsang" | "daesang";
export type Award = { year: number; show: string; name: string; kind: AwardKind };
export type LogKind = "growth" | "story" | "milestone" | "award" | "release" | "system";
export type Log = { turn: number; title: string; text: string; kind: LogKind };
export type Ending = { id: string; title: string; subtitle: string; text: string };

export type Money = {
  /** 회사가 투자한 누적 비용(억) */
  invested: number;
  /** 누적 매출(억) */
  revenue: number;
  /** 내 정산금 누적(억) */
  settled: number;
  firstSettledTurn: number | null;
  /** 상점에서 쓴 돈(억) */
  spent?: number;
};

export type MilestoneId = "debut" | "firstWin" | "firstSettlement" | "daesang" | "legend";
export type PublicMetrics = { instagram: number; youtube: number; spotify: number };
/** 데뷔조 구성과 내 역할 */
export type Lineup = { members: number; leader: boolean; center: boolean; maknae: boolean; parts: string[] };
/** Hand-drawn signature, strokes of normalized [x, y] points in 0..1. */
export type Signature = { strokes: [number, number][][]; signedAt: number };

export type Career = {
  v: 2;
  id: string;
  seed: number;
  rngState: number;
  name: string;
  gender: Gender;
  avatar: number;
  position: Position;
  stats: Stats;
  potential: Stats;
  health: number;
  mental: number;
  trust: number;
  fans: number;
  popularity: number;
  reputation: number;
  /** 팬덤 결속 0~100: 팬을 챙기면 오르고 컴백만 반복하면 식는다. 초동·투표·이탈에 영향 */
  loyalty: number;
  /** 팀 케미 0~100: 그룹이 같이 움직이면 오르고 개인 활동·불화로 내려간다. 완성도·탈퇴 위험에 영향 */
  chemistry: number;
  /** 화제성 0~100: 활동·수상·논란으로 튀고 시즌마다 식는다. 음원·소셜·브랜드평판에 바로 반영 */
  buzz: number;
  /** 올해 홍보 예산 배분(%) */
  budget?: { mv: number; digital: number; global: number; fan: number } | null;
  turn: number;
  stage: Stage;
  agencyId: string | null;
  agencyJoinedTurn: number | null;
  traineeContractEnd: number | null;
  schoolId: SchoolId | null;
  groupName: string;
  debutTurn: number | null;
  contractEnd: number | null;
  militaryUntil: number;
  hiatusUntil: number;
  lastReleaseTurn: number | null;
  albums: Album[];
  awards: Award[];
  musicWins: number;
  peakMelon: number | null;
  peakBillboard: number | null;
  peakPopularity: number;
  money: Money;
  metrics: PublicMetrics;
  signature?: Signature | null;
  /** 상점에서 산 아이템 id */
  items?: string[];
  /** 데뷔 제안 때 정해지는 그룹 내 역할 */
  lineup?: Lineup | null;
  /** 데뷔 앨범 준비: 콘셉트 → 쇼케이스 → 음악방송 데뷔 무대 순서로 정한 뒤 발매한다 */
  debutPlan?: { concept: Concept; albumName: string } | null;
  kpi?: Kpi | null;
  /** 진행 중인 연말 시상식 (초청 → 참석 → 수상소감) */
  ceremony?: { year: number; show: string; awards: Award[]; stages: string[]; attended?: boolean } | null;
  /** 시즌별 요약 기록 (은퇴 후 그래프용). 아이돌 시즌마다 1개 */
  timeline?: { turn: number; popularity: number; fans: number; rank: number | null }[];
  /** 가장 최근 시즌 진행 결과 (대시보드 요약용, 닫아도 남는다) */
  lastResult?: TurnResult | null;
  warnings: number;
  scoutCount: number;
  lowPopularityTurns: number;
  flags: Record<string, number>;
  seen: Record<string, number>;
  history: Log[];
  pending: ActiveEvent | null;
  result: TurnResult | null;
  milestones: MilestoneId[];
  ending: Ending | null;
};

export type CreateInput = {
  name: string;
  gender: Gender;
  avatar: number;
  position: Position;
  stats: Stats;
};

export class GameError extends Error {}
