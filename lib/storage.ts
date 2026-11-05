import type { Career } from "./game/types.ts";
import { GameError } from "./game/types.ts";
import { scoreOf } from "./game/endings.ts";
import { overall } from "./game/stats.ts";

export const KEYS = { career: "encore2:career", records: "encore2:records", settings: "encore2:settings" } as const;

export type CareerRecord = {
  id: string;
  name: string;
  groupName: string;
  avatar: number;
  agency: string | null;
  ending: string;
  endingId: string;
  score: number;
  ovr: number;
  fans: number;
  awards: number;
  wins: number;
  albums: number;
  age: number;
  retiredAt: number;
};

export type Settings = { coachDone?: boolean; reduceMotion?: boolean };

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(custom?: Store): Store | null {
  if (custom) return custom;
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    return null;
  }
  return null;
}

const REQUIRED: (keyof Career)[] = ["v", "id", "seed", "rngState", "name", "gender", "avatar", "position", "stats", "potential", "turn", "stage", "fans", "popularity", "reputation", "money", "albums", "awards", "flags", "seen", "history", "milestones"];

export function parseCareer(text: string): Career {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new GameError("저장 파일을 읽을 수 없어요. JSON 형식인지 확인해주세요.");
  }
  if (!data || typeof data !== "object") throw new GameError("저장 파일 형식이 올바르지 않아요.");
  const c = data as Record<string, unknown>;
  if (c.v !== 2) throw new GameError("ENCORE 2.0 저장 파일만 가져올 수 있어요.");
  for (const k of REQUIRED) if (!(k in c)) throw new GameError(`저장 파일에 ${k} 항목이 없어요.`);
  if (typeof c.name !== "string" || typeof c.turn !== "number" || !Array.isArray(c.albums)) throw new GameError("저장 파일 내용이 손상됐어요.");
  // 이전 2.0 저장본 보완
  if (!c.metrics || typeof c.metrics !== "object") c.metrics = { instagram: 0, youtube: 0, spotify: 0 };
  const stats = c.stats as Record<string, number>;
  for (const k of Object.keys(stats)) stats[k] = Math.round(stats[k]);
  if (!Array.isArray(c.items)) c.items = [];
  if (!Array.isArray(c.timeline)) c.timeline = [];
  if (typeof c.loyalty !== "number") c.loyalty = 50;
  if (typeof c.chemistry !== "number") c.chemistry = 60;
  if (typeof c.buzz !== "number") c.buzz = 0;
  // 예전 솔로 전향은 그룹명을 내 이름으로 덮어썼다: 데뷔 기록에서 되찾는다
  if (c.groupName === c.name && Array.isArray(c.history)) {
    const debut = (c.history as { title: string }[]).find((h) => h.title.endsWith(" 데뷔 확정"));
    if (debut) c.groupName = debut.title.slice(0, -" 데뷔 확정".length);
  }
  return c as unknown as Career;
}

export function loadCareer(s?: Store): Career | null {
  const st = store(s);
  if (!st) return null;
  const raw = st.getItem(KEYS.career);
  if (!raw) return null;
  try {
    return parseCareer(raw);
  } catch {
    return null;
  }
}

export function saveCareer(c: Career, s?: Store) {
  store(s)?.setItem(KEYS.career, JSON.stringify(c));
}

export function clearCareer(s?: Store) {
  store(s)?.removeItem(KEYS.career);
}

export function exportJSON(c: Career): string {
  return JSON.stringify(c, null, 2);
}

export function importJSON(text: string): Career {
  return parseCareer(text);
}

export function loadRecords(s?: Store): CareerRecord[] {
  const raw = store(s)?.getItem(KEYS.records);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function toRecord(c: Career, now = Date.now()): CareerRecord {
  return {
    id: c.id,
    name: c.name,
    groupName: c.groupName,
    avatar: c.avatar,
    agency: c.agencyId,
    ending: c.ending?.title ?? "",
    endingId: c.ending?.id ?? "",
    score: scoreOf(c),
    ovr: overall(c.stats, c.position),
    fans: c.fans,
    awards: c.awards.length,
    wins: c.musicWins,
    albums: c.albums.length,
    age: 12 + Math.floor(c.turn / 2), // 만 나이로 저장, 화면에선 한국 나이(+2)로 보여준다
    retiredAt: now,
  };
}

export function addRecord(c: Career, s?: Store, now = Date.now()): CareerRecord[] {
  const list = loadRecords(s).filter((r) => r.id !== c.id);
  list.push(toRecord(c, now));
  list.sort((a, b) => b.score - a.score || b.retiredAt - a.retiredAt);
  const trimmed = list.slice(0, 50);
  store(s)?.setItem(KEYS.records, JSON.stringify(trimmed));
  return trimmed;
}

export function loadSettings(s?: Store): Settings {
  const raw = store(s)?.getItem(KEYS.settings);
  if (!raw) return {};
  try {
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

export function saveSettings(v: Settings, s?: Store) {
  store(s)?.setItem(KEYS.settings, JSON.stringify(v));
}
