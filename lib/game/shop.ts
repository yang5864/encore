import type { Career, StatKey } from "./types.ts";
import { eraScale, yearOf } from "./format.ts";
import { settlement } from "./economy.ts";
import { MAIN_STAT } from "./focus.ts";

/** 물건마다 다른 덤 효과. 주 능력치 말고 이 물건만의 특색 */
export type Perk = { label: string; stat?: StatKey; amount?: number; health?: number; mental?: number; buzz?: number; fansPct?: number; reputation?: number };

export type ShopItem = {
  id: string;
  name: string;
  stat: StatKey;
  /** 능력치 상승량 (잠재력 한도도 같이 오른다) */
  amount: number;
  /** 2021년 기준 가격(억). 시대 보정이 곱해진다 */
  price: number;
  image: string;
  description: string;
  /** 1 일반 · 2 프로 · 3 마스터 */
  tier?: 1 | 2 | 3;
  perk?: Perk;
  /** 전용 연습실처럼 주력 능력치를 따라가는 특별 상품 */
  premium?: boolean;
};

type Kind = { key: string; name: string; stat: StatKey; description: string; base: number; perk: Perk };
/** base: 일반 단계 가격(억). 싼 소모품부터 장비까지 값이 고르게 퍼진다 */
const KINDS: Kind[] = [
  { key: "songwriter-notebook", name: "가사 노트", stat: "rap", description: "떠오른 라임을 바로 적어둬요", base: 1.5, perk: { label: "작사 감각 · 프로듀싱 +1", stat: "producing", amount: 1 } },
  { key: "full-length-mirror", name: "전신 거울", stat: "visual", description: "표정과 라인을 매일 점검해요", base: 2, perk: { label: "동작 점검 · 댄스 +1", stat: "dance", amount: 1 } },
  { key: "dance-sneakers", name: "댄스화", stat: "dance", description: "턴과 슬라이드가 가벼워져요", base: 2.5, perk: { label: "부상 예방 · 체력 +4", health: 4 } },
  { key: "headphones", name: "모니터 헤드폰", stat: "rap", description: "비트를 쪼개 듣는 귀가 생겨요", base: 3, perk: { label: "음정 체크 · 보컬 +1", stat: "vocal", amount: 1 } },
  { key: "ring-light", name: "링라이트", stat: "visual", description: "셀카와 라이브 방송 화면이 달라져요", base: 3.5, perk: { label: "SNS 반응 · 화제성 +6", buzz: 6 } },
  { key: "practice-room-pass", name: "연습실 이용권", stat: "dance", description: "새벽에도 쓸 수 있는 개인 연습실", base: 4, perk: { label: "혼자만의 시간 · 멘탈 +3", mental: 3 } },
  { key: "vlog-camera", name: "브이로그 카메라", stat: "variety", description: "자체 콘텐츠로 입담이 늘어요", base: 4.5, perk: { label: "자체 콘텐츠 · 팬 +2%", fansPct: 2 } },
  { key: "studio-microphone", name: "스튜디오 마이크", stat: "vocal", description: "숨소리까지 담기는 녹음용 마이크", base: 5, perk: { label: "홈 레코딩 · 프로듀싱 +1", stat: "producing", amount: 1 } },
  { key: "wireless-in-ear", name: "무선 인이어", stat: "dance", description: "격한 안무 중에도 박자를 놓치지 않아요", base: 5.5, perk: { label: "라이브 안정 · 보컬 +1", stat: "vocal", amount: 1 } },
  { key: "in-ear-monitor", name: "커스텀 인이어", stat: "vocal", description: "라이브 음정이 흔들리지 않아요", base: 6, perk: { label: "무대 긴장 완화 · 멘탈 +4", mental: 4 } },
  { key: "midi-keyboard", name: "MIDI 키보드", stat: "producing", description: "멜로디를 바로 찍어볼 수 있어요", base: 6.5, perk: { label: "화성 감각 · 보컬 +1", stat: "vocal", amount: 1 } },
  { key: "audio-interface", name: "오디오 인터페이스", stat: "producing", description: "홈 레코딩으로 데모를 만들어요", base: 7, perk: { label: "데모 퀄리티 · 평판 +2", reputation: 2 } },
  { key: "vocal-booth", name: "개인 보컬 부스", stat: "vocal", description: "집에서도 녹음실처럼 연습해요", base: 8, perk: { label: "방음 연습 · 멘탈 +3", mental: 3 } },
];

/** 단계별 배율: 가격 ×1 · ×3 · ×8, 덤 효과 ×1 · ×1.5 · ×2 */
const TIER = [
  { suffix: "01", label: "", amount: 3, price: 1, perk: 1 },
  { suffix: "02", label: " 프로", amount: 5, price: 3, perk: 1.5 },
  { suffix: "03", label: " 마스터", amount: 7, price: 8, perk: 2 },
] as const;

