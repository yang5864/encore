import { test } from "node:test";
import assert from "node:assert/strict";
import { realDaesang } from "../lib/game/daesang.ts";
import { brandTable } from "../lib/game/brand-rank.ts";

test("연말 시상식 대상 경쟁 상대는 그 해 실제 수상자", () => {
  assert.equal(realDaesang("MAMA", 2017), "방탄소년단");
  assert.equal(realDaesang("MMA", 2014), "아이유");
  assert.equal(realDaesang("골든디스크", 2016, "digital"), "트와이스");
  assert.equal(realDaesang("골든디스크", 2016, "album"), "엑소");
  for (const show of ["MAMA", "MMA", "골든디스크"]) for (let y = 2006; y <= 2025; y++) assert.ok(realDaesang(show, y), `${show} ${y}`);
  assert.equal(realDaesang("MAMA", 2026), null, "아직 열리지 않은 해는 없다");
});

test("추정 인기 순위는 한 그룹이 상위권을 연달아 차지하지 않는다", () => {
  for (let y = 2006; y <= 2018; y++) {
    const top = brandTable(y).slice(0, 10).map((e) => (e.name.includes(" ") ? e.name.split(" ")[0] : e.name));
    const counts = new Map<string, number>();
    for (const g of top) counts.set(g, (counts.get(g) ?? 0) + 1);
    assert.ok(Math.max(...counts.values()) <= 3, `${y} 상위 10명 중 한 그룹 최대 3명: ${top.join(",")}`);
    for (let i = 1; i < top.length; i++) assert.notEqual(top[i], top[i - 1], `${y} 같은 그룹이 연달아 나온다`);
  }
});
