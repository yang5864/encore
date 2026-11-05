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

test("대기 동작은 눈을 뜬 원본과 완전히 감은 전용 프레임을 사용한다", () => {
  for (let avatar = 0; avatar < 6; avatar++) {
    const frames = idleFrames(avatar);
    assert.equal(frames.length, 2);
    assert.equal(frames[0].url, `/art-v3/characters/avatar-${avatar}/idle-01.png`);
    assert.equal(frames[1].url, `/art-v3/characters/avatar-${avatar}/blink-closed.png`);
    assert.ok(existsSync(`public${frames[1].url}`));
  }
});

test("성별에 맞는 34개 이벤트의 396장 모두 완성된 이벤트 의상을 사용한다", () => {
  let count = 0;
  for (const scene of SCENES) for (let avatar = 0; avatar < 6; avatar++) {
    if (scene === "military" && avatar < 3 || scene === "military-concert" && avatar >= 3) continue;
    const art = eventArt(scene, avatar);
    assert.equal(art.frames.length, 2, `${scene}/${avatar}`);
    assert.ok(art.frames.every((f) => f.url.startsWith(`/art-v4/characters/avatar-${avatar}/${scene}/`)));
    count += art.frames.length;
  }
  assert.equal(count, 396);
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

test("추가 아바타 6–17: 성별 매핑, 모든 장면에서 기본 포즈로 그려진다", async () => {
  const { FEMALE_AVATARS, MALE_AVATARS, avatarIndex, idleFrames } = await import("../lib/art/index.ts");
  assert.equal(FEMALE_AVATARS.length, 9);
  assert.equal(MALE_AVATARS.length, 9);
  for (const a of [...FEMALE_AVATARS, ...MALE_AVATARS]) {
    const g = FEMALE_AVATARS.includes(a) ? "female" : "male";
    assert.equal(avatarIndex(a, g), a, `${a}는 ${g}로 그대로 쓴다`);
    assert.ok(idleFrames(a).length >= 2);
    for (const scene of ["fansign", "album", "awards-win", "military", "tour"]) {
      const art = eventArt(scene, a, g);
      assert.ok(art.frames.length >= 1 && art.frames.every((f) => f.url), `${a} ${scene}`);
    }
  }
  assert.equal(eventArt("military", 7, "female").scene, "rest", "여성 아바타는 입대 장면 대신 휴식");
  assert.equal(eventArt("military", 13, "male").scene, "military");
  assert.equal(avatarIndex(13, "female"), 0, "성별이 다르면 기본 아바타로");
});
