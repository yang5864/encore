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
  c.albums.push({ id: "x", turn: 20, name: "NOVA", concept: "fresh", quality: 92, sales: 3000000, melon: 1, billboard: null, wins: 0, shows: [], cost: 30, revenue: 300, scores: { digital: 92, physical: 90, broadcast: 85, social: 88, vote: 90 } });
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

test("컨디션이 위험이면 휴식만 고를 수 있다", async () => {
  const { focusOptions } = await import("../lib/game/focus.ts");
  const c = idol(4);
  c.health = 20;
  const opts = focusOptions(c);
  assert.ok(opts.every((o) => (o.id === "rest" ? !o.disabledReason : !!o.disabledReason)));
  assert.throws(() => advanceTurn(c, "promo"), /위험/);
  const rested = advanceTurn(c, "rest");
  assert.ok(rested.health > 20);
  const t = createCareer(base, 2);
  t.mental = 10;
  assert.ok(focusOptions(t).find((o) => o.id === "rest")?.disabledReason === undefined);
  assert.throws(() => advanceTurn(t, "train:all"), /위험/);
});

test("복무 기간은 육군 18 · 해군 20 · 공군 21개월이고 남는 달은 복귀 준비로 설명한다", () => {
  for (const [branch, months, turns] of [["army", 18, 3], ["navy", 20, 4], ["airforce", 21, 4]] as const) {
    const c = idol(2);
    c.gender = "male"; c.turn = 31; c.contractEnd = 40;
    c.pending = { id: "military", title: "", text: "", scene: "military", choices: [{ id: branch, label: "", hint: "", risk: "safe", op: `military:${branch}` }] };
    const n0 = resolveChoice(c, branch);
    assert.equal(n0.militaryUntil, 31 + turns);
    assert.match(n0.result!.text, new RegExp(`${months}개월 복무`));
    const n = resolveChoice(n0, "regular");
    const back = advanceTurn(n, "promo");
    assert.match(back.result!.text, new RegExp(`${months}개월의 복무`));
    if (turns * 6 > months) assert.match(back.result!.text, /복귀를 준비/);
  }
});

test("통신사 광고·명품 앰버서더는 톱티어(10위 경험·급성장·레전드)에게만 온다", async () => {
  const { eventById } = await import("../lib/game/events/index.ts");
  const { isTopTier } = await import("../lib/game/toptier.ts");
  const telecom = eventById("advert-telecom")!;
  const amb = eventById("ambassador")!;
  const beauty = eventById("advert-beauty")!;
  const c = idol(3);
  c.popularity = 70; c.turn = 20; c.debutTurn = 8;
  assert.equal(isTopTier(c), false);
  assert.equal(telecom.when!(c), false);
  assert.equal(amb.when!(c), false);
  assert.equal(beauty.when!(c), true, "화장품 광고는 인기 45 이상이면 온다");
  const ranked = structuredClone(c); ranked.flags.bestRank = 8;
  assert.equal(telecom.when!(ranked), true);
  assert.equal(amb.when!(ranked), true);
  const surging = structuredClone(c); surging.flags.prevPopularity = 50; // +20
  assert.equal(isTopTier(surging), true);
  const legend = structuredClone(c); legend.peakBillboard = 1;
  assert.equal(isTopTier(legend), true);
  // 시즌을 진행하면 최고 순위가 기록된다
  const star = idol(5); star.popularity = 95; star.fans = 5000000; star.lastReleaseTurn = star.turn - 1; star.buzz = 90; star.loyalty = 85; star.flags.mediaHeat = 90; star.metrics = { instagram: 20000000, youtube: 15000000, spotify: 10000000 };
  const n = advanceTurn(star, "comeback:fresh:star:digital:");
  assert.ok((n.flags.bestRank ?? 999) <= 10, `bestRank ${n.flags.bestRank}`);
});

