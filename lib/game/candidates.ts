import type { Position, StatKey, Stats } from "./types.ts";
import { ALLOCATION_TOTAL, STAT_KEYS, STAT_MAX, STAT_MIN, STAT_NAMES, overall, statWeight } from "./stats.ts";

/** 모든 시작 후보의 OVR */
export const START_OVR = 45;

export type Candidate = {
  id: string;
  stats: Stats;
  position: Position;
  /** 스타일 이름 (예: 파워 보컬) */
  name: string;
  /** 강점 요약 (예: 보컬 · 비주얼 · 고음) */
  summary: string;
  top: [StatKey, StatKey];
};

const ROLE_BY_STAT: Record<StatKey, Position> = { vocal: "vocal", dance: "dance", rap: "rap", visual: "visual", variety: "allround", producing: "producer" };

/** Role = the strongest stat. A flat profile (top-bottom spread under 12) becomes 올라운더. */
export function deriveRole(stats: Stats): Position {
  const sorted = [...STAT_KEYS].sort((a, b) => stats[b] - stats[a]);
  const spread = stats[sorted[0]] - stats[sorted[sorted.length - 1]];
  if (spread < 12) return "allround";
  const top = sorted[0];
  if (top === "variety") return sorted[1] === "visual" ? "visual" : "allround";
  return ROLE_BY_STAT[top];
}

const STYLES: Record<Position, { default: [string, string]; by: Partial<Record<StatKey, [string, string]>> }> = {
  vocal: { default: ["메인보컬", "보컬 · 안정감"], by: { visual: ["파워 보컬", "보컬 · 비주얼 · 고음"], producing: ["감성 보컬", "보컬 · 프로듀싱 · 자작곡"], dance: ["퍼포먼스 보컬", "보컬 · 댄스 · 라이브"], rap: ["보컬 래퍼", "보컬 · 랩 · 파트 소화력"], variety: ["예능 보컬", "보컬 · 예능 · 토크"] } },
  dance: { default: ["메인댄서", "댄스 · 무대 장악력"], by: { visual: ["퍼포먼스 센터", "댄스 · 비주얼 · 킬링파트"], rap: ["댄스 래퍼", "댄스 · 랩 · 힙합 콘셉트"], vocal: ["댄싱 보컬", "댄스 · 보컬 · 올라운드"], producing: ["안무 크리에이터", "댄스 · 프로듀싱 · 자작 안무"], variety: ["챌린지 장인", "댄스 · 예능 · 숏폼"] } },
  rap: { default: ["래퍼", "랩 · 플로우"], by: { vocal: ["싱잉 래퍼", "랩 · 보컬 · 멜로디 랩"], producing: ["힙합 래퍼", "랩 · 프로듀싱 · 자작 가사"], dance: ["퍼포먼스 래퍼", "랩 · 댄스 · 에너지"], visual: ["스타일 래퍼", "랩 · 비주얼 · 무드"], variety: ["입담 래퍼", "랩 · 예능 · 애드리브"] } },
  visual: { default: ["비주얼 센터", "비주얼 · 카메라"], by: { dance: ["퍼포먼스 비주얼", "비주얼 · 댄스 · 센터"], vocal: ["보컬 비주얼", "비주얼 · 보컬 · 균형"], variety: ["예능 비주얼", "비주얼 · 예능 · 방송 적응력"], rap: ["비주얼 래퍼", "비주얼 · 랩 · 콘셉트"], producing: ["아트 디렉터", "비주얼 · 프로듀싱 · 콘셉트 기획"] } },
  allround: { default: ["올라운더", "고른 능력 · 어떤 콘셉트든"], by: { variety: ["예능 올라운더", "예능 · 고른 능력 · 방송"], vocal: ["보컬 올라운더", "보컬 · 고른 능력"], dance: ["댄스 올라운더", "댄스 · 고른 능력"], visual: ["비주얼 올라운더", "비주얼 · 고른 능력"], rap: ["랩 올라운더", "랩 · 고른 능력"], producing: ["크리에이티브 올라운더", "프로듀싱 · 고른 능력"] } },
  producer: { default: ["프로듀서돌", "프로듀싱 · 작곡"], by: { vocal: ["싱어송라이터", "프로듀싱 · 보컬 · 자작곡"], rap: ["비트메이커", "프로듀싱 · 랩 · 트랙"], dance: ["퍼포먼스 프로듀서", "프로듀싱 · 댄스 · 무대 연출"], visual: ["콘셉트 디렉터", "프로듀싱 · 비주얼 · 앨범 기획"], variety: ["콘텐츠 프로듀서", "프로듀싱 · 예능 · 자체 콘텐츠"] } },
};

