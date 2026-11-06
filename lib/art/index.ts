import catalog from "./catalog.json" with { type: "json" };

export type ArtFrame = { url: string; height: number; x: number; y: number };
type SceneArt = { background: string; avatars: Record<string, ArtFrame[]> };
const scenes: Record<string, SceneArt> = catalog.scenes;

/** 여성 0–2·6–11, 남성 3–5·12–17 */
export const FEMALE_AVATARS = [0, 1, 2, 6, 7, 8, 9, 10, 11];
export const MALE_AVATARS = [3, 4, 5, 12, 13, 14, 15, 16, 17];
export const AVATAR_COUNT = 18;
export const isFemaleAvatar = (i: number) => FEMALE_AVATARS.includes(i);

export function avatarIndex(index: number, gender?: "female" | "male"): number {
  const valid = Number.isInteger(index) && index >= 0 && index < catalog.avatars.length ? index : 0;
  if (gender === "female" && !isFemaleAvatar(valid)) return 0;
  if (gender === "male" && isFemaleAvatar(valid)) return 3;
  return valid;
}

export function idleFrames(index: number): ArtFrame[] {
  return catalog.avatars[avatarIndex(index)].idle;
}

export type ArtMood = "sad" | "happy" | "neutral";

/** 표정 프레임(울상·활짝). 장면 전용 동작이 없을 때, 기본 서 있는 동작 대신 쓴다 */
export function moodFrame(index: number, mood: ArtMood | undefined): ArtFrame | null {
  if (mood !== "sad" && mood !== "happy") return null;
  const entry = catalog.avatars[avatarIndex(index)] as { mood?: Record<string, ArtFrame> };
  return entry.mood?.[mood] ?? null;
}

export function eventArt(scene: string, index: number, gender?: "female" | "male", mood?: ArtMood) {
  const avatar = avatarIndex(index, gender);
  let key = Object.hasOwn(scenes, scene) ? scene : "rest";
  if ((key === "military" || key === "military-band") && isFemaleAvatar(avatar)) key = "rest";
  if (key === "military-concert" && !isFemaleAvatar(avatar)) key = "festival";
  const art = scenes[key];
  const action = ["dance", "challenge", "isac"].includes(key) ? "dance"
    : ["album", "vocal", "survival", "tour", "coachella", "festival", "military-concert"].includes(key) ? "sing" : "idle";
  const available = art.avatars[avatar];
  // 장면 전용 동작이 없으면: 슬픈 결과는 항상 울상, 좋은 결과는 가만히 서 있을 때만 활짝
  const expression = available?.length ? null : moodFrame(avatar, mood === "sad" || action === "idle" ? mood : undefined);
  return { scene: key, background: art.background, moodApplied: !!expression,
    frames: expression ? [expression] : available?.length ? available : catalog.avatars[avatar][action] };
}

const EQUIPMENT: Record<string, string[]> = {
  vocal: ["studio-microphone", "headphones", "vocal-booth"],
  dance: ["dance-sneakers", "full-length-mirror", "practice-room-pass"],
  rap: ["studio-microphone", "headphones"],
  visual: ["ring-light", "vlog-camera"],
  variety: ["vlog-camera", "ring-light"],
  producing: ["midi-keyboard", "audio-interface", "songwriter-notebook"],
  "train:all": ["practice-room-pass", "full-length-mirror"],
  comeback: ["studio-microphone", "audio-interface", "headphones"],
  promo: ["vlog-camera", "ring-light"],
  fanmeet: ["vlog-camera", "ring-light"],
  overseas: ["in-ear-monitor"],
  "solo:solo": ["in-ear-monitor", "studio-microphone"],
  "solo:acting": ["vlog-camera"],
  "solo:variety": ["vlog-camera", "ring-light"],
  "solo:producing": ["midi-keyboard", "songwriter-notebook"],
};

export function equipmentPath(focus: string, stat: string, turn: number): string | null {
  const items = EQUIPMENT[focus === "train" ? stat : focus];
  if (!items) return null;
  const season = Math.max(0, Math.trunc(turn));
  return `/art-v3/items/${items[season % items.length]}-0${1 + (Math.floor(season / items.length) % 2)}.png`;
}
