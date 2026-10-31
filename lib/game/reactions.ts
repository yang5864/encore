import type { Career, Comment } from "./types.ts";
import { pick, rng } from "./rng.ts";

const AUTHORS = ["무대앞자리", "오늘의플리", "조용한응원", "퇴근후덕질", "응원봉충전중", "플리정리중", "새벽라디오", "앨범깡러", "직캠수집가", "입덕부정기", "정주행중", "티켓팅실패자"];

const GOOD = [
  "이번 활동 진짜 열심히 한 게 보인다",
  "무대 보고 입덕했어요 큰일났다",
  "라이브 안정감 미쳤다 ㅠㅠ",
  "멤버들 케미 너무 좋아서 자컨 정주행 중",
  "이 콘셉트 완전 찰떡이다",
  "오늘도 응원합니다 오래오래 가자",
  "요즘 알고리즘에 자꾸 떠서 결국 앨범 샀다",
  "팬 챙기는 거 보고 더 좋아졌어요",
  "포인트 안무 따라 하다가 하루 다 감",
  "이 그룹 왜 이제 알았지",
];
const BAD = [
  "이번엔 좀 아쉽다 다음 활동 기대할게",
  "해명이 더 필요해 보이는데",
  "팬들 마음도 생각해줬으면",
  "실력으로 보여주면 됨 기다린다",
  "이 타이밍에 이건 좀",
  "회사가 일을 못 하는 듯",
  "그래도 멤버들은 잘못 없잖아",
  "실망했지만 응원은 계속",
];
const NEUTRAL = [
  "이번 활동 어땠는지 후기 남겨요",
  "다음 컴백은 언제쯤이려나",
  "팬싸 후기 보고 왔는데 성격 좋다더라",
  "티저 보고 기대 중",
];

/** 3 in-game comments for a public moment. tone decides the mix. */
export function buildReactions(c: Career, tone: "good" | "bad" | "neutral"): Comment[] {
  const pool = tone === "good" ? GOOD : tone === "bad" ? BAD : NEUTRAL;
  const used = new Set<string>();
  const out: Comment[] = [];
  const scale = Math.max(30, Math.sqrt(c.fans + 100) * 3);
  while (out.length < 3 && used.size < pool.length) {
    const text = pick(c, pool);
    if (used.has(text)) continue;
    used.add(text);
    out.push({ author: pick(c, AUTHORS), text, likes: Math.round(scale * (0.4 + rng(c) * 1.8)) });
  }
  return out;
}

export function likeText(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천`;
  return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만`;
}
