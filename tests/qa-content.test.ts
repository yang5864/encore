import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { BRAND_RANKS, SOLO_NAMES, brandTable, rivalGroups } from "../lib/game/brand-rank.ts";
import { ERA, S, buildReactions } from "../lib/game/reactions.ts";
import type { Career } from "../lib/game/types.ts";

const base = { name: "하린", gender: "female" as const, avatar: 0, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };

function idol(seed = 5): Career {
  const c = createCareer(base, seed);
  Object.assign(c, { stage: "idol", agencyId: "cube", agencyJoinedTurn: 0, turn: 20, debutTurn: 6, contractEnd: 34, groupName: "LUMINA", fans: 800000, popularity: 60 });
  return c;
}

test("연도별 추정표는 개인 30명, 지수는 엄격히 감소하고 중복 없음", () => {
  for (let y = 2006; y <= 2026; y++) {
    const rows = BRAND_RANKS[y];
    assert.equal(rows.length, 30, `${y} 인원`);
    assert.equal(new Set(rows.map((r) => r.name)).size, 30, `${y} 이름 중복`);
    for (let i = 0; i < rows.length; i++) {
      assert.ok(rows[i].name.includes(" ") || SOLO_NAMES.includes(rows[i].name), `${y} ${rows[i].name}`);
      if (i > 0) assert.ok(rows[i].index < rows[i - 1].index, `${y} ${rows[i].name} 지수`);
    }
    assert.equal(brandTable(y).length, 30);
  }
});

test("rivalGroups는 그룹명만 돌려준다", () => {
  const g = rivalGroups(2016);
  assert.ok(g.includes("방탄소년단"));
  assert.ok(g.length >= 6 && g.length <= 8);
  assert.equal(new Set(g).size, g.length);
  for (const name of g) assert.ok(!name.includes(" "), name);
  for (let y = 2006; y <= 2026; y++) assert.ok(rivalGroups(y).length >= 6, `${y}`);
});

test("학폭 반응에 티저·기대·트친이 섞이지 않는다", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const lines = buildReactions(idol(seed), "bad", { kind: "scandal-bullying" }).map((x) => x.text);
    assert.equal(lines.length, 3);
    assert.equal(new Set(lines).size, 3);
    for (const t of lines) assert.ok(!/티저|기대|트친/.test(t), t);
  }
});

test("어떤 풀에도 트친이 없고 새 상황 풀은 8줄 이상", () => {
  for (const [kind, pool] of Object.entries(S)) for (const t of pool) assert.ok(!t.includes("트친"), `${kind}: ${t}`);
  for (const era of Object.values(ERA)) for (const lines of Object.values(era)) for (const t of lines) assert.ok(!t.includes("트친"), t);
  for (const k of ["scandal-bullying", "scandal-dating", "scandal-dui", "scandal-live", "scandal-chart", "hate-sasaeng", "health", "injury", "feud", "cut", "isac", "military-enlist", "military-discharge", "sns-open", "kpi-hit", "kpi-miss", "comeback-after-scandal"] as const) {
    assert.ok(S[k].length >= 8, k);
  }
  for (const k of ["album", "win", "fanmeet", "variety", "tour", "award", "daesang"] as const) assert.ok(S[k].length >= 12, k);
});
