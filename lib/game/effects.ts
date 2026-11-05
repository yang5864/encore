import type { Career, Change, Effects, Log, LogKind, StatKey } from "./types.ts";
import { STAT_KEYS, STAT_NAMES, clampStat, overall } from "./stats.ts";
import { conditionOf } from "./format.ts";

export function log(c: Career, title: string, text: string, kind: LogKind = "story") {
  const entry: Log = { turn: c.turn, title, text, kind };
  c.history.unshift(entry);
  if (c.history.length > 200) c.history.length = 200;
}

/** Positive reputation gains are halved while reputation is negative (spec 4.2). */
export function addReputation(c: Career, delta: number) {
  const d = delta > 0 && c.reputation < 0 ? delta / 2 : delta > 0 && c.reputation >= 50 ? delta * 0.5 : delta;
  c.reputation = Math.max(-100, Math.min(100, c.reputation + d));
}

export function applyEffects(c: Career, e: Effects | undefined) {
  if (!e) return;
  for (const k of STAT_KEYS) if (e[k]) c.stats[k] = clampStat(Math.round(c.stats[k] + e[k]!));
  if (e.health) c.health = Math.max(0, Math.min(100, c.health + e.health));
  if (e.mental) c.mental = Math.max(0, Math.min(100, c.mental + e.mental));
  if (e.trust) c.trust = Math.max(0, Math.min(100, c.trust + e.trust));
  if (e.fans) c.fans = Math.max(0, Math.round(c.fans + e.fans));
  if (e.fansMul) {
    // Growth saturates for huge fandoms; losses apply in full.
    const damp = e.fansMul > 1 ? 1 / (1 + c.fans / 5000000) : 1;
    c.fans = Math.max(0, Math.round(c.fans * (1 + (e.fansMul - 1) * damp)));
  }
  if (e.popularity) c.popularity = Math.max(0, Math.min(100, c.popularity + e.popularity));
  if (e.reputation) addReputation(c, e.reputation);
  if (e.loyalty) c.loyalty = Math.max(0, Math.min(100, (c.loyalty ?? 50) + e.loyalty));
  if (e.revenue) c.money.revenue = Math.round((c.money.revenue + e.revenue) * 10) / 10;
}

export type Snapshot = {
  stats: Record<StatKey, number>;
  ovr: number;
  fans: number;
  popularity: number;
  reputation: number;
  loyalty: number;
  chemistry: number;
  condition: number;
  settled: number;
  instagram: number;
  youtube: number;
  spotify: number;
};

export function snapshot(c: Career): Snapshot {
  return {
    stats: { ...c.stats },
    ovr: overall(c.stats, c.position),
    fans: c.fans,
    popularity: Math.round(c.popularity),
    reputation: Math.round(c.reputation),
    loyalty: Math.round(c.loyalty ?? 50),
    chemistry: Math.round(c.chemistry ?? 60),
    condition: conditionOf(c).value,
    settled: c.money.settled,
    instagram: c.metrics?.instagram ?? 0,
    youtube: c.metrics?.youtube ?? 0,
    spotify: c.metrics?.spotify ?? 0,
  };
}

/** Changes between two snapshots, ordered by how much a player cares. */
export function diff(before: Snapshot, after: Snapshot, showMoney: boolean): Change[] {
  const out: Change[] = [];
  const push = (key: string, label: string, b: number, a: number, fmt: Change["fmt"]) => {
    if (Math.round(b * 10) !== Math.round(a * 10)) out.push({ key, label, before: b, after: a, fmt });
  };
  push("ovr", "OVR", before.ovr, after.ovr, "int");
  push("fans", "팬", before.fans, after.fans, "fans");
  push("loyalty", "팬덤 결속", before.loyalty, after.loyalty, "int");
  push("chemistry", "팀 케미", before.chemistry, after.chemistry, "int");
  push("popularity", "인기도", before.popularity, after.popularity, "int");
  push("reputation", "평판", before.reputation, after.reputation, "rep");
  if (showMoney) push("settled", "정산금", before.settled, after.settled, "won");
  push("instagram", "인스타 팔로워", before.instagram, after.instagram, "count");
  push("youtube", "유튜브 구독자", before.youtube, after.youtube, "count");
  push("spotify", "스포티파이 리스너", before.spotify, after.spotify, "count");
  for (const k of STAT_KEYS) push(k, STAT_NAMES[k], Math.round(before.stats[k]), Math.round(after.stats[k]), "int");
  push("condition", "컨디션", before.condition, after.condition, "int");
  return out;
}
