"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/Card";
import { agencyById } from "@/lib/game/agencies";
import { fanText } from "@/lib/game/format";
import { loadRecords, type CareerRecord } from "@/lib/storage";

export default function RecordsPage() {
  const [records, setRecords] = useState<CareerRecord[]>([]);
  useEffect(() => setRecords(loadRecords()), []);
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <Link href="/" aria-label="홈" className="press w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[20px]">‹</Link>
        <h1 className="t-card">내 기록 · 명예의 전당</h1>
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
            <span className="w-7 text-center font-extrabold text-primary text-[17px]">{i + 1}</span>
            <div className="w-12 h-[60px] rounded-xl bg-[#f2f4f6] flex items-end justify-center overflow-hidden">
              <Avatar index={r.avatar} size={40} name={r.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="t-body font-bold truncate">{r.groupName ? `${r.groupName} ${r.name}` : r.name}</p>
              <p className="text-[12px] text-ink-3 truncate">{r.ending} · {agencyById(r.agency)?.name ?? "무소속"} · {r.age}세 은퇴</p>
              <p className="text-[12px] text-ink-2 mt-0.5">팬 {fanText(r.fans)} · 음방 1위 {r.wins}회 · 수상 {r.awards}회 · 앨범 {r.albums}장</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-ink-3 font-bold">OVR</p>
              <p className="t-num-md">{r.ovr}</p>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
