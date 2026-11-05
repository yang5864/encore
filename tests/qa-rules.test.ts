import { test } from "node:test";
import assert from "node:assert/strict";
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, applyToAgency, buyItem, resolveChoice, focusOptions } from "../lib/game/engine.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { eventById } from "../lib/game/events/index.ts";
import { activate } from "../lib/game/schedule.ts";
import { awardName, yearEndAwards } from "../lib/game/awards.ts";
import { CONCEPTS, MAIN_STAT } from "../lib/game/focus.ts";
import { MUSIC_SHOWS, winChance, melonRank, isBtsRival, BTS_RIVAL_BONUS } from "../lib/game/metrics-model.ts";
import { rivalFor } from "../lib/game/team.ts";
import { metricTargets } from "../lib/game/metrics.ts";
import { shopOffers, SHOP_ITEMS, PREMIUM_ID, priceOf } from "../lib/game/shop.ts";
import type { Career } from "../lib/game/types.ts";

const base = { name: "하린", gender: "female" as const, avatar: 0, position: "vocal" as const, stats: DEFAULT_ALLOCATION.vocal };

function idol(seed = 5): Career {
  const c = createCareer(base, seed);
  Object.assign(c, { stage: "idol", agencyId: "cube", agencyJoinedTurn: 0, turn: 20, debutTurn: 6, contractEnd: 34, groupName: "LUMINA", fans: 800000, popularity: 60, schoolId: "general", lastReleaseTurn: 20, trust: 50, kpi: null });
  c.flags.burst = 1;
  c.flags.snsOpened = 1;
  return c;
}
const give = (c: Career, id: string): Career => ({ ...structuredClone(c), pending: activate(eventById(id)!) });

// ───────── 1. 자숙 ─────────
test("논란 뒤 두 시즌 자숙: 공개 활동은 대부분 역효과, 휴식·팬미팅은 자숙을 앞당긴다", () => {
  const dui = give(idol(3), "member-dui");
  const after = resolveChoice(dui, "remove");
  assert.equal(after.flags.scandalCooldown, dui.turn + 2);

  const calm = idol(3);
  calm.lastReleaseTurn = 15;
  calm.flags.scandalCooldown = calm.turn + 2;
  const opts = focusOptions(calm);
  assert.ok(opts.find((o) => o.id === "comeback")!.hint.startsWith("⚠ 논란 직후 · 역효과 80%"));
  assert.ok(opts.find((o) => o.id === "overseas")!.hint.startsWith("⚠ 논란 직후"));
  assert.ok(!opts.find((o) => o.id === "fanmeet")!.hint.includes("역효과"));
  assert.ok(!opts.find((o) => o.id === "rest")!.hint.includes("역효과"));
  assert.equal(opts.find((o) => o.id === "comeback")!.disabledReason, undefined);
  delete calm.flags.scandalCooldown;
  assert.ok(!focusOptions(calm).find((o) => o.id === "comeback")!.hint.includes("역효과"));

  let backlash = 0, reversal = 0;
  const N = 200;
  for (let i = 1; i <= N; i++) {
    const c = idol(3);
    c.rngState = i * 977;
    c.turn = 21; c.lastReleaseTurn = 15; c.flags.scandalCooldown = 23; c.flags.lastIncident = 21;
    const n = advanceTurn(c, "overseas");
    if (n.result?.notes.some((x) => x.includes("강행"))) backlash++;
    if (n.result?.notes.some((x) => x.includes("정면 돌파"))) { reversal++; assert.equal(n.flags.scandalCooldown, undefined); }
  }
  assert.equal(backlash + reversal, N);
  assert.ok(backlash / N > 0.7 && backlash / N < 0.9, `역효과 ${backlash}/${N}`);

  const quiet = idol(3);
  quiet.flags.scandalCooldown = quiet.turn + 2;
  const rested = advanceTurn(quiet, "fanmeet");
  assert.equal(rested.flags.scandalCooldown, quiet.turn + 1, "팬미팅은 자숙을 한 시즌 앞당긴다");
  assert.ok(!rested.result?.notes.some((x) => x.includes("강행")));
});

