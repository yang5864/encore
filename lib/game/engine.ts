import type { ActiveEvent, Career, ChoiceDef, Comment, Concept, Effects, MilestoneId, StatKey, Tone, TurnResult } from "./types.ts";
import { GameError } from "./types.ts";
import { AGENCIES, agencyById, auditionChance, TIERS } from "./agencies.ts";
import { STAT_KEYS, STAT_NAMES, overall } from "./stats.ts";
import { ageOf, conditionOf, eraScale, isSecondHalf, MAX_TURN, periodLabel, yearOf } from "./format.ts";
import { rng, between, pick } from "./rng.ts";
import { applyEffects, addReputation, diff, log, snapshot, type Snapshot } from "./effects.ts";
import { CONCEPTS, MAIN_STAT, focusLabel, lowestStat, soloChance, soloStat, SOLO_LABELS, SOLO_UNLOCK_TURNS, type SoloKind } from "./focus.ts";
import { makeAlbum, albumSummary, addShowWin, winBase, ALBUM_NAME_PATTERN } from "./album.ts";
import type { Award } from "./types.ts";
import { yearEndAwards } from "./awards.ts";
import { DEBUT_COST, TRAINEE_COST_PER_TURN, updateSettlement } from "./economy.ts";
import { checkMilestones } from "./milestones.ts";
import { endingFor } from "./endings.ts";
import { buildReactions } from "./reactions.ts";
import { updateMetrics } from "./metrics.ts";
import { debutEvaluation, scheduleEvent, activate } from "./schedule.ts";
import { eventById } from "./events/index.ts";
import { bankruptcyRisk } from "./renewal.ts";
import { decodeEta, etaLabel, setDebutEta } from "./debut.ts";
import { boughtThisSeason, itemById, priceOf, shopOffers, walletOf } from "./shop.ts";

export { focusOptions } from "./focus.ts";
export { createCareer } from "./create.ts";

/** 지원은 시즌마다 세 곳까지. */
export const APPLY_PER_SEASON = 3;
/** 지망생·연습생 시절 포텐이 터질 확률(시즌당). 19세까지 약 16시즌이면 커리어당 약 21%. */
export const BURST_CHANCE = 0.015;

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
  const t = (base + chart) * (c.stage === "idol" ? 1 : 0.5);
  return Math.max(0, Math.min(100, t));
}

function buildResult(c: Career, before: Snapshot, headline: string, text: string, tone: Tone, opts: { scene?: string; notes?: string[]; comments?: Comment[]; milestones?: MilestoneId[]; awards?: Award[] } = {}): TurnResult {
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
  };
}

function finish(c: Career, before: Snapshot, headline: string, text: string, tone: Tone, opts: { scene?: string; notes?: string[]; comments?: Comment[]; awards?: Award[] } = {}) {
  updateSettlement(c);
  updateMetrics(c);
  c.peakPopularity = Math.max(c.peakPopularity, Math.round(c.popularity));
  const milestones = checkMilestones(c);
  if (milestones.includes("firstSettlement")) log(c, "첫 정산", "투자비를 모두 회수했어요. 이제 번 돈이 내 몫으로 들어와요.", "milestone");
  c.result = buildResult(c, before, headline, text, milestones.length ? "milestone" : tone, { ...opts, milestones });
}

// ─────────────────────────── 시즌 진행 ───────────────────────────

