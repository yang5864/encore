import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn } from "../lib/game/engine.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import type { Career, Kpi } from "../lib/game/types.ts";

const STREAK_NOTE = "두 해 연속";

function idolWithKpi(kpi: Kpi, flags: Record<string, number> = {}): Career {
  const c = createCareer({ name: "하린", gender: "female", avatar: 0, position: "vocal", stats: DEFAULT_ALLOCATION.vocal }, 11);
  Object.assign(c, { stage: "idol", agencyId: "cube", agencyJoinedTurn: 0, turn: 21, debutTurn: 6, contractEnd: 40, groupName: "LUMINA", fans: 100000, popularity: 55, trust: 50, lastReleaseTurn: 19 });
  c.kpi = { ...kpi, deadline: c.turn + 1 };
  Object.assign(c.flags, { kpiSince: c.turn - 1, snsOpened: 1 }, flags);
  return c;
}
const impossible: Kpi = { kind: "fans", target: 999_000_000, deadline: 0, label: "불가능한 목표" };
const easy: Kpi = { kind: "fans", target: 1, deadline: 0, label: "쉬운 목표" };
const notesOf = (c: Career) => (c.result?.notes ?? []).join(" ");

test("KPI: 달성 뒤 한 번 미달하면 연속 미달 페널티가 없다", () => {
  const afterHit = advanceTurn(idolWithKpi(easy, { kpiMisses: 1, kpiMissStreak: 1 }), "rest");
  assert.equal(afterHit.flags.kpiMissStreak, 0);
  const missOnce = advanceTurn(idolWithKpi(impossible, { kpiMisses: afterHit.flags.kpiMisses, kpiMissStreak: afterHit.flags.kpiMissStreak }), "rest");
  assert.equal(missOnce.flags.kpiMissStreak, 1);
  assert.equal(missOnce.flags.kpiMisses, 2, "누적 미달 기록은 유지된다");
  assert.ok(!notesOf(missOnce).includes(STREAK_NOTE));
});

test("KPI: 연속 두 번 미달하면 페널티 안내가 나온다", () => {
  const missTwice = advanceTurn(idolWithKpi(impossible, { kpiMisses: 1, kpiMissStreak: 1 }), "rest");
  assert.equal(missTwice.flags.kpiMissStreak, 2);
  assert.ok(notesOf(missTwice).includes(STREAK_NOTE));
});