export function describeCandidate(stats: Stats): { position: Position; name: string; summary: string; top: [StatKey, StatKey] } {
  const position = deriveRole(stats);
  const sorted = [...STAT_KEYS].sort((a, b) => stats[b] - stats[a]);
  const top: [StatKey, StatKey] = [sorted[0], sorted[1]];
  const style = STYLES[position];
  const second = position === "allround" ? sorted[0] : sorted[1];
  const [name, summary] = style.by[second] ?? style.default;
  return { position, name, summary, top };
}

function clampStats(raw: Record<StatKey, number>): Stats {
  const stats = { ...raw } as Stats;
  for (const k of STAT_KEYS) stats[k] = Math.round(Math.max(STAT_MIN, Math.min(STAT_MAX, stats[k])));
  // Rebalance to exactly 240 by nudging the stat with the most room, one point at a time.
  let total = STAT_KEYS.reduce((s, k) => s + stats[k], 0);
  let guard = 0;
  while (total !== ALLOCATION_TOTAL && guard++ < 400) {
    const dir = total < ALLOCATION_TOTAL ? 1 : -1;
    const pool = STAT_KEYS.filter((k) => (dir > 0 ? stats[k] < STAT_MAX : stats[k] > STAT_MIN));
    const k = pool[Math.floor(Math.random() * pool.length)];
    stats[k] += dir;
    total += dir;
  }
  return stats;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * 총합 240을 지키면서 OVR이 정확히 START_OVR이 되도록 점수를 옮긴다.
 * 가중치가 높은 능력에서 낮은 능력으로 1점씩 옮기면 OVR이 내려가고, 반대로 올라간다. 역할이 바뀌는 이동은 되돌린다.
 */
function normalizeOvr(stats: Stats): Stats | null {
  const s = { ...stats };
  for (let guard = 0; guard < 300; guard++) {
    const pos = deriveRole(s);
    const o = overall(s, pos);
    if (o === START_OVR) return s;
    const byWeight = [...STAT_KEYS].sort((a, b) => statWeight(pos, b) - statWeight(pos, a));
    const givers = o > START_OVR ? byWeight : [...byWeight].reverse(); // 무거운 쪽에서 빼면 OVR 하락
    const takers = o > START_OVR ? [...byWeight].reverse() : byWeight;
    let moved = false;
    for (const from of givers) {
      if (s[from] <= STAT_MIN) continue;
      for (const to of takers) {
        if (to === from || s[to] >= STAT_MAX) continue;
        s[from] -= 1;
        s[to] += 1;
        if (deriveRole(s) === pos) { moved = true; break; }
        s[from] += 1;
        s[to] -= 1;
      }
      if (moved) break;
    }
    if (!moved) return null;
  }
  return null;
}

/** One random profile: a main stat, a secondary, and noise elsewhere. Sum is always 240. */
export function randomCandidate(): Candidate {
  for (let i = 0; i < 20; i++) {
    const c = tryCandidate();
    if (c) return c;
  }
  throw new Error("후보를 만들지 못했어요");
}

function tryCandidate(): Candidate | null {
  const main = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
  const others = STAT_KEYS.filter((k) => k !== main);
  const second = others[Math.floor(Math.random() * others.length)];
  const flat = Math.random() < 0.15;
  const raw = {} as Record<StatKey, number>;
  for (const k of STAT_KEYS) {
    raw[k] = flat ? rand(36, 44) : k === main ? rand(50, 60) : k === second ? rand(42, 52) : rand(22, 44);
  }
  const stats = normalizeOvr(clampStats(raw));
  if (!stats) return null;
  const meta = describeCandidate(stats);
  return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, stats, ...meta };
}

export function generateCandidates(n = 3): Candidate[] {
  const out: Candidate[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 50) {
    const c = randomCandidate();
    if (out.some((x) => x.position === c.position && x.name === c.name)) continue;
    out.push(c);
  }
  return out;
}

export const statLabel = (k: StatKey) => STAT_NAMES[k];