// ───────── 2. 열애설 · 악플 ─────────
test("열애설은 팬덤을 크게 흔들고 커리어당 두 번까지만 온다", () => {
  const c = idol(4);
  const admitted = resolveChoice(give(c, "dating"), "admit");
  assert.ok(admitted.loyalty <= c.loyalty - 20, `결속 ${c.loyalty} → ${admitted.loyalty}`);
  assert.ok(admitted.fans < c.fans * 0.8);
  assert.equal(admitted.flags.datingCount, 1);
  assert.equal(admitted.flags.scandalCooldown, c.turn + 2);
  const dating = eventById("dating")!;
  assert.equal(dating.when!(c), true);
  c.flags.datingCount = 2;
  assert.equal(dating.when!(c), false);
  const hate = eventById("hate")!;
  const h = idol(4);
  assert.equal(hate.when!(h), true);
  const hated = resolveChoice(give(h, "hate"), "sue");
  assert.equal(hated.flags.hateCount, 1);
  h.flags.hateCount = 2;
  assert.equal(hate.when!(h), false);
  // 거짓 해명 실패는 평판과 결속이 함께 무너진다
  const fail = dating.choices.find((x) => x.id === "deny")!.fail!;
  assert.deepEqual([fail.fansMul, fail.reputation, fail.loyalty], [0.7, -18, -20]);
});

// ───────── 3 · 4. 시상식 ─────────
function awardsFor(over: Partial<Career>, album: Partial<Career["albums"][number]>, seed: number) {
  const c = idol(seed);
  Object.assign(c, over);
  c.turn = 22;
  c.albums = [{ id: "a", turn: 21, name: "X", concept: "fresh", quality: 75, sales: 100000, melon: 40, billboard: null, wins: 0, cost: 20, revenue: 50, ...album }];
  return yearEndAwards(c, 2018, [20, 21]);
}

test("시상식이 어려워졌다: 인기 65 미만은 본상 없음, 스타도 놓치는 해가 있고, 본상은 해마다 하나", () => {
  for (let s = 1; s <= 40; s++) assert.ok(!awardsFor({ popularity: 60 }, { melon: 5, wins: 2 }, s).some((a) => a.kind === "bonsang"));
  let bonsang = 0, miss = 0;
  for (let s = 1; s <= 200; s++) {
    const won = awardsFor({ popularity: 70, fans: 1500000 }, { melon: 5, wins: 2, sales: 300000 }, s);
    assert.ok(won.filter((a) => a.kind === "bonsang").length <= 1);
    if (won.some((a) => a.kind === "bonsang")) bonsang++; else miss++;
  }
  assert.ok(bonsang > 20 && miss > 60, `본상 ${bonsang} / 미수상 ${miss}`);
  // 대상: 1위 3회 이상이 아니면 없다
  for (let s = 1; s <= 60; s++) assert.ok(!awardsFor({ popularity: 95, fans: 9000000 }, { melon: 1, wins: 2, sales: 2000000 }, s).some((a) => a.kind === "daesang"));
  let daesang = 0;
  for (let s = 1; s <= 300; s++) if (awardsFor({ popularity: 95, fans: 9000000 }, { melon: 1, wins: 4, sales: 2000000 }, s).some((a) => a.kind === "daesang")) daesang++;
  assert.ok(daesang > 30 && daesang < 200, `대상 ${daesang}/300`);
  // 신인상: 성적이 약하면 없다
  for (let s = 1; s <= 40; s++) assert.ok(!awardsFor({ popularity: 40, fans: 100000 }, { melon: 60, wins: 1, sales: 80000 }, s).some((a) => a.kind === "rookie"));
});

