export type StatKey = "vocal" | "dance" | "rap" | "visual" | "variety" | "producing";
export type Stats = Record<StatKey, number>;
export type Position = "vocal" | "dance" | "rap" | "visual" | "allround" | "producer";
export type Gender = "female" | "male";
export type Stage = "free" | "trainee" | "idol" | "retired";
export type Tier = "major" | "mid" | "indie" | "global";
export type Risk = "safe" | "bold";
export type SchoolId = "arts" | "general" | "ged";
export type Concept = "fresh" | "girlcrush" | "ballad" | "performance";

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
