/* 같은 시드로 전략별 결과를 비교해 지배 전략이 있는지 본다. */
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, resolveChoice, choiceLock } from "../lib/game/engine.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { conditionOf } from "../lib/game/format.ts";
import type { Career, Concept } from "../lib/game/types.ts";

type Strat = (c: Career, i: number) => string;
const best = (c: Career): Concept => c.position === "vocal" ? "ballad" : c.position === "rap" ? "girlcrush" : c.position === "dance" ? "performance" : "fresh";
const rot: Concept[] = ["fresh", "performance", "girlcrush", "ballad"];
const STRATS: Record<string, Strat> = {
  "같은 콘셉트 연타": (c) => c.lastReleaseTurn === c.turn ? "fanmeet" : `comeback:${best(c)}:inhouse:balanced:`,
  "콘셉트 로테이션+팬미팅": (c, i) => c.lastReleaseTurn === c.turn ? "fanmeet" : i % 3 === 2 ? "fanmeet" : `comeback:${rot[c.albums.length % 4]}:inhouse:${c.albums.length % 2 ? "physical" : "digital"}:`,
  "유명 프로듀서+음원": (c) => c.lastReleaseTurn === c.turn ? "fanmeet" : `comeback:${c.albums.length % 2 ? best(c) : rot[c.albums.length % 4]}:star:digital:`,
  "자작곡 빌드": (c) => c.lastReleaseTurn === c.turn ? "fanmeet" : `comeback:${c.albums.length % 2 ? "ballad" : best(c)}:self:balanced:`,
  "팬덤 올인(음반+팬미팅)": (c, i) => c.lastReleaseTurn === c.turn ? "fanmeet" : i % 2 ? "fanmeet" : `comeback:${rot[c.albums.length % 4]}:inhouse:physical:`,
};
for (const [name, strat] of Object.entries(STRATS)) {
  const rows: { pop: number; fans: number; wins: number; settled: number; loyalty: number; kpi: number }[] = [];
  for (let seed = 1; seed <= 24; seed++) {
    const pos = (["vocal", "dance", "rap", "visual", "producer"] as const)[seed % 5];
    let c = createCareer({ name: "t", gender: seed % 2 ? "female" : "male", avatar: 0, position: pos, stats: DEFAULT_ALLOCATION[pos] }, seed * 97);
    Object.assign(c, { stage: "trainee", agencyId: ["sm", "starship", "rbw"][seed % 3], agencyJoinedTurn: 0, traineeContractEnd: 6, trust: 30 });
    for (let i = 0; i < 28 && c.stage !== "retired"; i++) {
      const f = conditionOf(c).level === "danger" ? "rest" : c.stage === "idol" ? strat(c, i) : "train:all";
      try { c = advanceTurn(c, f); } catch { c = advanceTurn(c, "rest"); }
      while (c.pending) { const ch = c.pending.choices.find((x) => !choiceLock(c, x) && x.op !== "retire" && x.op !== "solo") ?? c.pending.choices.find((x) => !choiceLock(c, x))!; c = resolveChoice(c, ch.id, { groupName: "T" }); }
    }
    rows.push({ pop: Math.round(c.popularity), fans: c.fans, wins: c.musicWins, settled: c.money.settled, loyalty: Math.round(c.loyalty), kpi: c.flags.kpiHits ?? 0 });
  }
  const med = (k: keyof (typeof rows)[0]) => { const s = rows.map((r) => r[k]).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  console.log(`${name.padEnd(16)} 인기 ${med("pop")} · 팬 ${med("fans").toLocaleString()} · 음방1위 ${med("wins")} · 정산 ${med("settled").toFixed(0)}억 · 결속 ${med("loyalty")} · KPI달성 ${med("kpi")}`);
}
