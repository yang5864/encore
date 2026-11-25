import { test } from "node:test";
import assert from "node:assert/strict";
import { BEAT, COUNT_IN, GOOD, LANES, PERFECT, SONG_LENGTH, judgeDelta, makeChart, nearestNote, noteMidi, rhythmScore } from "../lib/game/rhythm.ts";

test("악보: 시드마다 같고, 박자 위에 놓이고, 같은 줄이 세 번 이어지지 않는다", () => {
  const a = makeChart(42), b = makeChart(42), c = makeChart(43);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  for (let seed = 1; seed <= 50; seed++) {
    const chart = makeChart(seed);
    assert.ok(chart.length >= 30 && chart.length <= 42, `노트 ${chart.length}개`);
    for (let i = 0; i < chart.length; i++) {
      const n = chart[i];
      assert.ok(n.lane >= 0 && n.lane < LANES);
      assert.ok(n.t >= COUNT_IN * BEAT && n.t < SONG_LENGTH, "카운트 뒤, 곡 안에서");
      assert.equal(n.t % (BEAT / 2), 0, "반 박 단위");
      if (i) assert.ok(n.t > chart[i - 1].t, "시간 순서");
      if (i >= 2) assert.ok(!(n.lane === chart[i - 1].lane && n.lane === chart[i - 2].lane), "같은 줄 3연속 없음");
    }
  }
});

test("판정: ±70ms 완벽, ±150ms 좋아요, 그 밖은 없음. 가장 가까운 노트를 친다", () => {
  assert.equal(judgeDelta(0), "perfect");
  assert.equal(judgeDelta(-PERFECT), "perfect");
  assert.equal(judgeDelta(PERFECT + 1), "good");
  assert.equal(judgeDelta(-GOOD), "good");
  assert.equal(judgeDelta(GOOD + 1), null);
  const notes = [{ t: 2000, lane: 0, step: 0 }, { t: 2250, lane: 0, step: 1 }, { t: 2000, lane: 1, step: 0 }];
  assert.equal(nearestNote(notes, 0, 2200)?.t, 2250);
  assert.equal(nearestNote(notes, 2, 2000), null, "다른 줄은 안 친다");
  assert.equal(nearestNote([{ ...notes[0], hit: "perfect" as const }], 0, 2000), null, "이미 친 노트는 다시 안 친다");
});

test("점수: 다 완벽이면 100, 좋아요는 60%, 헛누름은 깎인다", () => {
  const chart = makeChart(7);
  assert.equal(rhythmScore(chart.map((n) => ({ ...n, hit: "perfect" as const })), 0), 100);
  assert.equal(rhythmScore(chart.map((n) => ({ ...n, hit: "good" as const })), 0), 60);
  assert.equal(rhythmScore(chart.map((n) => ({ ...n, hit: "miss" as const })), 0), 0);
  assert.ok(rhythmScore(chart.map((n) => ({ ...n, hit: "perfect" as const })), 8) < 100);
  assert.equal(rhythmScore(chart.map((n) => ({ ...n, hit: "miss" as const })), 20), 0, "0 밑으로 안 내려간다");
});

test("치는 소리는 그 마디 화음의 음이라 누르는 대로 멜로디가 된다", () => {
  const am = [noteMidi({ lane: 0, step: 0 }), noteMidi({ lane: 1, step: 0 }), noteMidi({ lane: 2, step: 0 })].map((m) => m % 12);
  assert.deepEqual(am, [9, 0, 4], "A · C · E (Am)");
  const f = [0, 1, 2].map((lane) => noteMidi({ lane, step: 8 }) % 12);
  assert.deepEqual(f, [5, 9, 0], "F · A · C (F)");
});