test("시상식별 실제 부문 이름", () => {
  const f = { gender: "female" as const, solo: false, melonBest: 5, melonOne: false };
  assert.equal(awardName("MAMA", "rookie", f), "Best New Artist");
  assert.equal(awardName("MAMA", "bonsang", f), "Best Female Group");
  assert.equal(awardName("MAMA", "bonsang", { ...f, gender: "male" }), "Best Male Group");
  assert.equal(awardName("MAMA", "bonsang", { ...f, solo: true }), "Best Vocal Performance");
  assert.equal(awardName("MAMA", "daesang", f), "Artist of the Year");
  assert.deepEqual(["rookie", "bonsang", "daesang"].map((k) => awardName("MMA", k as never, f)), ["신인상", "TOP10", "올해의 아티스트"]);
  assert.equal(awardName("골든디스크", "bonsang", f), "디지털 음원 본상");
  assert.equal(awardName("골든디스크", "bonsang", { ...f, melonBest: 40 }), "음반 본상");
  assert.equal(awardName("골든디스크", "daesang", { ...f, melonOne: true }), "디지털 음원 대상");
  assert.equal(awardName("골든디스크", "daesang", f), "음반 대상");
  for (let s = 1; s <= 100; s++) for (const a of awardsFor({ popularity: 80, fans: 3000000 }, { melon: 1, wins: 4, sales: 2000000 }, s)) assert.notEqual(a.name, "본상");
});

// ───────── 5. 시상식 초청 ─────────
test("연말 시상식 초청장에는 참석만 있다", () => {
  const base = idol(7);
  base.turn = 21; base.lastReleaseTurn = 21; base.popularity = 70; base.contractEnd = 40;
  const n = advanceTurn(base, "fanmeet");
  assert.equal(n.pending?.id, "awards-invite");
  assert.deepEqual(n.pending!.choices.map((x) => x.id), ["attend"]);
});

// ───────── 6. 콘셉트 이름 ─────────
test("콘셉트 이름은 성별 중립이다", () => {
  const g = CONCEPTS.find((x) => x.id === "girlcrush")!;
  assert.equal(g.name, "힙합 · 크러시");
  assert.equal(g.description, "강렬한 비트와 센 콘셉트. 랩과 퍼포먼스가 중요해요");
});

// ───────── 7. BTS ─────────
test("방탄소년단과 컴백이 겹치면 음방·멜론이 더 어렵다", () => {
  const c = idol(9);
  c.turn = 30;
  const s = { digital: 80, physical: 80, broadcast: 80, social: 80, vote: 80 };
  const show = MUSIC_SHOWS[0];
  const bts = winChance(c, s, show, true, 3, "방탄소년단");
  const other = winChance(c, s, show, true, 3, "다른그룹");
  assert.ok(bts < other);
  assert.equal(winChance(c, s, show, false, 3, "방탄소년단"), winChance(c, s, show, false, 3));
  assert.ok(isBtsRival("방탄소년단") && !isBtsRival("에스파"));
  assert.deepEqual(BTS_RIVAL_BONUS, { show: 12, melon: 5 });
  const m1 = melonRank(c, { ...s, digital: 70 }, true, 0, "방탄소년단");
  const m2 = melonRank(c, { ...s, digital: 70 }, true, 0, "에스파");
  assert.ok((m1 ?? 101) > (m2 ?? 101));
  // 이름을 넘기지 않으면 이번 시즌 라이벌(rivalFor)을 읽는다
  let t = 0;
  for (; t < 600; t++) { const x = { ...c, turn: t }; if (rivalFor(x)?.name === "방탄소년단") break; }
  if (t < 600) {
    const x = { ...c, turn: t } as Career;
    assert.equal(winChance(x, s, show, true, 3), winChance(x, s, show, true, 3, "방탄소년단"));
    assert.ok(winChance(x, s, show, true, 3) < winChance(x, s, show, true, 3, "다른그룹"));
  }
});

// ───────── 8. 인스타그램 ─────────
test("인스타그램은 계정을 열기 전엔 0이고, 열면 팔로워가 쌓인다", () => {
  const c = idol(2);
  c.turn = 36; c.fans = 350000; c.popularity = 45;
  delete c.flags.snsOpened;
  assert.equal(metricTargets(c).instagram, 0);
  c.flags.snsOpened = 1;
  assert.ok(metricTargets(c).instagram > 1_000_000);

  const ev = eventById("sns-open")!;
  const d = idol(2); d.turn = 36; delete d.flags.snsOpened;
  assert.equal(ev.when!(d), true);
  assert.equal(ev.weight, 3);
  const old = idol(2); old.turn = 20; delete old.flags.snsOpened; // 2016
  assert.equal(ev.when!(old), true);
  const early = idol(2); early.turn = 10; delete early.flags.snsOpened; // 2011
  assert.equal(ev.when!(early), false);
  const opened = resolveChoice(give(d, "sns-open"), "open");
  assert.ok(opened.flags.snsOpened);
  assert.ok(opened.metrics.instagram >= 500);
  const later = resolveChoice(give(d, "sns-open"), "later");
  assert.ok(!later.flags.snsOpened);
  assert.equal(later.metrics.instagram, 0);
  // 첫 성장 시즌에는 안내가 붙는다
  const grown = advanceTurn(opened, "fanmeet");
  assert.ok(grown.result?.notes.includes("인스타 팔로워가 늘기 시작했어요."));
  // 2012년 전에 데뷔한 아이돌은 2012년이 되면 회사가 계정을 열어준다
  const vet = idol(2); vet.turn = 11; vet.debutTurn = 6; delete vet.flags.snsOpened;
  const nv = advanceTurn(vet, "fanmeet");
  assert.ok(nv.flags.snsOpened);
});

