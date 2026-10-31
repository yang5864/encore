"use client";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { MilestoneBar } from "./MilestoneBar";
import { agencyById, TIERS } from "@/lib/game/agencies";
import { ageOf, careerPhase, periodLabel, STAGE_NAMES } from "@/lib/game/format";
import { POSITIONS } from "@/lib/game/stats";
import type { Career } from "@/lib/game/types";

export function ProfileCard({ career, onAgency }: { career: Career; onAgency: () => void }) {
  const a = agencyById(career.agencyId);
  const position = POSITIONS.find((p) => p.id === career.position)?.name;
  const monthsLeft = career.contractEnd !== null ? Math.max(0, (career.contractEnd - career.turn) * 6) : null;
  return (
    <Card className="fade-up">
      <div className="flex items-center gap-4">
        <div className="w-[72px] h-[90px] rounded-2xl bg-[#f2f4f6] flex items-end justify-center overflow-hidden">
          <Avatar index={career.avatar} size={64} name={career.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-cap">{periodLabel(career)} · {ageOf(career)}세</p>
          <h1 className="t-title truncate mt-0.5">{career.stage === "idol" && career.groupName ? `${career.groupName} ${career.name}` : career.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Chip tone={career.stage === "idol" ? "up" : career.stage === "trainee" ? "ok" : "neutral"}>{careerPhase(career) === STAGE_NAMES[career.stage] ? STAGE_NAMES[career.stage] : `${STAGE_NAMES[career.stage]} · ${careerPhase(career)}`}</Chip>
            <Chip>{position}</Chip>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#f9fafb] px-4 py-3">
        <div className="min-w-0">
          <p className="t-cap">소속</p>
          <p className="t-body font-bold truncate">
            {a ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: a.color }} />
                {a.name} <span className="text-ink-3 font-medium">· {TIERS[a.tier].short}</span>
              </>
            ) : (
              "무소속 지망생"
            )}
          </p>
          {career.stage === "idol" && monthsLeft !== null && <p className="text-[12px] text-ink-3 mt-0.5">전속계약 {monthsLeft}개월 남음</p>}
          {career.stage === "trainee" && career.traineeContractEnd !== null && <p className="text-[12px] text-ink-3 mt-0.5">연습생 계약 {Math.max(0, (career.traineeContractEnd - career.turn) * 6)}개월 남음</p>}
        </div>
        <button onClick={onAgency} className="press shrink-0 h-10 px-3.5 rounded-xl bg-primary-soft text-primary text-[14px] font-bold">
          {career.stage === "free" ? "기획사 지원" : career.stage === "idol" ? "기획사 보기" : "기획사 지원"}
        </button>
      </div>

      <div className="mt-5">
        <MilestoneBar career={career} />
      </div>
    </Card>
  );
}
