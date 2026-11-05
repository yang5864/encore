import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, resolveChoice, retireCareer, focusOptions, applyToAgency } from "../lib/game/engine.ts";
import { DEFAULT_ALLOCATION, overall } from "../lib/game/stats.ts";
import { EVENTS } from "../lib/game/events/index.ts";
import type { Career } from "../lib/game/types.ts";
import { conditionOf } from "../lib/game/format.ts";

const base = { name: "하린", gender: "female" as const, avatar: 0, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };

function trainee(seed = 3): Career {
  const c = createCareer(base, seed);
  c.stage = "trainee";
  c.agencyId = "starship";
  c.agencyJoinedTurn = 0;
  c.traineeContractEnd = 6;
  c.trust = 40;
  return c;
}

function idol(seed = 5): Career {
  const c = trainee(seed);
  c.stage = "idol";
  c.turn = 8;
  c.debutTurn = 6;
  c.contractEnd = 20;
  c.groupName = "LUMINA";
  c.fans = 120000;
  c.popularity = 50;
  c.schoolId = "general";
  c.lastReleaseTurn = 7;
  c.albums.push({ id: "a0", turn: 7, name: "FIRST LIGHT", concept: "fresh", quality: 60, sales: 40000, melon: 40, billboard: null, wins: 0, cost: 15, revenue: 13 });
  return c;
}

/** Advance until no event is pending. 스카우트 제의는 거절해 소속을 유지한다. */
function settle(c: Career): Career {
  while (c.pending) {
    const stay = c.pending.choices.find((x) => x.id === "stay");
    c = resolveChoice(c, (stay ?? c.pending.choices[0]).id, { groupName: "LUMINA" });
  }
  return c;
}

test("반기 진행은 원본을 바꾸지 않고 같은 시드는 같은 결과", () => {
  const a = trainee(11);
  const copy = structuredClone(a);
  const n1 = advanceTurn(a, "train:vocal");
  const n2 = advanceTurn(a, "train:vocal");
  assert.deepEqual(a, copy);
  assert.deepEqual(n1, n2);
  assert.equal(n1.turn, 1);
  assert.ok(n1.result);
  assert.ok(n1.stats.vocal > a.stats.vocal);
});

test("은퇴한 커리어는 진행할 수 없다", () => {
  const r = retireCareer(trainee());
  assert.equal(r.stage, "retired");
  assert.ok(r.ending);
  assert.throws(() => advanceTurn(r, "train:all"), /완성된/);
});

test("선택이 남아 있으면 진행할 수 없다", () => {
  let c = trainee();
  for (let i = 0; i < 12 && !c.pending; i++) c = advanceTurn(c, "train:vocal");
  assert.ok(c.pending, "이벤트가 한 번은 나와야 한다");
  assert.throws(() => advanceTurn(c, "train:vocal"), /선택을 마쳐/);
});

test("무소속 성장은 연습생보다 느리다", () => {
  const free = createCareer(base, 9);
  const t = trainee(9);
  const f1 = advanceTurn(free, "train:vocal");
  const t1 = advanceTurn(t, "train:vocal");
  assert.ok(f1.stats.vocal - free.stats.vocal < t1.stats.vocal - t.stats.vocal);
});

test("예약 이벤트가 있는 턴에는 이야기 이벤트가 나오지 않는다 (연습생 계약 만료)", () => {
  const c = trainee(21);
  c.turn = 5;
  c.schoolId = "general";
  const n = advanceTurn(c, "train:all");
  assert.equal(n.pending?.id, "trainee-contract");
});

test("중3 하반기(16살)에 고교 진학 선택이 온다", () => {
  const c = trainee(4);
  c.turn = 4;
  c.traineeContractEnd = 12;
  const n = advanceTurn(c, "train:all");
  assert.equal(n.pending?.id, "school");
  const after = resolveChoice(n, "general");
  assert.equal(after.schoolId, "general");
});

test("이야기 이벤트는 커리어당 한 번, repeatable만 4턴 뒤 재등장", () => {
  let c = trainee(13);
  c.schoolId = "general";
  const seenTurns: Record<string, number[]> = {};
  for (let i = 0; i < 40 && c.stage !== "retired"; i++) {
    c = advanceTurn(c, conditionOf(c).level === "danger" ? "rest" : c.stage === "idol" ? (c.lastReleaseTurn === c.turn || i % 2 ? "promo" : "comeback:fresh") : "train:all");
    if (c.pending) {
      const id = c.pending.id;
      (seenTurns[id] ??= []).push(c.turn);
      c = settle(c);
    }
  }
  for (const [id, turns] of Object.entries(seenTurns)) {
    const def = EVENTS.find((e) => e.id === id);
    if (!def || def.kind !== "story") continue;
    if (!def.repeatable) assert.equal(turns.length, 1, `${id} repeated`);
    else for (let i = 1; i < turns.length; i++) assert.ok(turns[i] - turns[i - 1] >= 4, `${id} too soon`);
  }
});

