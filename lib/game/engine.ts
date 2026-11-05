import type { ActiveEvent, Career, ChoiceDef, Comment, Concept, Effects, MilestoneId, StatKey, Tone, TurnResult } from "./types.ts";
import { GameError } from "./types.ts";
import { AGENCIES, agencyById, auditionChance, TIERS } from "./agencies.ts";
import { STAT_KEYS, STAT_NAMES, overall } from "./stats.ts";
import { ageOf, ageText, conditionOf, displayName, eraScale, fanText, isSecondHalf, MAX_TURN, periodLabel, yearOf } from "./format.ts";

const hasBatchim = (w: string) => { const ch = w.charCodeAt(w.length - 1); return ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0; };
import { rng, between, pick } from "./rng.ts";
import { applyEffects, addReputation, diff, log, snapshot, type Snapshot } from "./effects.ts";
import { CONCEPTS, DANGER_LOCK, MAIN_STAT, inCooldown, isPublicFocus, focusLabel, lowestStat, soloChance, soloStat, SOLO_LABELS, SOLO_UNLOCK_TURNS, type SoloKind } from "./focus.ts";
import { makeAlbum, albumSummary, addShowWin, ALBUM_NAME_PATTERN, DEFAULT_PRODUCTION } from "./album.ts";
import { MUSIC_SHOWS, winChance, addBuzz, BUZZ_DECAY, INCIDENT_IDS } from "./metrics-model.ts";
import { PRODUCERS, PROMOS } from "./focus.ts";
import { makeKpi, kpiMet } from "./kpi.ts";
import { BUDGET_PRESETS, budgetOf, rivalFor } from "./team.ts";
import type { Production } from "./types.ts";
import type { Award } from "./types.ts";
import { yearEndAwards, SHOW_FULL, YEAR_END_STAGES } from "./awards.ts";
import { DEBUT_COST, TRAINEE_COST_PER_TURN, updateSettlement } from "./economy.ts";
import { checkMilestones } from "./milestones.ts";
import { endingFor } from "./endings.ts";
import { buildReactions } from "./reactions.ts";
import { updateMetrics, metricTargets } from "./metrics.ts";
import { debutEvaluation, scheduleEvent, activate } from "./schedule.ts";
import { eventById } from "./events/index.ts";
import { bankruptcyRisk } from "./renewal.ts";
import { rankingFor } from "./brand-rank.ts";
import { decodeEta, etaLabel, setDebutEta } from "./debut.ts";
import { boughtThisSeason, priceOf, shopOffers, walletOf } from "./shop.ts";

export { focusOptions } from "./focus.ts";
export { createCareer } from "./create.ts";

/** 지원은 시즌마다 세 곳까지. */
export const APPLY_PER_SEASON = 3;
/** 지망생·연습생 시절 포텐이 터질 확률(시즌당). 19세까지 약 16시즌이면 커리어당 약 21%. */
export const BURST_CHANCE = 0.015;

/** 현역 복무 기간(개월): 육군·해병 18, 해군 20, 공군 21 */
export const MILITARY_MONTHS: Record<string, number> = { army: 18, navy: 20, airforce: 21 };

/** 빌보드 Hot 100 1위는 커리어 최고 순간 중 하나라 전체 화면으로 띄운다. */
function billboardSpotlight(c: Career, album: { name: string; billboard: number | null; sales: number }): TurnResult["spotlight"] {
  if (album.billboard !== 1) return undefined;
  return {
    chip: `${yearOf(c)} BILLBOARD HOT 100`,
    title: "빌보드 Hot 100\n1위에 올랐어요",
    subtitle: `${displayName(c)}의 '${album.name}'${hasBatchim(album.name) ? "이" : "가"} 미국 종합 싱글 차트 정상에 섰어요`,
    stats: [`초동 ${album.sales >= 10000 ? `${Math.round(album.sales / 10000)}만` : album.sales.toLocaleString("ko-KR")}장`, `코어 팬덤 ${fanText(c.fans)}`],
  };
}

/** 복무 중 고른 길(flags.servicePath 1~3). 전역 결과에 한 줄로 남는다. */
const SERVICE_PATHS: Record<number, { discharge: string }> = {
  1: { discharge: "군악대·홍보대사로 복무하며 무대 감각을 지켜서 돌아왔어요." },
  2: { discharge: "일반 복무로 몸과 마음을 푹 쉬고 돌아왔어요." },
  3: { discharge: "체력 단련에 집중해 몸을 만들어 돌아왔어요." },
};

const DEBUT_FANS: Record<string, number> = { major: 350000, mid: 70000, indie: 5000, global: 50000 };
export const GROUP_NAME_PATTERN = /^[\p{L}\p{N} _·!-]{1,20}$/u;

const clone = (c: Career): Career => structuredClone(c);

function ageMultiplier(age: number) {
  return age <= 17 ? 1 : age <= 21 ? 0.85 : age <= 25 ? 0.6 : age <= 29 ? 0.35 : 0.15;
}

/** Half-year training growth with potential headroom. */
function grow(c: Career, stat: StatKey, amount: number) {
  const a = agencyById(c.agencyId);
  const agencyMul = c.stage === "trainee" ? (a?.training ?? 1) * (a?.stat === stat ? 1.1 : 1) : c.stage === "free" ? 0.6 : 0.5;
  const school = c.schoolId === "arts" && (stat === "dance" || stat === "visual") ? 1.15 : c.schoolId === "ged" ? 1.1 : 1;
  const headroom = Math.max(0.12, Math.min(1, (c.potential[stat] - c.stats[stat]) / 28));
  const roleMul = MAIN_STAT[c.position] === stat ? 1.12 : 1; // 역할의 주력 능력은 조금 더 빨리 자란다
  const gain = amount * ageMultiplier(ageOf(c)) * agencyMul * school * headroom * roleMul * (0.9 + rng(c) * 0.2);
  // 능력치는 정수만 쓴다: 소수 부분은 확률로 올림해 평균 성장량을 유지한다
  const whole = Math.floor(gain);
  const extra = rng(c) < gain - whole ? 1 : 0;
  c.stats[stat] = Math.min(99, c.stats[stat] + whole + extra);
}

function popularityTarget(c: Career): number {
  // 코어 팬덤 5천 → 약 27, 35만 → 약 46, 150만 → 약 52, 500만 → 약 56 (+평판·차트 보정)
  const base = 8.3 * Math.log10(c.fans / eraScale(yearOf(c)) + 1) + Math.max(0, c.reputation) * 0.12;
  const recent = c.albums.filter((a) => c.turn - a.turn <= 2);
  const chart = Math.min(18, recent.reduce((s, a) => s + (a.melon !== null ? Math.max(0, 50 - a.melon) / 4 : 0) + a.wins * 1 + (a.billboard !== null ? 5 : 0), 0));
  const t = (base + chart + (c.buzz ?? 0) * 0.12) * (c.stage === "idol" ? 1 : 0.5);
  return Math.max(0, Math.min(100, t));
}

function buildResult(c: Career, before: Snapshot, headline: string, text: string, tone: Tone, opts: { scene?: string; notes?: string[]; comments?: Comment[]; milestones?: MilestoneId[]; awards?: Award[]; celebrate?: TurnResult["celebrate"]; spotlight?: TurnResult["spotlight"] } = {}): TurnResult {
  const after = snapshot(c);
  return {
    headline,
    text,
    scene: opts.scene,
    tone,
    changes: diff(before, after, c.stage === "idol" || c.stage === "retired"),
    comments: opts.comments ?? [],
    milestones: opts.milestones ?? [],
    notes: opts.notes ?? [],
    awards: opts.awards?.length ? opts.awards : undefined,
    celebrate: opts.celebrate,
    spotlight: opts.spotlight,
  };
}

function finish(c: Career, before: Snapshot, headline: string, text: string, tone: Tone, opts: { scene?: string; notes?: string[]; comments?: Comment[]; awards?: Award[]; celebrate?: TurnResult["celebrate"]; spotlight?: TurnResult["spotlight"] } = {}) {
  updateSettlement(c);
  updateMetrics(c);
  c.popularity = Math.max(0, Math.min(100, c.popularity));
  c.peakPopularity = Math.max(c.peakPopularity, Math.round(c.popularity));
  if (c.stage === "idol") {
    // 브랜드평판 최고 순위를 기억한다 (톱티어 제안 기준)
    const r = rankingFor(c, yearOf(c), isSecondHalf(c));
    if (!r.outside) c.flags.bestRank = Math.min(c.flags.bestRank ?? 999, r.me.rank);
    const tl = (c.timeline ??= []);
    const point = { turn: c.turn, popularity: Math.round(c.popularity), fans: c.fans, rank: r.outside ? null : r.me.rank };
    if (tl.length && tl[tl.length - 1].turn === c.turn) tl[tl.length - 1] = point;
    else tl.push(point);
  }
  const milestones = checkMilestones(c);
  if (milestones.includes("firstSettlement")) log(c, "첫 정산", "투자비를 모두 회수했어요. 이제 번 돈이 내 몫으로 들어와요.", "milestone");
  const celebrate = opts.celebrate;
  c.result = buildResult(c, before, headline, text, milestones.length ? "milestone" : tone, { ...opts, milestones, celebrate });
}

// ─────────────────────────── 시즌 진행 ───────────────────────────

