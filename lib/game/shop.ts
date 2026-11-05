import type { Career, StatKey } from "./types.ts";
import { eraScale, yearOf } from "./format.ts";
import { settlement } from "./economy.ts";
import { MAIN_STAT } from "./focus.ts";

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
  /** 전용 연습실처럼 주력 능력치를 따라가는 특별 상품 */
  premium?: boolean;
};

type Kind = { key: string; name: string; stat: StatKey; description: string };
const KINDS: Kind[] = [
  { key: "studio-microphone", name: "스튜디오 마이크", stat: "vocal", description: "숨소리까지 담기는 녹음용 마이크" },
  { key: "vocal-booth", name: "개인 보컬 부스", stat: "vocal", description: "집에서도 녹음실처럼 연습해요" },
  { key: "in-ear-monitor", name: "커스텀 인이어", stat: "vocal", description: "라이브 음정이 흔들리지 않아요" },
  { key: "dance-sneakers", name: "댄스화", stat: "dance", description: "턴과 슬라이드가 가벼워져요" },
  { key: "practice-room-pass", name: "연습실 이용권", stat: "dance", description: "새벽에도 쓸 수 있는 개인 연습실" },
  { key: "wireless-in-ear", name: "무선 인이어", stat: "dance", description: "격한 안무 중에도 박자를 놓치지 않아요" },
  { key: "headphones", name: "모니터 헤드폰", stat: "rap", description: "비트를 쪼개 듣는 귀가 생겨요" },
  { key: "songwriter-notebook", name: "가사 노트", stat: "rap", description: "떠오른 라임을 바로 적어둬요" },
  { key: "ring-light", name: "링라이트", stat: "visual", description: "셀카와 라이브 방송 화면이 달라져요" },
  { key: "full-length-mirror", name: "전신 거울", stat: "visual", description: "표정과 라인을 매일 점검해요" },
  { key: "vlog-camera", name: "브이로그 카메라", stat: "variety", description: "자체 콘텐츠로 입담이 늘어요" },
  { key: "midi-keyboard", name: "마스터 키보드", stat: "producing", description: "멜로디를 바로 찍어볼 수 있어요" },
  { key: "audio-interface", name: "오디오 인터페이스", stat: "producing", description: "홈 레코딩으로 데모를 만들어요" },
];

/** 01 일반(+3) · 02 프로(+5) · 03 마스터(+7, 모아야 살 수 있다). 03은 프로 이미지를 쓴다. */
export const SHOP_ITEMS: ShopItem[] = KINDS.flatMap((k) => [
  { id: `${k.key}-01`, name: k.name, stat: k.stat, amount: 3, price: 3, image: `/art-v3/items/${k.key}-01.png`, description: k.description },
  { id: `${k.key}-02`, name: `${k.name} 프로`, stat: k.stat, amount: 5, price: 9, image: `/art-v3/items/${k.key}-02.png`, description: k.description },
  { id: `${k.key}-03`, name: `${k.name} 마스터`, stat: k.stat, amount: 7, price: 30, image: `/art-v3/items/${k.key}-02.png`, description: k.description },
]);

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
  return picked;
}

export const boughtThisSeason = (c: Pick<Career, "flags" | "turn">) => c.flags.shopTurn === c.turn;
