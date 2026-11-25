/**
 * 예술고 실기 리듬 게임의 규칙 (화면·소리와 분리된 순수 계산).
 * 120BPM 8마디 곡: 4박 카운트 뒤 첫 박부터 노트가 온다. 앞 두 마디는 쉽고, 가운데가 촘촘하고, 마지막 마디는 쉬어 간다.
 */
export const BPM = 120;
/** 한 박 (ms) */
export const BEAT = 60000 / BPM;
/** 곡 시작 전 카운트 박 수 */
export const COUNT_IN = 4;
export const BARS = 8;
export const LANES = 3;
/** 노트가 화면 위에서 판정선까지 내려오는 시간 (ms) */
export const TRAVEL = 1400;
/** 판정 창 (ms, 노트 시각과의 차이) */
export const PERFECT = 70;
export const GOOD = 150;
/** 노트 점수: 완벽 1, 좋아요 0.6. 노트가 없는데 누르면 0.25를 깎는다 */
export const GOOD_VALUE = 0.6;
export const STRAY_PENALTY = 0.25;

export type Judge = "perfect" | "good" | "miss";
export type Note = { t: number; lane: number; /** 곡 안의 반 박 위치 (0부터): 화음·소리용 */ step: number; hit?: Judge };

/** 마디 안의 반 박 위치 (0~7) 묶음. 쉬움 → 보통 → 어려움 */
const EASY = [[0, 2, 4, 6], [0, 4, 6], [0, 2, 6], [0, 2, 4]];
const MID = [[0, 2, 3, 4, 6], [0, 1, 2, 4, 6], [0, 2, 4, 5, 6], [0, 2, 4, 6, 7]];
const HARD = [[0, 1, 2, 4, 5, 6], [0, 2, 3, 4, 6, 7], [0, 1, 2, 3, 4, 6]];
/** 마디별 난이도: 1~2 쉬움, 3~4 보통, 5~6 어려움, 7 보통, 8 쉬움 */
const SHAPE = [EASY, EASY, MID, MID, HARD, HARD, MID, EASY];

/** 시드로 정해지는 악보. 같은 줄이 세 번 이어지지 않는다. 시각은 곡 시작(카운트 시작)부터 ms */
export function makeChart(seed: number): Note[] {
  let s = (seed >>> 0) || 1;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const pool = SHAPE[bar];
    const pattern = pool[Math.floor(rnd() * pool.length)];
    for (const half of pattern) {
      const step = bar * 8 + half;
      let lane = Math.floor(rnd() * LANES);
      const n = notes.length;
      if (n >= 2 && notes[n - 1].lane === lane && notes[n - 2].lane === lane) lane = (lane + 1 + Math.floor(rnd() * 2)) % LANES;
      notes.push({ t: (COUNT_IN + step / 2) * BEAT, lane, step });
    }
  }
  return notes;
}

/** 곡 길이 (ms): 카운트 + 8마디 */
export const SONG_LENGTH = (COUNT_IN + BARS * 4) * BEAT;

/** 누른 시각과 노트 시각의 차이로 판정. 창 밖이면 null */
export function judgeDelta(deltaMs: number): Exclude<Judge, "miss"> | null {
  const d = Math.abs(deltaMs);
  return d <= PERFECT ? "perfect" : d <= GOOD ? "good" : null;
}

/** 그 줄에서 지금 칠 수 있는 가장 가까운 노트 */
export function nearestNote(notes: Note[], lane: number, now: number): Note | null {
  let best: Note | null = null;
  for (const n of notes) {
    if (n.hit || n.lane !== lane || Math.abs(n.t - now) > GOOD) continue;
    if (!best || Math.abs(n.t - now) < Math.abs(best.t - now)) best = n;
  }
  return best;
}

/** 실기 점수 0~100: 정확도에서 헛누름을 깎는다 */
export function rhythmScore(notes: Note[], stray: number): number {
  const got = notes.reduce((sum, n) => sum + (n.hit === "perfect" ? 1 : n.hit === "good" ? GOOD_VALUE : 0), 0);
  return Math.max(0, Math.min(100, Math.round(((got - stray * STRAY_PENALTY) / notes.length) * 100)));
}

/** 코드 진행 (마디마다): Am F C G 두 번. 근음은 반음 번호 (A2 = 45) */
export const CHORDS: { root: number; third: number; fifth: number }[] = [
  { root: 45, third: 48, fifth: 52 }, // Am
  { root: 41, third: 45, fifth: 48 }, // F
  { root: 48, third: 52, fifth: 55 }, // C
  { root: 43, third: 47, fifth: 50 }, // G
];
export const chordAt = (step: number) => CHORDS[Math.floor(step / 8) % CHORDS.length];
/** 노트를 치면 나는 음: 줄마다 그 마디 화음의 근음·3음·5음 (두 옥타브 위) → 누르는 손이 멜로디가 된다 */
export function noteMidi(note: Pick<Note, "lane" | "step">): number {
  const c = chordAt(note.step);
  return [c.root, c.third, c.fifth][note.lane] + 24;
}
export const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