export function advanceTurn(original: Career, focusId: string): Career {
  const c = clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 인생예요. 새 이야기를 시작해보세요.");
  if (c.pending) throw new GameError("먼저 지금의 선택을 마쳐주세요.");
  c.result = null;
  c.flags.prevPopularity = c.popularity;
  c.flags.prevFans = c.fans;
  const before = snapshot(c);
  const notes: string[] = [];
  let tone: Tone = "neutral";
  let scene: string | undefined;
  let comments: Comment[] = [];
  let wonAwards: Award[] = [];
  let celebrate: TurnResult["celebrate"];
  let spotlight: TurnResult["spotlight"];

  // 군 복무: 한 번에 건너뛴다
  if (c.militaryUntil > c.turn) {
    const months = c.flags.militaryMonths ?? (c.militaryUntil - c.turn) * 6;
    const prep = (c.militaryUntil - c.turn) * 6 - months;
    c.turn = c.militaryUntil;
    c.fans = Math.round(c.fans * 0.9);
    c.popularity = Math.max(0, c.popularity - 8);
    c.health = Math.min(100, c.health + 20);
    c.mental = Math.min(100, c.mental + 10);
    for (const k of STAT_KEYS) c.stats[k] = Math.max(0, c.stats[k] - 1);
    const path = SERVICE_PATHS[c.flags.servicePath ?? 0];
    log(c, "전역", `${months}개월의 복무를 마치고 돌아왔어요. ${path ? path.discharge : "팬들이 기다리고 있었어요."}`, "milestone");
    c.pending = scheduleEvent(c);
    c.lastResult = null;
    finish(c, before, "전역했어요", `${months}개월의 복무를 마쳤어요.${path ? ` ${path.discharge}` : ""}${prep > 0 ? ` 남은 ${prep}개월은 몸을 만들며 복귀를 준비했어요.` : ""} 팬들이 기다리고 있었어요. 다시 무대로 돌아갈 시간이에요.`, "good", { scene: "military" });
    return c;
  }

  // 화제성과 미디어 열기는 시즌이 시작되며 먼저 식는다. 활동이 없으면 브랜드평판이 눈에 띄게 내려앉는다
  c.buzz = Math.round((c.buzz ?? 0) * BUZZ_DECAY);
  c.flags.mediaHeat = Math.round((c.flags.mediaHeat ?? 0) * 0.5);
  {
    const prevIg = c.flags.prevInstagram ?? c.metrics?.instagram ?? 0;
    const nowIg = c.metrics?.instagram ?? 0;
    c.flags.snsGrowth = prevIg > 0 ? Math.max(0, Math.min(50, Math.round(((nowIg - prevIg) / prevIg) * 100))) : 0;
    c.flags.prevInstagram = nowIg;
  }
  const [kind, arg, ...restParts] = (c.hiatusUntil > c.turn ? "rest" : focusId).split(":");
  if (kind !== "rest" && conditionOf(c).level === "danger") throw new GameError(DANGER_LOCK);
  // comeback:<concept>:<producer>:<promo>:<encodedName> (구형 comeback:<concept>:<encodedName>도 받는다)
  let production: Production = { ...DEFAULT_PRODUCTION };
  let nameParts = restParts;
  if (kind === "comeback" && restParts.length >= 3) {
    const [producer, promo, ...rest] = restParts;
    if (!PRODUCERS.some((p) => p.id === producer) || !PROMOS.some((p) => p.id === promo)) throw new GameError("제작 방식을 골라주세요.");
    production = { producer: producer as Production["producer"], promo: promo as Production["promo"] };
    nameParts = rest;
  }
  if (production.promo === "global" && c.popularity < 55) throw new GameError("해외 집중 프로모션은 인기도 55 이상부터예요.");
  const albumName = nameParts.length ? decodeURIComponent(nameParts.join(":")) : "";
  if (albumName && !ALBUM_NAME_PATTERN.test(albumName)) throw new GameError("앨범 이름은 1~20자로 입력해주세요.");
  let headline = focusLabel(kind === "train" && !arg ? "train:all" : focusId);
  let text = "";
  const period = periodLabel(c);

  if (c.stage === "free" || c.stage === "trainee") {
    if (kind === "train" && arg && arg !== "all") {
      const stat = arg as StatKey;
      if (!STAT_KEYS.includes(stat)) throw new GameError("훈련할 능력을 골라주세요.");
      grow(c, stat, 6);
      for (const k of STAT_KEYS) if (k !== stat) grow(c, k, 1.5);
      c.health -= 10;
      c.mental -= 5;
      text = `${period}, ${STAT_NAMES[stat]}에 집중했어요.`;
    } else if (kind === "train") {
      for (const k of STAT_KEYS) grow(c, k, 3);
      c.health -= 8;
      c.mental -= 4;
      text = `${period}, 모든 능력을 고르게 다듬었어요.`;
    } else if (kind === "rest") {
      c.health += 35;
      c.mental += 30;
      text = `${period}, 충분히 쉬었어요. 몸과 마음이 가벼워졌어요.`;
      headline = "휴식";
    } else throw new GameError("선택할 수 없는 계획이에요.");
    if (!c.flags.burst && ageOf(c) <= 19 && rng(c) < BURST_CHANCE) {
      // 포텐 폭발: 숨은 잠재력 한도와 실력이 한꺼번에 오른다
      for (const k of STAT_KEYS) {
        c.potential[k] = Math.min(99, c.potential[k] + 8 + Math.floor(rng(c) * 8));
        c.stats[k] = Math.min(99, c.stats[k] + 3 + Math.floor(rng(c) * 5) + (k === MAIN_STAT[c.position] ? 4 : 0));
      }
      c.flags.burst = c.turn + 1;
      headline = "포텐이 터졌어요";
      text = `${period}, 연습실 영상 하나가 업계에 돌았어요. 몇 달 만에 실력이 한 단계 올라섰어요. 큰 회사들이 이름을 묻기 시작했어요.`;
      tone = "good";
      scene = "practice";
      log(c, "포텐 폭발", "실력과 잠재력이 한꺼번에 뛰었어요.", "milestone");
    }
    if (c.stage === "trainee") {
      c.money.invested += Math.round(TRAINEE_COST_PER_TURN * eraScale(yearOf(c)) * 10) / 10;
      c.trust = Math.min(100, c.trust + 4);
    }
  } else if (c.stage === "idol") {
    if (kind === "comeback") {
      if (c.lastReleaseTurn === c.turn) throw new GameError("이번 시즌에 이미 앨범을 냈어요.");
      const concept = arg as Concept;
      if (!CONCEPTS.some((x) => x.id === concept)) throw new GameError("콘셉트를 골라주세요.");
      const album = makeAlbum(c, concept, albumName, production);
      headline = `${c.albums.length === 1 ? "데뷔 앨범" : "새 앨범"} ${album.name}`;
      if (c.flags.rivalClash === c.turn) {
        const rv = rivalFor({ ...c, turn: c.turn })!;
        const beat = album.melon !== null && album.melon <= 5;
        if (beat) { c.popularity += 3; addReputation(c, 2); notes.push(`${rv.name} 컴백과 맞붙어 차트에서 이겼어요. 화제성이 붙어요.`); }
        else notes.push(`${rv.name} 컴백과 시기가 겹쳐 초동·차트·음방 점수를 나눠 가졌어요.`);
        delete c.flags.rivalClash;
      }
      if (production.producer === "self") notes.push(c.stats.producing >= 55 ? "자작곡이 좋은 평가를 받았어요. 프로듀싱 실력이 늘어요." : "자작곡의 완성도가 아쉬웠어요. 프로듀싱을 더 키우거나 외부 제작을 고려해요.");
      text = albumSummary(album);
      scene = "album";
      tone = album.melon !== null && album.melon <= 10 || album.wins > 0 ? "good" : "neutral";
      log(c, headline, text, "release");
      if (album.wins > 0) log(c, `음악방송 1위 ${album.wins}회`, `${album.name} 활동으로 1위 트로피를 들었어요.`, "award");
      if (album.billboard !== null) log(c, `빌보드 Hot 100 ${album.billboard}위`, "타이틀곡이 미국 종합 차트에 올랐어요.", "award");
      if (c.flags.albumViral === c.turn) { tone = "good"; notes.push("타이틀곡이 숏폼에서 터졌어요. 예상보다 훨씬 많은 사람이 들었어요."); }
      if (c.flags.albumFlop === c.turn) { tone = "bad"; notes.push("이번 앨범은 반응이 차가웠어요. 팬덤 일부가 이탈했어요."); }
      if (album.wins > 0) celebrate = "win";
      spotlight = billboardSpotlight(c, album);
      if (spotlight) { celebrate = "daesang"; tone = "milestone"; }
      comments = buildReactions(c, tone === "good" || tone === "milestone" ? "good" : tone === "bad" ? "bad" : "neutral", { kind: album.wins > 0 ? "win" : c.flags.albumViral === c.turn ? "album-viral" : c.flags.albumFlop === c.turn ? "album-flop" : "album", album: album.name, show: album.shows?.[0], melon: album.melon });
    } else if (kind === "promo") {
      grow(c, "variety", 4);
      grow(c, "visual", 1.5);
      c.popularity += 3;
      applyEffects(c, { fansMul: 1.05 });
      addReputation(c, 3);
      c.money.revenue += 1.5;
      c.health -= 8;
      c.mental -= 2;
      text = `${period}, 예능과 라디오를 돌며 얼굴을 알렸어요.`;
      scene = "variety";
      comments = buildReactions(c, "good", { kind: "variety" });
    } else if (kind === "fanmeet") {
      applyEffects(c, { fansMul: 1.1 });
      addReputation(c, 4);
      c.money.revenue += 2;
      c.loyalty = Math.min(100, c.loyalty + 12);
      if (!c.flags.solo) c.chemistry = Math.min(100, c.chemistry + 3);
      addBuzz(c, 4);
      c.mental += 6;
      c.health -= 4;
      grow(c, "variety", 1.5);
      text = `${period}, 팬미팅과 자체 콘텐츠로 팬들과 가까워졌어요.`;
      scene = "fansign";
      comments = buildReactions(c, "good", { kind: "fanmeet" });
    } else if (kind === "overseas") {
      if (c.popularity < 55) throw new GameError("인기도가 더 필요해요.");
      applyEffects(c, { fansMul: 1.12 });
      c.popularity += 3;
      c.loyalty = Math.max(0, c.loyalty - 3);
      addBuzz(c, 8);
      c.money.revenue += 6;
      c.health -= 12;
      c.mental -= 4;
      addReputation(c, 3);
      c.flags.globalBoost = c.turn + 1;
      text = `${period}, 해외 투어와 쇼케이스를 돌았어요. 다음 앨범의 해외 반응이 기대돼요.`;
      scene = "tour";
      comments = buildReactions(c, "good", { kind: "tour" });
    } else if (kind === "solo") {
      const solo = arg as SoloKind;
      if (!SOLO_LABELS[solo]) throw new GameError("개인 활동을 골라주세요.");
      if (c.debutTurn === null || c.turn - c.debutTurn < SOLO_UNLOCK_TURNS) throw new GameError("데뷔 3년 뒤부터 개인 활동을 할 수 있어요.");
      const stat = soloStat(c, solo);
      const p = soloChance(c, solo);
      const success = rng(c) < p;
      grow(c, stat, success ? 3 : 1.5);
      c.health -= 8;
      c.loyalty = Math.max(0, c.loyalty - 5); // 개인 활동 동안 그룹 팬덤은 서운하다
      if (!c.flags.solo) c.chemistry = Math.max(0, c.chemistry - 6); // 멤버들은 빈자리를 느낀다
      c.flags[`solo:${solo}`] = (c.flags[`solo:${solo}`] ?? 0) + (success ? 1 : 0);
      const statName = STAT_NAMES[stat];
      if (success) {
        tone = "good";
        addBuzz(c, 12);
        c.flags.mediaHeat = Math.min(100, (c.flags.mediaHeat ?? 0) + 15);
        if (solo === "acting") { c.popularity += 7; applyEffects(c, { fansMul: 1.1, reputation: 5, revenue: 6 }); headline = "드라마 흥행 — 연기돌로 인정"; text = `${period}, 출연한 작품이 화제가 됐어요. '연기 되는 아이돌' 수식어가 붙었어요.`; scene = "drama"; }
        else if (solo === "solo") { c.popularity += 6; applyEffects(c, { fansMul: 1.1, reputation: 4, revenue: 9 }); headline = "솔로 앨범 성공"; text = `${period}, 내 이름으로 낸 앨범이 좋은 성적을 냈어요. ${statName} 실력이 빛났어요.`; scene = "songwriting"; }
        else if (solo === "variety") { c.popularity += 9; applyEffects(c, { fansMul: 1.08, reputation: 4, revenue: 4 }); headline = "예능 캐릭터가 터졌다"; text = `${period}, 고정 예능과 개인 채널이 동시에 떴어요. 대중이 이름을 기억해요.`; scene = "variety"; }
        else { c.popularity += 3; applyEffects(c, { reputation: 5, revenue: 8 }); headline = "프로듀싱 곡이 차트에 올랐다"; text = `${period}, 다른 가수에게 준 곡이 히트했어요. 작곡가 크레딧에 이름이 쌓여요.`; scene = "songwriting"; }
        comments = buildReactions(c, "good", { kind: solo === "acting" ? "acting-hit" : solo === "solo" ? "solo-hit" : solo === "variety" ? "variety-hit" : "produce-hit" });
      } else {
        tone = "bad";
        c.mental -= 8;
        c.popularity -= 2;
        applyEffects(c, { revenue: 1 });
        if (solo === "acting") { addReputation(c, -4); headline = "연기력 논란"; text = `${period}, 출연작에서 연기력 지적을 받았어요. 비주얼만으로는 배역을 끌고 가기 어려웠어요.`; scene = "drama"; }
        else if (solo === "solo") { headline = "솔로 앨범 부진"; text = `${period}, 솔로 앨범 반응이 조용했어요. ${statName} 실력이 아직 솔로를 끌고 가기엔 부족했어요.`; scene = "songwriting"; }
        else if (solo === "variety") { headline = "예능에서 묻혔다"; text = `${period}, 고정 예능에서 존재감이 없었어요. 예능 수치가 낮으면 분량이 안 나와요.`; scene = "variety"; }
        else { headline = "곡이 채택되지 않았다"; text = `${period}, 보낸 데모가 채택되지 않았어요. 프로듀싱 실력을 더 쌓아야 해요.`; scene = "songwriting"; }
        comments = buildReactions(c, "bad", { kind: solo === "acting" ? "acting-flop" : solo === "solo" ? "solo-flop" : solo === "variety" ? "variety-flop" : "produce-flop" });
      }
      notes.push(`${SOLO_LABELS[solo].label}의 성공 가능성은 ${statName} 수치가 정해요.`);
    } else if (kind === "rest") {
      c.health += 35;
      c.mental += 30;
      c.fans = Math.round(c.fans * 0.97);
      text = `${period}, 휴식기를 가졌어요. 팬들은 기다려줬어요.`;
      headline = "휴식기";
      scene = "rest";
    } else throw new GameError("선택할 수 없는 계획이에요.");
    c.trust = Math.min(100, c.trust + 2);

    // ── 자숙 기간: 논란이 가라앉기 전에 공개 활동을 하면 여론이 돌아선다 ──
    if (inCooldown({ flags: c.flags, turn: c.turn })) {
      if (isPublicFocus(kind)) {
        if (rng(c) < 0.8) {
          c.popularity = Math.max(0, c.popularity - 6);
          c.loyalty = Math.max(0, c.loyalty - 8);
          addReputation(c, -5);
          c.buzz = Math.max(0, (c.buzz ?? 0) - 10);
          notes.push("논란이 가라앉기 전에 활동을 강행했어요. 여론이 더 나빠졌어요.");
          tone = "bad";
        } else {
          addBuzz(c, 25);
          addReputation(c, 6);
          notes.push("정면 돌파가 통했어요. 여론이 돌아섰어요.");
          delete c.flags.scandalCooldown;
        }
      } else if (kind === "rest" || kind === "fanmeet") {
        c.flags.scandalCooldown = (c.flags.scandalCooldown ?? 0) - 1; // 조용히 지내면 자숙이 한 시즌 더 빨리 끝난다
      }
    }
  }

  // ── 시간이 흐른다 ──
  c.turn += 1;
  c.health = Math.max(0, Math.min(100, c.health + 8));
  c.mental = Math.max(0, Math.min(100, c.mental + (c.schoolId === "ged" && c.stage !== "idol" ? 3 : 6)));
  if (c.flags.scandalTurn !== c.turn - 1) addReputation(c, 1);
  // 2012년 전에 데뷔한 아이돌은 SNS가 열리는 해에 회사가 계정을 알아서 열어준다
  if (c.stage === "idol" && !c.flags.snsOpened && yearOf(c) >= 2012 && c.debutTurn !== null && yearOf({ turn: c.debutTurn }) < 2012) {
    c.flags.snsOpened = Math.max(1, c.turn);
    notes.push("회사가 공식 인스타그램 계정을 열었어요.");
  }

  if (c.stage === "idol") {
    const gap = c.lastReleaseTurn === null ? 99 : c.turn - c.lastReleaseTurn;
    if (kind !== "comeback") c.fans = Math.round(c.fans * (kind === "fanmeet" ? 0.985 : 0.975));
    if (kind === "rest") { c.loyalty = Math.min(100, c.loyalty + 2); if (!c.flags.solo) c.chemistry = Math.min(100, c.chemistry + 4); }
    if (kind === "comeback" && !c.flags.solo && c.albums.length >= 3 && c.albums.slice(-3).every((al, i, arr) => al.turn === arr[0].turn + i)) c.chemistry = Math.max(0, c.chemistry - 3); // 쉼 없는 컴백 3연속
    if (!c.flags.solo) {
      const fanBudget = budgetOf(c).fan;
      if (fanBudget > 25) c.loyalty = Math.min(100, c.loyalty + Math.round((fanBudget - 25) / 8)); // 팬 콘텐츠 예산
      if (c.chemistry < 30) notes.push("팀 분위기가 위기예요. 휴식이나 팬미팅으로 멤버들과 시간을 보내지 않으면 탈퇴 이야기가 나와요.");
      else if (c.chemistry >= 80) notes.push("팀 케미가 최고예요. 완성도에 힘이 실려요.");
    }
    if (c.loyalty < 30) { c.fans = Math.round(c.fans * 0.95); notes.push("팬덤 결속이 낮아 팬이 빠져나가요. 팬미팅·콘텐츠로 챙겨주세요."); }
    else if (c.loyalty >= 80) notes.push("팬덤 결속이 단단해요. 초동과 음방 투표에 힘이 실려요.");
    if (gap >= 2 && kind !== "comeback") {
      c.popularity -= 5;
      c.fans = Math.round(c.fans * 0.95);
      notes.push("오랜 공백으로 관심이 줄었어요. 컴백을 준비해보세요.");
    }
    const age = ageOf(c);
    if (age >= 32) c.popularity -= 2;
    else if (age >= 28) c.popularity -= 1;
  }
  c.popularity = Math.round(Math.max(0, Math.min(100, c.popularity * 0.65 + popularityTarget(c) * 0.35)) * 10) / 10;

  // ── 회사 목표(KPI) 결산 · 새 목표 ──
  if (c.stage === "idol" && c.kpi && c.turn >= c.kpi.deadline) {
    const met = kpiMet(c, c.kpi, c.flags.kpiSince ?? c.kpi.deadline - 2);
    if (met) {
      c.trust = Math.min(100, c.trust + 10);
      c.flags.budgetBonus = 1;
      c.flags.kpiHits = (c.flags.kpiHits ?? 0) + 1;
      notes.push(`회사 목표 달성: ${c.kpi.label}. 다음 앨범 제작 지원이 늘어요.`);
    } else {
      c.trust = Math.max(0, c.trust - 8);
      c.flags.budgetCut = 1;
      c.flags.kpiMisses = (c.flags.kpiMisses ?? 0) + 1;
      notes.push(`회사 목표 미달: ${c.kpi.label}. 다음 앨범 제작비가 줄어요.`);
      if ((c.flags.kpiMisses ?? 0) >= 2) { addReputation(c, -2); notes.push("목표를 두 해 연속 놓쳐 회사 안에서 입지가 흔들려요."); }
    }
    c.kpi = null;
  }
  if (c.stage === "idol" && !c.kpi && c.turn % 2 === 0 && c.debutTurn !== null && c.turn - c.debutTurn >= 1 && c.contractEnd !== null && c.turn < c.contractEnd) {
    c.kpi = makeKpi(c);
    if (c.kpi) { c.flags.kpiSince = c.turn; notes.push(`올해 회사 목표: ${c.kpi.label}`); }
    c.flags.budgetDue = c.turn; // 예산 배분 이벤트
  }

  // ── 연말 결산 ──
  if (c.turn % 2 === 0 && c.stage === "idol") {
    const year = yearOf({ turn: c.turn - 1 });
    const won = yearEndAwards(c, year, [c.turn - 2, c.turn - 1]);
    const releasedThisYear = c.albums.some((a) => a.turn === c.turn - 2 || a.turn === c.turn - 1);
    if (releasedThisYear || c.popularity >= 35) {
      // 수상은 시상식에 참석해 호명될 때 확정된다. 초청장을 먼저 받는다
      const show = won[0]?.show ?? (c.popularity >= 60 ? "MAMA" : c.popularity >= 45 ? "MMA" : "골든디스크");
      const stages = YEAR_END_STAGES.slice(0, c.popularity >= 70 ? 3 : c.popularity >= 55 ? 2 : 1);
      c.ceremony = { year, show, awards: won, stages };
      c.flags.ceremonyDue = c.turn;
      notes.push(`${year} 연말 시상식 초청장이 도착했어요.`);
    } else notes.push(`${year} 연말 시상식: 올해는 초청받지 못했어요.`);
  }

  // ── 데뷔 평가 ──
  const evaluation = debutEvaluation(c);
  if (evaluation) {
    const a = agencyById(c.agencyId)!;
    const ovr = overall(c.stats, c.position);
    if (evaluation === "offer") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 1; }
    else if (evaluation === "cut") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 4; }
    else if (evaluation === "miss") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 2; notes.push(`데뷔 평가: 기준 OVR ${a.threshold}에 근접했어요.`); }
    else if (evaluation === "warn") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 3; c.warnings += 1; notes.push(`데뷔 평가 경고 ${c.warnings}회: OVR ${ovr}, 기준 ${a.threshold}`); }
    else notes.push(`데뷔 평가 피드백: OVR ${ovr}, 데뷔조 기준 ${a.threshold}. ${a.stat === MAIN_STAT[c.position] ? "회사 강점과 포지션이 잘 맞아요." : `${STAT_NAMES[a.stat]}을(를) 보강하면 빨라져요.`}`);
  }
  if (c.stage === "free") {
    const best = AGENCIES.map((a) => ({ a, p: auditionChance(c, a.id) })).filter((x) => (c.flags[`apply:${x.a.id}`] ?? -9) <= c.turn - 2).sort((x, y) => y.p - x.p)[0];
    if (best) notes.push(`지금 ${best.a.name} 합격 가능성이 가장 높아요. 홈의 소속 카드에서 지원할 수 있어요.`);
  }

  // ── 소속사 파산 ──
  // 계약을 맺은 직후 두 시즌은 파산 소식이 오지 않는다 (서명 직후 또 계약 화면이 뜨는 혼란 방지)
  if (c.turn - (c.flags.contractTurn ?? -99) >= 2 && rng(c) < bankruptcyRisk(c)) {
    c.flags.bankruptTurn = c.turn;
    c.flags.bankruptCount = (c.flags.bankruptCount ?? 0) + 1;
    notes.push("회사 재정이 버티지 못했어요.");
  }

  // ── 종료 조건 ──
  if (c.stage === "idol" && c.debutTurn !== null && c.turn - c.debutTurn >= 4) {
    c.lowPopularityTurns = c.popularity <= 10 ? c.lowPopularityTurns + 1 : 0;
    if (c.lowPopularityTurns >= 2) {
      log(c, "조용한 마무리", "오랜 침체 끝에 활동을 정리하기로 했어요.", "system");
      return retire(c, "오랜 침체 끝에 마지막 무대를 마쳤어요.");
    }
  }
  if (c.turn > MAX_TURN) return retire(c, "긴 커리어의 마지막 앵콜을 마쳤어요.");

  if (c.flags.snsOpened && !c.flags.snsGrowNoted && metricTargets(c).instagram > (c.metrics?.instagram ?? 0) * 1.05) {
    c.flags.snsGrowNoted = 1;
    notes.push("인스타 팔로워가 늘기 시작했어요.");
  }
  if (c.stage === "idol" && !boughtThisSeason(c)) {
    const offers = shopOffers(c);
    const cheapest = offers.length ? Math.min(...offers.map((o) => priceOf(c, o))) : Infinity;
    if (walletOf(c) >= cheapest) notes.push("정산금으로 이번 시즌 상점 아이템을 살 수 있어요. 홈의 상점 줄에서 골라요.");
  }
  if (c.flags.ceremonyDue === c.turn && c.ceremony) {
    c.pending = inviteEvent(c);
  } else {
    c.pending = scheduleEvent(c);
    if (!c.pending && c.flags.budgetDue === c.turn) c.pending = budgetEvent(c);
  }
  finish(c, before, headline, text, tone, { scene, notes, comments, awards: wonAwards, celebrate, spotlight });
  c.lastResult = c.result;
  return c;
}

