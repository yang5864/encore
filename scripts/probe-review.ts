/* 검수용 1회성 측정: 시즌당 이벤트 수와 2개 이상 뜬 시즌의 이벤트 조합 */
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, resolveChoice } from "../lib/game/engine.ts";
import { AGENCIES } from "../lib/game/agencies.ts";
import { DEFAULT_ALLOCATION } from "../lib/game/stats.ts";
import { MAIN_STAT } from "../lib/game/focus.ts";
import { conditionOf } from "../lib/game/format.ts";
import type { Career } from "../lib/game/types.ts";
import { INCIDENT_IDS } from "../lib/game/metrics-model.ts";
let idolSeasons = 0, incidentSeasons = 0;
const positions = ["vocal", "dance", "rap", "visual", "allround", "producer"] as const;
const hist = new Map<number, number>(); const combos = new Map<string, number>(); const byStage = new Map<string, number[]>();
for (const a of AGENCIES) for (let seed = 1; seed <= 6; seed++) {
  const pos = positions[seed % 6];
  let c: Career = createCareer({ name: "테스트", gender: seed % 2 ? "female" : "male", avatar: 0, position: pos, stats: DEFAULT_ALLOCATION[pos] }, seed * 7919 + a.id.length);
  Object.assign(c, { stage: "trainee", agencyId: a.id, agencyJoinedTurn: 0, traineeContractEnd: 6, trust: 30 });
  for (let i = 0; i < 24 && c.stage !== "retired"; i++) {
    const cond = conditionOf(c);
    const focus = c.stage === "idol" ? (cond.level === "danger" ? "rest" : c.lastReleaseTurn !== null && c.turn - c.lastReleaseTurn >= 1 ? "comeback:fresh" : "fanmeet") : (cond.level === "danger" ? "rest" : `train:${MAIN_STAT[c.position]}`);
    const stage = c.stage;
    c = advanceTurn(c, focus);
    const ids: string[] = [];
    while (c.pending) { ids.push(c.pending.id); const ch = c.pending.choices.find((x) => !x.requires) ?? c.pending.choices[0]; c = resolveChoice(c, ch.id, { groupName: "TEST" }); }
    if (stage === "idol") { idolSeasons++; if (ids.some((x) => INCIDENT_IDS.includes(x))) incidentSeasons++; }
    hist.set(ids.length, (hist.get(ids.length) ?? 0) + 1);
    if (!byStage.has(stage)) byStage.set(stage, []); byStage.get(stage)!.push(ids.length);
    if (ids.length >= 2) combos.set(ids.join(" → "), (combos.get(ids.join(" → ")) ?? 0) + 1);
  }
}
console.log("시즌당 이벤트 수 분포", [...hist].sort((a, b) => a[0] - b[0]));
for (const [s, v] of byStage) console.log(s, "평균", (v.reduce((x, y) => x + y, 0) / v.length).toFixed(2), "2개 이상", (v.filter((x) => x >= 2).length / v.length * 100).toFixed(0) + "%");
console.log([...combos].sort((a, b) => b[1] - a[1]).slice(0, 15));
console.log("아이돌 시즌 중 돌발 사건 비율", (incidentSeasons / idolSeasons * 100).toFixed(1) + "%");
