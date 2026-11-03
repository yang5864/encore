import type { Career } from "./types.ts";
import { eraScale, yearOf } from "./format.ts";

/**
 * 공개 지표 모델. 실제 2024~2026 K-POP 규모를 기준으로 맞췄다.
 *  - 개인 인스타 팔로워: 데뷔 직후 대형 신인 100만~200만, 2년 차 톱 그룹 멤버 1,000만 안팎, 글로벌 톱 5,000만+
 *  - 그룹 유튜브 구독자: 대형 신인 100만~200만, 전성기 700만~3,000만
 *  - 스포티파이 월간 리스너: 신인 100만~300만, 전성기 1,000만~4,000만
 * 모두 코어 팬덤(fans)과 인기도의 함수이며, 시즌마다 목표치의 일부만 따라가 급변을 막는다.
 */
export type Metrics = { instagram: number; youtube: number; spotify: number };

export const EMPTY_METRICS: Metrics = { instagram: 0, youtube: 0, spotify: 0 };

export const METRIC_CAPS: Metrics = { instagram: 100_000_000, youtube: 90_000_000, spotify: 80_000_000 };

export function metricTargets(c: Pick<Career, "fans" | "popularity" | "stage" | "albums" | "turn" | "peakBillboard" | "flags">): Metrics {
  const year = yearOf(c);
  const era = eraScale(year);
  // 플랫폼이 존재하기 전에는 0: 유튜브 2009년부터, 인스타그램 2012년부터, 스포티파이 국내 2021년부터
  const fans = Math.max(0, c.fans);
  const pop = Math.max(0, c.popularity);
  if (c.stage === "free" || c.stage === "trainee") {
    // 프리 데뷔 계정: 작은 팬덤의 1.5배 정도, 유튜브·스포티파이는 없음
    return { instagram: year >= 2012 ? Math.round(fans * 1.5) : 0, youtube: 0, spotify: 0 };
  }
  const recentHit = c.albums.filter((a) => c.turn - a.turn <= 2).reduce((s, a) => s + (a.melon !== null ? Math.max(0, 30 - a.melon) : 0) + (a.billboard !== null ? 40 : 0), 0);
  const instagram = fans * (3 + pop / 20) + (c.peakBillboard !== null ? 2_000_000 : 0);
  const youtube = fans * (2 + pop / 25) + recentHit * 20_000;
  const spotify = fans * (1.5 + pop / 15) + recentHit * 60_000 + (c.peakBillboard !== null ? 3_000_000 : 0);
  return {
    instagram: year >= 2012 ? Math.min(METRIC_CAPS.instagram, Math.round(instagram * era)) : 0,
    youtube: year >= 2009 ? Math.min(METRIC_CAPS.youtube, Math.round(youtube * era)) : 0,
    spotify: year >= 2021 ? Math.min(METRIC_CAPS.spotify, Math.round(spotify)) : 0,
  };
}

/** Moves stored metrics toward their targets: growth catches up 40% per half-year, decline 15%. */
export function updateMetrics(c: Career): Metrics {
  const target = metricTargets(c);
  const prev = c.metrics ?? EMPTY_METRICS;
  const next: Metrics = { ...prev };
  for (const k of ["instagram", "youtube", "spotify"] as const) {
    const t = target[k];
    const p = prev[k];
    next[k] = Math.round(t >= p ? p + (t - p) * 0.4 : p + (t - p) * 0.15);
  }
  c.metrics = next;
  return next;
}

export function countText(n: number): string {
  if (n < 10000) return Math.round(n).toLocaleString("ko-KR");
  if (n < 100000000) {
    const man = n / 10000;
    return `${man >= 100 ? Math.round(man).toLocaleString("ko-KR") : man.toFixed(1).replace(/\.0$/, "")}만`;
  }
  return `${(n / 100000000).toFixed(1).replace(/\.0$/, "")}억`;
}
