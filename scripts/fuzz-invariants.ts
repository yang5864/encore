/* 검수용 퍼즈: 무작위 합법 선택으로 수백 커리어를 끝까지 돌리며 상태 불변식을 시즌마다 검사한다. */
import { createCareer } from "../lib/game/create.ts";
import { advanceTurn, resolveChoice, choiceLock, focusOptions, applyToAgency, buyItem } from "../lib/game/engine.ts";
import { AGENCIES } from "../lib/game/agencies.ts";
import { DEFAULT_ALLOCATION, STAT_KEYS } from "../lib/game/stats.ts";
import { shopOffers } from "../lib/game/shop.ts";
import { GameError, type Career } from "../lib/game/types.ts";

const positions = ["vocal", "dance", "rap", "visual", "allround", "producer"] as const;
const problems = new Map<string, { n: number; ex: string }>();
const note = (k: string, ex: string) => { const p = problems.get(k); if (p) p.n++; else problems.set(k, { n: 1, ex }); };
let seasons = 0, careers = 0, retired = 0;
function check(c: Career, where: string) {
  const ctx = `${where} seed=${c.seed} turn=${c.turn} stage=${c.stage}`;
  for (const k of STAT_KEYS) { const v = c.stats[k]; if (!Number.isInteger(v) || v < 0 || v > 99) note(`stat ${k} 범위/정수`, `${ctx} ${v}`); }
  const ranged: [string, number, number, number][] = [["popularity", c.popularity, 0, 100], ["health", c.health, 0, 100], ["mental", c.mental, 0, 100], ["trust", c.trust, 0, 100], ["loyalty", c.loyalty, 0, 100], ["chemistry", c.chemistry, 0, 100], ["buzz", c.buzz ?? 0, 0, 100], ["reputation", c.reputation, -100, 100]];
  for (const [name, v, lo, hi] of ranged) if (!Number.isFinite(v) || v < lo - 1e-9 || v > hi + 1e-9) note(`${name} 범위`, `${ctx} ${v}`);
  if (!Number.isInteger(c.fans) || c.fans < 0) note("fans 정수·음수", `${ctx} ${c.fans}`);
  for (const [k, v] of Object.entries(c.money)) if (typeof v === "number" && !Number.isFinite(v)) note(`money.${k} NaN`, `${ctx} ${v}`);
  for (const [k, v] of Object.entries(c.flags)) if (typeof v === "number" && !Number.isFinite(v)) note(`flags.${k} NaN`, `${ctx} ${v}`);
  if (c.pending && !c.pending.choices.some((x) => !choiceLock(c, x))) note("모든 선택지가 잠긴 이벤트", `${ctx} ${c.pending.id}`);
  if (c.pending && c.pending.choices.length === 0) note("선택지 없는 이벤트", `${ctx} ${c.pending.id}`);
}
let r = 12345; const rand = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
for (let seed = 1; seed <= 300; seed++) {
  careers++;
  const pos = positions[seed % 6];
  let c = createCareer({ name: "퍼즈", gender: seed % 2 ? "female" : "male", avatar: seed % 18, position: pos, stats: DEFAULT_ALLOCATION[pos] }, seed * 2654435761 % 1e9);
  for (let i = 0; i < 60 && c.stage !== "retired"; i++) {
    if (c.stage === "free" && rand() < 0.5) { try { c = applyToAgency(c, AGENCIES[Math.floor(rand() * AGENCIES.length)].id); } catch (e) { if (!(e instanceof GameError)) note("지원 예외", String(e)); } }
    if (c.stage === "idol" && rand() < 0.3) { const o = shopOffers(c)[0]; if (o) { try { c = buyItem(c, o.id); } catch (e) { if (!(e instanceof GameError)) note("상점 예외", String(e)); } } }
    while (c.pending) {
      const open = c.pending.choices.filter((x) => !choiceLock(c, x));
      const ch = (open.length ? open : c.pending.choices)[Math.floor(rand() * (open.length || c.pending.choices.length))];
      try { c = resolveChoice(c, ch.id, { groupName: "FUZZ", albumName: "X", reaction: ["joy", "cry", "calm"][Math.floor(rand() * 3)] }); }
      catch (e) { note(e instanceof GameError ? `선택 거절(GameError): ${(e as Error).message}` : "선택 예외", `seed=${seed} turn=${c.turn} ${c.pending?.id}/${ch.id} ${String(e).slice(0, 120)}`); c = { ...c, pending: null }; }
      check(c, "choice");
    }
    if (c.stage === "retired") break;
    const opts = focusOptions(c).filter((o) => !o.disabledReason);
    let focus = opts.length ? opts[Math.floor(rand() * opts.length)].id : "rest";
    if (focus === "comeback") focus = `comeback:${["fresh", "performance", "girlcrush", "ballad"][Math.floor(rand() * 4)]}:${["inhouse", "star", "self"][Math.floor(rand() * 3)]}:${(c.popularity >= 55 ? ["balanced", "digital", "physical", "global"] : ["balanced", "digital", "physical"])[Math.floor(rand() * (c.popularity >= 55 ? 4 : 3))]}:`;
    if (focus === "train") focus = `train:${STAT_KEYS[Math.floor(rand() * STAT_KEYS.length)]}`;
    try { c = advanceTurn(c, focus); seasons++; }
    catch (e) {
      if (!(e instanceof GameError)) note("시즌 예외", `seed=${seed} turn=${c.turn} focus=${focus} ${String(e).slice(0, 160)}`);
      else { note(`시즌 거절(GameError): ${(e as Error).message}`, `seed=${seed} turn=${c.turn} focus=${focus}`); try { c = advanceTurn(c, "rest"); seasons++; } catch (e2) { note("휴식도 거절", `seed=${seed} ${String(e2).slice(0, 100)}`); break; } }
    }
    check(c, "season");
  }
  if (c.stage === "retired") retired++;
}
console.log(`커리어 ${careers} · 시즌 ${seasons} · 은퇴까지 ${retired}`);
for (const [k, v] of [...problems].sort((a, b) => b[1].n - a[1].n)) console.log(`${v.n}회  ${k}  예: ${v.ex}`);
