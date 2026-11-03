import type { ActiveEvent, Career, ChoiceDef, Lineup, StatKey } from "./types.ts";
import { AGENCIES, agencyById, auditionChance, tierRank, type Agency } from "./agencies.ts";
import { overall, STAT_KEYS } from "./stats.ts";
import { ageOf } from "./format.ts";
import { rng } from "./rng.ts";

// ─────────────────────────── 그룹 내 역할 ───────────────────────────

const PART_NAMES: Partial<Record<StatKey, [string, string, string]>> = {
  vocal: ["메인보컬", "리드보컬", "서브보컬"],
  dance: ["메인댄서", "리드댄서", "서브댄서"],
  rap: ["메인래퍼", "리드래퍼", "서브래퍼"],
};

function partOf(stat: StatKey, value: number): string | null {
  const names = PART_NAMES[stat];
  if (names) return value >= 70 ? names[0] : value >= 55 ? names[1] : stat === "rap" && value < 45 ? null : names[2];
  if (stat === "visual") return value >= 65 ? "비주얼" : null;
  if (stat === "producing") return value >= 62 ? "작사 · 작곡" : null;
  return null; // 예능은 파트가 아니라 캐릭터
}

/** 데뷔조 구성과 내 역할. 데뷔 제안을 받을 때 정해진다. */
export function makeLineup(c: Career): Lineup {
  const a = agencyById(c.agencyId);
  const [lo, hi] = a?.tier === "major" ? [4, 7] : a?.tier === "indie" ? [3, 5] : [4, 6];
  const members = lo + Math.floor(rng(c) * (hi - lo + 1));
  const ranked = [...STAT_KEYS].sort((x, y) => c.stats[y] - c.stats[x]);
  const parts: string[] = [];
  for (const k of ranked) {
    const p = partOf(k, c.stats[k]);
    if (p && parts.length < 2) parts.push(p);
  }
  if (!parts.length) parts.push("서브보컬");
  const age = ageOf(c);
  const visualTop = ranked.indexOf("visual") <= 1 && c.stats.visual >= 60;
  const center = visualTop ? rng(c) < 0.75 : rng(c) < 0.12;
  const leader = (c.stats.variety >= 55 && c.trust >= 45 && rng(c) < 0.6) || (age >= 20 && rng(c) < 0.4) || rng(c) < 1 / members / 2;
  const maknae = !leader && age <= 16 && rng(c) < 0.45;
  return { members, leader, center, maknae, parts };
}

export function lineupRoles(l: Lineup): string[] {
  return [l.leader ? "리더" : null, l.center ? "센터" : null, l.maknae ? "막내" : null, ...l.parts].filter((x): x is string => !!x);
}

export const lineupText = (l: Lineup) => `${l.members}인조 · ${lineupRoles(l).join(" · ")}`;

// ─────────────────────────── 데뷔 시점 ───────────────────────────

/** 시즌 단위 대기 기간. null은 회사도 모르는 미정. */
export type Eta = number | null;

export function etaLabel(eta: Eta): string {
  if (eta === null) return "데뷔 일정 미정";
  if (eta <= 1) return "바로 데뷔 가능";
  return `최소 ${Math.round(eta / 2)}년 뒤 데뷔`;
}

export function etaSentence(eta: Eta): string {
  if (eta === null) return "다음 데뷔 일정은 아직 정해지지 않았어요";
  if (eta <= 1) return "곧 데뷔할 수 있어요";
  return `다음 데뷔까지 최소 ${Math.round(eta / 2)}년은 기다려야 해요`;
}

/** 실력이 회사 기준보다 높을수록 빨리 데뷔시켜준다. 큰 회사일수록 대기열이 길다. */
export function etaFor(c: Career, a: Agency): Eta {
  if (rng(c) < 0.15) return null;
  const gap = overall(c.stats, c.position) - a.threshold;
  const base = gap >= 3 ? 1 : gap >= -3 ? 2 : gap >= -10 ? 4 : 6;
  return Math.min(6, base + (a.tier === "major" && base < 6 && rng(c) < 0.4 ? 2 : 0));
}

/** op 인코딩용: 미정은 "u". */
export const encodeEta = (eta: Eta) => (eta === null ? "u" : String(eta));
export const decodeEta = (s: string | undefined): Eta | undefined => (s === undefined || s === "" ? undefined : s === "u" ? null : Number(s));

/** 약속한 대기 기간을 실제 데뷔 가능 시점으로 바꾼다. 미정은 2~4년 사이 어딘가. */
export function setDebutEta(c: Career, eta: Eta) {
  const turns = eta === null ? 4 + Math.floor(rng(c) * 5) : eta;
  c.flags.debutEta = c.turn + turns;
}

