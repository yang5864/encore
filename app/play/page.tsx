"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCareer } from "@/hooks/useCareer";
import { Button, FixedCta } from "@/components/ui/Button";
import { ProfileCard } from "@/components/play/ProfileCard";
import { StatsCard } from "@/components/play/StatsCard";
import { SettlementCard } from "@/components/play/SettlementCard";
import { FocusCard, focusIdOf, type FocusSelection } from "@/components/play/FocusCard";
import { EventSheet } from "@/components/play/EventSheet";
import { ResultSheet } from "@/components/play/ResultSheet";
import { MilestoneSheet } from "@/components/play/MilestoneSheet";
import { AgencySheet } from "@/components/play/AgencySheet";
import { MenuSheet } from "@/components/play/MenuSheet";
import { CoachMarks } from "@/components/play/CoachMarks";
import { Card } from "@/components/ui/Card";
import { loadSettings, saveSettings } from "@/lib/storage";
import { focusOptions } from "@/lib/game/focus";
import { periodLabel } from "@/lib/game/format";
import type { MilestoneId } from "@/lib/game/types";

export default function PlayPage() {
  const router = useRouter();
  const { career, ready, error, clearError, advance, choose, apply, retire, dismissResult, reset, exportFile, importFile } = useCareer();
  const [focus, setFocus] = useState<FocusSelection>({ id: "" });
  const [progress, setProgress] = useState(0);
  const [agencyOpen, setAgencyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coach, setCoach] = useState(false);
  const [milestoneQueue, setMilestoneQueue] = useState<MilestoneId[]>([]);
  const [seenResultKey, setSeenResultKey] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !career) router.replace("/");
  }, [ready, career, router]);

  useEffect(() => {
    if (ready && career && !loadSettings().coachDone) setCoach(true);
  }, [ready, career]);

  // Default focus: first enabled option.
  useEffect(() => {
    if (!career) return;
    const opts = focusOptions(career);
    if (!opts.some((o) => o.id === focus.id && !o.disabledReason)) {
      const first = opts.find((o) => !o.disabledReason);
      setFocus({ id: first?.id ?? "", stat: "vocal", concept: "fresh" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career?.turn, career?.stage, career?.pending?.id]);

  // Queue milestone sheets for a new result.
  const resultKey = career?.result ? `${career.turn}:${career.result.headline}:${career.history.length}` : null;
  useEffect(() => {
    if (career?.result && resultKey !== seenResultKey) {
      setMilestoneQueue(career.result.milestones);
      setSeenResultKey(resultKey);
    }
  }, [career, resultKey, seenResultKey]);

  const pendingMilestone = milestoneQueue[0] ?? null;
  const showResult = !!career?.result && !pendingMilestone;
  const showEvent = !!career?.pending && !career.result && !pendingMilestone;

  const runAdvance = () => {
    if (!career) return;
    setProgress(10);
    requestAnimationFrame(() => setProgress(100));
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      advance(focusIdOf(focus));
      setProgress(0);
    }, reduce ? 0 : 800);
  };

  const ctaLabel = useMemo(() => {
    if (!career) return "";
    if (career.stage === "retired") return "기록 보기";
    if (career.pending) return "선택 확인하기";
    return `${periodLabel(career)} 진행`;
  }, [career]);

  if (!ready || !career) return <div className="shell" />;

  return (
    <main className="shell pt-3">
      <div className="top-progress" style={{ width: `${progress}%`, opacity: progress ? 1 : 0 }} />
      <header className="flex items-center justify-between h-12 mb-2">
        <Link href="/" className="font-extrabold text-[18px] tracking-tight">encore<span className="text-primary">.</span></Link>
        <button onClick={() => setMenuOpen(true)} aria-label="메뉴" className="press w-10 h-10 rounded-xl bg-white flex items-center justify-center">
          <span className="block w-4 h-[2px] bg-ink rounded-full shadow-[0_5px_0_var(--text),0_-5px_0_var(--text)]" />
        </button>
      </header>

      <div className="flex flex-col gap-3">
        <ProfileCard career={career} onAgency={() => setAgencyOpen(true)} />
        <StatsCard career={career} />
        {career.stage === "idol" || career.stage === "retired" ? <SettlementCard career={career} /> : null}
        {career.stage === "retired" ? (
          <Card className="fade-up">
            <p className="t-cap text-primary">{career.ending?.subtitle}</p>
            <h2 className="t-title mt-1">{career.ending?.title}</h2>
            <p className="t-body text-ink-2 mt-2">{career.ending?.text}</p>
          </Card>
        ) : (
          <FocusCard career={career} value={focus} onChange={setFocus} />
        )}
        {career.history.length > 0 && (
          <Card className="fade-up" style={{ animationDelay: "240ms" }}>
            <p className="t-cap mb-2">최근 기록</p>
            {career.history.slice(0, 3).map((h, i) => (
              <div key={i} className={`py-2.5 ${i ? "border-t border-line" : ""}`}>
                <p className="text-[12px] text-ink-3">{periodLabel({ turn: h.turn })}</p>
                <p className="text-[14px] font-bold mt-0.5">{h.title}</p>
              </div>
            ))}
            <button onClick={() => setMenuOpen(true)} className="press mt-2 text-[13px] font-bold text-primary">전체 기록 보기</button>
          </Card>
        )}
      </div>

      <FixedCta>
        {error && (
          <button onClick={clearError} className="mb-2 w-full rounded-xl bg-down-soft text-down text-[13px] font-bold py-2.5 px-3 text-left">
            {error}
          </button>
        )}
        <Button
          id="advance-cta"
          disabled={progress > 0 || (!career.pending && career.stage !== "retired" && !focus.id)}
          onClick={() => {
            if (career.stage === "retired") router.push("/records");
            else if (career.pending) dismissResult();
            else runAdvance();
          }}
        >
          {progress > 0 ? "진행 중…" : ctaLabel}
        </Button>
      </FixedCta>

      <MilestoneSheet career={career} id={pendingMilestone} open={!!pendingMilestone} onClose={() => setMilestoneQueue((q) => q.slice(1))} />
      {career.result && <ResultSheet result={career.result} open={showResult} onClose={dismissResult} ctaLabel={career.pending ? "다음 선택 보기" : "확인"} />}
      <EventSheet career={career} open={showEvent} onChoose={choose} />
      <AgencySheet
        career={career}
        open={agencyOpen}
        onClose={() => setAgencyOpen(false)}
        onApply={(id) => {
          setAgencyOpen(false);
          apply(id);
        }}
      />
      <MenuSheet
        career={career}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onExport={exportFile}
        onImport={importFile}
        onRetire={retire}
        onReset={() => {
          reset();
          router.replace("/");
        }}
      />
      {coach && (
        <CoachMarks
          onDone={() => {
            saveSettings({ ...loadSettings(), coachDone: true });
            setCoach(false);
          }}
        />
      )}
    </main>
  );
}
