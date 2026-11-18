import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, applyToAgency, resolveChoice } from "../lib/game/engine.ts";
import { DEFAULT_ALLOCATION, STAT_KEYS, overall } from "../lib/game/stats.ts";
import { AGING_START_AGE, agingLoss, applyAging, gainStat, skillFactor } from "../lib/game/aging.ts";
import { ARTS_MAJORS, ARTS_PASS, artsMajorOf, artsNeeded, artsTotal } from "../lib/game/school.ts";
import { defaultTrainPicks, focusOptions, trainPicks } from "../lib/game/focus.ts";
import { START_AGE } from "../lib/game/format.ts";
import type { Career } from "../lib/game/types.ts";

const base = { name: "하린", gender: "female" as const, avatar: 7, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };
const settle = (c: Career): Career => ({ ...c, pending: null, result: null });
function trainee(seed = 3): Career {
  const c = createCareer(base, seed);
  Object.assign(c, { stage: "trainee", agencyId: "starship", agencyJoinedTurn: 0, traineeContractEnd: 6, trust: 40, schoolId: "general" });
  return c;
}

test("집중 훈련: 고른 능력(1~3개)만 오르고, 고르지 않은 능력은 오르지 않는다", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const c = trainee(seed);
    const n = advanceTurn(c, "train:vocal+dance");
    assert.ok(n.stats.vocal > c.stats.vocal && n.stats.dance > c.stats.dance, `seed ${seed}`);
    for (const k of ["rap", "visual", "variety", "producing"] as const) assert.ok(n.stats[k] <= c.stats[k], `${k}는 오르지 않는다`);
  }
  // 한 능력에 몰면 더 빨리 자란다
  let one = 0, three = 0;
  for (let seed = 1; seed <= 60; seed++) {
    one += advanceTurn(trainee(seed), "train:vocal").stats.vocal;
    three += advanceTurn(trainee(seed), "train:vocal+dance+rap").stats.vocal;
  }
  assert.ok(one > three, "1개 집중이 3개 분산보다 그 능력을 빨리 올린다");
  assert.throws(() => advanceTurn(trainee(), "train:vocal+dance+rap+visual"), /1~3개/);
  assert.throws(() => advanceTurn(trainee(), "train:charm"), /1~3개/);
  assert.deepEqual(trainPicks("vocal", "all"), defaultTrainPicks("vocal"), "옛 올라운드 훈련은 포지션 기본 3개로 읽는다");
  assert.equal(defaultTrainPicks("vocal")[0], "vocal");
  assert.ok(!focusOptions(trainee()).some((o) => o.id === "train:all"), "올라운드 훈련 선택지는 없다");
});

test("성장은 잠재력 상한에서 멈춘다", () => {
  const c = trainee(4);
  c.potential.vocal = 70; c.stats.vocal = 69;
  gainStat(c, "vocal", 5);
  assert.equal(c.stats.vocal, 70);
  let n = c;
  for (let i = 0; i < 6; i++) n = settle(advanceTurn(n, "train:vocal"));
  assert.ok(n.stats.vocal <= Math.max(70, n.potential.vocal), `${n.stats.vocal} / ${n.potential.vocal}`);
});

test("29살(만 27세)부터 능력이 떨어지고 그 폭이 시즌마다 커진다", () => {
  assert.equal(agingLoss(-1, "dance"), 0);
  for (let n = 1; n < 12; n++) assert.ok(agingLoss(n, "dance") > agingLoss(n - 1, "dance") * 1.2, "지수로 가속");
  assert.ok(agingLoss(5, "dance") > agingLoss(5, "vocal") && agingLoss(5, "vocal") > agingLoss(5, "producing"), "몸을 쓰는 능력이 먼저 꺾인다");
  const total = (k: "dance" | "producing") => Array.from({ length: 12 }, (_, n) => agingLoss(n, k)).reduce((s, v) => s + v, 0);
  assert.ok(total("dance") > 30 && total("producing") < 10, `댄스 ${total("dance")} 프로듀싱 ${total("producing")}`);
  // 실제 커리어: 28살까지는 그대로, 34살에는 크게 내려간다
  const young = trainee(5); young.turn = (AGING_START_AGE - START_AGE) * 2 - 2; young.stats = { vocal: 90, dance: 90, rap: 90, visual: 90, variety: 90, producing: 90 };
  const y = structuredClone(young); applyAging(y);
  assert.deepEqual(y.stats, young.stats, "29살 전에는 노화가 없다");
  let sum = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const c = trainee(seed); c.stats = { vocal: 90, dance: 90, rap: 90, visual: 90, variety: 90, producing: 90 };
    for (let t = (AGING_START_AGE - START_AGE) * 2; t <= 41; t++) { c.turn = t; applyAging(c); }
    sum += c.stats.dance;
    assert.ok(c.stats.dance < c.stats.producing, "댄스가 프로듀싱보다 많이 떨어진다");
  }
  assert.ok(sum / 40 < 60, `34살 댄스 평균 ${sum / 40}`);
  assert.equal(skillFactor(70), 1);
  assert.ok(skillFactor(45) < 0.9, "실력이 꺾이면 인기도 식는다");
});

