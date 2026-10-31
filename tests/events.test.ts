import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { EVENTS, SCENES } from "../lib/game/events/index.ts";

test("이벤트 id는 고유하고 45개 이상", () => {
  const ids = EVENTS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 40, `${ids.length}`);
});

test("모든 선택지 힌트는 숫자 없는 문장", () => {
  for (const e of EVENTS) {
    if (e.id === "scout") continue;
    assert.ok(e.choices.length >= 1 && e.choices.length <= 5, e.id);
    for (const ch of e.choices) {
      assert.ok(ch.hint.length > 5, `${e.id}/${ch.id} hint`);
      assert.ok(!/\d/.test(ch.hint), `${e.id}/${ch.id} hint has digits: ${ch.hint}`);
      assert.ok(ch.risk === "safe" || ch.risk === "bold");
      if (ch.chance !== undefined) assert.ok(ch.success && ch.fail && ch.successText && ch.failText, `${e.id}/${ch.id} chance needs outcomes`);
    }
  }
});

test("모든 씬 이미지가 존재한다", () => {
  for (const s of SCENES) assert.ok(existsSync(`public/scenes/${s}.webp`), s);
  for (const e of EVENTS) assert.ok((SCENES as readonly string[]).includes(e.scene), `${e.id} scene ${e.scene}`);
});

test("숨은 이벤트는 중소 기획사에서만 열린다", () => {
  const hidden = EVENTS.filter((e) => e.kind === "hidden");
  assert.equal(hidden.length, 2);
  for (const e of hidden) assert.ok(e.when);
});
