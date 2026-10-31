import type { ActiveEvent, Career, ChoiceDef } from "./types.ts";
import { agencyById, AGENCIES, TIERS, type Agency } from "./agencies.ts";
import { DEBUT_COST, memberShare } from "./economy.ts";
import { wonText } from "./format.ts";

export type ContractRow = { label: string; value: string; accent?: boolean };
export type ContractTerms = {
  title: string;
  text: string;
  party: { name: string; sub: string; logo: string | null; color: string } | null;
  rows: ContractRow[];
  notes: string[];
  needsGroupName: boolean;
};

const eok = (v: number) => wonText(Math.round(v * 10) / 10);

function partyOf(a: Agency | null): ContractTerms["party"] {
  if (!a) return null;
  return { name: a.fullName, sub: `${TIERS[a.tier].name} · ${a.strength}`, logo: a.logo, color: a.color };
}

/** Human-readable contract for a signing choice. Mirrors what the engine will do on resolve. */
export function contractTerms(c: Career, event: ActiveEvent, choice: ChoiceDef): ContractTerms {
  const op = choice.op ?? "";
  const mine = agencyById(c.agencyId);
  const targetId = op.startsWith("join:") ? op.slice(5) : op.startsWith("scout:") ? op.slice(6) : null;
  const target = targetId ? agencyById(targetId) : null;

  if (op.startsWith("join:") || op.startsWith("scout:") || op === "freecast") {
    const a = target ?? mine;
    return {
      title: `${a?.name ?? "기획사"}가 ${c.name} 연습생과 계약하고 싶어해요`,
      text: "표준 연습생 계약서예요. 훈련비는 회사가 부담하고, 데뷔 전 중도 해지 시 개인에게 청구하지 않아요.",
      party: partyOf(a ?? null),
      rows: [
        { label: "계약 기간", value: "3년" },
        { label: "훈련비", value: "회사 부담 (시즌당 1.5억원 상당)" },
        { label: "숙소 · 레슨", value: "제공" },
        { label: "데뷔 평가", value: "매년 월말평가 기준", accent: true },
      ],
      notes: ["데뷔 후 수익에서 직접비를 회수할지는 별도 합의 사항이에요.", "계약 중 다른 회사 지원은 합의 종료 후 가능해요."],
      needsGroupName: false,
    };
  }
  if (op === "trainee:renew") {
    return {
      title: `${mine?.name ?? "회사"}와 연습생 재계약`,
      text: "평가 자료와 비용 내역을 확인했어요. 새 계약 기간 안에 데뷔를 목표로 해요.",
      party: partyOf(mine),
      rows: [
        { label: "계약 기간", value: "3년" },
        { label: "훈련비", value: "회사 부담" },
        { label: "데뷔 평가", value: "매년", accent: true },
      ],
      notes: ["기존 계약의 훈련비는 개인 채무로 전환되지 않아요."],
      needsGroupName: false,
    };
  }
  if (op === "debut") {
    const a = mine!;
    const share = Math.round(memberShare(c) * 100);
    return {
      title: `${a.name}가 ${c.name}와 전속계약을 맺고 싶어해요`,
      text: "데뷔조 합류와 함께 맺는 표준 전속계약이에요. 데뷔 제작비는 회사가 먼저 투자하고 매출로 회수한 뒤 정산해요.",
      party: partyOf(a),
      rows: [
        { label: "계약 기간", value: "7년", accent: true },
        { label: "데뷔 제작비", value: `${eok(DEBUT_COST * a.budget)} 회사 선투자` },
        { label: "정산", value: `회수 후 순이익의 ${share}% 중 멤버 몫` },
        { label: "활동 범위", value: "음반 · 공연 · 방송 · 광고" },
      ],
      notes: ["그룹 이름을 정하면 계약과 함께 데뷔가 확정돼요.", "7년 뒤 재계약 · 독립 · 솔로 · 해체를 다시 정해요."],
      needsGroupName: true,
    };
  }
  if (op === "renew") {
    const share = Math.round((memberShare(c) + 0.1) * 100);
    return {
      title: `${mine?.name ?? "회사"}와 재계약`,
      text: "7년의 활동을 인정받아 조건이 좋아진 새 계약이에요.",
      party: partyOf(mine),
      rows: [
        { label: "계약 기간", value: "3년" },
        { label: "정산", value: `순이익의 ${share}% 중 멤버 몫`, accent: true },
        { label: "활동", value: "그룹 활동 유지 · 개인 활동 보장" },
      ],
      notes: ["팬들이 가장 안도하는 선택이에요."],
      needsGroupName: false,
    };
  }
  if (op === "independent") {
    return {
      title: "멤버들과 독립 레이블 설립 계약",
      text: "멤버들이 직접 회사를 세우고 그룹 상표권을 가져와요. 제작 지원은 줄지만 정산 몫이 크게 늘어요.",
      party: { name: `${c.groupName || c.name} LABEL`, sub: "독립 레이블 · 멤버 공동 설립", logo: null, color: "#3182f6" },
      rows: [
        { label: "계약 기간", value: "3년" },
        { label: "정산", value: "순이익의 70% 중 멤버 몫", accent: true },
        { label: "제작 지원", value: "기존의 60% 수준" },
      ],
      notes: ["상표권과 활동 결정권을 멤버들이 가져요."],
      needsGroupName: false,
    };
  }
  if (op === "transfer") {
    return {
      title: "다른 회사와 새 전속계약 · 팀 활동 유지",
      text: "더 큰 회사로 옮기되 상표권 합의로 그룹 활동은 그대로 이어가요. 이적할 회사는 협상 결과에 따라 정해져요.",
      party: { name: "대형 · 중견 기획사 중 협상", sub: "상표권 사용 합의 포함", logo: null, color: "#7c5cff" },
      rows: [
        { label: "계약 기간", value: "3년" },
        { label: "정산", value: "조건 개선 (+10%p)", accent: true },
        { label: "그룹 활동", value: "유지 (상표권 합의)" },
      ],
      notes: ["신뢰는 새 회사에서 다시 쌓아요."],
      needsGroupName: false,
    };
  }
  if (op === "solo") {
    return {
      title: `${c.name} 솔로 전속계약`,
      text: "그룹을 떠나 내 이름으로 활동해요. 정산은 온전히 내 몫이지만 팬덤 일부가 떠나요.",
      party: partyOf(mine),
      rows: [
        { label: "계약 기간", value: "3년" },
        { label: "정산", value: "순이익 중 내 몫 100%", accent: true },
        { label: "활동", value: "솔로 앨범 · 개인 활동" },
      ],
      notes: ["그룹 활동은 종료돼요."],
      needsGroupName: false,
    };
  }
  return {
    title: event.title,
    text: event.text,
    party: partyOf(mine),
    rows: [],
    notes: [],
    needsGroupName: false,
  };
}

export const SIGNING_OPS = ["join:", "scout:", "freecast", "trainee:renew", "debut", "renew", "independent", "transfer", "solo"];
export const isSigningChoice = (choice: ChoiceDef) => !!choice.sign;

export { AGENCIES };