/** 데뷔 기준을 넘겨도 데뷔조에서 밀릴 확률. 큰 회사일수록, 이미 밀린 적이 있으면 덜하다. */
export function cutChance(c: Career): number {
  const a = agencyById(c.agencyId);
  if (!a || c.flags.promisedDebut) return 0;
  const base = a.tier === "major" ? 0.3 : a.tier === "mid" ? 0.2 : 0.12;
  return base * Math.pow(0.6, c.flags.cutCount ?? 0);
}

// ─────────────────────────── 이벤트 ───────────────────────────

/** 다른 회사가 보내는 연습생 오퍼. 지금 회사보다 크면 무대가, 작으면 데뷔 시점이 매력이다. */
export function rivalOffers(c: Career, max: number): ChoiceDef[] {
  const mine = agencyById(c.agencyId);
  const pool = AGENCIES.filter((a) => a.id !== c.agencyId && a.tier !== "global" && rng(c) < Math.max(0.08, auditionChance(c, a.id) * 0.6));
  const picked = pool.sort(() => rng(c) - 0.5).slice(0, max);
  return picked.map((a) => {
    const eta = etaFor(c, a);
    const bigger = mine ? tierRank(a.tier) > tierRank(mine.tier) : false;
    return {
      id: `move-${a.id}`,
      label: `${a.name}로 옮긴다 · ${etaLabel(eta)}`,
      hint: bigger ? "더 큰 무대와 빠른 성장. 신뢰는 처음부터 쌓아요" : `${a.strength}. 데뷔를 약속받고 옮겨요`,
      risk: "bold" as const,
      op: `scout:${a.id}:${encodeEta(eta)}`,
      sign: true,
    };
  });
}

/** 데뷔 기준은 넘었지만 데뷔조 명단에서 빠졌다. 지금 회사의 데뷔 시점과 타사 오퍼를 함께 보여준다. */
export function debutCutEvent(c: Career): ActiveEvent {
  const mine = agencyById(c.agencyId)!;
  const roll = rng(c);
  const eta: Eta = roll < 0.35 ? 2 : roll < 0.65 ? 4 : roll < 0.8 ? 6 : null;
  c.flags.cutCount = (c.flags.cutCount ?? 0) + 1;
  c.flags.cutEta = eta === null ? -1 : eta;
  const offers = rivalOffers(c, 2);
  const reasons = ["회사가 다른 연습생 위주로 팀을 꾸렸어요.", "콘셉트가 바뀌면서 멤버 구성이 다시 짜였어요.", "데뷔 일정 자체가 회사 사정으로 미뤄졌어요.", "최종 회의에서 한 자리가 다른 멤버에게 갔어요."];
  const reason = reasons[Math.floor(rng(c) * reasons.length)];
  return {
    id: "debut-cut",
    title: (c.flags.cutCount ?? 1) > 1 ? "또 데뷔조에 들지 못했어요" : "데뷔조에 들지 못했어요",
    text: `평가 기준은 넘었지만 최종 명단에 내 이름이 없었어요. ${reason} ${mine.name}에서는 ${etaSentence(eta)}.${offers.length ? ` 소식을 들은 다른 회사 ${offers.length}곳에서 연락이 왔어요.` : ""}`,
    scene: "dorm",
    choices: [
      { id: "wait", label: `${mine.name}에 남아 기다린다`, hint: `${etaLabel(eta)}. 회사의 신뢰가 오르지만 마음이 지쳐요`, risk: "safe", effects: { trust: 8, mental: -8 }, op: "debut:cut" },
      ...offers,
      { id: "leave", label: "계약을 정리하고 다른 회사를 찾는다", hint: "무소속이 돼요. 홈에서 바로 다른 회사에 지원할 수 있어요", risk: "bold", op: "trainee:leave" },
    ],
  };
}

/** 연습생에게 오는 타사 오퍼. */
export function rivalOfferEvent(c: Career): ActiveEvent | null {
  const offers = rivalOffers(c, 2);
  if (!offers.length) return null;
  const names = offers.map((o) => agencyById(o.op!.split(":")[1])!.name);
  return {
    id: "scout",
    title: `${names.join(" · ")} 이적 제의`,
    text: `${names.join("와 ")} 캐스팅 디렉터가 조용히 연락해왔어요. 오디션 없이 바로 연습생으로 받겠대요. 지금 회사와는 합의 종료가 가능해요.`,
    scene: "audition",
    choices: [...offers, { id: "stay", label: "지금 회사에 남는다", hint: "의리를 지켜 신뢰가 크게 올라요", risk: "safe", effects: { trust: 12, mental: 4 } }],
  };
}
