import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { makeLineup } from "../lib/game/debut.ts";
import { eventArt, FEMALE_AVATARS, MALE_AVATARS } from "../lib/art/index.ts";

function mk(seed: number, gender: "female" | "male", avatar: number) {
  const c = createCareer({ name: "하린", gender, avatar, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal }, seed);
  c.agencyId = "cube";
  return c;
}

test("makeLineup: 멤버 아바타는 같은 성별·서로 다름·내 아바타 제외", () => {
  for (let seed = 1; seed <= 40; seed++) {
    for (const [gender, avatar, set] of [["female", 1, FEMALE_AVATARS], ["male", 13, MALE_AVATARS]] as const) {
      const c = mk(seed, gender, avatar);
      const l = makeLineup(c);
      assert.equal(l.memberAvatars?.length, l.members - 1);
      assert.equal(new Set(l.memberAvatars).size, l.members - 1);
      for (const m of l.memberAvatars!) { assert.ok(set.includes(m)); assert.notEqual(m, avatar); }
    }
  }
});

test("makeLineup: 같은 시드면 같은 결과", () => {
  assert.deepEqual(makeLineup(mk(7, "female", 0)), makeLineup(mk(7, "female", 0)));
});

test("eventArt: 새 아바타(13)도 album 장면 프레임이 있다", () => {
  const a = eventArt("album", 13, "male");
  assert.ok(a.frames.length > 0);
});
