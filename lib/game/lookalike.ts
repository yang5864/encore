import type { Career, Position } from "./types.ts";

/**
 * 은퇴 회고의 마지막 장: 커리어가 가장 닮은 실제 K-POP 아이돌.
 * 성별·포지션·커리어 규모(레전드 / 정상급 / 꾸준함)로 고른다. 실제 인물은 공개된 포지션과 대표 성과만 쓰고, 사생활은 쓰지 않는다.
 */
export type Tier = "legend" | "top" | "steady";
export type Lookalike = { name: string; group: string; gender: Career["gender"]; position: Position; tier: Tier; note: string };

export const LOOKALIKES: Lookalike[] = [
  // 여자
  { name: "태연", group: "소녀시대", gender: "female", position: "vocal", tier: "legend", note: "메인보컬로 그룹과 솔로 모두 정상에 섰어요" },
  { name: "웬디", group: "레드벨벳", gender: "female", position: "vocal", tier: "top", note: "라이브로 신뢰를 쌓은 메인보컬이에요" },
  { name: "솔라", group: "마마무", gender: "female", position: "vocal", tier: "steady", note: "무대마다 성량으로 증명해 온 보컬이에요" },
  { name: "효연", group: "소녀시대", gender: "female", position: "dance", tier: "legend", note: "메인댄서로 한 시대의 군무를 이끌었어요" },
  { name: "슬기", group: "레드벨벳", gender: "female", position: "dance", tier: "top", note: "춤과 노래를 함께 갖춘 메인댄서예요" },
  { name: "모모", group: "트와이스", gender: "female", position: "dance", tier: "steady", note: "퍼포먼스로 팀의 무대를 받쳐 왔어요" },
  { name: "제니", group: "블랙핑크", gender: "female", position: "rap", tier: "legend", note: "래퍼로 시작해 세계 무대의 얼굴이 됐어요" },
  { name: "문별", group: "마마무", gender: "female", position: "rap", tier: "steady", note: "래퍼이자 작사가로 팀의 색을 만들었어요" },
  { name: "윤아", group: "소녀시대", gender: "female", position: "visual", tier: "legend", note: "센터와 연기를 오가며 오래 사랑받았어요" },
  { name: "카리나", group: "에스파", gender: "female", position: "visual", tier: "top", note: "리더이자 센터로 팀을 이끌어요" },
  { name: "아이린", group: "레드벨벳", gender: "female", position: "visual", tier: "steady", note: "리더이자 비주얼로 팀의 중심을 지켰어요" },
  { name: "리사", group: "블랙핑크", gender: "female", position: "allround", tier: "legend", note: "춤·랩·무대 장악력을 모두 갖춘 올라운더예요" },
  { name: "나연", group: "트와이스", gender: "female", position: "allround", tier: "top", note: "보컬과 무대 모두 고르게 해내는 멤버예요" },
  { name: "전소연", group: "(여자)아이들", gender: "female", position: "producer", tier: "legend", note: "팀의 곡을 직접 만들며 히트곡을 이어 왔어요" },
  { name: "우기", group: "(여자)아이들", gender: "female", position: "producer", tier: "steady", note: "작곡에 참여하며 자기 색을 쌓아 왔어요" },
  // 남자
  { name: "정국", group: "방탄소년단", gender: "male", position: "vocal", tier: "legend", note: "메인보컬로 세계 차트 정상에 섰어요" },
  { name: "도영", group: "NCT", gender: "male", position: "vocal", tier: "top", note: "안정적인 보컬로 팀의 중심을 잡았어요" },
  { name: "온유", group: "샤이니", gender: "male", position: "vocal", tier: "steady", note: "맑은 음색으로 오래 노래해 왔어요" },
  { name: "태민", group: "샤이니", gender: "male", position: "dance", tier: "legend", note: "퍼포먼스로 솔로 무대까지 정점에 올랐어요" },
  { name: "카이", group: "엑소", gender: "male", position: "dance", tier: "top", note: "춤으로 팀의 무대를 각인시켰어요" },
  { name: "호시", group: "세븐틴", gender: "male", position: "dance", tier: "top", note: "퍼포먼스 팀을 이끌며 안무를 만들어요" },
  { name: "마크", group: "NCT", gender: "male", position: "rap", tier: "top", note: "여러 유닛을 오가며 랩을 맡아 왔어요" },
  { name: "바비", group: "아이콘", gender: "male", position: "rap", tier: "steady", note: "래퍼로 무대와 작업을 꾸준히 이어 왔어요" },
  { name: "차은우", group: "아스트로", gender: "male", position: "visual", tier: "top", note: "센터와 연기로 대중에게 이름을 알렸어요" },
  { name: "진", group: "방탄소년단", gender: "male", position: "visual", tier: "legend", note: "비주얼과 보컬로 세계적인 팀의 맏형이 됐어요" },
  { name: "민호", group: "샤이니", gender: "male", position: "visual", tier: "steady", note: "무대와 연기를 오래 함께 해 왔어요" },
  { name: "지민", group: "방탄소년단", gender: "male", position: "allround", tier: "legend", note: "춤과 노래를 모두 해내며 솔로로도 정상에 섰어요" },
  { name: "현진", group: "스트레이 키즈", gender: "male", position: "allround", tier: "top", note: "춤·랩·비주얼을 고루 갖춘 멤버예요" },
  { name: "지드래곤", group: "빅뱅", gender: "male", position: "producer", tier: "legend", note: "팀의 히트곡을 직접 쓰며 한 시대를 만들었어요" },
  { name: "우지", group: "세븐틴", gender: "male", position: "producer", tier: "top", note: "팀의 곡 대부분을 직접 프로듀싱해요" },
  { name: "방찬", group: "스트레이 키즈", gender: "male", position: "producer", tier: "top", note: "리더이자 프로듀서로 팀의 음악을 만들어요" },
  { name: "지코", group: "블락비", gender: "male", position: "producer", tier: "steady", note: "작곡과 프로듀싱으로 자기 길을 넓혀 왔어요" },
];

/** 커리어 규모: 대상·빌보드 1위·브랜드평판 3위 안이면 레전드, 음방 1위가 쌓였거나 10위 안이면 정상급 */
export function careerTier(c: Pick<Career, "awards" | "musicWins" | "peakBillboard" | "flags">): Tier {
  const daesang = c.awards.some((a) => a.kind === "daesang");
  const best = c.flags.bestRank ?? 99;
  if (daesang || c.peakBillboard === 1 || best <= 3) return "legend";
  if (c.musicWins >= 3 || best <= 10) return "top";
  return "steady";
}

const TIER_ORDER: Tier[] = ["steady", "top", "legend"];

/** 데뷔한 커리어에만: 같은 성별 안에서 포지션이 같고 규모가 가장 가까운 사람, 같으면 시드로 고른다 */
export function lookalikeFor(c: Pick<Career, "gender" | "position" | "seed" | "awards" | "musicWins" | "peakBillboard" | "flags" | "debutTurn">): Lookalike | null {
  if (c.debutTurn === null) return null;
  const tier = careerTier(c);
  const pool = LOOKALIKES.filter((x) => x.gender === c.gender);
  const score = (x: Lookalike) => (x.position === c.position ? 0 : 3) + Math.abs(TIER_ORDER.indexOf(x.tier) - TIER_ORDER.indexOf(tier));
  const best = Math.min(...pool.map(score));
  const ties = pool.filter((x) => score(x) === best);
  return ties[c.seed % ties.length] ?? null;
}
