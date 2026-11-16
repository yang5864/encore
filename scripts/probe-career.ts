/* 전체 커리어 탐침: 나이별 OVR·인기, 음방 1위·본상·대상 빈도, 첫 소속 티어를 출력한다. 사용: npx tsx scripts/probe-career.ts [수] [natural|mid|major] */
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, resolveChoice, choiceLock, focusOptions, applyToAgency } from "../lib/game/engine.ts";
import { AGENCIES, auditionChance } from "../lib/game/agencies.ts";
import { DEFAULT_ALLOCATION, STAT_KEYS, overall } from "../lib/game/stats.ts";
import { defaultTrainPicks } from "../lib/game/focus.ts";
import { albumQuality } from "../lib/game/album.ts";
import { conditionOf, ageOf } from "../lib/game/format.ts";
import { rankingFor } from "../lib/game/brand-rank.ts";
import { yearOf, isSecondHalf } from "../lib/game/format.ts";
import type { Career } from "../lib/game/types.ts";
const positions = ["vocal", "dance", "rap", "visual", "allround", "producer"] as const;
const N = Number(process.argv[2] ?? 200);
const MODE = process.argv[3] ?? "natural";
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const at: Record<number, number[]> = {}; const popAt: Record<number, number[]> = {};
let debut = 0, wins = 0, winCareers = 0, rank1 = 0, rank1Careers = 0, daesang = 0, daesangCareers = 0, bonsang = 0, sweepYears = 0, sweepDaesang = 0, n99: number[] = [], tiers: Record<string, number> = {}, arts = 0, artsTry = 0, freeAt18 = 0, idolSeasons = 0;
const debutAge: number[] = [];
for (let seed = 1; seed <= N; seed++) {
  const pos = positions[seed % 6];
  let c: Career = createCareer({ name: "프로브", gender: seed % 2 ? "female" : "male", avatar: 8, position: pos, stats: DEFAULT_ALLOCATION[pos] }, seed * 104729);
  const picks = defaultTrainPicks(pos);
  if (MODE !== "natural") { const ag = MODE === "major" ? ["hybe", "sm", "jyp", "yg"][seed % 4] : ["starship", "cube", "kq", "fnc"][seed % 4]; c.stage = "trainee"; c.agencyId = ag; c.agencyJoinedTurn = 0; c.traineeContractEnd = 6; c.trust = 30; }
  let r1 = false;
  for (let i = 0; i < 60 && c.stage !== "retired"; i++) {
    if (MODE === "natural" && c.stage === "trainee" && !c.pending) {
      // 연습생이어도 더 큰 회사 문이 열리면 지원해 본다
      const mine = AGENCIES.find((x) => x.id === c.agencyId)!; const rank = (t: string) => (t === "major" ? 3 : t === "indie" ? 1 : 2);
      const up = AGENCIES.filter((x) => rank(x.tier) > rank(mine.tier) && auditionChance(c, x.id) > 0).sort((x, y) => rank(y.tier) - rank(x.tier))[0];
      if (up) try { c = applyToAgency(c, up.id); } catch {}
    }
    if (c.stage === "free" && !c.pending) {
      // 가장 높은 티어부터 합격 가능성이 있는 곳에 지원
      const order = [...AGENCIES].sort((a, b) => auditionChance(c, b.id) * (b.tier === "major" ? 3 : b.tier === "indie" ? 1 : 2) - auditionChance(c, a.id) * (a.tier === "major" ? 3 : a.tier === "indie" ? 1 : 2));
      for (const a of order.slice(0, 3)) { if (c.pending || c.stage !== "free") break; try { c = applyToAgency(c, a.id); } catch {} }
    }
    while (c.pending) {
      const ev = c.pending;
      const open = ev.choices.filter((x) => !choiceLock(c, x));
      let ch = open.find((x) => x.op?.startsWith("join:") || x.op === "debut" || x.id === "sign" || x.op === "school:arts-apply") ?? open[0] ?? ev.choices[0];
      if (ev.id === "arts-audition") { artsTry++; ch = open.find((x) => x.id === (pos === "dance" ? "dance" : pos === "visual" ? "broadcast" : "music")) ?? ch; }
      try { c = resolveChoice(c, ch.id, { groupName: "PROBE", albumName: "X", reaction: "joy", score: ev.id === "arts-audition" ? 70 : undefined }); } catch { c = { ...c, pending: null }; }
    }
    if (c.stage === "retired") break;
    if (ageOf(c) === 18 && c.stage === "free") freeAt18++;
    const cond = conditionOf(c);
    let f: string;
    if (c.stage === "idol") {
      idolSeasons++;
      const o = focusOptions(c).filter((x) => !x.disabledReason).map((x) => x.id);
      const concept = (["fresh", "girlcrush", "ballad", "performance"] as const).map((k) => ({ k, q: albumQuality({ ...c, rngState: 1 } as Career, k) })).sort((x, y) => y.q - x.q)[0].k;
      const gap = c.lastReleaseTurn === null ? 9 : c.turn - c.lastReleaseTurn;
      f = cond.level === "danger" ? "rest" : o.includes("comeback") && gap >= 1 && (c.loyalty >= 45 || gap >= 2) ? `comeback:${concept}:inhouse:${c.loyalty < 55 ? "physical" : "digital"}:` : o.includes("overseas") && c.loyalty >= 60 ? "overseas" : "fanmeet";
    }
    else f = cond.level === "danger" ? "rest" : `train:${picks.slice(0, 1 + (i % 3)).join("+")}`;
    const winsBefore = c.musicWins, awardsBefore = c.awards.length;
    try { c = advanceTurn(c, f); } catch { c = advanceTurn(c, "rest"); }
    if (c.stage === "idol") { const r = rankingFor(c, yearOf(c), isSecondHalf(c)); if (r.me.rank === 1) { rank1++; r1 = true; } }
    const age = ageOf(c) + 2;
    if (c.turn % 2 === 0) { (at[age] ??= []).push(overall(c.stats, c.position)); (popAt[age] ??= []).push(c.popularity); }
  }
  if (c.debutTurn !== null) { debut++; debutAge.push(12 + Math.floor(c.debutTurn / 2) + 2); }
  wins += c.musicWins; if (c.musicWins) winCareers++;
  if (r1) rank1Careers++;
  const d = c.awards.filter((a) => a.kind === "daesang").length; daesang += d; if (d) daesangCareers++;
  bonsang += c.awards.filter((a) => a.kind === "bonsang").length;
  // 그 해 음방 1위 5회 이상인 해와 그 해의 대상
  const byYear = new Map<number, number>(); for (const al of c.albums) { const y = 2006 + Math.floor(al.turn / 2); byYear.set(y, (byYear.get(y) ?? 0) + al.wins); }
  for (const [y, w] of byYear) if (w >= 5) { sweepYears++; if (c.awards.some((a) => a.kind === "daesang" && a.year === y)) sweepDaesang++; }
  n99.push(STAT_KEYS.filter((k) => c.stats[k] >= 95).length);
  if (c.schoolId === "arts") arts++;
  const firstAgency = c.history.filter((h) => h.title.includes("연습생")).pop()?.title ?? "none"; const tier = AGENCIES.find((a) => firstAgency.startsWith(a.name))?.tier ?? "none"; tiers[tier] = (tiers[tier] ?? 0) + 1;
}
console.log(`커리어 ${N} · 데뷔 ${debut} (${Math.round(debut / N * 100)}%) · 데뷔 나이 중앙값 ${med(debutAge)}살`);
console.log("OVR 중앙값(살):", [16, 18, 20, 22, 24, 26, 28, 29, 30, 31, 32, 33, 34].map((a) => `${a}:${med(at[a] ?? [])}`).join(" "));
console.log("인기 중앙값(살):", [20, 22, 24, 26, 28, 29, 30, 31, 32, 33, 34].map((a) => `${a}:${Math.round(med(popAt[a] ?? []))}`).join(" "));
const p90 = (a: number[]) => { const x = [...a].sort((p, q) => p - q); return x[Math.floor(x.length * 0.9)]; };
console.log("인기 상위 10%(살):", [22, 26, 29, 32, 34].map((a) => `${a}:${Math.round(p90(popAt[a] ?? []))}`).join(" "));
console.log(`음방 1위: 평균 ${(wins / N).toFixed(1)}회 · 한 번이라도 ${Math.round(winCareers / N * 100)}% | 인기 순위 1위: ${Math.round(rank1Careers / N * 100)}% 커리어, 아이돌 시즌의 ${(rank1 / idolSeasons * 100).toFixed(1)}%`);
console.log(`본상 평균 ${(bonsang / N).toFixed(2)} · 대상 ${daesang}회 (${Math.round(daesangCareers / N * 100)}% 커리어) · 1위 5회 이상인 해 ${sweepYears} 중 대상 ${sweepDaesang}`);
console.log(`은퇴 시 95 이상 능력 수 중앙값 ${med(n99)} · 예고 합격 ${arts}/${artsTry} · 첫 소속 티어 ${JSON.stringify(tiers)} · 20살에 무소속 ${freeAt18}`);