export function advanceTurn(original: Career, focusId: string): Career {
  const c = clone(original);
  if (c.stage === "retired") throw new GameError("이미 완성된 인생예요. 새 이야기를 시작해보세요.");
  if (c.pending) throw new GameError("먼저 지금의 선택을 마쳐주세요.");
  c.result = null;
  c.flags.prevPopularity = c.popularity;
  const before = snapshot(c);
  const notes: string[] = [];
  let tone: Tone = "neutral";
  let scene: string | undefined;
  let comments: Comment[] = [];
  let wonAwards: Award[] = [];

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

  const [kind, arg, ...restParts] = (c.hiatusUntil > c.turn ? "rest" : focusId).split(":");
  const albumName = restParts.length ? decodeURIComponent(restParts.join(":")) : "";
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
      const album = makeAlbum(c, concept, albumName);
      headline = `${c.albums.length === 1 ? "데뷔 앨범" : "새 앨범"} ${album.name}`;
      text = albumSummary(album);
      scene = "album";
      tone = album.melon !== null && album.melon <= 10 || album.wins > 0 ? "good" : "neutral";
      log(c, headline, text, "release");
      if (album.wins > 0) log(c, `음악방송 1위 ${album.wins}회`, `${album.name} 활동으로 1위 트로피를 들었어요.`, "award");
      if (album.billboard !== null) log(c, `빌보드 Hot 100 ${album.billboard}위`, "타이틀곡이 미국 종합 차트에 올랐어요.", "award");
      if (c.flags.albumViral === c.turn) { tone = "good"; notes.push("타이틀곡이 숏폼에서 터졌어요. 예상보다 훨씬 많은 사람이 들었어요."); }
      if (c.flags.albumFlop === c.turn) { tone = "bad"; notes.push("이번 앨범은 반응이 차가웠어요. 팬덤 일부가 이탈했어요."); }
      comments = buildReactions(c, tone === "good" ? "good" : tone === "bad" ? "bad" : "neutral");
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
    } else if (kind === "solo") {
      const solo = arg as SoloKind;
      if (!SOLO_LABELS[solo]) throw new GameError("개인 활동을 골라주세요.");
      if (c.debutTurn === null || c.turn - c.debutTurn < SOLO_UNLOCK_TURNS) throw new GameError("데뷔 3년 뒤부터 개인 활동을 할 수 있어요.");
      const stat = soloStat(c, solo);
      const p = soloChance(c, solo);
      const success = rng(c) < p;
      grow(c, stat, success ? 3 : 1.5);
      c.health -= 8;
      c.flags[`solo:${solo}`] = (c.flags[`solo:${solo}`] ?? 0) + (success ? 1 : 0);
      const statName = STAT_NAMES[stat];
      if (success) {
        tone = "good";
        if (solo === "acting") { c.popularity += 7; applyEffects(c, { fansMul: 1.1, reputation: 5, revenue: 6 }); headline = "드라마 흥행 — 연기돌로 인정"; text = `${period}, 출연한 작품이 화제가 됐어요. '연기 되는 아이돌' 수식어가 붙었어요.`; scene = "drama"; }
        else if (solo === "solo") { c.popularity += 6; applyEffects(c, { fansMul: 1.1, reputation: 4, revenue: 9 }); headline = "솔로 앨범 성공"; text = `${period}, 내 이름으로 낸 앨범이 좋은 성적을 냈어요. ${statName} 실력이 빛났어요.`; scene = "songwriting"; }
        else if (solo === "variety") { c.popularity += 9; applyEffects(c, { fansMul: 1.08, reputation: 4, revenue: 4 }); headline = "예능 캐릭터가 터졌다"; text = `${period}, 고정 예능과 개인 채널이 동시에 떴어요. 대중이 이름을 기억해요.`; scene = "variety"; }
        else { c.popularity += 3; applyEffects(c, { reputation: 5, revenue: 8 }); headline = "프로듀싱 곡이 차트에 올랐다"; text = `${period}, 다른 가수에게 준 곡이 히트했어요. 작곡가 크레딧에 이름이 쌓여요.`; scene = "songwriting"; }
        comments = buildReactions(c, "good");
      } else {
        tone = "bad";
        c.mental -= 8;
        c.popularity -= 2;
        applyEffects(c, { revenue: 1 });
        if (solo === "acting") { addReputation(c, -4); headline = "연기력 논란"; text = `${period}, 출연작에서 연기력 지적을 받았어요. 비주얼만으로는 배역을 끌고 가기 어려웠어요.`; scene = "drama"; }
        else if (solo === "solo") { headline = "솔로 앨범 부진"; text = `${period}, 솔로 앨범 반응이 조용했어요. ${statName} 실력이 아직 솔로를 끌고 가기엔 부족했어요.`; scene = "songwriting"; }
        else if (solo === "variety") { headline = "예능에서 묻혔다"; text = `${period}, 고정 예능에서 존재감이 없었어요. 예능 수치가 낮으면 분량이 안 나와요.`; scene = "variety"; }
        else { headline = "곡이 채택되지 않았다"; text = `${period}, 보낸 데모가 채택되지 않았어요. 프로듀싱 실력을 더 쌓아야 해요.`; scene = "songwriting"; }
        comments = buildReactions(c, "bad");
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
  c.popularity = Math.round(Math.max(0, Math.min(100, c.popularity * 0.65 + popularityTarget(c) * 0.35)) * 10) / 10;

  // ── 연말 결산 ──
  if (c.turn % 2 === 0 && c.stage === "idol") {
    const year = yearOf({ turn: c.turn - 1 });
    const won = yearEndAwards(c, year, [c.turn - 2, c.turn - 1]);
    wonAwards = won;
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
  if (rng(c) < bankruptcyRisk(c)) {
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

  c.pending = scheduleEvent(c);
  finish(c, before, headline, text, tone, { scene, notes, comments, awards: wonAwards });
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
}

export function resolveChoice(original: Career, choiceId: string, extra: { groupName?: string; albumName?: string } = {}): Career {
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
    addReputation(c, 3);
    headline = `${name} 데뷔 확정`;
    text = `${ageOf(c)}세, ${a.name}에서 ${name}(으)로 데뷔해요. 데뷔 앨범 콘셉트를 정할 차례예요.`;
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
    headline = `${album.name} 역주행 1위`;
    text = "발매한 지 한참 된 곡이 멜론 1위에 올랐어요. 음악방송에서 다시 1위 트로피를 들었어요.";
    tone = "milestone";
    log(c, headline, text, "award");
  } else if (op.startsWith("musicshow:")) {
    const album = c.albums[c.albums.length - 1];
    const base = Math.min(0.7, winBase(c, album.melon, album.sales) * 1.2);
    const p = op === "musicshow:push" ? Math.min(0.75, base + 0.1) : base;
    if (op === "musicshow:push" && rng(c) < 0.3) { addReputation(c, -2); notes.push("일부 커뮤니티에서 과한 총공이라는 말이 나왔어요."); }
    const show = rng(c) < p ? addShowWin(c, album, rng(c)) : null;
    if (show) {
      applyEffects(c, { fansMul: 1.08 });
      c.popularity += 3;
      headline = `${show} 1위!`;
      text = `${album.name}(으)로 ${show} 1위 트로피를 들었어요. 앵콜 무대에서 팬들이 떼창을 했어요.`;
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
    const turns = branch === "army" ? 3 : 4;
    c.militaryUntil = c.turn + turns;
    c.flags.militaryDone = 1;
    headline = { army: "육군 입대", navy: "해군 입대", airforce: "공군 입대" }[branch] ?? "입대";
    text = `${turns * 6}개월 뒤 돌아와요. 다음 진행에서 복무 기간이 한 번에 지나가요.`;
    log(c, headline, text, "milestone");
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
  const item = itemById(itemId);
  if (!item || !shopOffers(c).some((x) => x.id === itemId)) throw new GameError("이번 시즌에 파는 물건이 아니에요.");
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
  finish(c, before, `${item.name} 구매`, `${item.description}. ${STAT_NAMES[item.stat]} 실력이 늘었어요.`, "good");
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
