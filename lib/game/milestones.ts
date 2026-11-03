import type { Career, MilestoneId } from "./types.ts";
import { daesangCount } from "./awards.ts";

export const MILESTONES: { id: MilestoneId; label: string; title: string; text: string }[] = [
  { id: "debut", label: "데뷔", title: "데뷔했어요", text: "연습실의 시간이 무대가 됐어요. 이제 모든 선택이 팬들 앞에서 이뤄져요." },
  { id: "firstWin", label: "음방 1위", title: "첫 음악방송 1위", text: "앵콜 무대에서 울었어요. 팬들이 만들어준 첫 트로피예요." },
  { id: "firstSettlement", label: "첫 정산", title: "첫 정산을 받았어요", text: "투자비를 모두 회수했어요. 이제부터 번 돈이 내 몫으로 들어와요." },
  { id: "daesang", label: "대상", title: "대상 수상", text: "올해의 이름이 됐어요. 트로피보다 오래 남는 건 함께한 사람들이에요." },
  { id: "legend", label: "레전드", title: "레전드가 됐어요", text: "이름만으로 한 시대가 떠오르는 아티스트. 작은 연습실에서 시작된 이야기예요." },
];

export const isLegend = (c: Career) => c.peakBillboard === 1 || daesangCount(c) >= 3 || !!c.flags.domeTour || !!c.flags.grammy || !!c.flags.stadiumTour;

/** Returns newly reached milestones and appends them to the career. */
export function checkMilestones(c: Career): MilestoneId[] {
  const reached: MilestoneId[] = [];
  const add = (id: MilestoneId) => {
    if (!c.milestones.includes(id)) {
      c.milestones.push(id);
      reached.push(id);
    }
  };
  if (c.debutTurn !== null) add("debut");
  if (c.musicWins >= 1) add("firstWin");
  if (c.money.firstSettledTurn !== null) add("firstSettlement");
  if (daesangCount(c) >= 1) add("daesang");
  if (isLegend(c)) add("legend");
  return reached;
}

/** 0..5 filled steps for the progress bar. */
export function milestoneStep(c: Pick<Career, "milestones" | "stage">): number {
  const order: MilestoneId[] = ["debut", "firstWin", "daesang", "legend"];
  let step = c.stage === "trainee" || c.stage === "idol" || c.stage === "retired" ? 1 : 0;
  for (const m of order) if (c.milestones.includes(m)) step = Math.max(step, order.indexOf(m) + 2);
  return step;
}
