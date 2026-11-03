import type { ActiveEvent, Career, ChoiceDef } from "./types.ts";
import { AGENCIES, agencyById } from "./agencies.ts";
import { MAIN_STAT } from "./focus.ts";
import { overall } from "./stats.ts";
import { eraScale, yearOf } from "./format.ts";
import { rng } from "./rng.ts";

/** 지금 소속사가 재계약을 원할 확률. 인기와 실력이 회사 기준보다 높을수록 붙잡는다. */
export function renewWillingness(c: Career): number {
  const a = agencyById(c.agencyId);
  if (!a || c.flags.independent) return 1;
  return Math.max(0.1, Math.min(0.98, 0.25 + c.popularity / 80 + (overall(c.stats, c.position) - a.threshold) / 30));
}

/** 해외 기획사 한 곳이 오퍼를 보낼 확률. */
export function globalOfferChance(c: Career, agencyId: string): number {
  const a = agencyById(agencyId)!;
  const fans = c.fans / eraScale(yearOf(c));
  const p = -0.35 + c.popularity / 90 + (overall(c.stats, c.position) - 60) / 40 + (fans >= 1000000 ? 0.15 : 0) + (a.stat === MAIN_STAT[c.position] ? 0.1 : 0);
  return Math.max(0, Math.min(0.8, p));
}

export const OWN_LABEL_POPULARITY = 30;
export const LEAVE_GROUP_POPULARITY = 45;

/**
 * 전속계약 만료 또는 소속사 파산 때 받는 제안. 오퍼는 실력과 인기에 따라 들어올 수도, 안 들어올 수도 있다.
 * 국내 기획사끼리의 이적은 현실에서 드물어 넣지 않는다.
 */
export function renewalEvent(c: Career, reason: "contract" | "bankrupt"): ActiveEvent {
  const mine = agencyById(c.agencyId);
  const own = !!c.flags.independent;
  const solo = !!c.flags.solo;
  const choices: ChoiceDef[] = [];
  const lines: string[] = [];

  if (reason === "contract") {
    if (own) {
      choices.push({ id: "renew", label: "내 회사를 계속 운영한다", hint: "지금 방식 그대로 3년 더 활동해요", risk: "safe", op: "renew", sign: true });
    } else if (rng(c) < renewWillingness(c)) {
      choices.push({ id: "renew", label: `${mine?.name ?? "회사"}와 재계약한다`, hint: "정산 조건이 좋아지고 활동이 안정돼요", risk: "safe", op: "renew", sign: true });
      lines.push(`${mine?.name ?? "회사"}는 재계약을 원해요.`);
    } else {
      lines.push(`${mine?.name ?? "회사"}는 재계약 의사를 밝히지 않았어요.`);
    }
  }

  const offers = AGENCIES.filter((a) => a.tier === "global" && a.id !== c.agencyId && rng(c) < globalOfferChance(c, a.id));
  for (const a of offers) {
    choices.push({
      id: `move-${a.id}`,
      label: solo ? `${a.name}와 솔로 계약한다` : `${a.name}로 옮긴다 · 그룹 활동 유지`,
      hint: `${a.strength}. 정산 조건이 좋아지고 해외 활동 지원을 받아요`,
      risk: "bold",
      op: `move:${a.id}`,
      sign: true,
    });
  }
  lines.push(offers.length ? `해외 기획사 ${offers.length}곳에서 오퍼가 왔어요.` : "해외 기획사 오퍼는 없었어요.");

  if (!own) {
    choices.push({
      id: "own",
      label: solo ? "개인 소속사를 세운다" : "개인 소속사를 세운다 · 그룹 활동 유지",
      hint: "정산 몫이 크게 늘지만 제작 지원은 줄어요",
      risk: "bold",
      op: "independent",
      sign: true,
      requires: { popularity: OWN_LABEL_POPULARITY },
    });
  }
  if (!solo) {
    choices.push({
      id: "leave",
      label: "그룹을 탈퇴하고 개인 소속사를 세운다",
      hint: "내 이름으로만 활동해요. 정산은 온전히 내 몫이지만 팬덤 일부가 떠나요",
      risk: "bold",
      op: "solo",
      sign: true,
      requires: { popularity: LEAVE_GROUP_POPULARITY },
    });
  }
  choices.push({ id: "disband", label: solo ? "활동을 마무리한다" : "그룹 활동을 마무리한다", hint: "아름다운 마무리. 커리어가 끝나고 기록에 남아요", risk: "bold", op: "retire" });

  const first = !c.flags.renewed;
  if (reason === "bankrupt") {
    return {
      id: "agency-bankrupt",
      title: `${mine?.name ?? "소속사"} 파산`,
      text: `회수하지 못한 제작비가 쌓여 ${mine?.name ?? "소속사"}가 문을 닫았어요. 남은 제작비 부담은 사라졌지만 새 길을 정해야 해요. ${lines.join(" ")}`,
      scene: "contract",
      public: true,
      choices,
    };
  }
  return {
    id: "contract7",
    title: first ? "7년 재계약 협상" : "재계약 협상",
    text: `전속계약 만료가 다가왔어요. ${lines.join(" ")} 이 선택이 다음 몇 년을 정해요.`,
    scene: "contract",
    public: true,
    choices,
  };
}

/** 회사가 버티지 못할 만큼 적자가 쌓였는지. 대형 기획사는 파산하지 않는다. */
export function bankruptcyRisk(c: Career): number {
  const a = agencyById(c.agencyId);
  if (!a || c.stage !== "idol" || c.flags.independent || a.tier === "major") return 0;
  const cap = (a.tier === "indie" ? 12 : a.tier === "mid" ? 35 : 50) * eraScale(yearOf(c));
  const unrecovered = c.money.invested - c.money.revenue;
  if (unrecovered < cap) return 0;
  const weak = overall(c.stats, c.position) < a.threshold || c.popularity < 25;
  return weak ? 0.35 : 0.08;
}
