"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { ageText, fanText, isSecondHalf, MAX_TURN, periodLabel, wonText, yearOf } from "@/lib/game/format";
import { rankingFor } from "@/lib/game/brand-rank";
import { settlement } from "@/lib/game/economy";
import type { Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

/** 은퇴한 커리어의 최종 요약: 결말 · 수상 · 순위 그래프 · 디스코그래피 · 인생 타임라인 */
export function CareerSummary({ career }: { career: Career }) {
  const s = settlement(career);
  const daesang = career.awards.filter((a) => a.kind === "daesang").length;
  const finalTurn = { ...career, turn: Math.min(career.turn, MAX_TURN) };
  const finalRank = rankingFor(finalTurn, yearOf(finalTurn), isSecondHalf(finalTurn));
  const timeline = [...career.history].reverse().filter((h) => h.kind === "milestone" || h.kind === "award" || h.kind === "system");
  const awards = [...career.awards].sort((x, y) => x.year - y.year);
  const rankText = finalRank.outside ? (finalRank.source.kind === "real" ? "50위 밖" : "순위 밖") : `${finalRank.me.rank}위`;
  // 영문 대문자 부제는 제목 아래 한 줄 설명으로 읽히게 문장 표기로 바꾼다
  const tagline = career.ending?.subtitle ? career.ending.subtitle.charAt(0) + career.ending.subtitle.slice(1).toLowerCase() : "";
  return (
    <>
      <Card className="fade-up">
        <h2 className="t-title">{career.ending?.title}</h2>
        {tagline && <p className="t-cap mt-1">{tagline}</p>}
        <p className="t-body text-ink-2 mt-3">{career.ending?.text}</p>

        <Link href="/ranking" className="press mt-4 block rounded-2xl bg-primary-soft/60 px-4 py-3">
          <span className="flex items-center justify-between gap-3">
            <span className="t-cap whitespace-nowrap">최종 브랜드평판 순위</span>
            <span className="t-cap font-bold text-primary whitespace-nowrap inline-flex items-center">전체 순위<Icon name="chevron-right" size={16} /></span>
          </span>
          <span className="mt-1 flex items-baseline gap-2">
            <span className="t-num text-primary">{rankText}</span>
            <span className="t-cap whitespace-nowrap">{periodLabel(finalTurn)} 기준</span>
          </span>
        </Link>

        {(career.flags.grammy || career.flags.stadiumTour || career.peakBillboard === 1) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {career.peakBillboard === 1 && <Chip tone="warn">빌보드 Hot 100 1위</Chip>}
            {career.flags.grammy ? <Chip tone="warn">그래미 노미네이트</Chip> : null}
            {career.flags.stadiumTour ? <Chip tone="warn">월드 스타디움 투어</Chip> : null}
          </div>
        )}

        <dl className="grid grid-cols-3 gap-x-3 gap-y-4 mt-4 pt-4 border-t border-line">
          <Stat label="최고 순위" value={career.flags.bestRank ? `${career.flags.bestRank}위` : "순위 밖"} />
          <Stat label="음방 1위" value={`${career.musicWins}회`} />
          <Stat label="대상" value={`${daesang}회`} />
          <Stat label="최다 팬" value={fanText(Math.max(career.fans, ...(career.timeline ?? []).map((t) => t.fans)))} />
          <Stat label="최고 인기" value={`${career.peakPopularity}`} />
          <Stat label="총 정산" value={wonText(s.mine)} />
        </dl>
      </Card>

      <RankGraph career={career} />

      {awards.length > 0 && (
        <Card className="fade-up" style={{ animationDelay: "120ms" }}>
          <CardTitle sub={`트로피 ${awards.length}개`}>수상 이력</CardTitle>
          <Folded count={awards.length} label={`수상 ${awards.length}개 모두 보기`}>
            {(shown) => (
              <ul className="flex flex-col gap-2.5">
                {awards.slice(0, shown).map((aw, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 t-cap text-ink-3 tabular-nums">{aw.year}</span>
                    <Icon name={aw.kind === "daesang" ? "trophy" : aw.kind === "rookie" ? "sprout" : "medal"} size={18} className={aw.kind === "daesang" ? "text-warn shrink-0" : "text-ink-3 shrink-0"} />
                    <span className="min-w-0 flex-1 t-cap text-ink truncate"><b className="font-bold">{aw.show}</b> {aw.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Folded>
        </Card>
      )}

      {career.albums.length > 0 && (
        <Card className="fade-up" style={{ animationDelay: "160ms" }}>
          <CardTitle sub={`앨범 ${career.albums.length}장`}>디스코그래피</CardTitle>
          <Folded count={career.albums.length} label={`앨범 ${career.albums.length}장 모두 보기`}>
            {(shown) => (
              <ul className="flex flex-col gap-3">
                {career.albums.slice(0, shown).map((al) => (
                  <li key={al.id} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 t-cap text-ink-3 tabular-nums">{yearOf({ turn: al.turn })}</span>
                    <div className="min-w-0 flex-1">
                      <p className="t-cap text-ink font-bold truncate">{al.name}</p>
                      <p className="t-cap text-ink-3 truncate tabular-nums">{[`초동 ${fanCount(al.sales)}장`, al.melon !== null ? `멜론 ${al.melon}위` : null, al.wins ? `1위 ${al.wins}회` : null, al.billboard !== null ? `빌보드 ${al.billboard}위` : null].filter(Boolean).join("  ")}</p>
                    </div>
                    {al.melon !== null && al.melon <= 10 && <Logo id="melon" label="멜론" size={18} rounded="full" />}
                  </li>
                ))}
              </ul>
            )}
          </Folded>
        </Card>
      )}

      <Card className="fade-up" style={{ animationDelay: "200ms" }}>
        <CardTitle sub={`${yearOf({ turn: 0 })}년 ${ageText({ turn: 0 })}부터 ${yearOf(finalTurn)}년 ${ageText(finalTurn)}까지`}>내 인생 타임라인</CardTitle>
        <Folded count={timeline.length} label={`기록 ${timeline.length}개 모두 보기`}>
          {(shown) => (
            <ol className="relative border-l border-line ml-1.5 pl-4 flex flex-col gap-3.5">
              {timeline.slice(0, shown).map((h, i) => (
                <li key={i} className="relative min-w-0">
                  <span className={cn("absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full", h.kind === "award" ? "bg-warn" : h.kind === "milestone" ? "bg-primary" : "bg-ink-3")} aria-hidden />
                  <p className="t-cap text-ink-3 whitespace-nowrap">{periodLabel({ turn: h.turn })}</p>
                  <p className="t-cap text-ink font-bold truncate">{h.title}</p>
                </li>
              ))}
            </ol>
          )}
        </Folded>
      </Card>
    </>
  );
}

/** 긴 목록은 처음 몇 개만 보여주고, 펼치면 전부 보여준다 */
const FOLD = 5;
function Folded({ count, label, children }: { count: number; label: string; children: (shown: number) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {children(open ? count : Math.min(count, FOLD))}
      {count > FOLD && (
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="press mt-4 w-full h-11 rounded-xl bg-chip t-cap font-bold">
          {open ? "접기" : label}
        </button>
      )}
    </>
  );
}

/** 1,234,567 → 123만 (목록 한 줄에 들어가게 줄인 판매량) */
const fanCount = (n: number) => (n >= 10000 ? `${Math.round(n / 1000) / 10}만` : n.toLocaleString("ko-KR"));

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="t-cap text-ink-3 whitespace-nowrap">{label}</dt>
      <dd className="t-num-md truncate mt-0.5">{value}</dd>
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
      <CardTitle sub={best !== null ? `최고 ${best}위, 데뷔 후 ${points.length}시즌` : "50위 안에 든 적이 없어요"}>브랜드평판 순위 추이</CardTitle>
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
