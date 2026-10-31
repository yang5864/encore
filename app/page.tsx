"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MilestoneBar } from "@/components/play/MilestoneBar";
import { agencyById } from "@/lib/game/agencies";
import { ageOf, fanText, periodLabel, STAGE_NAMES } from "@/lib/game/format";
import { overall } from "@/lib/game/stats";
import type { Career } from "@/lib/game/types";
import { loadCareer, loadRecords, type CareerRecord } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [career, setCareer] = useState<Career | null>(null);
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setCareer(loadCareer());
    setRecords(loadRecords().slice(0, 3));
    setReady(true);
  }, []);

  return (
    <main className="shell pt-3">
      <header className="flex items-center justify-between h-12">
        <span className="font-extrabold text-[18px] tracking-tight">encore<span className="text-primary">.</span></span>
        <Link href="/guide" className="press h-9 px-3 rounded-xl bg-white text-[13px] font-bold text-ink-2 flex items-center">가이드</Link>
      </header>

      <section className="mt-6 fade-up">
        <p className="t-cap text-primary font-bold">연습생부터 레전드까지</p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.03em] leading-[1.2] mt-2">
          14살, 소속사 없는<br />지망생에서 시작해요
        </h1>
        <p className="t-body text-ink-2 mt-3">반기마다 계획 하나를 고르면 6개월이 흘러요. 오디션, 데뷔, 음악방송 1위, 대상까지 쌓인 선택이 커리어가 돼요.</p>
      </section>

      <Card className="mt-6 fade-up" style={{ animationDelay: "80ms" }}>
        <MilestoneBar career={{ milestones: [], stage: "free" }} />
      </Card>

      {ready && career && (
        <Card className="mt-3 fade-up" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-[70px] rounded-xl bg-[#f2f4f6] flex items-end justify-center overflow-hidden">
              <Avatar index={career.avatar} size={48} name={career.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="t-cap">{career.stage === "retired" ? "완성된 커리어" : "이어하기"}</p>
              <p className="t-card truncate">{career.groupName ? `${career.groupName} ${career.name}` : career.name}</p>
              <p className="text-[13px] text-ink-2">{periodLabel(career)} · {ageOf(career)}세 · {STAGE_NAMES[career.stage]} · OVR {overall(career.stats, career.position)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => router.push("/play")}>{career.stage === "retired" ? "결과 보기" : "이어하기"}</Button>
          </div>
        </Card>
      )}

      <div className="mt-3 fade-up" style={{ animationDelay: "200ms" }}>
        <Button variant={career ? "secondary" : "primary"} onClick={() => router.push("/new")}>
          {career ? "새 커리어 시작" : "시작하기"}
        </Button>
      </div>

      <Card className="mt-6 fade-up" style={{ animationDelay: "260ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="t-card">내 기록</h2>
          <Link href="/records" className="text-[13px] font-bold text-primary">전체 보기</Link>
        </div>
        {records.length === 0 ? (
          <p className="t-cap mt-3">은퇴한 커리어가 여기에 쌓여요.</p>
        ) : (
          <div className="mt-3 flex flex-col">
            {records.map((r, i) => (
              <div key={r.id} className={`flex items-center gap-3 py-3 ${i ? "border-t border-line" : ""}`}>
                <span className="w-6 text-center font-extrabold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="t-body font-bold truncate">{r.groupName ? `${r.groupName} ${r.name}` : r.name}</p>
                  <p className="text-[12px] text-ink-3">{r.ending} · {agencyById(r.agency)?.name ?? "무소속"} · 팬 {fanText(r.fans)}</p>
                </div>
                <span className="t-num-md">{r.ovr}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <footer className="mt-10 pb-6 text-[12px] text-ink-3 leading-relaxed">
        <p>ENCORE는 가상의 커리어 시뮬레이션이에요. 실제 기획사·학교·시상식 명칭은 배경으로만 쓰이며 수치와 확률은 게임 규칙이에요. DAWN·MONO·ORBIT은 가상 회사예요.</p>
        <div className="flex gap-3 mt-3 font-bold">
          <Link href="/guide">게임 가이드</Link>
          <Link href="/records">내 기록</Link>
        </div>
      </footer>
    </main>
  );
}
