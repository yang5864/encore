import type { ActiveEvent, Career, GameEventDef } from "./types.ts";
import { EVENTS, eventById } from "./events/index.ts";
import { AGENCIES, agencyById, auditionChance, tierRank } from "./agencies.ts";
import { ageOf, isSecondHalf } from "./format.ts";
import { renewalEvent } from "./renewal.ts";
import { cutChance, debutCutEvent, lineupText, makeLineup, rivalOfferEvent } from "./debut.ts";
import { overall } from "./stats.ts";
import { rng } from "./rng.ts";

export const SCOUT_CHANCE = 0.06;
export const MIRACLE_CHANCE = 0.02;
export const STORY_CHANCE = 0.7;
export const REPEAT_GAP = 4;

export function activate(def: GameEventDef): ActiveEvent {
  return { id: def.id, title: def.title, text: def.text, scene: def.scene, public: def.public, choices: structuredClone(def.choices) };
}

function stageMatches(def: GameEventDef, c: Career) {
  return def.stage === "any" || def.stage === c.stage;
}

function eligible(def: GameEventDef, c: Career): boolean {
  if (!stageMatches(def, c)) return false;
  const seenAt = c.seen[def.id];
  if (seenAt !== undefined && (!def.repeatable || c.turn - seenAt < REPEAT_GAP)) return false;
  return def.when ? def.when(c) : true;
}

function take(c: Career, id: string): ActiveEvent {
  const def = eventById(id)!;
  c.seen[id] = c.turn;
  return activate(def);
}

export function debutEvaluation(c: Career): "offer" | "cut" | "miss" | "warn" | "feedback" | null {
  if (c.stage !== "trainee" || c.agencyJoinedTurn === null) return null;
  const since = c.turn - c.agencyJoinedTurn;
  const a = agencyById(c.agencyId)!;
  const ovr = overall(c.stats, c.position);
  // 약속받은 데뷔 시점이 있으면 그때부터 매 시즌 평가한다
  if (c.flags.debutEta !== undefined) {
    if (c.turn < c.flags.debutEta || (c.flags.debutDeferredUntil ?? 0) > c.turn) return null;
    if (ovr >= a.threshold - (c.flags.promisedDebut ? 3 : 0) && c.trust >= 20) return rng(c) < cutChance(c) ? "cut" : "offer";
    return since % 2 === 0 ? (ovr >= a.threshold - 8 ? "miss" : "feedback") : null;
  }
  if (since < 2 || since % 2 !== 0) return null;
  if ((c.flags.debutDeferredUntil ?? 0) > c.turn) return null;
  if (ovr >= a.threshold && c.trust >= 30) return rng(c) < cutChance(c) ? "cut" : "offer";
  if (ovr >= a.threshold - 8 && rng(c) < 0.4) return "miss";
  if (ovr < a.threshold - 15 && since >= 4) return "warn";
  return "feedback";
}

/** Picks at most one event for the new period, by spec priority. Mutates `seen`. */
export function scheduleEvent(c: Career): ActiveEvent | null {
  if (c.stage === "retired") return null;

  // 1. 예약
  if (c.stage === "trainee" && c.traineeContractEnd !== null && c.turn >= c.traineeContractEnd) return take(c, "trainee-contract");
  if (c.schoolId === null && ageOf(c) === 16 && c.turn % 2 === 0) return take(c, "school");
  if (c.stage === "free" && ageOf(c) === 19 && isSecondHalf(c)) return lastCallEvent(c);
  if (c.stage === "idol" && c.flags.bankruptTurn === c.turn) return renewalEvent(c, "bankrupt");
  if (c.stage === "idol" && c.contractEnd !== null && c.turn >= c.contractEnd) {
    c.seen.contract7 = c.turn;
    return renewalEvent(c, "contract");
  }
  if (c.flags.burst === c.turn) {
    const offer = burstCastingEvent(c);
    if (offer) return offer;
  }
  if (c.stage === "idol" && eligible(eventById("military")!, c)) return take(c, "military");
  if (c.stage === "trainee" && c.warnings >= 2) return take(c, "trainee-dismiss");
  if (c.flags.debutEval === c.turn) {
    const kind = c.flags.debutEvalKind;
    if (kind === 1) {
      const lineup = makeLineup(c);
      c.lineup = lineup;
      const e = take(c, "debut-offer");
      e.text = `${e.text} 데뷔조 구성: ${lineupText(lineup)}.`;
      return e;
    }
    if (kind === 4) return debutCutEvent(c);
    if (kind === 2) return take(c, "debut-miss");
    if (kind === 3) return take(c, "warning");
  }

  if (c.stage === "trainee" && c.agencyJoinedTurn !== null && c.turn - c.agencyJoinedTurn >= 4) {
    const a = agencyById(c.agencyId)!;
    if (a.tier === "indie" && overall(c.stats, c.position) < a.threshold - 10 && rng(c) < 0.06) return agencyClosedEvent(a.name);
  }

  // 2. 상태
  for (const id of ["showcase", "musicshow", "live-controversy", "chartfraud", "hiatus-health", "injury"]) {
    const def = eventById(id)!;
    if (eligible(def, c) && (id !== "injury" || rng(c) < 0.35)) return take(c, id);
  }

  // 3. 숨은 이벤트 · 스카우트
  for (const id of ["awaken", "rechart"]) {
    const def = eventById(id)!;
    if (eligible(def, c) && rng(c) < MIRACLE_CHANCE) return take(c, id);
  }
  if (c.stage === "trainee" && c.scoutCount < 3 && c.hiatusUntil <= c.turn && rng(c) < SCOUT_CHANCE + Math.max(0, overall(c.stats, c.position) - 50) / 400) {
    const offer = rivalOfferEvent(c);
    if (offer) {
      c.seen.scout = c.turn;
      return offer;
    }
  }

  // 4. 이야기
  if (rng(c) >= STORY_CHANCE) return null;
  const pool = EVENTS.filter((e) => e.kind === "story" && eligible(e, c));
  if (!pool.length) return null;
  const total = pool.reduce((s, e) => s + (e.weight ?? 1), 0);
  let r = rng(c) * total;
  for (const e of pool) {
    r -= e.weight ?? 1;
    if (r <= 0) return take(c, e.id);
  }
  return take(c, pool[pool.length - 1].id);
}

