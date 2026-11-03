"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button, FixedCta } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/Logo";
import { SupportTrigger } from "@/components/SupportSheet";
import { AGENCIES, agencyById } from "@/lib/game/agencies";
import { ageOf, fanText, periodLabel, STAGE_NAMES } from "@/lib/game/format";
import { milestoneStep } from "@/lib/game/milestones";
import { overall } from "@/lib/game/stats";
import type { Career } from "@/lib/game/types";
import { loadCareer, loadRecords, type CareerRecord } from "@/lib/storage";
import { cn } from "@/lib/cn";

const STEPS = ["연습생", "데뷔", "음방 1위", "대상", "레전드"];
const STEP_COPY = ["작은 연습실에서", "드디어 무대 위로", "첫 트로피를 들었어요", "올해의 이름이 됐어요", "마침내 레전드까지"];

export default function HomePage() {
  const router = useRouter();
  const [career, setCareer] = useState<Career | null>(null);
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [showcase, setShowcase] = useState(4);

  useEffect(() => {
    setCareer(loadCareer());
    setRecords(loadRecords().slice(0, 3));
    setReady(true);
  }, []);

  // 히어로 타임라인이 5단계를 천천히 순환한다
  useEffect(() => {
    const id = setInterval(() => setShowcase((s) => (s + 1) % 5), 2600);
    return () => clearInterval(id);
  }, []);

  const step = career ? milestoneStep(career) : null;
  const heroStep = step !== null && step > 0 ? step - 1 : showcase;

  return (
    <main className="shell pt-3">
      <header className="flex items-center justify-between h-12">
        <div>
          <p className="font-extrabold text-[16px] tracking-tight leading-none">encore<span className="text-primary">.</span></p>
          <p className="text-[13px] text-ink-3 mt-1">연습생부터 레전드까지</p>
        </div>
        <div className="flex items-center gap-1">
          <SupportTrigger className="press w-10 h-10 rounded-xl flex items-center justify-center text-ink-2" aria-label="후원">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 21s-7-4.6-9.3-8.6C.6 8.9 2.6 5 6.3 5c2 0 3.4 1.1 4.2 2.4h3C14.3 6.1 15.7 5 17.7 5c3.7 0 5.7 3.9 3.6 7.4C19 16.4 12 21 12 21z" /></svg>
          </SupportTrigger>
          <Link href="/guide" aria-label="가이드" className="press w-10 h-10 rounded-xl flex items-center justify-center text-ink-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm1.3-5.2c-.6.4-.8.7-.8 1.4h-2c0-1.4.6-2.1 1.5-2.7.7-.5 1-.8 1-1.4 0-.7-.5-1.1-1.2-1.1-.8 0-1.3.5-1.4 1.3H8.4c.1-1.9 1.5-3.1 3.5-3.1 2 0 3.3 1.1 3.3 2.8 0 1.2-.6 1.9-1.9 2.8z" /></svg>
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <Card className="mt-3 fade-up !p-6">
        <p className="t-cap">12살 중학교 1학년, 소속사 없는 지망생에서 시작해요</p>
        <h1 className="text-[22px] font-extrabold tracking-[-0.03em] leading-[1.15] mt-2">
          연습실에서<br />레전드까지
        </h1>
        <p className="t-body text-ink-2 mt-3 leading-relaxed">
          시즌마다 계획 하나를 고르면 6개월이 흘러요.<br />오디션, 데뷔, 음방 1위, 대상까지 도전해 보세요.
        </p>
      </Card>

      {/* 캐릭터 + 타임라인 */}
      <Card className="mt-3 fade-up !px-5 !py-7" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col items-center">
          <div className="float">
            <Avatar index={career?.avatar ?? 0} size={88} name={career?.name ?? "캐릭터"} />
          </div>
          <p className="t-card mt-3">{STEP_COPY[heroStep]}</p>
        </div>
        <div className="relative mt-6 px-2">
          <div className="absolute left-4 right-4 top-[7px] h-[2px] bg-chip" />
          <div className="absolute left-4 top-[7px] h-[2px] bg-primary transition-all duration-700" style={{ width: `calc((100% - 32px) * ${heroStep / 4})` }} />
          <div className="relative flex justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center w-12">
                <span className={cn("w-4 h-4 rounded-full border-[3px] transition-colors duration-500", i <= heroStep ? "bg-primary border-primary" : "bg-card border-chip", i === heroStep && "shadow-[0_0_0_5px_rgba(49,130,246,0.25)]")} />
                <span className={cn("text-[13px] mt-2 whitespace-nowrap", i === heroStep ? "font-bold text-ink" : "text-ink-3")}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 이어하기 */}
      {ready && career && (
        <Card className="mt-3 fade-up" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-[60px] rounded-xl bg-chip flex items-end justify-center overflow-hidden">
              <Avatar index={career.avatar} size={40} name={career.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="t-cap">{career.stage === "retired" ? "완성된 인생" : "진행 중인 인생"}</p>
              <p className="t-card truncate">{career.groupName ? `${career.groupName} ${career.name}` : career.name}</p>
              <p className="text-[13px] text-ink-2 flex items-center gap-1.5 truncate">
                {career.agencyId && <Logo id={agencyById(career.agencyId)?.logo} label={agencyById(career.agencyId)?.name ?? ""} color={agencyById(career.agencyId)?.color} size={16} rounded="full" />}
                <span className="truncate">{periodLabel(career)} · {ageOf(career)}세 · {STAGE_NAMES[career.stage]} · OVR {overall(career.stats, career.position)}</span>
              </p>
            </div>
            <button onClick={() => router.push("/play")} className="press shrink-0 h-10 px-3.5 rounded-xl bg-primary-soft text-primary text-[13px] font-bold">
              {career.stage === "retired" ? "결과" : "이어하기"}
            </button>
          </div>
        </Card>
      )}

      {/* 내 기록 */}
      <Card className="mt-3 fade-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="t-card">내 기록</h2>
          <Link href="/records" className="text-[13px] font-semibold text-ink-3">전체 보기 ›</Link>
        </div>
        {records.length === 0 ? (
          <p className="t-cap mt-3">은퇴한 커리어가 여기에 쌓여요.</p>
        ) : (
          <div className="mt-2 flex flex-col">
            {records.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <span className={cn("w-5 text-center font-extrabold", i === 0 ? "text-warn" : "text-ink-3")}>{i + 1}</span>
                <div className="w-10 h-12 rounded-lg bg-chip flex items-end justify-center overflow-hidden">
                  <Avatar index={r.avatar} size={32} name={r.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="t-body font-bold truncate">{r.groupName ? `${r.groupName} ${r.name}` : r.name}</p>
                  <p className="text-[13px] text-ink-3 truncate">{r.ending} · {agencyById(r.agency)?.name ?? "무소속"} · 팬 {fanText(r.fans)}</p>
                </div>
                <span className="text-[13px] font-bold text-ink-2 whitespace-nowrap">🏆 {r.awards} · OVR {r.ovr}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 기획사 로고 스트립 */}
      <Card className="mt-3 fade-up" style={{ animationDelay: "260ms" }}>
        <h2 className="t-card">지원할 수 있는 기획사</h2>
        <p className="t-cap mt-1">2026 종합 순위 순 · 대형 4 · 중견 5 · 레이블 4 · 해외 3</p>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {AGENCIES.map((a) => (
            <div key={a.id} className="shrink-0 flex flex-col items-center gap-1.5 w-16">
              <Logo id={a.logo} label={a.name} color={a.color} size={48} rounded="full" />
              <span className="text-[13px] text-ink-2 font-semibold truncate w-full text-center">{a.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 메뉴 리스트 */}
      <Card className="mt-3 fade-up !p-2" style={{ animationDelay: "320ms" }}>
        {[
          { href: "/guide", t: "게임 가이드", s: "진행 방법과 현실 고증 노트" },
          { href: "/records", t: "명예의 전당", s: "은퇴한 커리어 순위" },
        ].map((m) => (
          <Link key={m.href} href={m.href} className="press flex items-center justify-between gap-3 px-3 py-3.5 rounded-2xl">
            <div className="min-w-0">
              <p className="t-body font-bold">{m.t}</p>
              <p className="text-[13px] text-ink-3">{m.s}</p>
            </div>
            <span className="text-ink-3">›</span>
          </Link>
        ))}
        <SupportTrigger className="press w-full flex items-center justify-between gap-3 px-3 py-3.5 rounded-2xl text-left">
          <div className="min-w-0">
            <p className="t-body font-bold">후원하기</p>
            <p className="text-[13px] text-ink-3">커피 한 잔이 다음 업데이트가 돼요</p>
          </div>
          <span className="text-ink-3">›</span>
        </SupportTrigger>
      </Card>

      <footer className="mt-8 text-[13px] text-ink-3 leading-relaxed">
        <p className="font-bold text-ink-2">ENCORE</p>
        <p className="mt-1">나만의 아이돌 인생, 앵콜.</p>
        <p className="mt-3">실제 기획사·학교·플랫폼 명칭과 로고의 권리는 각 권리자에게 있으며 가상 게임의 배경으로만 쓰여요. 수치와 확률은 게임 규칙이에요.</p>
        <p className="mt-2">© 2026 ENCORE</p>
      </footer>

      <FixedCta>
        <Button onClick={() => router.push(career && career.stage !== "retired" ? "/play" : "/new")}>
          {career && career.stage !== "retired" ? "이어서 플레이하기" : "새로운 인생 시작하기"}
        </Button>
      </FixedCta>
    </main>
  );
}
