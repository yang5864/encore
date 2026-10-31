import type { ActiveEvent, Career, GameEventDef } from "./types.ts";
import { EVENTS, eventById } from "./events/index.ts";
import { AGENCIES, agencyById, tierRank } from "./agencies.ts";
import { ageOf } from "./format.ts";
import { overall } from "./stats.ts";
import { rng } from "./rng.ts";

export const SCOUT_CHANCE = 0.04;
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

export function debutEvaluation(c: Career): "offer" | "miss" | "warn" | "feedback" | null {
  if (c.stage !== "trainee" || c.agencyJoinedTurn === null) return null;
  const since = c.turn - c.agencyJoinedTurn;
  if (since < 2 || since % 2 !== 0) return null;
  if ((c.flags.debutDeferredUntil ?? 0) > c.turn) return null;
  const a = agencyById(c.agencyId)!;
  const ovr = overall(c.stats, c.position);
  if (ovr >= a.threshold && c.trust >= 30) return "offer";
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
  if (c.stage === "idol" && c.contractEnd !== null && c.turn >= c.contractEnd) return take(c, "contract7");
  if (c.stage === "idol" && eligible(eventById("military")!, c)) return take(c, "military");
  if (c.stage === "trainee" && c.warnings >= 2) return take(c, "trainee-dismiss");
  if (c.flags.debutEval === c.turn) {
    const kind = c.flags.debutEvalKind;
    if (kind === 1) return take(c, "debut-offer");
    if (kind === 2) return take(c, "debut-miss");
    if (kind === 3) return take(c, "warning");
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
  if (c.stage === "trainee" && c.scoutCount < 2 && c.hiatusUntil <= c.turn && rng(c) < SCOUT_CHANCE) {
    const mine = agencyById(c.agencyId)!;
    const candidates = AGENCIES.filter((a) => tierRank(a.tier) > tierRank(mine.tier));
    if (candidates.length) {
      const a = candidates[Math.floor(rng(c) * candidates.length)];
      const def = eventById("scout")!;
      c.seen.scout = c.turn;
      return {
        id: "scout",
        title: `${a.name} 스카우트 제의`,
        text: `${a.fullName} 캐스팅 디렉터가 조용히 연락해왔어요. 지금 회사보다 큰 곳이에요. 오디션 없이 바로 연습생으로 받겠대요. 지금 회사와는 합의 종료가 가능해요.`,
        scene: def.scene,
        choices: [
          { id: "move", label: `${a.name}로 옮긴다`, hint: "더 큰 무대와 빠른 성장. 신뢰는 처음부터 다시 쌓아요", risk: "bold", op: `scout:${a.id}` },
          { id: "stay", label: "지금 회사에 남는다", hint: "의리를 지켜 신뢰가 크게 올라요", risk: "safe", effects: { trust: 12, mental: 4 } },
        ],
      };
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
