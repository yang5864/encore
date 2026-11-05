import type { Career, CreateInput, Stats } from "./types.ts";
import { GameError } from "./types.ts";
import { STAT_KEYS, validateAllocation } from "./stats.ts";
import { newSeed, rng } from "./rng.ts";

export const NAME_PATTERN = /^[\p{L}\p{N} _·-]{1,12}$/u;

export function createCareer(input: CreateInput, seed: number = newSeed(), id: string = cryptoId()): Career {
  const name = input.name.trim();
  if (!NAME_PATTERN.test(name)) throw new GameError("이름은 1~12자의 글자와 숫자만 쓸 수 있어요.");
  if (!["female", "male"].includes(input.gender)) throw new GameError("성별을 선택해주세요.");
  if (!Number.isInteger(input.avatar) || input.avatar < 0 || input.avatar > 17) throw new GameError("캐릭터를 선택해주세요.");
  const allocationError = validateAllocation(input.stats);
  if (allocationError) throw new GameError(allocationError);

  const c: Career = {
    v: 2,
    id,
    seed,
    rngState: seed >>> 0,
    name,
    gender: input.gender,
    avatar: input.avatar,
    position: input.position,
    stats: { ...input.stats },
    potential: {} as Stats,
    health: 85,
    mental: 80,
    trust: 0,
    fans: 0,
    popularity: 0,
    reputation: 0,
    loyalty: 50,
    chemistry: 60,
    turn: 0,
    stage: "free",
    agencyId: null,
    agencyJoinedTurn: null,
    traineeContractEnd: null,
    schoolId: null,
    groupName: "",
    debutTurn: null,
    contractEnd: null,
    militaryUntil: 0,
    hiatusUntil: 0,
    lastReleaseTurn: null,
    albums: [],
    awards: [],
    musicWins: 0,
    peakMelon: null,
    peakBillboard: null,
    peakPopularity: 0,
    money: { invested: 0, revenue: 0, settled: 0, firstSettledTurn: null, spent: 0 },
    items: [],
    timeline: [],
    metrics: { instagram: 0, youtube: 0, spotify: 0 },
    warnings: 0,
    scoutCount: 0,
    lowPopularityTurns: 0,
    flags: {},
    seen: {},
    history: [],
    pending: null,
    result: null,
    milestones: [],
    ending: null,
  };
  // 숨은 잠재력: 사람마다 차이가 커서 60대에서 멈추는 능력도, 99까지 가는 능력도 있다.
  for (const k of STAT_KEYS) {
    c.potential[k] = Math.round(Math.min(99, 58 + c.stats[k] * 0.25 + rng(c) * 32));
  }
  return c;
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
