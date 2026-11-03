import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCandidates, deriveRole, describeCandidate, START_OVR } from "../lib/game/candidates.ts";
import { STAT_KEYS, validateAllocation, overall } from "../lib/game/stats.ts";
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn } from "../lib/game/engine.ts";
import { focusOptions, soloChance } from "../lib/game/focus.ts";
import type { Career } from "../lib/game/types.ts";

test("랜덤 후보는 항상 240점, 20~60 범위, 서로 다른 스타일", () => {
  for (let i = 0; i < 30; i++) {
    const list = generateCandidates(3);
    assert.equal(list.length, 3);
    for (const c of list) {
      assert.equal(validateAllocation(c.stats), null, JSON.stringify(c.stats));
      assert.equal(STAT_KEYS.reduce((s, k) => s + c.stats[k], 0), 240);
      assert.ok(c.name && c.summary);
    }
    assert.equal(new Set(list.map((c) => c.name)).size, 3);
  }
});

test("역할은 가장 높은 능력으로 정해지고, 고른 분포는 올라운더", () => {
  assert.equal(deriveRole({ vocal: 58, dance: 40, rap: 30, visual: 44, variety: 34, producing: 34 }), "vocal");
  assert.equal(deriveRole({ vocal: 30, dance: 58, rap: 30, visual: 50, variety: 36, producing: 36 }), "dance");
  assert.equal(deriveRole({ vocal: 40, dance: 41, rap: 39, visual: 40, variety: 40, producing: 40 }), "allround");
  assert.equal(describeCandidate({ vocal: 58, dance: 40, rap: 30, visual: 48, variety: 30, producing: 34 }).name, "파워 보컬");
  assert.equal(describeCandidate({ vocal: 30, dance: 30, rap: 36, visual: 30, variety: 36, producing: 58 }).name, "비트메이커");
});

function idol(stats: Career["stats"], position: Career["position"] = "vocal"): Career {
  const c = createCareer({ name: "테스트", gender: "female", avatar: 0, position, stats: { vocal: 40, dance: 40, rap: 40, visual: 40, variety: 40, producing: 40 } }, 3);
  c.stats = stats;
  c.stage = "idol";
  c.agencyId = "starship";
  c.agencyJoinedTurn = 0;
  c.turn = 14;
  c.debutTurn = 6;
  c.contractEnd = 30;
  c.groupName = "LUMINA";
  c.fans = 200000;
  c.popularity = 55;
  c.schoolId = "general";
  c.lastReleaseTurn = 14;
  c.milestones = ["debut", "firstSettlement"];
  c.money.firstSettledTurn = 8;
  return c;
}

test("개인 활동은 데뷔 3년 뒤에 열리고 성공은 주력 수치에 달려 있다", () => {
  const early = idol({ vocal: 70, dance: 50, rap: 40, visual: 50, variety: 30, producing: 40 });
  early.turn = 8;
  assert.ok(!focusOptions(early).some((o) => o.id.startsWith("solo:")));
  const c = idol({ vocal: 70, dance: 50, rap: 40, visual: 50, variety: 25, producing: 40 });
  const solo = focusOptions(c).filter((o) => o.group === "solo");
  assert.equal(solo.length, 4);
  assert.equal(solo.find((o) => o.id === "solo:variety")?.readiness?.tone, "danger");
  assert.ok(soloChance(c, "variety") < 0.3);
  assert.ok(soloChance(c, "solo") > 0.6);

  let wins = 0, losses = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const strong = idol({ vocal: 70, dance: 50, rap: 40, visual: 50, variety: 85, producing: 40 });
    strong.seed = seed; strong.rngState = seed;
    const weak = idol({ vocal: 70, dance: 50, rap: 40, visual: 50, variety: 25, producing: 40 });
    weak.seed = seed; weak.rngState = seed;
    if (advanceTurn(strong, "solo:variety").result?.tone === "good") wins++;
    if (advanceTurn(weak, "solo:variety").result?.tone === "bad") losses++;
  }
  assert.ok(wins >= 30, `strong wins ${wins}`);
  assert.ok(losses >= 28, `weak losses ${losses}`);
});

test("시작 후보는 모두 OVR 45로 통일된다", () => {
  for (let i = 0; i < 200; i++) {
    for (const c of generateCandidates()) {
      assert.equal(overall(c.stats, c.position), START_OVR, JSON.stringify(c.stats));
      assert.equal(STAT_KEYS.reduce((s, k) => s + c.stats[k], 0), 240);
    }
  }
});