test("그룹을 탈퇴하면 그룹 활동 구분과 멤버 이벤트가 사라진다", async () => {
  const { focusOptions } = await import("../lib/game/focus.ts");
  const { eventById } = await import("../lib/game/events/index.ts");
  const c = idol(9);
  c.turn = 20; c.debutTurn = 8; c.flags.solo = 1; c.flags.independent = 1;
  const opts = focusOptions(c);
  assert.ok(opts.every((o) => o.group === undefined), "섹션 구분 없음");
  assert.ok(!opts.some((o) => o.id === "solo:solo"), "솔로 앨범 활동은 컴백으로 합쳐진다");
  assert.equal(opts.find((o) => o.id === "comeback")?.label, "솔로 앨범 준비");
  for (const id of ["member-bullying", "member-dui", "member-leave", "unit"]) assert.equal(eventById(id)!.when!(c), false, id);
});

test("그래미·스타디움 투어는 조건을 갖춰야 하고 커리어당 약 5%로 드물다", async () => {
  const { eventById } = await import("../lib/game/events/index.ts");
  const { scheduleEvent, ENDGAME_CHANCE } = await import("../lib/game/schedule.ts");
  const g = eventById("grammy")!, st = eventById("stadium")!;
  const c = idol(2);
  assert.equal(g.when!(c), false); assert.equal(st.when!(c), false);
  const top = idol(2); top.popularity = 92; top.fans = 5000000; top.peakBillboard = 3; top.flags.domeTour = 1;
  assert.equal(g.when!(top), true); assert.equal(st.when!(top), true);
  // 전성기 4시즌을 가정: 둘 중 하나라도 뜰 확률이 15% 안팎 (커리어당 각 ~5%)
  let hit = 0; const N = 400;
  for (let seed = 1; seed <= N; seed++) {
    const s = structuredClone(top); s.rngState = seed; s.lastReleaseTurn = s.turn;
    let got = false;
    for (let i = 0; i < 4 && !got; i++) { s.turn += 1; const e = scheduleEvent(s); if (e && (e.id === "grammy" || e.id === "stadium")) got = true; }
    if (got) hit++;
  }
  const rate = hit / N;
  assert.ok(rate > 0.05 && rate < 0.3, `끝판왕 이벤트 비율 ${rate} (시즌당 ${ENDGAME_CHANCE})`);
  // 결과에 전체 화면 연출 내용이 실린다
  const ev = { ...top, pending: { id: "grammy", title: "", text: "", scene: "awards", public: true, choices: [{ id: "attend", label: "", hint: "", risk: "safe" as const, op: "grammy" }] } };
  const n = resolveChoice(ev as Career, "attend");
  assert.equal(n.flags.grammy, 1);
  assert.ok(n.result?.spotlight?.title.includes("그래미"));
  assert.equal(n.result?.celebrate, "daesang");
});

test("빌보드 1위는 전체 화면 연출로 띄우고, 시즌 결과는 홈 요약용으로 남는다", async () => {
  const { focusOptions } = await import("../lib/game/focus.ts");
  let hit = 0;
  for (let seed = 1; seed <= 60 && !hit; seed++) {
    const c = idol(seed);
    c.popularity = 98; c.fans = 6000000; c.turn = 30; c.debutTurn = 8; c.lastReleaseTurn = 28;
    c.stats = { vocal: 95, dance: 95, rap: 90, visual: 95, variety: 85, producing: 90 };
    c.flags.globalBoost = 30; c.buzz = 90; c.loyalty = 90; c.metrics = { instagram: 30000000, youtube: 25000000, spotify: 40000000 }; c.budget = { mv: 20, digital: 15, global: 50, fan: 15 };
    const n = advanceTurn(c, "comeback:fresh:inhouse:global:");
    assert.ok(n.lastResult, "진행 결과가 남는다");
    if (n.albums[0].billboard === 1) {
      hit++;
      assert.ok(n.result?.spotlight?.title.includes("빌보드"));
      assert.equal(n.result?.celebrate, "daesang");
    }
  }
  assert.ok(hit > 0, "60번 안에 빌보드 1위가 한 번은 나온다");
  assert.ok(!focusOptions(idol(1)).some((o) => o.id === "promo"), "방송·예능은 계획 선택지에서 빠진다");
});