// ───────── 9. 상점 ─────────
test("상점: 더 큰 상위 단계와 전용 연습실", () => {
  assert.equal(SHOP_ITEMS.find((x) => x.id === "headphones-01")!.amount, 3);
  assert.equal(SHOP_ITEMS.find((x) => x.id === "headphones-02")!.amount, 5);
  const m = SHOP_ITEMS.find((x) => x.id === "headphones-03")!;
  assert.deepEqual([m.amount, m.price, m.image], [7, 30, "/art-v3/items/headphones-02.png"]);
  let masters = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const c = idol(seed);
    const offers = shopOffers(c);
    assert.ok(offers.filter((o) => o.id.endsWith("-03")).length <= 1);
    assert.ok(!offers.some((o) => o.id === PREMIUM_ID), "지갑이 비면 전용 연습실은 없다");
    masters += offers.filter((o) => o.id.endsWith("-03")).length;
  }
  assert.ok(masters > 0);
  const rich = idol(3);
  rich.money.revenue = 2000; rich.money.invested = 50;
  const offers = shopOffers(rich);
  const premium = offers.find((o) => o.id === PREMIUM_ID)!;
  assert.ok(premium);
  assert.equal(premium.stat, MAIN_STAT[rich.position]);
  assert.deepEqual([premium.amount, premium.price, premium.image], [12, 120, "/art-v3/items/practice-room-pass-02.png"]);
  assert.ok(priceOf(rich, premium) > 0);
  const bought = buyItem(rich, PREMIUM_ID);
  assert.equal(bought.stats[premium.stat], Math.min(99, rich.stats[premium.stat] + 12));
  assert.ok(shopOffers(bought).some((o) => o.id === PREMIUM_ID), "구매한 시즌엔 구매 완료로 남는다");
});

// ───────── 10. 아육대 ─────────
test("아육대: 달리기·양궁은 능력치에 따라 성공하고, 불참하면 쉰다", () => {
  const ev = eventById("isac")!;
  assert.equal(ev.repeatable, true);
  assert.equal(ev.weight, 1.5);
  const low = idol(1); low.turn = 2; // 2007
  assert.equal(ev.when!(low), false);
  assert.equal(ev.when!(idol(1)), true);
  let ok = 0;
  for (let i = 1; i <= 60; i++) {
    const c = give(idol(1), "isac");
    c.rngState = i * 31; c.stats.dance = 90; c.health = 50;
    const n = resolveChoice(c, "run");
    if (n.result?.headline.includes("결승")) { ok++; assert.ok(n.loyalty >= c.loyalty + 4); } else assert.ok(n.health < 50);
  }
  assert.ok(ok > 25 && ok < 60, `달리기 성공 ${ok}/60`);
  const arch = resolveChoice({ ...give(idol(1), "isac"), rngState: 5 }, "archery");
  assert.ok(/양궁/.test(arch.result!.headline));
  const skip = give(idol(1), "isac"); skip.health = 50;
  const rested = resolveChoice(skip, "skip");
  assert.equal(rested.health, 56);
  assert.equal(rested.loyalty, skip.loyalty - 2);
});

