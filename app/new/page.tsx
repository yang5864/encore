"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button, FixedCta } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultSheet } from "@/components/play/ResultSheet";
import { cn } from "@/lib/cn";
import { AGENCIES, TIERS, TIER_ORDER, auditionChance, chanceLabel } from "@/lib/game/agencies";
import { generateCandidates, type Candidate } from "@/lib/game/candidates";
import { createCareer } from "@/lib/game/create";
import { applyToAgency } from "@/lib/game/engine";
import { POSITIONS, STAT_COLORS, STAT_KEYS, STAT_NAMES, overall } from "@/lib/game/stats";
import type { Career, Gender, Tier } from "@/lib/game/types";
import { GameError } from "@/lib/game/types";
import { saveCareer } from "@/lib/storage";

const STEPS = ["프로필", "스타일", "첫 지원"];
const TONE: Record<string, "down" | "warn" | "neutral" | "ok" | "up"> = { "매우 낮음": "down", 낮음: "warn", 보통: "neutral", 높음: "ok", "매우 높음": "up" };

export default function NewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [avatar, setAvatar] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [rerolls, setRerolls] = useState(0);
  const [tier, setTier] = useState<Tier>("mid");
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Career | null>(null);

  useEffect(() => {
    const list = generateCandidates(3);
    setCandidates(list);
    setCandidateId(list[0]?.id ?? null);
  }, []);

  const candidate = candidates.find((c) => c.id === candidateId) ?? null;

  const reroll = () => {
    const list = generateCandidates(3);
    setCandidates(list);
    setCandidateId(list[0]?.id ?? null);
    setRerolls((n) => n + 1);
  };

  const next = () => {
    setError(null);
    if (step === 0 && name.trim().length === 0) return setError("이름을 입력해주세요.");
    if (step === 1 && !candidate) return setError("스타일을 골라주세요.");
    if (step === 2) {
      if (!agencyId || !candidate) return setError("지원할 기획사를 골라주세요.");
      try {
        const c = createCareer({ name, gender, avatar, position: candidate.position, stats: candidate.stats });
        const applied = applyToAgency(c, agencyId);
        saveCareer(applied);
        setResult(applied);
      } catch (e) {
        setError(e instanceof GameError ? e.message : "문제가 생겼어요.");
      }
      return;
    }
    setStep(step + 1);
  };

  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <button onClick={() => (step ? setStep(step - 1) : router.back())} aria-label="뒤로" className="press w-10 h-10 rounded-xl bg-card flex items-center justify-center text-[20px]">‹</button>
        <div className="flex-1">
          <ProgressBar value={((step + 1) / STEPS.length) * 100} height={4} label="진행" />
        </div>
        <span className="t-cap">{step + 1}/{STEPS.length}</span>
      </header>

      {step === 0 && (
        <section className="fade-up mt-6">
          <h1 className="t-title">어떤 아이돌로<br />시작할까요?</h1>
          <p className="t-cap mt-2">14살, 아직 소속사가 없는 지망생이에요.</p>
          <label className="t-cap block mt-8 mb-1.5" htmlFor="name">활동명</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="예: 하린" className="w-full h-14 rounded-2xl bg-card px-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-primary" />
          <p className="t-cap mt-6 mb-2">성별</p>
          <div className="grid grid-cols-2 gap-2">
            {(["female", "male"] as Gender[]).map((g) => (
              <button key={g} onClick={() => { setGender(g); setAvatar(g === "female" ? 0 : 3); }} className={cn("press h-14 rounded-2xl font-bold border-2", gender === g ? "border-primary bg-primary-soft/60 text-primary" : "border-transparent bg-card")}>
                {g === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
          <p className="t-cap mt-6 mb-2">캐릭터</p>
          <div className="grid grid-cols-3 gap-2">
            {(gender === "female" ? [0, 1, 2] : [3, 4, 5]).map((i) => (
              <button key={i} onClick={() => setAvatar(i)} className={cn("press rounded-2xl border-2 bg-card flex items-end justify-center pt-3 overflow-hidden h-[112px]", avatar === i ? "border-primary" : "border-transparent")}>
                <Avatar index={i} size={72} />
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="fade-up mt-6">
          <p className="t-cap">{name.trim() || "연습생"} · 14세</p>
          <h1 className="t-title mt-1">플레이 스타일을<br />골라 주세요</h1>
          <p className="t-cap mt-2">세 후보 모두 능력치 합은 240이고, 분포만 달라요. 가장 높은 능력이 포지션을 정해요.</p>
          <div className="flex flex-col gap-3 mt-5" key={rerolls}>
            {candidates.map((c, i) => {
              const selected = c.id === candidateId;
              const position = POSITIONS.find((p) => p.id === c.position);
              return (
                <button
                  key={c.id}
                  onClick={() => setCandidateId(c.id)}
                  className={cn("press fade-up w-full text-left rounded-[20px] border-2 bg-card p-5", selected ? "border-primary" : "border-transparent")}
                  style={{ animationDelay: `${i * 70}ms` }}
                  aria-pressed={selected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="t-card">{c.name}</p>
                      <p className="text-[13px] text-ink-2 mt-0.5">{c.summary}</p>
                    </div>
                    <span className={cn("shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center", selected ? "border-primary bg-primary text-white" : "border-line")} aria-hidden>
                      {selected ? "✓" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Chip tone="neutral" className="bg-ink text-bg">{position?.name}</Chip>
                    {c.top.map((k) => (
                      <Chip key={k}>{STAT_NAMES[k]} {c.stats[k]}</Chip>
                    ))}
                    <Chip tone="up">OVR {overall(c.stats, c.position)}</Chip>
                  </div>
                  {selected && (
                    <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2.5 fade-up">
                      {STAT_KEYS.map((k) => (
                        <div key={k} className="flex items-center gap-3">
                          <span className="w-14 text-[13px] font-semibold text-ink-2">{STAT_NAMES[k]}</span>
                          <ProgressBar value={c.stats[k]} color={STAT_COLORS[k]} height={6} className="flex-1" label={STAT_NAMES[k]} />
                          <span className="w-7 text-right text-[14px] font-bold tabular-nums">{c.stats[k]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={reroll} className="press mt-5 w-full h-12 rounded-xl text-[15px] font-bold text-ink-2">
            다른 후보 보기
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="fade-up mt-6">
          <h1 className="t-title">어디에 지원할까요?</h1>
          <p className="t-cap mt-2">대형은 문이 좁고 중소는 넓어요. 떨어져도 무소속으로 시작해 언제든 다시 지원할 수 있어요.</p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 mt-5">
            {TIER_ORDER.map((t) => (
              <button key={t} onClick={() => setTier(t)} className={cn("press shrink-0 h-9 px-3.5 rounded-full text-[13px] font-bold", tier === t ? "bg-ink text-bg" : "bg-card text-ink-2")}>{TIERS[t].short}</button>
            ))}
          </div>
          <p className="t-cap mt-3">{TIERS[tier].description}</p>
          <div className="flex flex-col gap-2 mt-3">
            {candidate && AGENCIES.filter((a) => a.tier === tier).map((a) => {
              const label = chanceLabel(auditionChance({ stats: candidate.stats, position: candidate.position }, a.id));
              return (
                <button key={a.id} onClick={() => setAgencyId(a.id)} className={cn("press text-left rounded-2xl border-2 bg-card p-4 flex items-center gap-3", agencyId === a.id ? "border-primary" : "border-transparent")}>
                  <Logo id={a.logo} label={a.name} color={a.color} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="t-body font-bold truncate">{a.name}</p>
                    <p className="text-[12px] text-ink-3 truncate">{a.strength}</p>
                  </div>
                  <Chip tone={TONE[label]}>{label}</Chip>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <FixedCta>
        {error && <p className="mb-2 rounded-xl bg-down-soft text-down text-[13px] font-bold py-2.5 px-3">{error}</p>}
        <Button onClick={next}>{step === 2 ? "지원하기" : step === 1 ? "이 스타일로 할게요" : "다음"}</Button>
      </FixedCta>

      {result?.result && (
        <ResultSheet
          result={result.result}
          open
          onClose={() => {
            saveCareer({ ...result, result: null });
            router.replace("/play");
          }}
          ctaLabel="플레이 시작"
        />
      )}
    </main>
  );
}
