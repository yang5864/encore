import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { eventArt, equipmentPath, idleFrames } from "../lib/art/index.ts";
import { SCENES } from "../lib/game/events/index.ts";

test("모든 장면에서 선택한 캐릭터의 실제 이미지 파일을 사용한다", () => {
  for (const scene of SCENES) for (let avatar = 0; avatar < 6; avatar++) {
    const art = eventArt(scene, avatar, avatar < 3 ? "female" : "male");
    assert.ok(existsSync(`public${art.background}`), art.background);
    assert.ok(art.frames.length >= 1 && art.frames.length <= 2);
    for (const frame of art.frames) {
      assert.ok(existsSync(`public${frame.url}`), frame.url);
      assert.ok(frame.url.includes(`avatar-${avatar}/`), frame.url);
      assert.ok(frame.height > 0 && frame.height <= 1);
      assert.ok(frame.x > 0 && frame.x < 1 && frame.y > 0 && frame.y < 1);
    }
  }
});

test("입대는 남성만, 위문공연은 여성만 표시하며 잘못된 장면은 안전하게 대체한다", () => {
  for (let avatar = 0; avatar < 6; avatar++) {
    assert.equal(eventArt("military", avatar).scene, avatar < 3 ? "rest" : "military");
    assert.equal(eventArt("military-concert", avatar).scene, avatar < 3 ? "military-concert" : "festival");
  }
  assert.equal(eventArt("unknown", -1).scene, "rest");
  assert.equal(eventArt("constructor", 0).scene, "rest");
  assert.ok(eventArt("military", 0, "male").frames[0].url.includes("avatar-3/military/"));
});

test("미완성 이벤트는 있는 한 프레임 또는 같은 캐릭터의 기본 동작으로 표시한다", () => {
  assert.ok(eventArt("album", 4).frames.every((f) => existsSync(`public${f.url}`)));
  assert.equal(idleFrames(99)[0].url, idleFrames(0)[0].url);
});

test("아이템 12종의 두 변형 모두 존재하고 활동 이미지로 연결된다", () => {
  const paths = new Set<string>();
  for (let turn = 0; turn < 12; turn++) {
    for (const stat of ["vocal", "dance", "rap", "visual", "variety", "producing"]) {
      const path = equipmentPath("train", stat, turn)!;
      assert.ok(existsSync(`public${path}`), path);
      paths.add(path);
    }
    paths.add(equipmentPath("overseas", "vocal", turn)!);
  }
  assert.equal(paths.size, 24);
  assert.equal(equipmentPath("rest", "vocal", 0), null);
});
