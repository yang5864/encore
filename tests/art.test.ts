import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { eventArt, equipmentPath, idleFrames, moodFrame } from "../lib/art/index.ts";
import { SCENES } from "../lib/game/events/index.ts";

test("모든 장면에서 선택한 캐릭터의 실제 이미지 파일을 사용한다", () => {
  for (const scene of SCENES) for (const avatar of [6, 9, 12, 17]) {
    const art = eventArt(scene, avatar, avatar < 12 ? "female" : "male");
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
  for (const avatar of [6, 11, 12, 17]) {
    assert.equal(eventArt("military", avatar).scene, avatar < 12 ? "rest" : "military");
    assert.equal(eventArt("military-concert", avatar).scene, avatar < 12 ? "military-concert" : "festival");
  }
  assert.equal(eventArt("unknown", -1).scene, "rest");
  assert.equal(eventArt("constructor", 0).scene, "rest");
  // 폐기한 초기 아바타 0~5는 닮은 새 아바타로 그린다
  assert.ok(eventArt("military", 3, "male").frames[0].url.includes("avatar-14/"));
});

test("미완성 이벤트는 있는 한 프레임 또는 같은 캐릭터의 기본 동작으로 표시한다", () => {
  assert.ok(eventArt("album", 4).frames.every((f) => existsSync(`public${f.url}`)));
  assert.equal(idleFrames(99)[0].url, idleFrames(6)[0].url);
});

test("대기 동작은 눈을 뜬 원본과 완전히 감은 전용 프레임을 사용한다", () => {
  for (let avatar = 6; avatar < 18; avatar++) {
    const frames = idleFrames(avatar);
    assert.equal(frames.length, 2);
    assert.ok(frames[0].url.endsWith(`/characters/avatar-${avatar}/idle-open.png`), frames[0].url);
    assert.ok(frames[1].url.endsWith(`/characters/avatar-${avatar}/idle-closed.png`), frames[1].url);
    assert.ok(frames.every((f) => existsSync(`public${f.url}`)));
  }
});

test("12명 모두 같은 규칙: 시상식은 전용 프레임(의자 프레임 제외), 그 밖의 장면은 기본 동작", () => {
  const awards: Record<string, number> = { "awards-redcarpet": 4, "awards-stage": 4, "awards-seat": 3, "awards-win": 2, "awards-cry": 4, "awards-speech": 4, "awards-lose": 3 };
  for (let avatar = 6; avatar < 18; avatar++) {
    for (const [scene, count] of Object.entries(awards)) {
      const art = eventArt(scene, avatar);
      assert.equal(art.frames.length, count, `${scene}/${avatar}`);
      assert.ok(art.frames.every((f) => !f.url.includes("awards-seat/")), "의자에 앉은 그림은 쓰지 않는다");
      assert.ok(art.frames.every((f) => existsSync(`public${f.url}`)));
    }
    for (const scene of ["album", "tour", "debut", "grammy", "press"]) {
      const art = eventArt(scene, avatar);
      assert.ok(art.frames.every((f) => !f.url.includes(`/${scene}/`)), `${scene}/${avatar}는 기본 동작`);
    }
  }
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
  assert.equal(FEMALE_AVATARS.length, 6);
  assert.equal(MALE_AVATARS.length, 6);
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
  assert.equal(avatarIndex(13, "female"), 6, "성별이 다르면 기본 아바타로");
  // 폐기한 0~5는 닮은 새 아바타로
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((a) => avatarIndex(a)), [9, 10, 7, 14, 12, 17]);
});

test("새 아바타 6–17도 시상식 7장면 4프레임 의상을 쓰고, 18명 모두 울상·활짝 표정이 있다", () => {
  const awardScenes = ["awards-redcarpet", "awards-stage", "awards-seat", "awards-win", "awards-cry", "awards-speech", "awards-lose"];
  for (let avatar = 6; avatar < 18; avatar++) for (const scene of awardScenes) {
    const art = eventArt(scene, avatar);
    assert.equal(art.scene, scene, `${scene}/${avatar}`);
    assert.ok(art.frames.length >= 2, `${scene}/${avatar}`);
    for (const f of art.frames) assert.ok(existsSync(`public${f.url}`), f.url);
  }
  for (let avatar = 0; avatar < 18; avatar++) {
    for (const mood of ["sad", "happy"] as const) {
      const f = moodFrame(avatar, mood);
      assert.ok(f && existsSync(`public${f.url}`), `${avatar}/${mood}`);
    }
    // 장면 전용 동작이 없는 장면: 슬프면 울상 한 장, 좋으면 서 있을 때만 활짝
    const sad = eventArt("isac", avatar, undefined, "sad");
    assert.ok(sad.moodApplied && sad.frames.length === 1 && sad.frames[0].url.endsWith("mood-sad.png"));
    const dancing = eventArt("isac", avatar, undefined, "happy");
    assert.ok(!dancing.moodApplied, "춤 동작은 활짝 표정으로 바꾸지 않는다");
  }
  // 장면 전용 동작(시상식)이 있으면 표정 그림으로 바꾸지 않는다
  assert.ok(!eventArt("awards-seat", 0, undefined, "sad").moodApplied);
  // 군악대는 남성 전용
  for (const avatar of [12, 13, 14, 15, 16, 17]) assert.equal(eventArt("military-band", avatar).frames.length, 2);
  assert.equal(eventArt("military-band", 6).scene, "rest");
});
