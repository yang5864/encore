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

export function eventArt(scene: string, index: number, gender?: "female" | "male") {
  const avatar = avatarIndex(index, gender);
  let key = Object.hasOwn(scenes, scene) ? scene : "rest";
  if (key === "military" && isFemaleAvatar(avatar)) key = "rest";
  if (key === "military-concert" && !isFemaleAvatar(avatar)) key = "festival";
  const art = scenes[key];
  const action = ["dance", "challenge"].includes(key) ? "dance"
    : ["album", "vocal", "survival", "tour", "coachella", "festival", "military-concert"].includes(key) ? "sing" : "idle";
  const available = art.avatars[avatar];
  return { scene: key, background: art.background,
    frames: available?.length ? available : catalog.avatars[avatar][action] };
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
