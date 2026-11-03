import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { eventArt } from "../lib/art/index.ts";
import { showcaseAt } from "../lib/art/showcase.ts";

test("한 캐릭터로 다섯 단계를 마치면 다음 캐릭터의 연습생 단계로 순환한다", () => {
  const images = new Set<string>();
  for (let tick = 0; tick < 30; tick++) {
    const stage = showcaseAt(tick);
    assert.equal(stage.step, tick % 5);
    assert.equal(stage.avatar, Math.floor(tick / 5));
    const frames = eventArt(stage.scene, stage.avatar).frames;
    const selected = stage.pose === undefined ? frames : [frames[stage.pose]];
    assert.ok(selected.every((f) => existsSync(`public${f.url}`)));
    images.add(selected[0].url);
  }
  assert.equal(images.size, 30);
  assert.deepEqual(showcaseAt(30), showcaseAt(0));
  assert.equal(showcaseAt(4).label, "레전드");
  assert.equal(showcaseAt(5).label, "연습생");
  assert.equal(showcaseAt(5).avatar, 1);
});