// ─────────────────────────── 선택 처리 ───────────────────────────

function meets(c: Career, choice: ChoiceDef): string | null {
  const r = choice.requires;
  if (!r) return null;
  if ("stat" in r && c.stats[r.stat] < r.value) return `${STAT_NAMES[r.stat]} ${r.value} 이상 필요해요`;
  if ("reputation" in r && c.reputation < r.reputation) return "평판이 더 필요해요";
  if ("popularity" in r && c.popularity < r.popularity) return `인기도 ${r.popularity} 이상 필요해요`;
  return null;
}

export const choiceLock = meets;

function debutConceptEvent(): ActiveEvent {
  return {
    id: "debut-concept",
    title: "데뷔 앨범 콘셉트",
    text: "첫 앨범의 방향을 정해요. 멤버 구성과 내 포지션에 맞는 콘셉트가 초동과 차트를 좌우해요.",
    scene: "album",
    public: true,
    choices: CONCEPTS.map((x) => ({ id: x.id, label: x.name, hint: x.description, risk: "safe" as const, op: `comeback:${x.id}` })),
  };
}

/** 파산한 회사의 미회수 제작비는 사라진다. 정산은 새 회사에서 처음부터 다시 쌓인다. */
function writeOffIfBankrupt(c: Career) {
  if (c.flags.bankruptTurn === undefined) return;
  c.money.invested = Math.min(c.money.invested, c.money.revenue);
  delete c.flags.bankruptTurn;
}

