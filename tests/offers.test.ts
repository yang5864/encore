import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, applyToAgency, buyItem, resolveChoice, APPLY_PER_SEASON } from "../lib/game/engine.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { displayName } from "../lib/game/format.ts";
import { renewalEvent } from "../lib/game/renewal.ts";
import { shopOffers, priceOf, walletOf } from "../lib/game/shop.ts";
import type { Career } from "../lib/game/types.ts";

const base = { name: "하린", gender: "female" as const, avatar: 0, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };

function idol(seed = 5): Career {
  const c = createCareer(base, seed);
  Object.assign(c, { stage: "idol", agencyId: "cube", agencyJoinedTurn: 0, turn: 20, debutTurn: 6, contractEnd: 34, groupName: "LUMINA", fans: 800000, popularity: 60, schoolId: "general", lastReleaseTurn: 20, trust: 50 });
  return c;
}

test("기획사 지원은 시즌마다 세 곳까지", () => {
  let c = createCareer(base, 11);
  const ids = ["sm", "yg", "jyp", "hybe"];
  let applied = 0;
  for (const id of ids) {
    if (applied === APPLY_PER_SEASON) {
      assert.throws(() => applyToAgency(c, id), /3곳까지/);
      break;
    }
    c = applyToAgency(c, id);
    if (c.pending) c = resolveChoice(c, "decline");
    applied++;
  }
  assert.equal(applied, APPLY_PER_SEASON);
});

test("19세 하반기 무소속이면 반드시 소속사 계약 제안이 온다 (거절 없음)", () => {
  const c = createCareer(base, 3);
  c.turn = 14;
  c.schoolId = "general";
  c.flags.burst = 1; // 포텐 폭발 제외
  const n = advanceTurn(c, "train:all");
  assert.equal(n.turn, 15);
  assert.equal(n.pending?.id, "last-call");
  assert.ok(n.pending.choices.length >= 1 && n.pending.choices.length <= 3);
  assert.ok(n.pending.choices.every((x) => x.op?.startsWith("join:") && x.sign));
  const signed = resolveChoice(n, n.pending.choices[0].id);
  assert.equal(signed.stage, "trainee");
});

test("포텐 폭발은 드물게 일어나고, 터지면 대형 기획사가 먼저 캐스팅한다", () => {
  let bursts = 0;
  const N = 300;
  for (let seed = 1; seed <= N; seed++) {
    let c = createCareer(base, seed);
    c.schoolId = "general";
    for (let i = 0; i < 14 && c.stage === "free"; i++) {
      c = advanceTurn(c, "train:all");
      if (c.flags.burst) {
        bursts++;
        assert.equal(c.pending?.id, "burst-cast");
        assert.ok(c.pending.choices.some((x) => /^scout:(hybe|sm|jyp|yg)$/.test(x.op ?? "")));
        break;
      }
      c.pending = null;
      c.result = null;
    }
  }
  const rate = bursts / N;
  assert.ok(rate > 0.08 && rate < 0.25, `포텐 폭발 비율 ${rate}`);
});

test("재계약 오퍼는 실력과 인기에 따라 다르게 온다", () => {
  const star = idol(7);
  star.popularity = 90;
  star.stats = { vocal: 90, dance: 85, rap: 70, visual: 85, variety: 75, producing: 70 };
  star.fans = 3000000;
  const weak = idol(7);
  weak.popularity = 15;
  weak.stats = { vocal: 45, dance: 40, rap: 35, visual: 45, variety: 40, producing: 35 };
  let starOffers = 0;
  let weakOffers = 0;
  let weakLocked = true;
  for (let i = 0; i < 40; i++) {
    const s = structuredClone(star); s.rngState = i + 1;
    const w = structuredClone(weak); w.rngState = i + 1;
    starOffers += renewalEvent(s, "contract").choices.filter((x) => x.op?.startsWith("move:")).length;
    const we = renewalEvent(w, "contract");
    weakOffers += we.choices.filter((x) => x.op?.startsWith("move:")).length;
    if (!we.choices.find((x) => x.op === "solo")?.requires) weakLocked = false;
  }
  assert.ok(starOffers > 40, `스타 해외 오퍼 ${starOffers}`);
  assert.equal(weakOffers, 0);
  assert.ok(weakLocked);
});

test("그룹을 탈퇴해도 그룹명이 이름 앞에 남는다", () => {
  const c = idol(9);
  c.popularity = 70;
  c.pending = renewalEvent(c, "contract");
  const left = resolveChoice(c, "leave");
  assert.equal(left.groupName, "LUMINA");
  assert.equal(left.flags.solo, 1);
  assert.equal(displayName(left), "LUMINA 하린");
  assert.equal(displayName({ name: "gd", groupName: "gd", stage: "retired" }), "gd");
});

test("해외 이적은 그룹 활동을 유지한 채 소속사만 바뀐다", () => {
  const c = idol(4);
  c.pending = renewalEvent(c, "contract");
  c.pending.choices.unshift({ id: "move-sony", label: "Sony", hint: "", risk: "bold", op: "move:sony", sign: true });
  const moved = resolveChoice(c, "move-sony");
  assert.equal(moved.agencyId, "sony");
  assert.equal(moved.groupName, "LUMINA");
  assert.ok(!moved.flags.solo);
});

test("적자가 쌓인 약한 중소 아이돌은 소속사가 파산할 수 있다", () => {
  let bankrupt = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const c = idol(seed);
    c.agencyId = "dawn";
    c.popularity = 15;
    c.stats = { vocal: 40, dance: 35, rap: 30, visual: 40, variety: 35, producing: 30 };
    c.money.invested = 40;
    c.money.revenue = 5;
    const n = advanceTurn(c, "promo");
    if (n.pending?.id === "agency-bankrupt") {
      bankrupt++;
      assert.ok(!n.pending.choices.some((x) => x.op === "renew"));
      const own = n.pending.choices.find((x) => x.op === "retire")!;
      assert.ok(own);
    }
  }
  assert.ok(bankrupt >= 5, `파산 ${bankrupt}`);
});

test("상점: 시즌마다 3개 진열, 하나만 사면 능력치가 오른다", () => {
  const c = idol(2);
  c.money.revenue = 500;
  c.money.invested = 50;
  const offers = shopOffers(c);
  assert.equal(offers.length, 3);
  assert.equal(new Set(offers.map((x) => x.id.slice(0, -3))).size, 3);
  const item = offers[0];
  const wallet = walletOf(c);
  const bought = buyItem(c, item.id);
  assert.equal(bought.stats[item.stat], Math.min(99, c.stats[item.stat] + item.amount));
  assert.equal(walletOf(bought), Math.round((wallet - priceOf(c, item)) * 10) / 10);
  assert.throws(() => buyItem(bought, offers[1].id), /하나만/);
  const poor = idol(2);
  assert.throws(() => buyItem(poor, offers[0].id), /부족/);
});
