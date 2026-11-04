import type { Career, Kpi } from "./types.ts";
import { agencyById } from "./agencies.ts";
import { eraScale, yearOf } from "./format.ts";
import { rng } from "./rng.ts";

/**
 * 회사가 매년 초 거는 목표. FM의 구단주 기대치처럼, 달성하면 신뢰와 제작 지원이 오르고 놓치면 깎인다.
 * 지금 상태보다 한 단계 위를 요구한다.
 */
export function makeKpi(c: Career): Kpi | null {
  if (c.stage !== "idol" || c.debutTurn === null) return null;
  const a = agencyById(c.agencyId);
  const era = eraScale(yearOf(c));
  const latest = c.albums[c.albums.length - 1];
  const deadline = c.turn + 2; // 연말 결산 시점
  const pool: Kpi[] = [];
  if (latest) {
    const target = Math.round((latest.sales * 1.3) / 1000) * 1000;
    pool.push({ kind: "sales", target, deadline, label: `초동 ${target >= 10000 ? `${Math.round(target / 10000)}만` : target.toLocaleString("ko-KR")}장 이상 앨범 1장` });
  }
  const melonTarget = c.peakMelon === null ? 50 : c.peakMelon <= 3 ? 1 : c.peakMelon <= 10 ? 3 : c.peakMelon <= 30 ? 10 : 30;
  pool.push({ kind: "melon", target: melonTarget, deadline, label: `멜론 ${melonTarget}위 안 타이틀곡` });
  const winsTarget = c.musicWins === 0 ? 1 : 3;
  pool.push({ kind: "wins", target: winsTarget, deadline, label: `올해 음악방송 1위 ${winsTarget}회` });
  const fansTarget = Math.round((c.fans * 1.4) / 10000) * 10000;
  if (fansTarget > 0) pool.push({ kind: "fans", target: fansTarget, deadline, label: `코어 팬덤 ${Math.round(fansTarget / 10000)}만명` });
  if (c.popularity >= 60 && c.fans / era >= 800000 && (a?.tier === "major" || a?.tier === "global")) pool.push({ kind: "billboard", target: 100, deadline, label: "빌보드 Hot 100 진입" });
  return pool[Math.floor(rng(c) * pool.length)] ?? null;
}

/** 마감 시점에 달성 여부. `since`는 목표를 받은 시즌. */
export function kpiMet(c: Career, k: Kpi, since: number): boolean {
  const year = c.albums.filter((al) => al.turn >= since && al.turn < k.deadline);
  switch (k.kind) {
    case "sales": return year.some((al) => al.sales >= k.target);
    case "melon": return year.some((al) => al.melon !== null && al.melon <= k.target);
    case "wins": return year.reduce((s, al) => s + al.wins, 0) >= k.target;
    case "fans": return c.fans >= k.target;
    case "billboard": return year.some((al) => al.billboard !== null);
  }
}