/** 19세 하반기: 성인이 되기 전 마지막 기회. 받아주는 회사 중 하나와 반드시 계약한다. */
function lastCallEvent(c: Career): ActiveEvent {
  const ranked = AGENCIES.map((a) => ({ a, p: auditionChance(c, a.id) })).sort((x, y) => tierRank(y.a.tier) - tierRank(x.a.tier) || y.p - x.p);
  const willing = ranked.filter((x) => x.p >= 0.35).slice(0, 3);
  for (const x of [...ranked].reverse()) {
    if (willing.length >= 3) break;
    if (!willing.includes(x)) willing.push(x);
  }
  c.seen["last-call"] = c.turn;
  return {
    id: "last-call",
    title: "성인이 되기 전 마지막 기회",
    text: "곧 스무 살이에요. 지금까지 본 오디션 영상을 기억한 회사들이 연락해왔어요. 이번엔 한 곳을 골라 계약해요.",
    scene: "contract",
    choices: willing.map(({ a }) => ({ id: `join-${a.id}`, label: `${a.name}와 계약한다`, hint: `${a.strength} · 데뷔 기준 OVR ${a.threshold}`, risk: a.tier === "indie" ? "safe" as const : "bold" as const, op: `join:${a.id}`, sign: true })),
  };
}

/** 포텐이 터지면 대형 기획사가 먼저 캐스팅 제의를 한다. 이미 대형이면 없다. */
function burstCastingEvent(c: Career): ActiveEvent | null {
  const mine = agencyById(c.agencyId);
  if (mine?.tier === "major") return null;
  const majors = AGENCIES.filter((a) => a.tier === "major");
  const first = majors[Math.floor(rng(c) * majors.length)];
  const rest = majors.filter((a) => a.id !== first.id);
  const picks = rng(c) < 0.4 ? [first, rest[Math.floor(rng(c) * rest.length)]] : [first];
  c.seen.burst = c.turn;
  return {
    id: "burst-cast",
    title: picks.length > 1 ? `${picks.map((a) => a.name).join(" · ")} 동시 캐스팅 제의` : `${first.name} 캐스팅 제의`,
    text: `포텐이 터진 걸 알아본 ${picks.map((a) => a.fullName).join("와 ")} 캐스팅 디렉터가 먼저 연락해왔어요. 오디션 없이 바로 연습생으로 받겠대요.${mine ? " 지금 회사와는 합의 종료가 가능해요." : ""}`,
    scene: "audition",
    choices: [
      ...picks.map((a) => ({ id: `cast-${a.id}`, label: `${a.name}와 계약한다`, hint: "더 큰 무대와 빠른 성장. 데뷔 기준도 높아요", risk: "bold" as const, op: `scout:${a.id}`, sign: true })),
      mine
        ? { id: "stay", label: "지금 회사에 남는다", hint: "의리를 지켜 신뢰가 크게 올라요", risk: "safe" as const, effects: { trust: 12, mental: 4 } }
        : { id: "decline", label: "거절한다", hint: "무소속으로 남아 다른 길을 찾아요", risk: "safe" as const, op: "decline" },
    ],
  };
}

function agencyClosedEvent(name: string): ActiveEvent {
  return {
    id: "agency-closed",
    title: `${name} 폐업 통보`,
    text: "회사 사정이 어려워져 연습생 운영을 접는대요. 데뷔 계획도 모두 멈췄어요.",
    scene: "contract",
    choices: [{ id: "leave", label: "짐을 정리하고 나온다", hint: "무소속이 돼요. 바로 다른 회사에 지원할 수 있어요", risk: "safe", op: "agency-closed" }],
  };
}