test("예술고는 전공을 골라 실기 오디션에 붙어야 간다", () => {
  const start = createCareer(base, 9);
  start.turn = 4; // 다음 시즌이 16살 하반기
  let c = advanceTurn(start, "train:vocal");
  assert.equal(c.pending?.id, "school");
  c = resolveChoice(c, "arts");
  assert.equal(c.pending?.id, "arts-audition");
  assert.equal(c.schoolId, null, "원서만 낸 상태");
  assert.deepEqual(c.pending!.choices.map((x) => x.id), ARTS_MAJORS.map((m) => m.id));
  const music = ARTS_MAJORS[0];
  const need = artsNeeded(c, music);
  assert.ok(need > 40 && need <= 100, `필요 실기 점수 ${need}`);
  // 실기가 모자라면 불합격 → 일반고/검정고시 중 선택
  const failed = resolveChoice(c, "music", { score: need - 5 });
  assert.equal(failed.schoolId, null);
  assert.equal(failed.pending?.id, "school-fallback");
  assert.ok(failed.result?.headline.includes("불합격"));
  assert.equal(resolveChoice(failed, "general").schoolId, "general");
  // 실기를 잘 보면 합격하고 전공이 남는다
  const passed = resolveChoice(c, "music", { score: need });
  assert.equal(passed.schoolId, "arts");
  assert.equal(artsMajorOf(passed)?.id, "music");
  assert.ok(artsTotal(c, music, need) >= ARTS_PASS);
  assert.equal(passed.pending, null);
});

test("대형 기획사는 OVR 58부터, 대형 포함 시즌에 세 곳까지. 19살 하반기까지 무소속이면 반드시 계약한다", () => {
  const c = createCareer(base, 12);
  assert.throws(() => applyToAgency(c, "hybe"), /OVR 58부터/);
  const good = structuredClone(c);
  good.stats = { vocal: 72, dance: 62, rap: 55, visual: 62, variety: 58, producing: 62 };
  assert.ok(overall(good.stats, good.position) >= 58);
  let a = applyToAgency(good, "hybe");
  if (a.pending) a = resolveChoice(a, "decline");
  // 대형에 떨어져도 같은 시즌에 다른 대형·중견에 계속 지원할 수 있다 (세 곳까지)
  let b = applyToAgency(settle(a), "sm");
  if (b.pending) b = resolveChoice(b, "decline");
  let d = applyToAgency(settle(b), "jyp");
  if (d.pending) d = resolveChoice(d, "decline");
  assert.throws(() => applyToAgency(settle(d), "starship"), /3곳까지/);
  // 무소속으로 버티면 19살 하반기(고3)에 마지막 오디션이 온다. 거절 선택지가 없다
  let free = createCareer(base, 13);
  free.schoolId = "general";
  for (let i = 0; i < 12 && free.pending?.id !== "last-call"; i++) free = advanceTurn(settle(free), "train:vocal");
  assert.equal(free.pending?.id, "last-call");
  assert.equal(free.turn, 11, "19살 하반기");
  assert.ok(free.pending!.choices.every((x) => x.op?.startsWith("join:")));
  for (const k of STAT_KEYS) assert.ok(Number.isInteger(free.stats[k]));
});