/** 연말 시상식 초청장. 참석해야 무대와 시상이 진행된다. */
function inviteEvent(c: Career): ActiveEvent {
  const cm = c.ceremony!;
  return {
    id: "awards-invite",
    title: `${cm.year} ${SHOW_FULL[cm.show] ?? cm.show} 초청장`,
    text: `${cm.year} ${SHOW_FULL[cm.show] ?? cm.show} 측에서 ${c.groupName || c.name}을(를) 초청했어요. ${cm.stages.join(" · ")} 무대 출연 요청도 같이 왔어요. 연말 일정이 빡빡하지만, 시상식은 한 해의 결산이에요.`,
    scene: "awards",
    public: true,
    // 연말 시상식은 빠질 수 없다. awards:skip 처리는 예전 저장 데이터 호환을 위해 남겨둔다
    choices: [
      { id: "attend", label: "시상식에 참석한다", hint: "연말 무대에 서고 시상 결과를 현장에서 들어요. 체력이 조금 떨어져요", risk: "safe", op: "awards:attend" },
    ],
  };
}

/** 입대 직후 한 번 뜨는 복무 계획. 고른 길이 전역 결과에 남는다. */
function militaryEvent(c: Career): ActiveEvent {
  return {
    id: "military-service",
    title: "복무 중",
    text: `${c.flags.militaryMonths ?? 18}개월의 복무가 시작돼요. 어떻게 보낼지 정해요. 전역 뒤 복귀 무대에 영향을 줘요.`,
    scene: "military",
    public: true,
    choices: [
      { id: "band", label: "군악대 · 홍보대사로 복무", hint: "무대 감각을 지키고 팬들과 소식이 이어져요. 보컬이 받쳐줘야 뽑혀요", risk: "safe", requires: { stat: "vocal", value: 55 }, effects: { loyalty: 5, health: 5 }, op: "service:band" },
      { id: "regular", label: "일반 복무", hint: "몸과 마음이 크게 회복되지만 실력은 조금 무뎌져요", risk: "safe", effects: { health: 15, mental: 8, vocal: -1, dance: -1, rap: -1, visual: -1, variety: -1, producing: -1 }, op: "service:regular" },
      { id: "fitness", label: "체력 단련에 집중", hint: "체력이 가장 크게 오르고 춤 근력도 붙어요", risk: "safe", effects: { health: 25, dance: 2 }, op: "service:fitness" },
    ],
  };
}

/** 시상식 본편. 화면은 AwardShow가 장면별로 보여주고, 선택지는 수상소감(또는 다음 기약)이다. */
function ceremonyEvent(c: Career): ActiveEvent {
  const cm = c.ceremony!;
  const top = [...cm.awards].sort((a, b) => rank(b) - rank(a))[0];
  const choices: ChoiceDef[] = top
    ? [
        { id: "fans", label: "팬들에게 감사해요", hint: "팬덤 결속과 평판이 올라요", risk: "safe", op: "speech:fans" },
        { id: "parents", label: "부모님께 감사해요", hint: "평판이 오르고 마음이 단단해져요", risk: "safe", op: "speech:parents" },
        { id: "company", label: "소속사에 감사해요", hint: "회사 신뢰가 크게 오르지만 팬들은 조금 서운해요", risk: "safe", op: "speech:company" },
        { id: "expected", label: "당연히 받을 줄 알았어요", hint: "화제성은 붙지만 평판이 깎이고 태도 논란이 날 수 있어요", risk: "bold", op: "speech:expected" },
      ]
    : [{ id: "next", label: "다음을 기약해요", hint: "무대는 잘 마쳤어요. 내년을 노려요", risk: "safe", op: "awards:none" }];
  return {
    id: "ceremony",
    title: `${cm.year} ${SHOW_FULL[cm.show] ?? cm.show}`,
    text: top ? `${top.name} 발표를 앞두고 있어요.` : "시상 부문 발표를 앞두고 있어요.",
    scene: "awards",
    public: true,
    choices,
  };
}
const rank = (a: Award) => (a.kind === "daesang" ? 3 : a.kind === "bonsang" ? 2 : 1);

/** 시상식 결과 확정: 상을 기록하고 연출을 붙인다. */
function commitAwards(c: Career, attended: boolean): { celebrate: TurnResult["celebrate"]; spotlight: TurnResult["spotlight"]; notes: string[] } {
  const cm = c.ceremony!;
  const notes: string[] = [];
  c.awards.push(...cm.awards);
  if (cm.awards.length) {
    addBuzz(c, cm.awards.some((a) => a.kind === "daesang") ? 35 : 18);
    c.flags.mediaHeat = Math.min(100, (c.flags.mediaHeat ?? 0) + (cm.awards.some((a) => a.kind === "daesang") ? 45 : 25));
  }
  for (const a of cm.awards) log(c, `${a.show} ${a.name}`, `${cm.year}년 ${SHOW_FULL[a.show] ?? a.show}에서 ${a.name}을 받았어요.${attended ? "" : " (대리 수상)"}`, "award");
  const daesang = cm.awards.find((a) => a.kind === "daesang");
  let spotlight: TurnResult["spotlight"];
  if (daesang && attended) {
    const count = c.awards.filter((a) => a.kind === "daesang").length;
    spotlight = { chip: `${daesang.year} ${daesang.show}`, title: `${count <= 1 ? "첫" : `${count}번째`} 대상을\n받았어요`, subtitle: `${displayName(c)}${hasBatchim(displayName(c)) ? "이" : "가"} ${daesang.name.replace(/\s*\(대상\)$/, "")}${hasBatchim(daesang.name.replace(/\s*\(대상\)$/, "")) ? "으로" : "로"} 뽑혔어요`, stats: [`음방 1위 ${c.musicWins}회`, c.peakMelon === 1 ? "멜론 1위" : c.peakMelon ? `멜론 최고 ${c.peakMelon}위` : ""].filter(Boolean) };
  }
  const celebrate: TurnResult["celebrate"] = !cm.awards.length ? undefined : !attended ? undefined : daesang ? "daesang" : "award";
  if (cm.awards.length) notes.push(`${cm.year} ${SHOW_FULL[cm.show] ?? cm.show}: ${cm.awards.map((a) => a.name).join(" · ")}`);
  c.ceremony = null;
  delete c.flags.ceremonyDue;
  return { celebrate, spotlight, notes };
}

