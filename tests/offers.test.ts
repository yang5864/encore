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

function readyTrainee(seed: number): Career {
  const c = createCareer(base, seed);
  Object.assign(c, { stage: "trainee", agencyId: "sm", agencyJoinedTurn: 2, traineeContractEnd: 20, turn: 5, trust: 60, schoolId: "general" });
  c.stats = { vocal: 85, dance: 75, rap: 55, visual: 70, variety: 60, producing: 55 };
  c.flags.burst = 1;
  return c;
}

test("데뷔 제안에 그룹 구성과 내 역할이 나온다", () => {
  for (let seed = 1; seed < 80; seed++) {
    const n = advanceTurn(readyTrainee(seed), "train:all");
    if (n.pending?.id !== "debut-offer") continue;
    assert.ok(n.lineup);
    assert.ok(n.lineup.members >= 4 && n.lineup.members <= 7);
    assert.ok(n.lineup.parts.includes("메인보컬"));
    assert.ok(n.pending.choices.some((x) => x.op === "debut"));
    return;
  }
  assert.fail("데뷔 제안이 오지 않았다");
});

test("간혹 데뷔조에서 밀리고, 데뷔 시점과 이적 선택지가 나온다", () => {
  let cuts = 0;
  for (let seed = 1; seed < 120; seed++) {
    const n = advanceTurn(readyTrainee(seed), "train:all");
    if (n.pending?.id !== "debut-cut") continue;
    cuts++;
    assert.match(n.pending.text, /최소 \d년은 기다려야|아직 정해지지 않았어요/);
    const wait = resolveChoice(n, "wait");
    assert.ok(wait.flags.debutEta !== undefined && wait.flags.debutEta > wait.turn);
    const move = n.pending.choices.find((x) => x.op?.startsWith("scout:"));
    if (move) {
      const moved = resolveChoice(n, move.id);
      assert.notEqual(moved.agencyId, "sm");
      assert.match(move.label, /바로 데뷔 가능|최소 \d년 뒤 데뷔|데뷔 일정 미정/);
    }
  }
  assert.ok(cuts >= 10 && cuts <= 70, `탈락 ${cuts}/119`);
});

test("네티즌 반응은 상황과 시대에 맞는 문장으로 나온다", async () => {
  const { buildReactions, eraOf } = await import("../lib/game/reactions.ts");
  assert.equal(eraOf(2008), "cyworld");
  assert.equal(eraOf(2024), "now");
  const c = idol(3);
  c.turn = 4; // 2008
  const old = buildReactions(c, "good", { kind: "win", show: "뮤직뱅크", album: "BLOOM" });
  assert.equal(old.length, 3);
  assert.ok(old.some((x) => x.text.includes("뮤직뱅크") || x.text.includes("1위")), "1위 상황 문장이 들어간다");
  assert.ok(new Set(old.map((x) => x.text)).size === 3, "중복 없음");
  c.turn = 38; // 2025
  const now = buildReactions(c, "bad", { kind: "album-flop", album: "ORBIT" });
  assert.ok(now.every((x) => !x.text.includes("{")), "자리표시자가 남지 않는다");
});

test("음방 1위는 꽃가루, 대상은 금빛 가루 연출로 표시된다", () => {
  const c = idol(8);
  c.popularity = 95; c.fans = 4000000;
  c.stats = { vocal: 90, dance: 90, rap: 80, visual: 90, variety: 80, producing: 80 };
  c.turn = 21; c.lastReleaseTurn = 20;
  c.albums.push({ id: "x", turn: 20, name: "NOVA", concept: "fresh", quality: 92, sales: 3000000, melon: 1, billboard: null, wins: 0, shows: [], cost: 30, revenue: 300 });
  c.flags.candidate = 21;
  c.pending = { id: "musicshow", title: "", text: "", scene: "mc", public: true, choices: [{ id: "push", label: "", hint: "", risk: "bold", op: "musicshow:push" }] };
  let won = 0;
  for (let i = 0; i < 20; i++) { const n = resolveChoice({ ...structuredClone(c), rngState: i + 1 }, "push"); if (n.result?.celebrate === "win") won++; }
  assert.ok(won > 5, `1위 ${won}/20`);
});

test("아이템 구매는 명시된 능력치만 바꾼다 (SNS·팬·정산 변동 없음)", () => {
  const c = idol(6);
  c.money.revenue = 500; c.money.invested = 50;
  c.metrics = { instagram: 120000, youtube: 80000, spotify: 50000 };
  const item = shopOffers(c)[0];
  const n = buyItem(c, item.id);
  assert.deepEqual(n.metrics, c.metrics);
  assert.equal(n.fans, c.fans);
  assert.equal(n.popularity, c.popularity);
  const changed = n.result!.changes.map((x) => x.key);
  assert.ok(changed.every((k) => k === item.stat || k === "ovr"), `변경 항목 ${changed.join(",")}`);
  assert.ok(!shopOffers(n).some((x) => x.id === item.id) || n.flags.shopTurn === n.turn, "이번 시즌엔 구매 완료로 남는다");
  n.turn += 1;
  assert.ok(!shopOffers(n).some((x) => x.id === item.id), "다음 시즌부터는 가진 물건이 진열되지 않는다");
});
