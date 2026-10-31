import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { retireCareer } from "../lib/game/engine.ts";
import { addRecord, exportJSON, importJSON, loadCareer, loadRecords, saveCareer } from "../lib/storage.ts";

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}
const base = { name: "하린", gender: "female" as const, avatar: 0, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };

test("저장/복원 라운드트립", () => {
  const s = memory();
  const c = createCareer(base, 1);
  saveCareer(c, s);
  assert.deepEqual(loadCareer(s), c);
  assert.deepEqual(importJSON(exportJSON(c)), c);
});

test("잘못된 파일은 거부한다", () => {
  assert.throws(() => importJSON("not json"), /읽을 수 없어요/);
  assert.throws(() => importJSON(JSON.stringify({ v: 1, name: "x" })), /2\.0/);
  assert.throws(() => importJSON(JSON.stringify({ v: 2, name: "x" })), /항목이 없어요/);
});

test("기록은 점수순, 최대 50개", () => {
  const s = memory();
  for (let i = 0; i < 55; i++) {
    const c = retireCareer(createCareer({ ...base, name: `n${i}` }, i + 1));
    c.fans = i * 1000;
    addRecord(c, s, i);
  }
  const list = loadRecords(s);
  assert.equal(list.length, 50);
  assert.ok(list[0].score >= list[1].score);
  assert.equal(list[0].name, "n54");
});