/** 연초 홍보 예산 배분. 회사가 준 예산을 어디에 쓸지 정한다. */
function budgetEvent(c: Career): ActiveEvent {
  const a = agencyById(c.agencyId);
  const pool = Math.round((a?.budget ?? 0.6) * 20 * eraScale(yearOf(c)));
  return {
    id: "budget",
    title: `${yearOf(c)}년 홍보 예산 배분`,
    text: `회사가 올해 홍보 예산 ${pool}억원을 배정했어요. 어디에 집중할지 정해요. 회사 목표${c.kpi ? `(${c.kpi.label})` : ""}와 맞추면 좋아요.`,
    scene: "contract",
    choices: BUDGET_PRESETS.map((p) => ({ id: p.id, label: p.name, hint: p.hint, risk: "safe" as const, op: `budget:${p.id}` })),
  };
}

function debutStageEvent(): ActiveEvent {
  return {
    id: "debut-stage",
    title: "음악방송 데뷔 무대",
    text: "첫 음악방송 무대예요. 신인은 대부분 1위 후보에도 오르지 못하지만, 데뷔 무대 하나로 이름을 알리기도 해요. 어디에 가장 신경 쓸까요?",
    scene: "mc",
    public: true,
    choices: [
      { id: "vocal", label: "흔들림 없는 라이브", hint: "보컬이 좋을수록 '라이브 잘하는 신인'으로 화제가 돼요", risk: "safe", op: "debutstage:vocal" },
      { id: "dance", label: "칼군무 퍼포먼스", hint: "댄스가 좋을수록 직캠이 퍼져요", risk: "safe", op: "debutstage:dance" },
      { id: "visual", label: "엔딩 요정 · 카메라 워킹", hint: "비주얼이 좋을수록 엔딩 캡처가 돌아요", risk: "safe", op: "debutstage:visual" },
      { id: "variety", label: "무대 밖 매력 · 인터뷰", hint: "예능감이 좋을수록 대기실 영상이 인기를 끌어요", risk: "safe", op: "debutstage:variety" },
    ],
  };
}

function joinAgency(c: Career, agencyId: string) {
  c.agencyId = agencyId;
  c.agencyJoinedTurn = c.turn;
  c.stage = "trainee";
  c.traineeContractEnd = c.turn + 6;
  c.trust = 30;
  c.warnings = 0;
  c.money.invested = 0;
  c.flags.debutDeferredUntil = 0;
  delete c.flags.debutEta;
  delete c.flags.promisedDebut;
  delete c.flags.cutEta;
  c.lineup = null;
  c.flags.contractTurn = c.turn;
}

