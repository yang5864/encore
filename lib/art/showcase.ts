export const SHOWCASE_STEPS: readonly { label: string; copy: string; scene: string; pose?: number }[] = [
  { label: "연습생", copy: "작은 연습실에서", scene: "dance" },
  { label: "데뷔", copy: "드디어 무대 위로", scene: "awards-stage", pose: 1 },
  { label: "음방 1위", copy: "첫 트로피를 들었어요", scene: "awards-win", pose: 2 },
  { label: "대상", copy: "올해의 이름이 됐어요", scene: "awards-speech", pose: 0 },
  { label: "레전드", copy: "마침내 레전드까지", scene: "awards-redcarpet", pose: 1 },
];

export function showcaseAt(tick: number) {
  const step = tick % SHOWCASE_STEPS.length;
  return { step, avatar: Math.floor(tick / SHOWCASE_STEPS.length) % 6, ...SHOWCASE_STEPS[step] };
}
