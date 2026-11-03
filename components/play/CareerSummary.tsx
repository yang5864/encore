"use client";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { agencyById } from "@/lib/game/agencies";
import { ageOf, fanText, isSecondHalf, MAX_TURN, periodLabel, wonText, yearOf } from "@/lib/game/format";
import { rankingFor } from "@/lib/game/brand-rank";
import { settlement } from "@/lib/game/economy";
import type { Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";

/** 은퇴한 커리어의 최종 요약: 결말 · 수상 · 순위 그래프 · 디스코그래피 · 인생 타임라인 */
export function CareerSummary({ career }: { career: Career }) {
  const s = settlement(career);
  const daesang = career.awards.filter((a) => a.kind === "daesang").length;
  const a = agencyById(career.agencyId);
  const finalTurn = { ...career, turn: Math.min(career.turn, MAX_TURN) };
  const finalRank = rankingFor(finalTurn, yearOf(finalTurn), isSecondHalf(finalTurn));
  return (
    <>
      <Card className="fade-up">
        <p className="t-cap text-primary">{career.ending?.subtitle}</p>
        <h2 className="t-title mt-1">{career.ending?.title}</h2>
        <p className="t-body text-ink-2 mt-2">{career.ending?.text}</p>
        <Link href="/ranking" className="press mt-4 flex items-center gap-3 rounded-2xl bg-primary-soft/60 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-ink-3">최종 브랜드평판 순위 · {periodLabel(finalTurn)}</span>
            <span className="block text-[22px] font-extrabold text-primary leading-tight">{finalRank.outside ? (finalRank.source.kind === "real" ? "50위 밖" : "순위 밖") : `${finalRank.me.rank}위`}</span>
          </span>
          <span className="text-[13px] font-bold text-primary shrink-0">전체 순위 보기 ›</span>
        </Link>
        {(career.flags.grammy || career.flags.stadiumTour || career.peakBillboard === 1) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {career.peakBillboard === 1 && <Chip tone="warn">빌보드 Hot 100 1위</Chip>}
            {career.flags.grammy ? <Chip tone="warn">그래미 노미네이트</Chip> : null}
            {career.flags.stadiumTour ? <Chip tone="warn">월드 스타디움 투어</Chip> : null}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Stat label="최고 순위" value={career.flags.bestRank ? `${career.flags.bestRank}위` : "순위 밖"} />
          <Stat label="음방 1위" value={`${career.musicWins}회`} />
          <Stat label="대상" value={`${daesang}회`} />
          <Stat label="최다 팬" value={fanText(Math.max(career.fans, ...(career.timeline ?? []).map((t) => t.fans)))} />
          <Stat label="최고 인기" value={`${career.peakPopularity}`} />
          <Stat label="총 정산" value={wonText(s.mine)} />
        </div>
      </Card>

      <RankGraph career={career} />

      {career.awards.length > 0 && (
        <Card className="fade-up" style={{ animationDelay: "120ms" }}>
          <CardTitle sub={`${career.awards.length}개의 트로피`}>수상 이력</CardTitle>
          <div className="flex flex-col gap-2">
            {[...career.awards].sort((x, y) => x.year - y.year).map((aw, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-12 text-[13px] text-ink-3 tabular-nums">{aw.year}</span>
                <span className="text-[16px]" aria-hidden>{aw.kind === "daesang" ? "🏆" : aw.kind === "rookie" ? "🌱" : "🎖️"}</span>
                <span className="min-w-0 flex-1 text-[13px] font-bold truncate">{aw.show} <span className="text-ink-2 font-medium">{aw.name}</span></span>
                {aw.kind === "daesang" && <Chip tone="info">대상</Chip>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {career.albums.length > 0 && (
        <Card className="fade-up" style={{ animationDelay: "160ms" }}>
          <CardTitle sub={`${career.albums.length}장`}>디스코그래피</CardTitle>
          <div className="flex flex-col gap-2.5">
            {career.albums.map((al) => (
              <div key={al.id} className="flex items-center gap-3">
                <span className="w-12 text-[13px] text-ink-3 tabular-nums">{yearOf({ turn: al.turn })}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold truncate">{al.name}</p>
                  <p className="text-[13px] text-ink-3 truncate">초동 {al.sales.toLocaleString("ko-KR")}장{al.melon !== null ? ` · 멜론 ${al.melon}위` : ""}{al.wins ? ` · 음방 1위 ${al.wins}회` : ""}{al.billboard !== null ? ` · 빌보드 ${al.billboard}위` : ""}</p>
                </div>
                {al.melon !== null && al.melon <= 10 && <Logo id="melon" label="멜론" size={18} rounded="full" />}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="fade-up" style={{ animationDelay: "200ms" }}>
        <CardTitle sub={`${yearOf({ turn: 0 })}년 ${ageOf({ turn: 0 })}세부터 ${a ? `${a.name} ` : ""}${career.groupName || career.name}까지`}>내 인생 타임라인</CardTitle>
        <ol className="relative border-l border-line ml-2 pl-4 flex flex-col gap-3">
          {[...career.history].reverse().filter((h) => h.kind === "milestone" || h.kind === "award" || h.kind === "system").map((h, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full", h.kind === "award" ? "bg-warn" : h.kind === "milestone" ? "bg-primary" : "bg-ink-3")} />
              <p className="text-[13px] text-ink-3">{periodLabel({ turn: h.turn })} · {ageOf({ turn: h.turn })}세</p>
              <p className="text-[13px] font-bold mt-0.5">{h.title}</p>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sub p-3 min-w-0">
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="text-[16px] font-bold truncate">{value}</p>
    </div>
  );
}

/** 시즌별 브랜드평판 순위 꺾은선. 위가 1위, 순위 밖은 바닥에 점선. */
function RankGraph({ career }: { career: Career }) {
  const points = (career.timeline ?? []).filter((t) => t.turn >= (career.debutTurn ?? 0));
  if (points.length < 2) {
    return (
      <Card className="fade-up" style={{ animationDelay: "90ms" }}>
        <CardTitle>브랜드평판 순위 추이</CardTitle>
        <p className="t-cap">시즌별 순위 기록이 부족해요. 이 기능 이후에 진행한 시즌부터 기록돼요.</p>
      </Card>
    );
  }
  const W = 320, H = 150, px = 28, py = 12;
  const maxRank = 50;
  const x = (i: number) => px + (i / (points.length - 1)) * (W - px * 2);
  const y = (rank: number | null) => py + ((rank === null ? maxRank + 5 : Math.min(maxRank, rank)) - 1) / (maxRank + 4) * (H - py * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.rank).toFixed(1)}`).join(" ");
  const best = points.reduce((m, p) => (p.rank !== null && (m === null || p.rank < m) ? p.rank : m), null as number | null);
  const first = points[0], last = points[points.length - 1];
  return (
    <Card className="fade-up" style={{ animationDelay: "90ms" }}>
      <CardTitle sub={best !== null ? `최고 ${best}위 · 데뷔 후 ${points.length}시즌` : "50위 안에 든 적이 없어요"}>브랜드평판 순위 추이</CardTitle>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="시즌별 브랜드평판 순위">
        {[1, 10, 25, 50].map((r) => (
          <g key={r}>
            <line x1={px} x2={W - px} y1={y(r)} y2={y(r)} stroke="var(--line)" strokeDasharray={r === 1 ? undefined : "3 3"} />
            <text x={px - 6} y={y(r) + 4} textAnchor="end" fontSize="10" fill="var(--text-3)">{r}위</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.rank)} r={p.rank !== null && p.rank === best ? 4 : 2.5} fill={p.rank === null ? "var(--text-3)" : "var(--primary)"} />
        ))}
        <text x={px} y={H - 1} fontSize="10" fill="var(--text-3)">{yearOf(first)}</text>
        <text x={W - px} y={H - 1} fontSize="10" fill="var(--text-3)" textAnchor="end">{yearOf(last)}</text>
      </svg>
    </Card>
  );
}