export function resolveChoice(original: Career, choiceId: string, extra: { groupName?: string; albumName?: string; reaction?: string } = {}): Career {
  const c = clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 인생예요.");
  const event = c.pending;
  if (!event) throw new GameError("지금은 결정할 선택이 없어요.");
  const choice = event.choices.find((x) => x.id === choiceId);
  if (!choice) throw new GameError("제시된 선택지 중 하나를 골라주세요.");
  const locked = meets(c, choice);
  if (locked) throw new GameError(locked);
  c.result = null;
  c.pending = null;
  const before = snapshot(c);
  let headline = choice.label;
  let text = `${event.title} — 선택을 마쳤어요.`;
  let tone: Tone = "neutral";
  const notes: string[] = [];
  const op = choice.op ?? "";
  let celebrate: TurnResult["celebrate"];
  let spotlight: TurnResult["spotlight"];
  let reaction: import("./reactions.ts").ReactionContext | null = null;

  // 확률 선택
  if (choice.chance !== undefined) {
    const success = rng(c) < choice.chance;
    applyEffects(c, success ? choice.success : choice.fail);
    text = (success ? choice.successText : choice.failText) ?? text;
    tone = success ? "good" : "bad";
    headline = success ? `${choice.label} — 성공` : `${choice.label} — 아쉬운 결과`;
    if (success && op === "tour:dome") c.flags.domeTour = 1;
    if (!success && op === "scandal") { c.flags.scandalTurn = c.turn; c.hiatusUntil = c.turn + 1; c.loyalty = Math.max(0, c.loyalty - 10); }
  if (event.id === "member-bullying" || event.id === "member-dui") c.chemistry = Math.max(0, c.chemistry - 10);
  if (event.id === "unit" && tone === "good") c.chemistry = Math.min(100, c.chemistry + 5);
  } else {
    applyEffects(c, choice.effects);
  }

  if (INCIDENT_IDS.includes(event.id)) {
    // 논란·사고는 미디어 관심을 끌어 브랜드평판 지수는 오히려 튀고, 호감과 결속은 깎인다
    c.flags.mediaHeat = Math.min(100, (c.flags.mediaHeat ?? 0) + 30);
    addBuzz(c, 10);
    c.flags.lastIncident = c.turn;
    if (tone === "bad") { c.loyalty = Math.max(0, c.loyalty - 6); }
  }
  // 열애설·악플은 커리어당 두 번까지만 찾아온다
  if (event.id === "dating") c.flags.datingCount = (c.flags.datingCount ?? 0) + 1;
  if (event.id === "hate") c.flags.hateCount = (c.flags.hateCount ?? 0) + 1;
  // 멤버가 탈퇴하면 팀이 실제로 줄어든다
  if (event.id === "member-leave" && c.lineup) {
    c.lineup.members = Math.max(2, c.lineup.members - 1);
    if (c.lineup.memberAvatars?.length) c.lineup.memberAvatars.pop();
  }
  // 논란 뒤에는 두 시즌 자숙 기간: 이 동안 공개 활동은 역효과가 난다
  {
    const incident = INCIDENT_IDS.includes(event.id);
    const failedChance = choice.chance !== undefined && tone === "bad";
    const badEffects = choice.chance === undefined && (choice.effects?.reputation ?? 0) <= -8;
    if ((incident && (failedChance || badEffects || (event.id === "dating" && choice.id === "admit"))) || (op === "scandal" && (choice.chance === undefined || failedChance))) {
      c.flags.scandalCooldown = c.turn + 2;
    }
  }

  // 운영 훅
  if (op.startsWith("join:")) {
    const a = agencyById(op.slice(5))!;
    const prev = agencyById(c.agencyId);
    joinAgency(c, a.id);
    headline = `${a.name} 연습생 계약 완료`;
    text = prev ? `${prev.name}와 합의 종료하고 ${a.fullName}의 연습생이 됐어요. 신뢰는 처음부터 쌓아요.` : `${a.fullName}의 연습생이 됐어요. ${TIERS[a.tier].description}.`;
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "decline") {
    headline = "계약을 거절했어요";
    text = c.agencyId ? "지금 회사에서 계속 준비해요." : "무소속으로 남아 다른 회사를 노려요.";
    log(c, headline, text, "system");
  } else if (op === "freecast") {
    const a = pick(c, AGENCIES.filter((x) => x.tier === "indie"));
    joinAgency(c, a.id);
    headline = `${a.name} 연습생이 됐어요`;
    text = `${a.fullName}의 캐스팅 오디션을 통과했어요. 작은 연습실이지만 가끔 기적이 숨어 있는 곳이에요.`;
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op.startsWith("scout:")) {
    const [, agencyId, etaCode] = op.split(":");
    const a = agencyById(agencyId)!;
    const wasFree = c.stage === "free";
    joinAgency(c, a.id);
    c.scoutCount += 1;
    const eta = decodeEta(etaCode);
    if (eta !== undefined) {
      setDebutEta(c, eta);
      if (eta !== null && eta <= 1) c.flags.promisedDebut = 1;
      notes.push(`${a.name}가 약속한 데뷔 시점: ${etaLabel(eta)}`);
    }
    headline = wasFree ? `${a.name} 캐스팅 계약` : `${a.name}로 이적했어요`;
    text = wasFree ? `오디션 없이 ${a.fullName}의 연습생이 됐어요. ${TIERS[a.tier].description}.` : `${a.fullName}의 연습생으로 새로 시작해요. 신뢰는 처음부터 쌓아요.`;
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "debut") {
    const name = (extra.groupName ?? "").trim();
    if (c.stage !== "trainee" || c.debutTurn !== null) throw new GameError("이미 데뷔한 커리어예요.");
    if (!GROUP_NAME_PATTERN.test(name)) throw new GameError("그룹 이름을 1~20자로 입력해주세요.");
    const a = agencyById(c.agencyId)!;
    c.groupName = name;
    c.stage = "idol";
    c.debutTurn = c.turn;
    c.contractEnd = c.turn + 14;
    c.money.invested += Math.round(DEBUT_COST * a.budget * eraScale(yearOf(c)) * 10) / 10;
    c.fans += Math.round(DEBUT_FANS[a.tier] * eraScale(yearOf(c)) * (0.8 + rng(c) * 0.4));
    c.popularity = Math.max(c.popularity, a.tier === "major" ? 30 : a.tier === "indie" ? 10 : 20);
    c.trust = Math.min(100, c.trust + 10);
    c.mental = Math.min(100, c.mental + 15);
    c.loyalty = 55;
    c.chemistry = 60;
    addReputation(c, 3);
    headline = `${name} 데뷔 확정`;
    text = `${ageText(c)}, ${a.name}에서 ${name}(으)로 데뷔해요. 데뷔 앨범 콘셉트를 정할 차례예요.`;
    tone = "milestone";
    log(c, headline, text, "milestone");
    c.pending = debutConceptEvent();
  } else if (op === "debut:cut") {
    const eta = c.flags.cutEta === -1 ? null : c.flags.cutEta ?? 2;
    setDebutEta(c, eta);
    delete c.flags.cutEta;
    headline = "회사에 남아 다음 데뷔를 기다려요";
    text = `${etaLabel(eta)}. 다음 팀을 준비하며 연습을 이어가요.`;
    log(c, "데뷔조 탈락", text, "system");
  } else if (op === "debut:wait") {
    c.flags.debutDeferredUntil = c.turn + 2;
    headline = "데뷔를 미뤘어요";
    text = "한 번 더 준비하기로 했어요. 다음 평가에서 다시 제안받아요.";
  } else if (op.startsWith("comeback:") && event.id === "debut-concept") {
    // 데뷔 앨범은 바로 내지 않고 쇼케이스 → 음악방송 데뷔 무대를 거친 뒤 발매한다
    const chosen = (extra.albumName ?? "").trim();
    if (chosen && !ALBUM_NAME_PATTERN.test(chosen)) throw new GameError("앨범 이름은 1~20자로 입력해주세요.");
    c.debutPlan = { concept: op.slice(9) as Concept, albumName: chosen };
    headline = `데뷔 콘셉트: ${CONCEPTS.find((x) => x.id === op.slice(9))?.name ?? ""}`;
    text = "타이틀곡과 콘셉트가 정해졌어요. 이제 데뷔 쇼케이스를 준비해요.";
    c.pending = activate(eventById("showcase")!);
    c.seen.showcase = c.turn;
  } else if (op.startsWith("showcase:")) {
    headline = op === "showcase:open" ? "무료 공개 쇼케이스" : "팬 초청 유료 쇼케이스";
    text = "쇼케이스를 마쳤어요. 이번 주 음악방송에서 데뷔 무대를 가져요.";
    c.pending = debutStageEvent();
  } else if (op.startsWith("debutstage:")) {
    const stat = op.slice(11) as StatKey;
    const plan = c.debutPlan ?? { concept: "fresh" as Concept, albumName: "" };
    // 신경 쓴 부분이 내 강점이면 1위 가능성이 조금 오른다. 그래도 신인 1위는 드물다
    c.flags.stageBonus = Math.max(0, (c.stats[stat] - 55) / 100);
    const album = makeAlbum(c, plan.concept, plan.albumName);
    c.debutPlan = null;
    headline = `데뷔 앨범 ${album.name}`;
    text = `${STAT_NAMES[stat]}에 힘준 데뷔 무대를 마쳤어요. ${albumSummary(album)}`;
    tone = album.wins > 0 || (album.melon !== null && album.melon <= 10) ? "good" : "neutral";
    notes.push(album.wins > 0 ? `신인이 데뷔 활동에서 1위를 했어요. 정말 드문 일이에요.` : album.melon !== null ? `데뷔곡이 멜론 ${album.melon}위에 올랐어요.` : "데뷔곡은 아직 차트에 오르지 못했어요. 대부분의 신인이 그래요.");
    if (album.wins > 0) celebrate = "win";
    spotlight = billboardSpotlight(c, album);
    if (spotlight) celebrate = "daesang";
    reaction = { kind: album.wins > 0 ? "win" : "debut-stage", album: album.name, show: album.shows?.[0], melon: album.melon };
    if (c.flags.albumViral === c.turn) { tone = "good"; notes.push("타이틀곡이 숏폼에서 터졌어요. 예상보다 훨씬 많은 사람이 들었어요."); }
    if (c.flags.albumFlop === c.turn) { tone = "bad"; notes.push("데뷔 앨범 반응이 차가웠어요."); }
    log(c, headline, albumSummary(album), "release");
    if (album.wins > 0) log(c, `음악방송 1위 ${album.wins}회`, `${album.shows?.join(" · ")} 1위 트로피를 들었어요.`, "award");
  } else if (op.startsWith("comeback:")) {
    const chosen = (extra.albumName ?? "").trim();
    if (chosen && !ALBUM_NAME_PATTERN.test(chosen)) throw new GameError("앨범 이름은 1~20자로 입력해주세요.");
    const album = makeAlbum(c, op.slice(9) as Concept, chosen);
    headline = `${c.albums.length === 1 ? "데뷔 앨범" : "새 앨범"} ${album.name}`;
    text = albumSummary(album);
    tone = album.wins > 0 || (album.melon !== null && album.melon <= 10) ? "good" : "neutral";
    if (c.flags.albumViral === c.turn) { tone = "good"; notes.push("타이틀곡이 숏폼에서 터졌어요. 예상보다 훨씬 많은 사람이 들었어요."); }
    if (c.flags.albumFlop === c.turn) { tone = "bad"; notes.push("데뷔 앨범 반응이 차가웠어요."); }
    if (album.wins > 0) celebrate = "win";
    spotlight = billboardSpotlight(c, album);
    if (spotlight) celebrate = "daesang";
    reaction = { kind: album.wins > 0 ? "win" : c.flags.albumViral === c.turn ? "album-viral" : c.flags.albumFlop === c.turn ? "album-flop" : "album", album: album.name, show: album.shows?.[0], melon: album.melon };
    log(c, headline, text, "release");
    if (album.wins > 0) log(c, `음악방송 1위 ${album.wins}회`, `${album.name} 활동으로 1위 트로피를 들었어요.`, "award");
  } else if (op.startsWith("school:")) {
    c.schoolId = op.slice(7) as Career["schoolId"];
    headline = { arts: "예술고 진학", general: "일반고 진학", ged: "검정고시 준비" }[op.slice(7)] ?? headline;
    text = "다음 몇 년의 생활이 정해졌어요.";
    log(c, headline, text, "milestone");
  } else if (op === "trainee:renew") {
    c.traineeContractEnd = c.turn + 6;
    headline = "연습생 재계약";
    text = "평가 자료와 비용 내역을 확인하고 새 계약에 합의했어요.";
    log(c, headline, text, "milestone");
  } else if (op === "trainee:leave") {
    const a = agencyById(c.agencyId);
    c.stage = "free";
    c.agencyId = null;
    c.agencyJoinedTurn = null;
    c.traineeContractEnd = null;
    c.trust = 0;
    c.warnings = 0;
    c.money.invested = 0;
    headline = "무소속이 됐어요";
    text = `${a?.name ?? "회사"}와의 계약을 마쳤어요. 개인 채무는 없어요. 홈의 소속 카드에서 다른 회사에 지원할 수 있어요.`;
    log(c, headline, text, "system");
  } else if (op === "retire") {
    delete c.flags.bankruptTurn;
    return retire(c, event.id === "contract7" ? "멤버들과 마지막 콘서트를 마쳤어요." : "꿈을 정리하고 새로운 길을 찾기로 했어요.");
  } else if (op === "grind") {
    for (const k of [MAIN_STAT[c.position]]) c.stats[k] = Math.min(99, c.stats[k] + 3);
  } else if (op === "weakfix") {
    const low = lowestStat(c);
    c.stats[low] = Math.min(99, c.stats[low] + 3);
    const second = STAT_KEYS.filter((k) => k !== low).reduce((m, k) => (c.stats[k] < c.stats[m] ? k : m));
    c.stats[second] = Math.min(99, c.stats[second] + 2);
  } else if (op === "awaken") {
    for (const k of STAT_KEYS) c.stats[k] = Math.min(99, c.stats[k] + 8 + Math.round(rng(c) * 7));
    c.flags.miracle = 1;
    c.trust = Math.min(100, c.trust + 20);
    headline = "각성했어요";
    text = "몇 달의 연습이 한꺼번에 몸에 붙었어요. 트레이너가 데뷔조 회의를 앞당겼어요.";
    tone = "milestone";
    log(c, headline, text, "milestone");
  } else if (op === "rechart") {
    const album = c.albums[c.albums.length - 1];
    album.melon = 1;
    addShowWin(c, album, rng(c));
    addShowWin(c, album, rng(c));
    c.peakMelon = 1;
    c.fans = Math.round(c.fans * between(c, 2.5, 3));
    c.popularity = Math.min(100, c.popularity + 20);
    c.money.revenue += 25;
    addReputation(c, 10);
    c.flags.miracle = 1;
    addBuzz(c, 40);
    c.flags.mediaHeat = Math.min(100, (c.flags.mediaHeat ?? 0) + 40);
    celebrate = "win";
    reaction = { kind: "rechart", album: album.name };
    headline = `${album.name} 역주행 1위`;
    text = "발매한 지 한참 된 곡이 멜론 1위에 올랐어요. 음악방송에서 다시 1위 트로피를 들었어요.";
    tone = "milestone";
    log(c, headline, text, "award");
  } else if (op.startsWith("musicshow:")) {
    const album = c.albums[c.albums.length - 1];
    const won = new Set(album.shows ?? []);
    const open = MUSIC_SHOWS.filter((s) => !won.has(s.name));
    const scores = album.scores ?? { digital: 50, physical: 50, broadcast: 50, social: 50, vote: 50 };
    const best = open.length ? Math.max(...open.map((s) => winChance(c, scores, s, false, c.albums.length - 1))) : 0;
    const base = Math.min(0.7, best * 1.1);
    const p = op === "musicshow:push" ? Math.min(0.78, base + 0.12) : base;
    if (op === "musicshow:push" && rng(c) < 0.3) { addReputation(c, -2); notes.push("일부 커뮤니티에서 과한 총공이라는 말이 나왔어요."); }
    const show = rng(c) < p ? addShowWin(c, album, rng(c)) : null;
    if (show) {
      applyEffects(c, { fansMul: 1.08 });
      c.popularity += 3;
      celebrate = "win";
      reaction = { kind: "win", album: album.name, show };
      headline = `${show} 1위!`;
      text = `${album.name}(으)로 ${show} 1위 트로피를 들었어요. 앵콜 무대에서 팬들이 떼창을 했어요.`;
      tone = "good";
      log(c, headline, text, "award");
    } else {
      reaction = { kind: "win-miss", album: album.name };
      headline = "아쉬운 2위";
      text = "근소한 차이로 1위를 놓쳤어요. 다음 주를 노려요.";
      tone = "bad";
    }
  } else if (op === "hiatus") {
    c.hiatusUntil = c.turn + 1;
    headline = "휴식기에 들어가요";
    text = "회사가 활동 중단을 공식 발표했어요. 다음 시즌은 쉬어요.";
  } else if (op === "scandal") {
    c.flags.scandalTurn = c.turn;
    c.hiatusUntil = c.turn + 1;
    headline = "팀 자숙 시작";
    text = "공식 입장을 내고 활동을 중단했어요. 회복에는 시간이 걸려요.";
    tone = "bad";
    log(c, headline, text, "system");
  } else if (op.startsWith("military:")) {
    const branch = op.slice(9);
    const months = MILITARY_MONTHS[branch] ?? 18;
    const turns = Math.ceil(months / 6); // 시즌은 6개월 단위라 남는 달은 복귀 준비에 쓴다
    c.militaryUntil = c.turn + turns;
    c.flags.militaryDone = 1;
    c.flags.militaryMonths = months;
    headline = { army: "육군 입대", navy: "해군 입대", airforce: "공군 입대" }[branch] ?? "입대";
    text = `${months}개월 복무 뒤 돌아와요.${turns * 6 > months ? ` 전역 후 남는 ${turns * 6 - months}개월은 복귀 준비에 써요.` : ""} 다음 진행에서 복무 기간이 한 번에 지나가요.`;
    log(c, headline, text, "milestone");
    c.pending = militaryEvent(c);
  } else if (op.startsWith("service:")) {
    const path = op.slice(8);
    c.flags.servicePath = path === "band" ? 1 : path === "regular" ? 2 : 3;
    if (path === "band") addBuzz(c, 10);
    headline = { band: "군악대 · 홍보대사로 복무", regular: "일반 복무", fitness: "체력 단련에 집중" }[path] ?? "복무";
    text = { band: "군악대 공연과 홍보대사 활동으로 팬들에게 소식이 이어져요.", regular: "평범한 병사로 하루하루를 보내요. 몸과 마음이 단단해져요.", fitness: "남는 시간을 몸 만드는 데 써요. 전역할 땐 체력이 달라져 있을 거예요." }[path] ?? "";
    log(c, headline, text, "milestone");
  } else if (op === "sns:open") {
    c.flags.snsOpened = Math.max(1, c.turn);
    c.metrics = { ...(c.metrics ?? { instagram: 0, youtube: 0, spotify: 0 }), instagram: Math.max(500, Math.round(c.fans * 0.3)) };
    headline = "공식 인스타그램을 열었어요";
    text = "첫 게시물을 올리자 팬들이 몰려들었어요. 앞으로 팔로워가 천천히 쌓여요.";
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op.startsWith("isac:")) {
    const kind = op.slice(5);
    if (kind === "skip") {
      applyEffects(c, { health: 6, loyalty: -2 });
      headline = "육상 대회에 불참했어요";
      text = "방송 대신 푹 쉬었어요. 팬들은 아쉬워했지만 컨디션은 좋아졌어요.";
    } else {
      const run = kind === "run";
      const p = run ? 0.3 + c.stats.dance / 150 : 0.3 + c.stats.variety / 150;
      const success = rng(c) < p;
      tone = success ? "good" : "bad";
      if (run) {
        if (success) { addBuzz(c, 15); applyEffects(c, { loyalty: 4, popularity: 2 }); headline = "60m 달리기 결승 진출"; text = "트랙을 가르며 결승선을 끊었어요. 직캠이 실시간 검색어에 올랐어요."; }
        else { applyEffects(c, { health: -6 }); headline = "60m 달리기에서 넘어졌어요"; text = "출발 직후 발이 꼬였어요. 짤이 돌았지만 다친 데는 없어서 다행이에요."; }
      } else if (success) { addBuzz(c, 12); applyEffects(c, { popularity: 3 }); headline = "양궁 10점 명중"; text = "숨을 고르고 쏜 화살이 정중앙에 꽂혔어요. '침착한 센터'라는 말이 돌았어요."; }
      else { headline = "양궁에서 과녁을 빗나갔어요"; text = "긴장한 탓에 화살이 엉뚱한 곳으로 날아갔어요. 팬들은 귀엽다고 해줬어요."; }
    }
  } else if (op.startsWith("move:")) {
    const a = agencyById(op.slice(5))!;
    const bankrupt = c.flags.bankruptTurn !== undefined;
    writeOffIfBankrupt(c);
    c.agencyId = a.id;
    c.flags.independent = 0;
    c.contractEnd = c.turn + 6;
    c.flags.renewed = 1;
    c.flags.shareBonus = 1;
    c.trust = 40;
    headline = c.flags.solo ? `${a.name}와 솔로 계약` : `${a.name}로 이적 · 그룹 활동 유지`;
    text = c.flags.solo ? `${a.fullName}와 전속계약을 맺었어요. 해외 활동 지원을 받아요.` : `${a.fullName}와 새 전속계약을 맺었어요. 상표권 합의로 그룹 활동은 그대로 이어가요.${bankrupt ? " 멤버들은 각자 새 회사를 찾았어요." : ""}`;
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "renew") {
    const own = !!c.flags.independent;
    c.contractEnd = c.turn + 6;
    c.flags.renewed = 1;
    if (!own) c.flags.shareBonus = 1;
    c.trust = Math.min(100, c.trust + 15);
    c.mental = Math.min(100, c.mental + 10);
    headline = own ? "내 회사 운영 연장" : "재계약 완료";
    text = own ? "3년 더 지금 방식으로 활동해요." : "정산 조건이 좋아진 새 계약에 서명했어요. 팬들이 안도했어요.";
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "independent") {
    writeOffIfBankrupt(c);
    c.contractEnd = c.turn + 6;
    c.flags.renewed = 1;
    c.flags.independent = 1;
    headline = "개인 소속사 설립";
    text = c.flags.solo ? "내 이름으로 회사를 세웠어요. 정산 몫은 크게 늘고 제작 지원은 줄어요." : "개인 소속사를 세우고 그룹 활동은 계속해요. 정산 몫은 크게 늘고 제작 지원은 줄어요.";
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "solo") {
    writeOffIfBankrupt(c);
    c.contractEnd = c.turn + 6;
    c.flags.renewed = 1;
    c.flags.solo = 1;
    c.flags.independent = 1;
    // 그룹 인기에 기대던 팬은 떠나고, 개인 인기가 높을수록 많이 남는다
    const keep = Math.max(0.5, Math.min(0.9, 0.45 + c.popularity / 200 + rng(c) * 0.1));
    c.fans = Math.round(c.fans * keep);
    headline = "그룹 탈퇴 · 개인 소속사 설립";
    text = `${c.groupName || "그룹"}을(를) 떠나 내 회사에서 내 이름으로 활동해요. 팬덤 ${Math.round((1 - keep) * 100)}%가 떠났지만 정산은 온전히 내 몫이에요.`;
    log(c, headline, text, "milestone");
  } else if (op === "grammy") {
    c.flags.grammy = 1;
    applyEffects(c, { popularity: 10, reputation: 10, fansMul: 1.15, revenue: 40 });
    c.flags.miracle = 1;
    headline = "그래미 노미네이트";
    text = "레드카펫에 섰어요. 수상은 못 했지만 전 세계가 이름을 불렀어요. 한국 아이돌 역사에 남는 순간이에요.";
    tone = "milestone";
    celebrate = "daesang";
    reaction = { kind: "grammy" };
    spotlight = { chip: `${yearOf(c)} GRAMMY AWARDS`, title: "그래미 어워드에\n노미네이트됐어요", subtitle: `${displayName(c)}의 이름이 레코딩 아카데미 후보에 올랐어요`, stats: [c.peakBillboard !== null ? `빌보드 Hot 100 최고 ${c.peakBillboard}위` : "", `음방 1위 ${c.musicWins}회`].filter(Boolean) };
    log(c, headline, text, "award");
  } else if (op === "stadium") {
    c.flags.stadiumTour = 1;
    c.flags.miracle = 1;
    applyEffects(c, { fansMul: 1.2, revenue: 400, popularity: 6, reputation: 8, health: -25, mental: 10 });
    headline = "월드 스타디움 투어 전 회 매진";
    text = "북미·유럽·아시아 스타디움을 돌았어요. 매 공연 5만 명. 마이클 잭슨과 BTS가 섰던 자리에 섰어요.";
    tone = "milestone";
    celebrate = "daesang";
    reaction = { kind: "stadium" };
    spotlight = { chip: `${yearOf(c)} WORLD STADIUM TOUR`, title: "전 세계 스타디움을\n매진시켰어요", subtitle: `${displayName(c)}${hasBatchim(displayName(c)) ? "이" : "가"} 세계에서 몇 팀뿐인 스타디움 투어를 마쳤어요`, stats: ["12개 도시 · 회당 5만 명", `코어 팬덤 ${fanText(c.fans)}`] };
    log(c, headline, text, "milestone");
  } else if (op === "awards:attend") {
    const cm = c.ceremony!;
    cm.attended = true;
    c.health = Math.max(0, c.health - 6);
    c.popularity += 2;
    applyEffects(c, { fansMul: 1.03 });
    headline = `${cm.year} ${SHOW_FULL[cm.show] ?? cm.show} 참석`;
    text = `${cm.stages.join(" · ")} 무대를 마치고 시상식장에 앉았어요.`;
    c.pending = ceremonyEvent(c);
  } else if (op === "awards:skip") {
    const cm = c.ceremony!;
    c.popularity -= 2;
    c.loyalty = Math.max(0, c.loyalty - 3);
    const r = commitAwards(c, false);
    notes.push(...r.notes);
    headline = cm.awards.length ? `${cm.show} 불참 · 대리 수상` : `${cm.show} 불참`;
    text = cm.awards.length ? "참석하지 않은 자리에서 이름이 불렸어요. 소속사 대표가 대신 트로피를 받았어요. 팬들은 아쉬워했어요." : "연말을 조용히 보냈어요. 팬들은 무대를 기다렸어요.";
    tone = cm.awards.length ? "neutral" : "bad";
    reaction = { kind: cm.awards.length ? "award" : "generic" };
    c.pending = scheduleEvent(c) ?? (c.flags.budgetDue === c.turn ? budgetEvent(c) : null);
  } else if (op === "awards:none") {
    const cm = c.ceremony!;
    commitAwards(c, true);
    headline = `${cm.year} ${SHOW_FULL[cm.show] ?? cm.show} · 수상 없음`;
    text = "무대는 잘 마쳤지만 트로피는 없었어요. 객석에서 박수를 보내며 내년을 생각했어요.";
    c.mental = Math.max(0, c.mental - 4);
    reaction = { kind: "award-miss" };
    c.pending = scheduleEvent(c) ?? (c.flags.budgetDue === c.turn ? budgetEvent(c) : null);
  } else if (op.startsWith("speech:")) {
    const cm = c.ceremony!;
    const kind = op.slice(7);
    const rx = extra.reaction;
    if (rx === "cry") c.loyalty = Math.min(100, c.loyalty + 3);
    else if (rx === "joy") c.popularity += 1;
    else if (rx === "calm") addReputation(c, 1);
    let speech = "";
    if (kind === "fans") { c.loyalty = Math.min(100, c.loyalty + 8); addReputation(c, 3); speech = "이 상은 팬 여러분 거예요. 응원봉 하나하나가 저희를 여기까지 데려왔어요."; }
    else if (kind === "parents") { addReputation(c, 4); c.mental = Math.min(100, c.mental + 5); speech = "엄마 아빠, 연습생 때 믿어줘서 고마워요. 이 트로피는 집에 가져갈게요."; }
    else if (kind === "company") { c.trust = Math.min(100, c.trust + 10); c.loyalty = Math.max(0, c.loyalty - 3); speech = "대표님과 스태프 분들께 감사해요. 회사가 아니었다면 이 무대는 없었어요."; }
    else {
      c.popularity += 4; addReputation(c, -6); speech = "솔직히 올해는 저희가 받을 줄 알았어요.";
      if (rng(c) < 0.25) { addReputation(c, -4); notes.push("수상소감이 '거만하다'는 반응이 커뮤니티에 돌았어요. 태도 논란이 붙었어요."); }
    }
    const r = commitAwards(c, true);
    notes.push(...r.notes);
    celebrate = r.celebrate;
    spotlight = r.spotlight;
    const top = [...c.awards].filter((a) => a.year === cm.year).sort((a, b) => rank(b) - rank(a))[0];
    headline = `${top.show} ${top.name}`;
    text = `${rx === "cry" ? "눈물을 닦으며 " : rx === "calm" ? "담담하게 " : "환하게 웃으며 "}마이크를 잡았어요. "${speech}"`;
    tone = "milestone";
    reaction = { kind: top.kind === "daesang" ? "daesang" : "award" };
    c.pending = scheduleEvent(c) ?? (c.flags.budgetDue === c.turn ? budgetEvent(c) : null);
  } else if (op.startsWith("budget:")) {
    const p = BUDGET_PRESETS.find((x) => x.id === op.slice(7))!;
    c.budget = { ...p.split };
    delete c.flags.budgetDue;
    headline = `홍보 예산: ${p.name}`;
    text = `뮤직비디오 ${p.split.mv}% · 음원 ${p.split.digital}% · 해외 ${p.split.global}% · 팬 콘텐츠 ${p.split.fan}%로 올해를 운영해요.`;
  } else if (op === "feud:talk") {
    c.chemistry = Math.min(100, c.chemistry + 18);
    c.mental -= 6;
    headline = "멤버들과 밤새 이야기했어요";
    text = "쌓였던 말을 다 꺼냈어요. 당장 편하진 않지만 팀이 다시 한 방향을 봐요.";
    tone = "good";
  } else if (op === "feud:company") {
    c.chemistry = Math.min(100, c.chemistry + 8);
    c.trust = Math.max(0, c.trust - 6);
    headline = "회사가 중재했어요";
    text = "회사가 멤버 면담을 잡았어요. 겉으로는 정리됐지만 '회사가 끼었다'는 서운함이 남아요.";
  } else if (op === "feud:ignore") {
    c.chemistry = Math.max(0, c.chemistry - 8);
    headline = "일단 활동부터 했어요";
    text = "말을 아끼고 스케줄을 돌렸어요. 분위기는 더 가라앉았어요.";
    tone = "bad";
  } else if (op === "agency-closed") {
    const a = agencyById(c.agencyId);
    c.stage = "free";
    c.agencyId = null;
    c.agencyJoinedTurn = null;
    c.traineeContractEnd = null;
    c.trust = 0;
    c.warnings = 0;
    c.money.invested = 0;
    headline = `${a?.name ?? "회사"} 폐업`;
    text = "회사가 문을 닫아 무소속이 됐어요. 개인 채무는 없어요. 다른 회사에 지원할 수 있어요.";
    tone = "bad";
    log(c, headline, text, "system");
  }

  if (/^(renew|independent|solo|trainee:renew|move:|debut$)/.test(op)) c.flags.contractTurn = c.turn;
  if (!c.pending) c.pending = null;
  let commentTone: "good" | "bad" | "neutral" | undefined;
  if (!reaction) {
    const BAD_EVENT_KIND: Record<string, import("./reactions.ts").ReactionKind> = {
      "member-bullying": "scandal-bullying", dating: "scandal-dating", "member-dui": "scandal-dui", "live-controversy": "scandal-live", chartfraud: "scandal-chart",
      hate: "hate-sasaeng", "hiatus-health": "health", injury: "injury", feud: "feud", "debut-cut": "cut",
    };
    const kind: import("./reactions.ts").ReactionKind =
      BAD_EVENT_KIND[event.id] ?? (event.id === "isac" ? "isac" : event.id === "sns-open" ? "sns-open" : op.startsWith("military:") ? "military-enlist"
      : op === "debut" ? "debut" : op.startsWith("showcase:") ? "showcase" : op === "renew" ? "renew" : op.startsWith("move:") ? "move" : op === "independent" ? "own-label" : op === "solo" ? "leave"
      : op === "retire" ? "disband" : event.id === "agency-bankrupt" ? "bankrupt" : op === "scandal" || event.id.includes("controversy") ? "scandal" : op === "hiatus" ? "hiatus" : "generic");
    reaction = { kind };
    if (event.id in BAD_EVENT_KIND) commentTone = tone === "good" ? "neutral" : "bad";
  }
  const comments = event.public || reaction.kind !== "generic" ? buildReactions(c, commentTone ?? (tone === "bad" ? "bad" : tone === "neutral" ? "neutral" : "good"), reaction) : [];
  finish(c, before, headline, text, tone, { scene: event.scene, notes, comments, celebrate, spotlight });
  return c;
}

