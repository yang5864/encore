/* 14개 기획사 × 6개 시드로 22세까지 자동 플레이해 OVR·인기도·정산 분포를 출력한다. */
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, resolveChoice } from "../lib/game/engine.ts";
import { AGENCIES } from "../lib/game/agencies.ts";
import { DEFAULT_ALLOCATION, overall } from "../lib/game/stats.ts";
import { MAIN_STAT } from "../lib/game/focus.ts";
import { conditionOf, reputationLabel } from "../lib/game/format.ts";
import type { Career } from "../lib/game/types.ts";

const positions = ["vocal", "dance", "rap", "visual", "allround", "producer"] as const;
const rows: { agency: string; seed: number; ovr22: number; pop22: number; fans22: number; debutAge: number | null; rep22: number; settled: number; ovr26: number; pop26: number; wins: number; events: number }[] = [];

for (const a of AGENCIES) {
  for (let seed = 1; seed <= 6; seed++) {
    const pos = positions[seed % positions.length];
    let c: Career = createCareer({ name: "테스트", gender: seed % 2 ? "female" : "male", avatar: 0, position: pos, stats: DEFAULT_ALLOCATION[pos] }, seed * 7919 + a.id.length);
    c.stage = "trainee";
    c.agencyId = a.id;
    c.agencyJoinedTurn = 0;
    c.traineeContractEnd = 6;
    c.trust = 30;
    let events = 0;
    let ovr22 = 0, pop22 = 0, fans22 = 0, rep22 = 0;
    for (let i = 0; i < 24 && c.stage !== "retired"; i++) {
      let focus: string;
      const cond = conditionOf(c);
      if (c.stage === "idol") {
        focus = cond.level === "danger" ? "rest" : c.lastReleaseTurn !== null && c.turn - c.lastReleaseTurn >= 1 ? "comeback:fresh" : c.popularity >= 55 && i % 3 === 0 ? "overseas" : "promo";
      } else {
        focus = cond.level === "danger" ? "rest" : i % 3 === 2 ? "train:all" : `train:${MAIN_STAT[c.position]}`;
      }
      c = advanceTurn(c, focus);
      while (c.pending) {
        events++;
        const choice = c.pending.choices.find((x) => !x.requires) ?? c.pending.choices[0];
        c = resolveChoice(c, choice.id, { groupName: "TEST" });
      }
      if (c.turn === 16) { ovr22 = overall(c.stats, c.position); pop22 = Math.round(c.popularity); fans22 = c.fans; rep22 = Math.round(c.reputation); }
    }
    rows.push({ agency: a.id, seed, ovr22, pop22, fans22, debutAge: c.debutTurn === null ? null : 14 + Math.floor(c.debutTurn / 2), rep22, settled: c.money.settled, ovr26: overall(c.stats, c.position), pop26: Math.round(c.popularity), wins: c.musicWins, events });
  }
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const debuted = rows.filter((r) => r.debutAge !== null);
console.log(`표본 ${rows.length} · 데뷔 ${debuted.length} (${Math.round((debuted.length / rows.length) * 100)}%)`);
console.log(`22세 OVR 중앙값 ${median(rows.map((r) => r.ovr22))} 평균 ${mean(rows.map((r) => r.ovr22)).toFixed(1)} 범위 ${Math.min(...rows.map((r) => r.ovr22))}~${Math.max(...rows.map((r) => r.ovr22))}`);
console.log(`26세 OVR 중앙값 ${median(rows.map((r) => r.ovr26))}`);
console.log(`데뷔 나이 중앙값 ${median(debuted.map((r) => r.debutAge!))} 범위 ${Math.min(...debuted.map((r) => r.debutAge!))}~${Math.max(...debuted.map((r) => r.debutAge!))}`);
console.log(`22세 인기도 중앙값 ${median(rows.map((r) => r.pop22))} · 팬 중앙값 ${median(rows.map((r) => r.fans22))} · 평판 중앙값 ${median(rows.map((r) => r.rep22))} (${reputationLabel(median(rows.map((r) => r.rep22)))})`);
console.log(`26세 인기도 중앙값 ${median(rows.map((r) => r.pop26))} · 첫 정산 받은 비율 ${Math.round((rows.filter((r) => r.settled > 0).length / rows.length) * 100)}% · 음방 1위 평균 ${mean(rows.map((r) => r.wins)).toFixed(1)} · 턴당 이벤트 ${(mean(rows.map((r) => r.events)) / 24).toFixed(2)}`);
for (const tier of ["major", "mid", "indie", "global"]) {
  const ids = AGENCIES.filter((a) => a.tier === tier).map((a) => a.id);
  const rs = rows.filter((r) => ids.includes(r.agency));
  console.log(`  ${tier}: OVR22 ${median(rs.map((r) => r.ovr22))} · 데뷔 ${Math.round((rs.filter((r) => r.debutAge !== null).length / rs.length) * 100)}% · 인기26 ${median(rs.map((r) => r.pop26))} · 정산 ${median(rs.map((r) => r.settled)).toFixed(1)}억`);
}