// ───────── 11. 군 복무 ─────────
test("입대하면 복무 계획이 뜨고, 전역 결과에 고른 길이 남는다", () => {
  const mk = () => { const c = idol(2); c.gender = "male"; c.turn = 31; c.contractEnd = 60; c.stats.vocal = 70; return give(c, "military"); };
  const enlisted = resolveChoice(mk(), "army");
  assert.equal(enlisted.pending?.id, "military-service");
  const weak = structuredClone(enlisted); weak.stats.vocal = 40;
  assert.throws(() => resolveChoice(weak, "band"), /보컬/);
  const band = resolveChoice(enlisted, "band");
  assert.equal(band.pending, null);
  assert.ok(band.buzz > enlisted.buzz);
  const back = advanceTurn(band, "fanmeet");
  assert.match(back.result!.text, /군악대/);
  const fit = resolveChoice(enlisted, "fitness");
  assert.equal(fit.stats.dance, Math.min(99, enlisted.stats.dance + 2));
  assert.match(advanceTurn(fit, "fanmeet").result!.text, /체력 단련/);
  const reg = resolveChoice(enlisted, "regular");
  assert.equal(reg.stats.vocal, enlisted.stats.vocal - 1);
  assert.match(advanceTurn(reg, "fanmeet").result!.text, /일반 복무/);
});

// ───────── 12. 계약 직후 또 계약 ─────────
test("회귀: 계약 직후 같은 시즌/다음 시즌에 또 계약 화면이 뜨지 않는다", () => {
  // 재계약 / 개인 소속사 직후에는 만료가 미뤄져 contract7이 다시 뜨지 않는다
  for (const choice of ["renew", "own"]) {
    const c = idol(3);
    c.turn = 34; c.contractEnd = 34; c.lastReleaseTurn = 34; c.popularity = 70;
    const signed = resolveChoice(give(c, "contract7"), choice);
    assert.equal(signed.contractEnd, signed.turn + 6);
    let next = advanceTurn(signed, "fanmeet");
    for (let g = 0; g < 4 && next.pending; g++) {
      assert.ok(!["contract7", "agency-bankrupt"].includes(next.pending.id), `재계약 직후 ${next.pending.id}`);
      next = resolveChoice(next, next.pending.choices.find((x) => !x.requires && x.op !== "retire")!.id);
    }
  }
  // 파산 소식은 서명 직후 두 시즌 안에는 오지 않는다 (원인: 계약 직후 파산 → 또 계약 선택지)
  let bankrupt = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const c = idol(seed);
    c.agencyId = "indie1"; c.money.invested = 400; c.money.revenue = 0; c.popularity = 10; c.flags.contractTurn = c.turn;
    const n = advanceTurn(c, "fanmeet");
    if (n.pending?.id === "agency-bankrupt") bankrupt++;
  }
  assert.equal(bankrupt, 0);
  // 연습생 계약 직후에는 스카우트/캐스팅 제안이 연달아 뜨지 않는다
  for (let seed = 1; seed <= 60; seed++) {
    let c = createCareer(base, seed);
    c.schoolId = "general"; c.stage = "free";
    for (const k of Object.keys(c.stats) as (keyof typeof c.stats)[]) c.stats[k] = 80;
    c.flags.burst = 0;
    c = applyToAgency({ ...c, rngState: seed }, "cube");
    if (c.pending?.id !== "trainee-offer") continue;
    c = resolveChoice(c, "sign");
    assert.equal(c.flags.contractTurn, c.turn);
    c.flags.burst = c.turn + 1;
    const n = advanceTurn(c, "train:all");
    assert.ok(!["scout", "burst-cast", "trainee-contract"].includes(n.pending?.id ?? ""), `${n.pending?.id}`);
  }
});

// ───────── 13. 멤버 탈퇴 ─────────
test("멤버가 탈퇴하면 팀 인원과 아바타가 줄어든다", () => {
  const c = idol(8);
  c.lineup = { members: 5, leader: false, center: false, maknae: false, parts: [], memberAvatars: [1, 2, 3, 4] };
  const n = resolveChoice(give(c, "member-leave"), "support");
  assert.equal(n.lineup!.members, 4);
  assert.deepEqual(n.lineup!.memberAvatars, [1, 2, 3]);
  const d = idol(8);
  d.lineup = { members: 2, leader: false, center: false, maknae: false, parts: [], memberAvatars: [1] };
  assert.equal(resolveChoice(give(d, "member-leave"), "reorg").lineup!.members, 2);
});
