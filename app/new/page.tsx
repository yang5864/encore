"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button, FixedCta } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultSheet } from "@/components/play/ResultSheet";
import { cn } from "@/lib/cn";
import { AGENCIES, TIERS, TIER_ORDER, auditionChance, chanceLabel } from "@/lib/game/agencies";
import { createCareer } from "@/lib/game/create";
import { applyToAgency } from "@/lib/game/engine";
import { ALLOCATION_TOTAL, DEFAULT_ALLOCATION, POSITIONS, STAT_COLORS, STAT_KEYS, STAT_MAX, STAT_MIN, STAT_NAMES, overall, validateAllocation } from "@/lib/game/stats";
import type { Career, Gender, Position, Stats, Tier } from "@/lib/game/types";
import { GameError } from "@/lib/game/types";
import { saveCareer } from "@/lib/storage";

const STEPS = ["프로필", "포지션", "능력치", "첫 지원"];
const TONE: Record<string, "down" | "warn" | "neutral" | "ok" | "up"> = { "매우 낮음": "down", 낮음: "warn", 보통: "neutral", 높음: "ok", "매우 높음": "up" };

export default function NewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [avatar, setAvatar] = useState(0);
  const [position, setPosition] = useState<Position>("vocal");
  const [stats, setStats] = useState<Stats>({ ...DEFAULT_ALLOCATION.vocal });
  const [tier, setTier] = useState<Tier>("mid");
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Career | null>(null);

  const total = STAT_KEYS.reduce((s, k) => s + stats[k], 0);
  const remaining = ALLOCATION_TOTAL - total;
  const allocationError = validateAllocation(stats);
  const preview = useMemo(() => ({ stats, position }), [stats, position]);

  const next = () => {
    setError(null);
    if (step === 0 && name.trim().length === 0) return setError("이름을 입력해주세요.");
    if (step === 2 && allocationError) return setError(allocationError);
    if (step === 3) {
      if (!agencyId) return setError("지원할 기획사를 골라주세요.");
      try {
        const c = createCareer({ name, gender, avatar, position, stats });
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
        <button onClick={() => (step ? setStep(step - 1) : router.back())} aria-label="뒤로" className="press w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[20px]">‹</button>
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
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="예: 하린" className="w-full h-14 rounded-2xl bg-white px-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-primary" />
          <p className="t-cap mt-6 mb-2">성별</p>
          <div className="grid grid-cols-2 gap-2">
            {(["female", "male"] as Gender[]).map((g) => (
              <button key={g} onClick={() => { setGender(g); setAvatar(g === "female" ? 0 : 3); }} className={cn("press h-14 rounded-2xl font-bold border-2", gender === g ? "border-primary bg-primary-soft/60 text-primary" : "border-transparent bg-white")}>
                {g === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
          <p className="t-cap mt-6 mb-2">캐릭터</p>
          <div className="grid grid-cols-3 gap-2">
            {(gender === "female" ? [0, 1, 2] : [3, 4, 5]).map((i) => (
              <button key={i} onClick={() => setAvatar(i)} className={cn("press rounded-2xl border-2 bg-white flex items-end justify-center pt-3 overflow-hidden h-[112px]", avatar === i ? "border-primary" : "border-transparent")}>
                <Avatar index={i} size={72} />
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="fade-up mt-6">
          <h1 className="t-title">주 포지션을 골라요</h1>
          <p className="t-cap mt-2">OVR 계산의 가중치와 기본 능력 배분이 달라져요.</p>
          <div className="flex flex-col gap-2 mt-6">
            {POSITIONS.map((p) => (
              <button key={p.id} onClick={() => { setPosition(p.id); setStats({ ...DEFAULT_ALLOCATION[p.id] }); }} className={cn("press text-left rounded-2xl border-2 p-4 bg-white", position === p.id ? "border-primary" : "border-transparent")}>
                <div className="flex items-center justify-between">
                  <span className="t-body font-bold">{p.name}</span>
                  <span className="text-[11px] font-bold text-ink-3 tracking-wider">{p.en}</span>
                </div>
                <p className="text-[13px] text-ink-2 mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="fade-up mt-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="t-title">능력치를 나눠요</h1>
              <p className="t-cap mt-2">총 {ALLOCATION_TOTAL}점 · 능력당 {STAT_MIN}~{STAT_MAX}</p>
            </div>
            <div className="text-right">
              <p className="t-cap">OVR</p>
              <p className="t-num text-primary">{overall(preview.stats, preview.position)}</p>
            </div>
          </div>
          <div className={cn("mt-4 rounded-2xl px-4 py-3 text-[14px] font-bold", remaining === 0 ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
            {remaining === 0 ? "배분 완료" : remaining > 0 ? `${remaining}점 남았어요` : `${-remaining}점 초과했어요`}
          </div>
          <div className="flex flex-col gap-4 mt-5">
            {STAT_KEYS.map((k) => (
              <div key={k} className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="t-body font-bold">{STAT_NAMES[k]}</span>
                  <div className="flex items-center gap-2">
                    <button aria-label={`${STAT_NAMES[k]} 감소`} onClick={() => setStats({ ...stats, [k]: Math.max(STAT_MIN, stats[k] - 1) })} className="press w-9 h-9 rounded-full bg-[#f2f4f6] font-bold">−</button>
                    <span className="t-num-md w-8 text-center">{stats[k]}</span>
                    <button aria-label={`${STAT_NAMES[k]} 증가`} onClick={() => setStats({ ...stats, [k]: Math.min(STAT_MAX, stats[k] + 1) })} className="press w-9 h-9 rounded-full bg-[#f2f4f6] font-bold">+</button>
                  </div>
                </div>
                <input type="range" min={STAT_MIN} max={STAT_MAX} value={stats[k]} onChange={(e) => setStats({ ...stats, [k]: Number(e.target.value) })} className="w-full accent-[var(--primary)]" aria-label={STAT_NAMES[k]} />
                <ProgressBar value={stats[k]} color={STAT_COLORS[k]} height={4} className="mt-1" />
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="fade-up mt-6">
          <h1 className="t-title">어디에 지원할까요?</h1>
          <p className="t-cap mt-2">대형은 문이 좁고 중소는 넓어요. 떨어져도 무소속으로 시작해 언제든 다시 지원할 수 있어요.</p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 mt-5">
            {TIER_ORDER.map((t) => (
              <button key={t} onClick={() => setTier(t)} className={cn("press shrink-0 h-9 px-3.5 rounded-full text-[13px] font-bold", tier === t ? "bg-ink text-white" : "bg-white text-ink-2")}>{TIERS[t].short}</button>
            ))}
          </div>
          <p className="t-cap mt-3">{TIERS[tier].description}</p>
          <div className="flex flex-col gap-2 mt-3">
            {AGENCIES.filter((a) => a.tier === tier).map((a) => {
              const label = chanceLabel(auditionChance(preview, a.id));
              return (
                <button key={a.id} onClick={() => setAgencyId(a.id)} className={cn("press text-left rounded-2xl border-2 bg-white p-4 flex items-center gap-3", agencyId === a.id ? "border-primary" : "border-transparent")}>
                  <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-[12px] font-extrabold" style={{ background: a.color }}>{a.name.slice(0, 2)}</span>
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
        <Button onClick={next} disabled={step === 2 && !!allocationError}>{step === 3 ? "지원하기" : "다음"}</Button>
      </FixedCta>

      {result?.result && (
        <ResultSheet result={result.result} open onClose={() => router.replace("/play")} ctaLabel="플레이 시작" />
      )}
    </main>
  );
}