// ─────────────────────────── 기획사 지원 ───────────────────────────

export function applyToAgency(original: Career, agencyId: string): Career {
  const c = clone(original);
  const a = agencyById(agencyId);
  if (!a) throw new GameError("기획사를 골라주세요.");
  if (c.stage === "retired") throw new GameError("이미 완성된 인생예요.");
  if (c.stage === "idol") throw new GameError("전속계약 중이에요. 재계약 시점에 열려요.");
  if (c.pending) throw new GameError("먼저 지금의 선택을 마쳐주세요.");
  if (c.agencyId === agencyId) throw new GameError("이미 소속된 회사예요.");
  const last = c.flags[`apply:${agencyId}`];
  if (last !== undefined && c.turn - last < 2) throw new GameError("같은 회사에는 1년 뒤 다시 지원할 수 있어요.");
  if (appliedThisSeason(c) >= APPLY_PER_SEASON) throw new GameError(`기획사 지원은 시즌마다 ${APPLY_PER_SEASON}곳까지예요. 다음 시즌에 다시 지원해주세요.`);
  c.result = null;
  const before = snapshot(c);
  c.flags[`apply:${agencyId}`] = c.turn;
  c.flags.appliedCount = appliedThisSeason(c) + 1;
  c.flags.appliedTurn = c.turn;
  const p = auditionChance(c, agencyId);
  const passed = rng(c) < p;
  if (passed) {
    const prev = agencyById(c.agencyId);
    const headline = `${a.name} 오디션 합격`;
    const text = prev ? `${prev.name}와 합의 종료 조건으로 ${a.fullName}에서 연습생 계약서를 보내왔어요.` : `${a.fullName}에서 연습생 계약서를 보내왔어요. ${TIERS[a.tier].description}.`;
    log(c, headline, "합격 통보와 함께 계약서가 도착했어요.", "milestone");
    c.pending = {
      id: "trainee-offer",
      title: `${a.name} 연습생 계약 제안`,
      text: `${a.fullName}가 ${c.name} 연습생과 계약하고 싶어해요. 조건을 확인하고 서명해주세요.`,
      scene: "contract",
      choices: [
        { id: "sign", label: "계약하기", hint: "연습생이 되어 회사 트레이닝을 받아요", risk: "safe", op: `join:${agencyId}`, sign: true },
        { id: "decline", label: "거절하기", hint: prev ? "지금 회사에 남아요" : "무소속으로 남아 다른 회사를 노려요", risk: "bold", op: "decline" },
      ],
    };
    finish(c, before, headline, text, "good", { scene: "audition" });
  } else {
    c.mental = Math.max(0, c.mental - 6);
    const headline = `${a.name} 오디션 불합격`;
    const text = c.stage === "free" ? "이번엔 아쉽게 떨어졌어요. 심사평을 받았어요. 실력을 쌓고 다시 도전할 수 있어요." : "이번엔 아쉽게 떨어졌어요. 지금 회사에서 계속 준비해요.";
    log(c, headline, text, "system");
    finish(c, before, headline, text, "bad", { scene: "audition" });
  }
  return c;
}

