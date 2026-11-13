"use client";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/Card";
import { agencyById } from "@/lib/game/agencies";
import { fanText, displayName, KOREAN_AGE_OFFSET } from "@/lib/game/format";
import { loadRecords, type CareerRecord } from "@/lib/storage";
import { Logo } from "@/components/Logo";

export default function RecordsPage() {
  const [records, setRecords] = useState<CareerRecord[]>([]);
  useEffect(() => setRecords(loadRecords()), []);
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <BackButton href="/" label="홈" />
        <h1 className="t-subhead">내 기록 · 명예의 전당</h1>
      </header>
      <p className="t-cap mt-2">은퇴한 커리어가 점수순으로 쌓여요. 이 기기에만 저장돼요.</p>
      <div className="flex flex-col gap-2 mt-4">
        {records.length === 0 && (
          <Card>
            <p className="t-body text-ink-2">아직 기록이 없어요. 첫 커리어를 완성해보세요.</p>
          </Card>
        )}
        {records.map((r, i) => (
          <Card key={r.id} className="fade-up flex items-center gap-3 !p-4" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <span className="w-7 text-center font-extrabold text-primary text-[16px]">{i + 1}</span>
            <div className="w-12 h-[60px] rounded-xl bg-chip flex items-end justify-center overflow-hidden">
              <Avatar index={r.avatar} size={40} name={r.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="t-body font-bold truncate">{displayName({ name: r.name, groupName: r.groupName, stage: "retired" })}</p>
              <p className="text-[13px] text-ink-3 truncate flex items-center gap-1">{r.agency && <Logo id={agencyById(r.agency)?.logo} label={agencyById(r.agency)?.name ?? ""} color={agencyById(r.agency)?.color} size={14} rounded="full" />}<span className="truncate">{r.ending} · {agencyById(r.agency)?.name ?? "무소속"} · {r.age + KOREAN_AGE_OFFSET}살 은퇴</span></p>
              <p className="text-[13px] text-ink-2 mt-0.5 flex flex-wrap gap-x-2.5"><span>팬 {fanText(r.fans)}</span><span>음방 1위 {r.wins}회</span><span>수상 {r.awards}회</span><span>앨범 {r.albums}장</span></p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-ink-3 font-bold">OVR</p>
              <p className="t-num-md">{r.ovr}</p>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
