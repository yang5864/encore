import catalog from "./catalog.json" with { type: "json" };

export type ArtFrame = { url: string; height: number; x: number; y: number };
type SceneArt = { background: string; avatars: Record<string, ArtFrame[]> };
const scenes: Record<string, SceneArt> = catalog.scenes;

/** 여성 6–11, 남성 12–17. 초기 캐릭터 0–5는 비율이 달라 폐기했다 */
export const FEMALE_AVATARS = [6, 7, 8, 9, 10, 11];
export const MALE_AVATARS = [12, 13, 14, 15, 16, 17];
export const AVATAR_COUNT = 18;
export const isFemaleAvatar = (i: number) => FEMALE_AVATARS.includes(i);
/** 폐기한 0–5를 고른 예전 저장본·기록: 가장 닮은 캐릭터로 보여준다 (흑단발→흑발 픽시, 갈색 단발→곱슬 양갈래, 긴 웨이브→로즈 땋은 머리, 흑발 가르마→흑발 언더컷, 금발→금발 울프컷, 은발→애쉬 퍼플) */
export const LEGACY_AVATAR: Record<number, number> = { 0: 9, 1: 10, 2: 7, 3: 14, 4: 12, 5: 17 };

export function avatarIndex(index: number, gender?: "female" | "male"): number {
  const raw = Number.isInteger(index) && index >= 0 && index < catalog.avatars.length ? index : FEMALE_AVATARS[0];
  const valid = LEGACY_AVATAR[raw] ?? raw;
  if (gender === "female" && !isFemaleAvatar(valid)) return FEMALE_AVATARS[0];
  if (gender === "male" && isFemaleAvatar(valid)) return MALE_AVATARS[0];
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

/** 이 장면 전용 동작 그림이 있는 아바타인가 */
export function hasSceneFrames(scene: string, index: number, gender?: "female" | "male"): boolean {
  return !!sceneFrames(Object.hasOwn(scenes, scene) ? scene : "rest", avatarIndex(index, gender))?.length;
}

/** `uniform`: 그룹 중 누구 하나라도 장면 전용 그림이 없으면 모두 같은 기본 동작(노래·춤·서 있기)으로 맞춘다 */
/**
 * 시상식 의자 그림은 쓰지 않는다: 프레임이 넘어갈 때 의자가 좌우로 흔들려 보인다.
 * 객석 장면은 서서 박수 치는 프레임(수상 없음 세트의 1~3)을, 호명·박수 장면은 서 있는 프레임만 쓴다.
 */
const FRAMES_FROM: Record<string, string> = { "awards-seat": "awards-lose" };
const FRAME_PICK: Record<string, number[]> = { "awards-win": [2, 3], "awards-lose": [0, 1, 2] };
function sceneFrames(key: string, avatar: number): ArtFrame[] | undefined {
  const source = FRAMES_FROM[key] ?? key;
  const frames = scenes[source]?.avatars[avatar];
  const pick = FRAME_PICK[source];
  return frames && pick ? pick.map((i) => frames[i]).filter(Boolean) : frames;
}

export function eventArt(scene: string, index: number, gender?: "female" | "male", mood?: ArtMood, uniform = false) {
  const avatar = avatarIndex(index, gender);
  let key = Object.hasOwn(scenes, scene) ? scene : "rest";
  if ((key === "military" || key === "military-band") && isFemaleAvatar(avatar)) key = "rest";
  if (key === "military-concert" && !isFemaleAvatar(avatar)) key = "festival";
  const art = scenes[key];
  const action = ["dance", "challenge", "isac"].includes(key) ? "dance"
    : ["album", "vocal", "survival", "tour", "coachella", "festival", "military-concert"].includes(key) ? "sing" : "idle";
  const available = uniform ? undefined : sceneFrames(key, avatar);
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
