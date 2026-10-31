import type { ActiveEvent, Career, ChoiceDef, Comment, Concept, Effects, MilestoneId, StatKey, Tone, TurnResult } from "./types.ts";
import { GameError } from "./types.ts";
import { AGENCIES, agencyById, auditionChance, TIERS } from "./agencies.ts";
import { STAT_KEYS, STAT_NAMES, overall } from "./stats.ts";
import { ageOf, conditionOf, isSecondHalf, MAX_TURN, periodLabel, yearOf } from "./format.ts";
import { rng, between, pick } from "./rng.ts";
import { applyEffects, addReputation, diff, log, snapshot, type Snapshot } from "./effects.ts";
import { CONCEPTS, MAIN_STAT, focusLabel, lowestStat } from "./focus.ts";
import { makeAlbum, albumSummary } from "./album.ts";
import { yearEndAwards } from "./awards.ts";
import { DEBUT_COST, TRAINEE_COST_PER_TURN, updateSettlement } from "./economy.ts";
import { checkMilestones } from "./milestones.ts";
import { endingFor } from "./endings.ts";
import { buildReactions } from "./reactions.ts";
import { debutEvaluation, scheduleEvent, activate } from "./schedule.ts";
import { eventById } from "./events/index.ts";

export { focusOptions } from "./focus.ts";
export { createCareer } from "./create.ts";

const DEBUT_FANS: Record<string, number> = { major: 60000, mid: 15000, indie: 3000, global: 20000 };
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
  const gain = amount * ageMultiplier(ageOf(c)) * agencyMul * school * headroom * (0.9 + rng(c) * 0.2);
  c.stats[stat] = Math.min(99, Math.round((c.stats[stat] + gain) * 10) / 10);
}

function popularityTarget(c: Career): number {
  const base = 10.5 * Math.log10(c.fans + 1) + Math.max(0, c.reputation) * 0.1;
  const recent = c.albums.filter((a) => c.turn - a.turn <= 2);
  const chart = Math.min(10, recent.reduce((s, a) => s + (a.melon !== null ? Math.max(0, 30 - a.melon) / 5 : 0) + (a.billboard !== null ? 5 : 0), 0));
  const t = (base + chart) * (c.stage === "idol" ? 1 : 0.5);
  return Math.max(0, Math.min(100, t));
}

function buildResult(c: Career, before: Snapshot, headline: string, text: string, tone: Tone, opts: { scene?: string; notes?: string[]; comments?: Comment[]; milestones?: MilestoneId[] } = {}): TurnResult {
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
  };
}

function finish(c: Career, before: Snapshot, headline: string, text: string, tone: Tone, opts: { scene?: string; notes?: string[]; comments?: Comment[] } = {}) {
  updateSettlement(c);
  c.peakPopularity = Math.max(c.peakPopularity, Math.round(c.popularity));
  const milestones = checkMilestones(c);
  if (milestones.includes("firstSettlement")) log(c, "첫 정산", "투자비를 모두 회수했어요. 이제 번 돈이 내 몫으로 들어와요.", "milestone");
  c.result = buildResult(c, before, headline, text, milestones.length ? "milestone" : tone, { ...opts, milestones });
}

// ─────────────────────────── 반기 진행 ───────────────────────────