export const appliedThisSeason = (c: Pick<Career, "flags" | "turn">) => (c.flags.appliedTurn === c.turn ? c.flags.appliedCount ?? 1 : 0);

// ─────────────────────────── 상점 ───────────────────────────

export function buyItem(original: Career, itemId: string): Career {
  const c = clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 인생예요.");
  if (c.pending) throw new GameError("먼저 지금의 선택을 마쳐주세요.");
  const item = shopOffers(c).find((x) => x.id === itemId);
  if (!item) throw new GameError("이번 시즌에 파는 물건이 아니에요.");
  if (boughtThisSeason(c)) throw new GameError("상점에서는 시즌마다 하나만 살 수 있어요.");
  const price = priceOf(c, item);
  if (walletOf(c) < price) throw new GameError("정산금이 부족해요.");
  c.result = null;
  const before = snapshot(c);
  c.money.spent = Math.round(((c.money.spent ?? 0) + price) * 10) / 10;
  c.potential[item.stat] = Math.min(99, c.potential[item.stat] + item.amount);
  c.stats[item.stat] = Math.min(99, c.stats[item.stat] + item.amount);
  c.flags.shopTurn = c.turn;
  c.items = [...(c.items ?? []), item.id];
  log(c, `${item.name} 구매`, `${STAT_NAMES[item.stat]}이(가) ${item.amount} 올랐어요.`, "growth");
  // 시즌 정산·SNS 갱신은 돌리지 않는다: 아이템은 명시된 능력치만 바꾼다
  c.result = buildResult(c, before, `${item.name} 구매`, `${item.description}. ${STAT_NAMES[item.stat]} 실력이 늘었어요.`, "good");
  return c;
}

// ─────────────────────────── 은퇴 ───────────────────────────

export function retire(original: Career, reason = "마지막 앵콜 무대를 마쳤어요."): Career {
  const c = original.result === null && original.pending === null ? original : clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 인생예요.");
  const before = snapshot(c);
  const ending = endingFor(c);
  c.ending = ending;
  c.stage = "retired";
  c.pending = null;
  log(c, ending.title, ending.text, "milestone");
  updateSettlement(c);
  c.result = buildResult(c, before, ending.title, reason, "milestone", { scene: "retirement", notes: [ending.subtitle] });
  return c;
}

export function retireCareer(original: Career): Career {
  return retire(clone(original));
}

export const conditionText = (c: Career) => conditionOf(c).label;
export const isHalfTwo = isSecondHalf;
export { activate, eventById };
export type { Effects };