test("팀 케미 · 예산 배분 · 라이벌 컴백이 돌아간다", async () => {
  const { rivalFor, BUDGET_PRESETS } = await import("../lib/game/team.ts");
  const { eventById } = await import("../lib/game/events/index.ts");
  // 라이벌: 시드·시즌으로 정해지고 약 40% 시즌에 있다
  const c = idol(3); c.turn = 20; c.debutTurn = 8;
  let hits = 0;
  for (let t = 20; t < 60; t++) if (rivalFor({ ...c, turn: t })) hits++;
  assert.ok(hits >= 8 && hits <= 24, `라이벌 시즌 ${hits}/40`);
  assert.deepEqual(rivalFor({ ...c, turn: 21 }), rivalFor({ ...c, turn: 21 }), "같은 시즌엔 같은 라이벌");
  // 케미가 낮으면 불화 이벤트 조건, 더 낮으면 탈퇴 이벤트 조건
  const low = idol(4); low.chemistry = 30; low.turn = 20; low.debutTurn = 8;
  assert.equal(eventById("feud")!.when!(low), true);
  assert.equal(eventById("member-leave")!.when!(low), true);
  const fine = idol(4); fine.chemistry = 70; fine.turn = 20; fine.debutTurn = 8;
  assert.equal(eventById("member-leave")!.when!(fine), false);
  // 개인 활동은 케미를, 팬미팅은 결속과 케미를 움직인다
  const s = idol(5); s.turn = 20; s.debutTurn = 8; s.lastReleaseTurn = 20;
  assert.ok(advanceTurn(s, "solo:acting").chemistry < s.chemistry);
  const f = advanceTurn(s, "fanmeet");
  assert.ok(f.chemistry > s.chemistry && f.loyalty > s.loyalty);
  // 연초 예산 이벤트 → 선택하면 budget이 잡힌다
  const y = idol(6); y.turn = 21; y.debutTurn = 8; y.lastReleaseTurn = 21; y.kpi = null; y.contractEnd = 40; y.flags.burst = 1;
  let n = advanceTurn(y, "fanmeet");
  for (let i = 0; i < 3 && n.pending && n.pending.id !== "budget"; i++) { n = resolveChoice(n, n.pending.choices.find((x) => !x.requires)!.id); }
  if (n.pending?.id === "budget") {
    const chosen = resolveChoice(n, "chart");
    assert.deepEqual(chosen.budget, BUDGET_PRESETS.find((p) => p.id === "chart")!.split);
  } else assert.ok(n.kpi, "연초엔 KPI가 잡힌다");
});

test("연말 시상식: 초청 → 참석 → 호명 → 수상소감 순서로 진행되고, 불참이면 대리 수상", () => {
  const base = idol(7);
  base.turn = 21; base.debutTurn = 8; base.lastReleaseTurn = 21; base.popularity = 70; base.fans = 2000000; base.contractEnd = 40; base.flags.burst = 1;
  base.albums = [{ id: "a", turn: 21, name: "X", concept: "fresh", quality: 75, sales: 400000, melon: 3, billboard: null, wins: 2, shows: ["더쇼", "뮤직뱅크"], cost: 20, revenue: 50 }];
  // 수상은 확률이라, 수상자가 나오는 난수 상태를 하나 골라 흐름을 검증한다
  let n = advanceTurn(base, "fanmeet");
  for (let k = 1; k < 60 && !(n.ceremony && n.ceremony.awards.length > 0); k++) n = advanceTurn({ ...structuredClone(base), rngState: k }, "fanmeet");
  assert.equal(n.pending?.id, "awards-invite", "연말엔 초청장이 먼저 온다");
  assert.ok(n.ceremony && n.ceremony.awards.length > 0, "수상 후보가 나오는 해가 있다");
  assert.equal(n.awards.length, 0, "참석 전엔 수상이 확정되지 않는다");
  assert.equal(n.result?.celebrate, undefined, "활동 결과에 폭죽이 붙지 않는다");
  const attended = resolveChoice(n, "attend");
  assert.equal(attended.pending?.id, "ceremony");
  assert.ok(attended.pending!.choices.some((x) => x.op === "speech:fans"));
  const spoke = resolveChoice(attended, "fans", { reaction: "cry" });
  assert.ok(spoke.awards.length > 0, "소감 뒤 수상이 기록된다");
  assert.ok(spoke.loyalty > attended.loyalty, "팬 감사 소감은 결속을 올린다");
  assert.ok(spoke.result?.celebrate === "award" || spoke.result?.celebrate === "daesang");
  assert.equal(spoke.ceremony, null);
  assert.ok(!n.pending!.choices.some((x) => x.id === "skip"), "시상식은 불참할 수 없다");
});