test("데뷔 평가는 소속 후 2턴마다, 기준 OVR을 넘으면 제안", () => {
  const c = trainee(2);
  c.schoolId = "general";
  c.stats = { vocal: 80, dance: 70, rap: 60, visual: 70, variety: 60, producing: 60 };
  assert.ok(overall(c.stats, c.position) >= 56);
  const n1 = advanceTurn(c, "train:vocal");
  assert.notEqual(n1.pending?.id, "debut-offer");
  const n2 = advanceTurn(settle(n1), "train:vocal");
  assert.equal(n2.pending?.id, "debut-offer");
  assert.throws(() => resolveChoice(n2, "accept", { groupName: "" }), /그룹 이름/);
  const debuted = resolveChoice(n2, "accept", { groupName: "LUMINA" });
  assert.equal(debuted.stage, "idol");
  assert.equal(debuted.pending?.id, "debut-concept");
  assert.ok(debuted.milestones.includes("debut"));
  const planned = resolveChoice(debuted, "fresh");
  assert.equal(planned.albums.length, 0, "콘셉트만 정하고 아직 발매하지 않는다");
  assert.equal(planned.pending?.id, "showcase");
  const showcased = resolveChoice(planned, "open");
  assert.equal(showcased.pending?.id, "debut-stage");
  const released = resolveChoice(showcased, "dance");
  assert.equal(released.albums.length, 1);
  assert.equal(released.pending, null);
  assert.ok(released.albums[0].wins <= 6);
  assert.ok(released.money.invested > 5, "데뷔 제작비와 앨범 제작비가 억 단위로 쌓인다 (2007년 시대 보정 포함)");
});

test("1년 이상 컴백 공백이면 인기 하락 안내가 붙는다", () => {
  const c = idol();
  c.lastReleaseTurn = 5;
  const n = advanceTurn(c, "promo");
  assert.ok(n.result?.notes.some((t) => t.includes("공백")));
});

test("소속이 생기면 지원 팝업은 뜨지 않고 직접 지원만 가능하다", () => {
  let c = trainee(8);
  c.schoolId = "general";
  for (let i = 0; i < 10; i++) {
    c = advanceTurn(c, "train:all");
    assert.notEqual(c.pending?.id, "quarter-agency");
    c = settle(c);
    if (c.stage !== "trainee") break;
  }
  const t = trainee(8);
  const applied = applyToAgency(t, "jyp");
  assert.ok(applied.result?.headline.includes("JYP"));
  if (applied.pending?.id === "trainee-offer") assert.equal(applied.agencyId, "starship", "서명 전에는 기존 소속 유지");
  assert.throws(() => applyToAgency(idol(), "jyp"), /전속계약/);
});

test("패시브 평판은 턴마다 오른다", () => {
  const c = trainee(6);
  const n = advanceTurn(c, "train:all");
  assert.ok(n.reputation >= c.reputation + 1);
});

test("아이돌 7년 계약 만료에 재계약 이벤트가 온다", () => {
  const c = idol();
  c.turn = 19;
  c.lastReleaseTurn = 19;
  c.popularity = 85;
  c.stats = { vocal: 80, dance: 75, rap: 60, visual: 75, variety: 65, producing: 60 };
  const n0 = advanceTurn(c, "promo");
  // 연말이면 시상식 초청이 먼저 오고, 끝내면 재계약 협상이 바로 이어진다
  const n = n0.pending?.id === "awards-invite" ? resolveChoice(n0, "skip") : n0;
  assert.equal(n.pending?.id, "contract7");
  assert.ok(!n.pending.choices.some((x) => x.op === "transfer"), "국내 기획사끼리 이적은 없다");
  const renewed = resolveChoice(n, "renew");
  assert.equal(renewed.contractEnd, 26);
});

test("남성 아이돌은 27세 이후 입대 이벤트, 복무는 한 번에 지나간다", () => {
  const c = idol(3);
  c.gender = "male";
  c.turn = 31;
  c.contractEnd = 40;
  c.lastReleaseTurn = 27;
  const n0 = advanceTurn(c, "promo");
  const n = n0.pending?.id === "awards-invite" ? resolveChoice(n0, "skip") : n0;
  assert.equal(n.pending?.id, "military");
  const enlisted = resolveChoice(n, "army");
  assert.equal(enlisted.militaryUntil, 35);
  const back = advanceTurn(enlisted, "promo");
  assert.equal(back.turn, 35);
  assert.ok(back.result?.headline.includes("전역"));
});

test("focusOptions: 무소속/연습생/아이돌마다 다르고 휴식은 상황에 따라 잠긴다", () => {
  const free = createCareer(base, 1);
  assert.equal(focusOptions(free)[0].label, "학원 수업");
  assert.ok(focusOptions(free).find((o) => o.id === "rest")?.disabledReason);
  const t = trainee();
  t.health = 20;
  assert.equal(focusOptions(t).find((o) => o.id === "rest")?.disabledReason, undefined);
  const i = idol();
  i.popularity = 30;
  assert.ok(focusOptions(i).find((o) => o.id === "overseas")?.disabledReason);
});

test("능력치는 항상 정수다", () => {
  let c = trainee(17);
  c.schoolId = "general";
  for (let i = 0; i < 20 && c.stage !== "retired"; i++) {
    c = advanceTurn(c, conditionOf(c).level === "danger" ? "rest" : c.stage === "idol" ? (c.lastReleaseTurn === c.turn ? "promo" : "comeback:fresh") : "train:vocal");
    c = settle(c);
    for (const v of Object.values(c.stats)) assert.ok(Number.isInteger(v), `${JSON.stringify(c.stats)}`);
  }
});