export function advanceTurn(original: Career, focusId: string): Career {
  const c = clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 커리어예요. 새 이야기를 시작해보세요.");
  if (c.pending) throw new GameError("먼저 지금의 선택을 마쳐주세요.");
  c.result = null;
  const before = snapshot(c);
  const notes: string[] = [];
  let tone: Tone = "neutral";
  let scene: string | undefined;
  let comments: Comment[] = [];

  // 군 복무: 한 번에 건너뛴다
  if (c.militaryUntil > c.turn) {
    const months = (c.militaryUntil - c.turn) * 6;
    c.turn = c.militaryUntil;
    c.fans = Math.round(c.fans * 0.9);
    c.popularity = Math.max(0, c.popularity - 8);
    c.health = Math.min(100, c.health + 20);
    c.mental = Math.min(100, c.mental + 10);
    for (const k of STAT_KEYS) c.stats[k] = Math.max(0, c.stats[k] - 1);
    log(c, "전역", `${months}개월의 복무를 마치고 돌아왔어요. 팬들이 기다리고 있었어요.`, "milestone");
    c.pending = scheduleEvent(c);
    finish(c, before, "전역했어요", `${months}개월의 복무를 마쳤어요. 팬들이 기다리고 있었어요. 다시 무대로 돌아갈 시간이에요.`, "good", { scene: "military" });
    return c;
  }

  const [kind, arg] = (c.hiatusUntil > c.turn ? "rest" : focusId).split(":");
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
    if (c.stage === "trainee") {
      c.money.invested += TRAINEE_COST_PER_TURN;
      c.trust = Math.min(100, c.trust + 4);
    }
  } else if (c.stage === "idol") {
    if (kind === "comeback") {
      if (c.lastReleaseTurn === c.turn) throw new GameError("이번 반기에 이미 앨범을 냈어요.");
      const concept = arg as Concept;
      if (!CONCEPTS.some((x) => x.id === concept)) throw new GameError("콘셉트를 골라주세요.");
      const album = makeAlbum(c, concept);
      headline = `${c.albums.length === 1 ? "데뷔 앨범" : "새 앨범"} ${album.name}`;
      text = albumSummary(album);
      scene = "album";
      tone = album.melon !== null && album.melon <= 10 || album.wins > 0 ? "good" : "neutral";
      log(c, headline, text, "release");
      if (album.wins > 0) log(c, `음악방송 1위 ${album.wins}회`, `${album.name} 활동으로 1위 트로피를 들었어요.`, "award");
      if (album.billboard !== null) log(c, `빌보드 Hot 100 ${album.billboard}위`, "타이틀곡이 미국 종합 차트에 올랐어요.", "award");
      comments = buildReactions(c, tone === "good" ? "good" : "neutral");
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
      comments = buildReactions(c, "good");
    } else if (kind === "fanmeet") {
      applyEffects(c, { fansMul: 1.07 });
      addReputation(c, 4);
      c.money.revenue += 2;
      c.mental += 6;
      c.health -= 4;
      grow(c, "variety", 1.5);
      text = `${period}, 팬미팅과 자체 콘텐츠로 팬들과 가까워졌어요.`;
      scene = "fansign";
      comments = buildReactions(c, "good");
    } else if (kind === "overseas") {
      if (c.popularity < 55) throw new GameError("인기도가 더 필요해요.");
      applyEffects(c, { fansMul: 1.12 });
      c.popularity += 3;
      c.money.revenue += 6;
      c.health -= 12;
      c.mental -= 4;
      addReputation(c, 3);
      c.flags.globalBoost = c.turn + 1;
      text = `${period}, 해외 투어와 쇼케이스를 돌았어요. 다음 앨범의 해외 반응이 기대돼요.`;
      scene = "tour";
      comments = buildReactions(c, "good");
    } else if (kind === "rest") {
      c.health += 35;
      c.mental += 30;
      c.fans = Math.round(c.fans * 0.97);
      text = `${period}, 휴식기를 가졌어요. 팬들은 기다려줬어요.`;
      headline = "휴식기";
      scene = "rest";
    } else throw new GameError("선택할 수 없는 계획이에요.");
    c.trust = Math.min(100, c.trust + 2);
  }

  // ── 시간이 흐른다 ──
  c.turn += 1;
  c.health = Math.max(0, Math.min(100, c.health + 8));
  c.mental = Math.max(0, Math.min(100, c.mental + (c.schoolId === "ged" && c.stage !== "idol" ? 3 : 6)));
  if (c.flags.scandalTurn !== c.turn - 1) addReputation(c, 1);

  if (c.stage === "idol") {
    const gap = c.lastReleaseTurn === null ? 99 : c.turn - c.lastReleaseTurn;
    if (kind !== "comeback") c.fans = Math.round(c.fans * 0.97);
    if (gap >= 2 && kind !== "comeback") {
      c.popularity -= 5;
      c.fans = Math.round(c.fans * 0.95);
      notes.push("오랜 공백으로 관심이 줄었어요. 컴백을 준비해보세요.");
    }
    const age = ageOf(c);
    if (age >= 32) c.popularity -= 2;
    else if (age >= 28) c.popularity -= 1;
  }
  c.popularity = Math.round(Math.max(0, Math.min(100, c.popularity * 0.5 + popularityTarget(c) * 0.5)) * 10) / 10;

  // ── 연말 결산 ──
  if (c.turn % 2 === 0 && c.stage === "idol") {
    const year = yearOf({ turn: c.turn - 1 });
    const won = yearEndAwards(c, year, [c.turn - 2, c.turn - 1]);
    if (won.length) {
      for (const a of won) log(c, `${a.show} ${a.name}`, `${year}년 연말 시상식에서 ${a.name}을 받았어요.`, "award");
      notes.push(`${year} 연말 시상식: ${won.map((a) => `${a.show} ${a.name}`).join(", ")}`);
      if (won.some((a) => a.kind === "daesang")) tone = "good";
    } else notes.push(`${year} 연말 시상식: 올해는 수상하지 못했어요.`);
  }

  // ── 데뷔 평가 ──
  const evaluation = debutEvaluation(c);
  if (evaluation) {
    const a = agencyById(c.agencyId)!;
    const ovr = overall(c.stats, c.position);
    if (evaluation === "offer") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 1; }
    else if (evaluation === "miss") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 2; notes.push(`데뷔 평가: 기준 OVR ${a.threshold}에 근접했어요.`); }
    else if (evaluation === "warn") { c.flags.debutEval = c.turn; c.flags.debutEvalKind = 3; c.warnings += 1; notes.push(`데뷔 평가 경고 ${c.warnings}회: OVR ${ovr}, 기준 ${a.threshold}`); }
    else notes.push(`데뷔 평가 피드백: OVR ${ovr}, 데뷔조 기준 ${a.threshold}. ${a.stat === MAIN_STAT[c.position] ? "회사 강점과 포지션이 잘 맞아요." : `${STAT_NAMES[a.stat]}을(를) 보강하면 빨라져요.`}`);
  }
  if (c.stage === "free") {
    const best = AGENCIES.map((a) => ({ a, p: auditionChance(c, a.id) })).filter((x) => (c.flags[`apply:${x.a.id}`] ?? -9) <= c.turn - 2).sort((x, y) => y.p - x.p)[0];
    if (best) notes.push(`지금 ${best.a.name} 합격 가능성이 가장 높아요. 홈의 소속 카드에서 지원할 수 있어요.`);
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

  c.pending = scheduleEvent(c);
  finish(c, before, headline, text, tone, { scene, notes, comments });
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

function joinAgency(c: Career, agencyId: string) {
  c.agencyId = agencyId;
  c.agencyJoinedTurn = c.turn;
  c.stage = "trainee";
  c.traineeContractEnd = c.turn + 6;
  c.trust = 30;
  c.warnings = 0;
  c.money.invested = 0;
  c.flags.debutDeferredUntil = 0;
}

export function resolveChoice(original: Career, choiceId: string, extra: { groupName?: string } = {}): Career {
  const c = clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 커리어예요.");
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

  // 확률 선택
  if (choice.chance !== undefined) {
    const success = rng(c) < choice.chance;
    applyEffects(c, success ? choice.success : choice.fail);
    text = (success ? choice.successText : choice.failText) ?? text;
    tone = success ? "good" : "bad";
    headline = success ? `${choice.label} — 성공` : `${choice.label} — 아쉬운 결과`;
    if (success && op === "tour:dome") c.flags.domeTour = 1;
    if (!success && op === "scandal") { c.flags.scandalTurn = c.turn; c.hiatusUntil = c.turn + 1; }
  } else {
    applyEffects(c, choice.effects);
  }

  // 운영 훅
  if (op === "freecast") {
    const a = pick(c, AGENCIES.filter((x) => x.tier === "indie"));
    joinAgency(c, a.id);
    headline = `${a.name} 연습생이 됐어요`;
    text = `${a.fullName}의 캐스팅 오디션을 통과했어요. 작은 연습실이지만 가끔 기적이 숨어 있는 곳이에요.`;
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op.startsWith("scout:")) {
    const a = agencyById(op.slice(6))!;
    joinAgency(c, a.id);
    c.scoutCount += 1;
    headline = `${a.name}로 이적했어요`;
    text = `${a.fullName}의 연습생으로 새로 시작해요. 신뢰는 처음부터 쌓아요.`;
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
    c.money.invested += Math.round(DEBUT_COST * a.budget * 10) / 10;
    c.fans += Math.round(DEBUT_FANS[a.tier] * (0.8 + rng(c) * 0.4));
    c.popularity = Math.max(c.popularity, a.tier === "major" ? 30 : a.tier === "indie" ? 10 : 20);
    c.trust = Math.min(100, c.trust + 10);
    c.mental = Math.min(100, c.mental + 15);
    addReputation(c, 3);
    headline = `${name} 데뷔 확정`;
    text = `${ageOf(c)}세, ${a.name}에서 ${name}(으)로 데뷔해요. 데뷔 앨범 콘셉트를 정할 차례예요.`;
    tone = "milestone";
    log(c, headline, text, "milestone");
    c.pending = debutConceptEvent();
  } else if (op === "debut:wait") {
    c.flags.debutDeferredUntil = c.turn + 2;
    headline = "데뷔를 미뤘어요";
    text = "한 번 더 준비하기로 했어요. 다음 평가에서 다시 제안받아요.";
  } else if (op.startsWith("comeback:")) {
    const album = makeAlbum(c, op.slice(9) as Concept);
    headline = `${c.albums.length === 1 ? "데뷔 앨범" : "새 앨범"} ${album.name}`;
    text = albumSummary(album);
    tone = album.wins > 0 || (album.melon !== null && album.melon <= 10) ? "good" : "neutral";
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
    return retire(c, event.id === "contract7" ? "멤버들과 마지막 콘서트를 마쳤어요." : "꿈을 정리하고 새로운 길을 찾기로 했어요.");
  } else if (op === "grind") {
    for (const k of [MAIN_STAT[c.position]]) c.stats[k] = Math.min(99, c.stats[k] + 3);
  } else if (op === "weakfix") {
    const low = lowestStat(c);
    c.stats[low] = Math.min(99, c.stats[low] + 2.5);
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
    album.wins += 2;
    c.musicWins += 2;
    c.peakMelon = 1;
    c.fans = Math.round(c.fans * between(c, 2.5, 3));
    c.popularity = Math.min(100, c.popularity + 20);
    c.money.revenue += 25;
    addReputation(c, 10);
    c.flags.miracle = 1;
    headline = `${album.name} 역주행 1위`;
    text = "발매한 지 한참 된 곡이 멜론 1위에 올랐어요. 음악방송에서 다시 1위 트로피를 들었어요.";
    tone = "milestone";
    log(c, headline, text, "award");
  } else if (op.startsWith("musicshow:")) {
    const album = c.albums[c.albums.length - 1];
    const base = Math.max(0.15, Math.min(0.9, 0.3 + album.sales / 300000 + (album.melon !== null ? Math.max(0, 40 - album.melon) / 60 : 0)));
    const p = op === "musicshow:push" ? Math.min(0.95, base + 0.25) : base;
    if (op === "musicshow:push" && rng(c) < 0.3) { addReputation(c, -2); notes.push("일부 커뮤니티에서 과한 총공이라는 말이 나왔어요."); }
    if (rng(c) < p) {
      album.wins += 1;
      c.musicWins += 1;
      applyEffects(c, { fansMul: 1.08 });
      c.popularity += 3;
      headline = "음악방송 1위!";
      text = `${album.name}(으)로 1위 트로피를 들었어요. 앵콜 무대에서 팬들이 떼창을 했어요.`;
      tone = "good";
      log(c, headline, text, "award");
    } else {
      headline = "아쉬운 2위";
      text = "근소한 차이로 1위를 놓쳤어요. 다음 주를 노려요.";
      tone = "bad";
    }
  } else if (op === "hiatus") {
    c.hiatusUntil = c.turn + 1;
    headline = "휴식기에 들어가요";
    text = "회사가 활동 중단을 공식 발표했어요. 다음 반기는 쉬어요.";
  } else if (op === "scandal") {
    c.flags.scandalTurn = c.turn;
    c.hiatusUntil = c.turn + 1;
    headline = "팀 자숙 시작";
    text = "공식 입장을 내고 활동을 중단했어요. 회복에는 시간이 걸려요.";
    tone = "bad";
    log(c, headline, text, "system");
  } else if (op.startsWith("military:")) {
    const branch = op.slice(9);
    const turns = branch === "army" ? 3 : 4;
    c.militaryUntil = c.turn + turns;
    c.flags.militaryDone = 1;
    headline = { army: "육군 입대", navy: "해군 입대", airforce: "공군 입대" }[branch] ?? "입대";
    text = `${turns * 6}개월 뒤 돌아와요. 다음 진행에서 복무 기간이 한 번에 지나가요.`;
    log(c, headline, text, "milestone");
  } else if (op === "renew") {
    c.contractEnd = c.turn + 6;
    c.flags.shareBonus = 1;
    c.trust = Math.min(100, c.trust + 15);
    c.mental = Math.min(100, c.mental + 10);
    headline = "재계약 완료";
    text = "정산 조건이 좋아진 새 계약에 서명했어요. 팬들이 안도했어요.";
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "independent") {
    c.contractEnd = c.turn + 6;
    c.flags.independent = 1;
    headline = "독립 레이블 설립";
    text = "멤버들과 직접 회사를 세웠어요. 정산 몫은 크게 늘고 제작 지원은 줄어요.";
    tone = "good";
    log(c, headline, text, "milestone");
  } else if (op === "solo") {
    c.contractEnd = c.turn + 6;
    c.flags.solo = 1;
    c.groupName = c.name;
    c.fans = Math.round(c.fans * 0.75);
    headline = "솔로 전향";
    text = "그룹을 떠나 내 이름으로 활동해요. 팬덤 일부는 떠났지만 정산은 온전히 내 몫이에요.";
    log(c, headline, text, "milestone");
  }

  if (!c.pending) c.pending = null;
  const comments = event.public ? buildReactions(c, tone === "bad" ? "bad" : tone === "neutral" ? "neutral" : "good") : [];
  finish(c, before, headline, text, tone, { scene: event.scene, notes, comments });
  return c;
}

// ─────────────────────────── 기획사 지원 ───────────────────────────

export function applyToAgency(original: Career, agencyId: string): Career {
  const c = clone(original);
  const a = agencyById(agencyId);
  if (!a) throw new GameError("기획사를 골라주세요.");
  if (c.stage === "retired") throw new GameError("이미 완성된 커리어예요.");
  if (c.stage === "idol") throw new GameError("전속계약 중이에요. 재계약 시점에 열려요.");
  if (c.pending) throw new GameError("먼저 지금의 선택을 마쳐주세요.");
  if (c.agencyId === agencyId) throw new GameError("이미 소속된 회사예요.");
  const last = c.flags[`apply:${agencyId}`];
  if (last !== undefined && c.turn - last < 2) throw new GameError("같은 회사에는 1년 뒤 다시 지원할 수 있어요.");
  c.result = null;
  const before = snapshot(c);
  c.flags[`apply:${agencyId}`] = c.turn;
  const p = auditionChance(c, agencyId);
  const passed = rng(c) < p;
  if (passed) {
    const prev = agencyById(c.agencyId);
    joinAgency(c, agencyId);
    const headline = `${a.name} 오디션 합격`;
    const text = prev ? `${prev.name}와 합의 종료하고 ${a.fullName}의 연습생이 됐어요. 신뢰는 처음부터 쌓아요.` : `${a.fullName}의 연습생이 됐어요. ${TIERS[a.tier].description}.`;
    log(c, headline, text, "milestone");
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

// ─────────────────────────── 은퇴 ───────────────────────────

export function retire(original: Career, reason = "마지막 앵콜 무대를 마쳤어요."): Career {
  const c = original.result === null && original.pending === null ? original : clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 커리어예요.");
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
