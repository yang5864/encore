import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { auditionChance, chanceLabel, AGENCIES } from "../lib/game/agencies.ts";
import { DEFAULT_ALLOCATION, overall, validateAllocation, STAT_KEYS } from "../lib/game/stats.ts";
import { fanText, wonText, reputationLabel, reputationProgress, conditionOf, ageOf, periodLabel } from "../lib/game/format.ts";
import { applyToAgency } from "../lib/game/engine.ts";

const base = { name: "하린", gender: "female" as const, avatar: 0, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };

test("기본 배분은 모두 240점이고 20~60 범위", () => {
  for (const stats of Object.values(DEFAULT_ALLOCATION)) {
    assert.equal(validateAllocation(stats), null);
    assert.equal(STAT_KEYS.reduce((s, k) => s + stats[k], 0), 240);
  }
  assert.ok(validateAllocation({ ...DEFAULT_ALLOCATION.vocal, vocal: 61, dance: 35 }));
  assert.ok(validateAllocation({ ...DEFAULT_ALLOCATION.vocal, vocal: 59 }));
});

test("OVR은 정수이며 시작 시 45 안팎", () => {
  for (const [pos, stats] of Object.entries(DEFAULT_ALLOCATION)) {
    const ovr = overall(stats, pos as keyof typeof DEFAULT_ALLOCATION);
    assert.ok(Number.isInteger(ovr));
    assert.ok(ovr >= 40 && ovr <= 50, `${pos} ${ovr}`);
  }
});

test("오디션 확률: 대형은 낮고 중소는 높다, 0.03~0.95로 제한", () => {
  const c = createCareer(base, 1);
  const major = auditionChance(c, "sm");
  const indie = auditionChance(c, "dawn");
  assert.ok(major < 0.25 && major > 0.03, `${major}`);
  assert.ok(indie > 0.7, `${indie}`);
  const strong = { ...c, stats: { vocal: 99, dance: 99, rap: 99, visual: 99, variety: 99, producing: 99 } };
  assert.equal(auditionChance(strong, "dawn"), 0.95);
  assert.equal(chanceLabel(0.1), "매우 낮음");
  assert.equal(chanceLabel(0.85), "매우 높음");
  assert.equal(AGENCIES.length, 14);
});

test("createCareer는 무소속 지망생으로 시작하고 입력을 검증한다", () => {
  const c = createCareer(base, 7);
  assert.equal(c.stage, "free");
  assert.equal(c.agencyId, null);
  assert.equal(c.turn, 0);
  assert.equal(ageOf(c), 14);
  assert.equal(periodLabel(c), "2027년 상반기");
  assert.throws(() => createCareer({ ...base, name: "<script>" }));
  assert.throws(() => createCareer({ ...base, stats: { ...base.stats, vocal: 10 } }));
  for (const k of STAT_KEYS) assert.ok(c.potential[k] >= 72 && c.potential[k] <= 99);
});

test("기획사 지원: 합격이면 연습생, 불합격이면 무소속 유지, 같은 회사 재지원은 2턴 쿨다운", () => {
  let passed = false;
  let failed = false;
  for (let seed = 1; seed < 60 && !(passed && failed); seed++) {
    const c = createCareer(base, seed);
    const next = applyToAgency(c, "dawn");
    assert.equal(c.stage, "free", "원본은 바뀌지 않는다");
    assert.ok(next.result);
    if (next.stage === "trainee") {
      passed = true;
      assert.equal(next.agencyId, "dawn");
      assert.equal(next.traineeContractEnd, 6);
      assert.equal(next.result?.tone, "good");
    } else {
      failed = true;
      assert.equal(next.agencyId, null);
      assert.throws(() => applyToAgency(next, "dawn"), /1년 뒤/);
    }
  }
  assert.ok(passed && failed);
});

test("표시 포맷", () => {
  assert.equal(fanText(3200), "3,200명");
  assert.equal(fanText(12000), "1.2만명");
  assert.equal(fanText(3500000), "350만명");
  assert.equal(wonText(0.4), "4,000만원");
  assert.equal(wonText(1.5), "1.5억원");
  assert.equal(wonText(120), "120억원");
  assert.equal(wonText(12000), "1.2조원");
  assert.equal(reputationLabel(-30), "논란");
  assert.equal(reputationLabel(10), "보통");
  assert.equal(reputationLabel(30), "호감");
  assert.equal(reputationLabel(70), "국민호감");
  assert.equal(Math.round(reputationProgress(12.5)), 50);
  assert.equal(conditionOf({ health: 80, mental: 20 }).level, "danger");
  assert.equal(conditionOf({ health: 60, mental: 70 }).level, "good");
});

import { metricTargets, countText } from "../lib/game/metrics.ts";
import { importJSON, exportJSON } from "../lib/storage.ts";

test("공개 지표는 실제 규모에 맞고, 옛 저장본에도 보완된다", () => {
  const c = createCareer(base, 1);
  c.stage = "idol";
  c.fans = 350000;
  c.popularity = 45;
  const rookie = metricTargets(c);
  assert.ok(rookie.instagram > 1_000_000 && rookie.instagram < 3_000_000, `${rookie.instagram}`);
  assert.ok(rookie.spotify > 1_000_000 && rookie.spotify < 4_000_000, `${rookie.spotify}`);
  c.fans = 1800000;
  c.popularity = 75;
  const top = metricTargets(c);
  assert.ok(top.instagram > 8_000_000 && top.instagram < 20_000_000, `${top.instagram}`);
  assert.ok(top.youtube > 5_000_000 && top.youtube < 20_000_000, `${top.youtube}`);
  assert.equal(countText(14_872_731), "1,487만");
  assert.equal(countText(12000), "1.2만");
  const legacy = JSON.parse(exportJSON(createCareer(base, 2)));
  delete legacy.metrics;
  assert.deepEqual(importJSON(JSON.stringify(legacy)).metrics, { instagram: 0, youtube: 0, spotify: 0 });
});