const scalePerk = (p: Perk, m: number): Perk => {
  const r = (v?: number) => (v === undefined ? undefined : Math.max(1, Math.round(v * m)));
  const out: Perk = { label: p.label, stat: p.stat, amount: r(p.amount), health: r(p.health), mental: r(p.mental), buzz: r(p.buzz), fansPct: r(p.fansPct), reputation: r(p.reputation) };
  // 라벨의 숫자도 단계에 맞게
  const n = out.amount ?? out.health ?? out.mental ?? out.buzz ?? out.fansPct ?? out.reputation;
  out.label = p.label.replace(/\+\d+/, `+${n}`);
  return out;
};

/** 01 일반 · 02 프로 · 03 마스터(모아야 살 수 있다). 03 그림은 전용 이미지가 나오기 전까지 프로 그림을 쓴다. */
export const SHOP_ITEMS: ShopItem[] = KINDS.flatMap((k) => TIER.map((t, i) => ({
  id: `${k.key}-${t.suffix}`,
  name: `${k.name}${t.label}`,
  stat: k.stat,
  amount: t.amount,
  price: Math.round(k.base * t.price * 10) / 10,
  image: `/art-v3/items/${k.key}-${i === 0 ? "01" : "02"}.png`,
  description: k.description,
  tier: (i + 1) as 1 | 2 | 3,
  perk: scalePerk(k.perk, t.perk),
})));

export const PREMIUM_ID = "studio-premium";
export const PREMIUM_PRICE = 120;
/** 전용 연습실: 내 주력 능력치(포지션)가 크게 오른다. 지갑이 절반 이상 모였을 때만 진열된다. */
export const premiumItem = (position: Career["position"]): ShopItem => ({
  id: PREMIUM_ID,
  name: "전용 연습실",
  stat: MAIN_STAT[position],
  amount: 12,
  price: PREMIUM_PRICE,
  image: "/art-v3/items/practice-room-pass-02.png",
  description: "회사와 따로 쓰는 나만의 연습실. 주력 능력이 크게 올라요",
  tier: 3,
  perk: { label: "컨디션 관리 · 체력 +8 · 멘탈 +8", health: 8, mental: 8 },
  premium: true,
});

export const itemById = (id: string, position: Career["position"] = "vocal") => (id === PREMIUM_ID ? premiumItem(position) : SHOP_ITEMS.find((x) => x.id === id) ?? null);
export const priceOf = (c: Pick<Career, "turn">, item: ShopItem) => Math.round(item.price * eraScale(yearOf(c)) * 10) / 10;

/** 쓸 수 있는 돈 = 받은 정산금 − 상점에서 쓴 돈. */
export function walletOf(c: Career): number {
  return Math.max(0, Math.round((settlement(c).mine - (c.money.spent ?? 0)) * 10) / 10);
}

function hash(n: number): number {
  let x = n >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/** 시즌마다 바뀌는 진열 상품 3개. 게임 난수(rngState)를 쓰지 않아 다시 열어도 같다. 마스터(03)는 시즌에 하나까지, 지갑이 넉넉하면 마지막 칸이 전용 연습실로 바뀐다. */
export function shopOffers(c: Pick<Career, "seed" | "turn"> & Partial<Pick<Career, "items" | "flags" | "position" | "money" | "agencyId">>): ShopItem[] {
  const picked: ShopItem[] = [];
  const kinds = new Set<string>();
  // 이미 가진 물건은 다시 진열하지 않는다. 이번 시즌에 산 물건만 "구매 완료"로 남겨둔다
  const owned = new Set((c.items ?? []).filter((id) => !(c.flags?.shopTurn === c.turn && id === c.items?.[c.items.length - 1])));
  let master = false;
  for (let i = 0; picked.length < 3 && i < 160; i++) {
    const item = SHOP_ITEMS[hash(c.seed * 31 + c.turn * 977 + i * 7919) % SHOP_ITEMS.length];
    const kind = item.id.slice(0, -3);
    if (kinds.has(kind) || owned.has(item.id)) continue;
    if (item.id.endsWith("-03")) {
      if (master) continue;
      master = true;
    }
    kinds.add(kind);
    picked.push(item);
  }
  if (c.position && c.money && c.flags && !owned.has(PREMIUM_ID)) {
    const premium = premiumItem(c.position);
    const boughtNow = c.flags.shopTurn === c.turn && c.items?.[c.items.length - 1] === PREMIUM_ID;
    if (boughtNow || walletOf(c as Career) >= premium.price * eraScale(yearOf(c)) * 0.5) picked[2] = premium;
  }
  return picked.sort((x, y) => x.price - y.price);
}

export const boughtThisSeason = (c: Pick<Career, "flags" | "turn">) => c.flags.shopTurn === c.turn;
