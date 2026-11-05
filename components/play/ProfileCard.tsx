"use client";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { MilestoneBar } from "./MilestoneBar";
import { Logo } from "@/components/Logo";
import { agencyById, TIERS } from "@/lib/game/agencies";
import { ageText, careerPhase, displayName, MAX_TURN, periodLabel, STAGE_NAMES } from "@/lib/game/format";
import { POSITIONS } from "@/lib/game/stats";
import { lineupRoles } from "@/lib/game/debut";
import type { Career } from "@/lib/game/types";

export function ProfileCard({ career, onAgency }: { career: Career; onAgency: () => void }) {
  const a = agencyById(career.agencyId);
  const position = POSITIONS.find((p) => p.id === career.position)?.name;
  const monthsLeft = career.contractEnd !== null ? Math.max(0, (career.contractEnd - career.turn) * 6) : null;
  return (
    <Card className="fade-up">
      <div className="flex items-center gap-4">
        <div className="w-[72px] h-[90px] rounded-2xl bg-chip flex items-end justify-center overflow-hidden">
          <Avatar index={career.avatar} size={64} name={career.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-cap">{career.stage === "retired" ? `커리어 완성 · ${ageText({ turn: Math.min(career.turn, MAX_TURN) })} 은퇴` : `${periodLabel(career)} · ${ageText(career)}`}</p>
          <h1 className="t-title truncate mt-0.5">{displayName(career)}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Chip tone={career.stage === "idol" ? "info" : career.stage === "trainee" ? "ok" : "neutral"}>{careerPhase(career) === STAGE_NAMES[career.stage] ? STAGE_NAMES[career.stage] : `${STAGE_NAMES[career.stage]} · ${careerPhase(career)}`}</Chip>
            {career.stage !== "free" && career.stage !== "trainee" && career.lineup && !career.flags.solo ? (
              lineupRoles(career.lineup).slice(0, 3).map((r) => <Chip key={r}>{r}</Chip>)
            ) : (
              <Chip>{position}</Chip>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-sub px-4 py-3">
        <div className="min-w-0">
          <p className="t-cap">소속</p>
          <p className="t-body font-bold truncate flex items-center gap-1.5">
            {career.flags.independent && career.stage !== "free" ? (
              <span className="truncate">{career.name} 개인 소속사 <span className="text-ink-3 font-medium">· 1인 기획사</span></span>
            ) : a ? (
              <>
                <Logo id={a.logo} label={a.name} color={a.color} size={20} rounded="full" />
                <span className="truncate">{a.name} <span className="text-ink-3 font-medium">· {TIERS[a.tier].short}</span></span>
              </>
            ) : (
              "무소속 지망생"
            )}
          </p>
          {career.stage === "idol" && monthsLeft !== null && <p className="text-[13px] text-ink-3 mt-0.5">전속계약 {monthsLeft}개월 남음</p>}
          {career.stage === "trainee" && career.traineeContractEnd !== null && <p className="text-[13px] text-ink-3 mt-0.5">연습생 계약 {Math.max(0, (career.traineeContractEnd - career.turn) * 6)}개월 남음</p>}
        </div>
        {career.stage !== "retired" && (
          <button onClick={onAgency} className="press shrink-0 h-10 px-3.5 rounded-xl bg-primary-soft text-primary text-[13px] font-bold">
            {career.stage === "idol" ? "기획사 보기" : "기획사 지원"}
          </button>
        )}
      </div>

      <div className="mt-5">
        <MilestoneBar career={career} />
      </div>
    </Card>
  );
}
