import { FEMALE_AVATARS, MALE_AVATARS } from "./index.ts";

/** 소개 화면에서 돌아가며 보여줄 아바타: 여자·남자를 번갈아 12명 */
export const SHOWCASE_AVATARS = FEMALE_AVATARS.flatMap((f, i) => [f, MALE_AVATARS[i]]);

export const SHOWCASE_STEPS: readonly { label: string; copy: string; scene: string; pose?: number }[] = [
  { label: "연습생", copy: "작은 연습실에서", scene: "dance" },
  { label: "데뷔", copy: "드디어 무대 위로", scene: "awards-stage", pose: 1 },
  { label: "음방 1위", copy: "첫 트로피를 들었어요", scene: "awards-win", pose: 0 },
  { label: "대상", copy: "올해의 이름이 됐어요", scene: "awards-speech", pose: 0 },
  { label: "레전드", copy: "마침내 레전드까지", scene: "awards-redcarpet", pose: 1 },
];

export function showcaseAt(tick: number) {
  const step = tick % SHOWCASE_STEPS.length;
  return { step, avatar: SHOWCASE_AVATARS[Math.floor(tick / SHOWCASE_STEPS.length) % SHOWCASE_AVATARS.length], ...SHOWCASE_STEPS[step] };
}
