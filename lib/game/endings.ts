import type { Career, Ending } from "./types.ts";
import { daesangCount } from "./awards.ts";

export const ENDINGS: Ending[] = [
  { id: "legend", title: "글로벌 레전드", subtitle: "FROM A PRACTICE ROOM TO THE WORLD", text: "작은 연습실에서 시작된 목소리가 전 세계에 닿았어요. 빌보드 1위보다 오래 남는 건, 당신의 음악과 함께 자란 사람들의 기억이에요." },
  { id: "icon", title: "한 시대의 아이콘", subtitle: "THE NAME OF AN ERA", text: "수많은 무대와 트로피가 쌓여 하나의 시대가 됐어요. 이름만으로 떠오르는 음악. 당신은 누군가의 청춘에 남았어요." },
  { id: "national", title: "국민 아티스트", subtitle: "A MILLION REASONS TO SING", text: "백만 개가 넘는 마음이 당신의 노래를 불렀어요. 찬란한 기록 사이에도 서로를 알아보던 작은 순간들을 잊지 않았어요." },
  { id: "artist", title: "나만의 음악 세계", subtitle: "THE ARTIST WHO WROTE THEIR OWN STORY", text: "숫자보다 먼저 음악을 만들었어요. 직접 쓴 멜로디와 이야기는 시간이 지나도 당신의 이름으로 남을 거예요." },
  { id: "stage", title: "무대가 사랑한 이름", subtitle: "BORN FOR THE SPOTLIGHT", text: "매번 다른 무대에서도 당신만의 빛은 분명했어요. 하나씩 쌓아온 트로피는 수많은 연습의 시간을 기억해요." },
  { id: "star", title: "우리들의 소중한 스타", subtitle: "EVERY STAGE WAS WORTH IT", text: "객석의 크기는 달랐지만 모든 무대는 소중했어요. 당신의 노래로 힘을 얻은 누군가가 있다는 것. 그걸로도 충분히 빛나는 커리어예요." },
  { id: "restart", title: "또 다른 시작", subtitle: "YOUR STORY DOESN'T END HERE", text: "모든 꿈이 같은 모양으로 완성되지는 않아요. 배운 것과 함께한 사람들, 용기를 냈던 순간은 다음 이야기의 시작이 돼요." },
];

export function endingFor(c: Career): Ending {
  const by = (id: string) => ENDINGS.find((e) => e.id === id)!;
  if (c.peakBillboard === 1) return by("legend");
  if (daesangCount(c) >= 3) return by("icon");
  if (c.fans >= 3000000) return by("national");
  if (c.stats.producing >= 80 && c.albums.length >= 5) return by("artist");
  if (c.musicWins >= 10) return by("stage");
  if (c.debutTurn !== null) return by("star");
  return by("restart");
}

export function scoreOf(c: Career): number {
  return (
    c.albums.filter((a) => a.billboard === 1).length * 100000 +
    daesangCount(c) * 30000 +
    c.musicWins * 1000 +
    c.albums.length * 300 +
    Math.floor(c.fans / 10) +
    c.peakPopularity * 100
  );
}
