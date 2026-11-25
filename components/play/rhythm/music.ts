/**
 * 리듬 게임 반주: 소리 파일 없이 WebAudio로 만든다 (120BPM, Am–F–C–G).
 * 곡 전체를 시작할 때 한 번에 예약하고, 게임 시계는 이 오디오 시계를 따른다 (화면과 소리가 어긋나지 않게).
 */
import { BARS, BEAT, COUNT_IN, CHORDS, midiHz } from "@/lib/game/rhythm";

export type Music = {
  ctx: AudioContext;
  /** 곡 시작(카운트 첫 박) 오디오 시각 (초) */
  startAt: number;
  /** 지금 곡 안의 시각 (ms). 출력 지연을 빼서 귀에 들리는 박자에 맞춘다 */
  now: () => number;
  /** 노트를 친 소리 */
  hit: (midi: number, perfect: boolean) => void;
  miss: () => void;
  stop: () => void;
};

export function createAudio(): AudioContext | null {
  const Ctx = typeof window !== "undefined" ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;
  if (!Ctx) return null;
  try {
    const ctx = new Ctx();
    void ctx.resume?.(); // iOS는 사용자 탭 안에서 깨워야 소리가 난다
    return ctx;
  } catch {
    return null;
  }
}

export function startMusic(ctx: AudioContext, leadSec = 0.25): Music {
  const master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const beat = BEAT / 1000;
  const startAt = ctx.currentTime + leadSec;
  const nodes: AudioScheduledSourceNode[] = [];

  const env = (g: GainNode, t: number, peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };
  const osc = (type: OscillatorType, freq: number, t: number, peak: number, decay: number, out: AudioNode = master, attack = 0.005) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    env(g, t, peak, attack, decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
    nodes.push(o);
    return o;
  };
  const burst = (t: number, peak: number, decay: number, hp: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = ctx.createGain();
    env(g, t, peak, 0.002, decay);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + decay + 0.05);
    nodes.push(src);
  };
  const kick = (t: number) => {
    const o = osc("sine", 150, t, 0.9, 0.32);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
  };
  const snare = (t: number) => { burst(t, 0.35, 0.16, 1800); osc("triangle", 190, t, 0.18, 0.08); };
  const hat = (t: number, open = false) => burst(t, open ? 0.12 : 0.07, open ? 0.18 : 0.04, 7000);
  const stick = (t: number, accent: boolean) => osc("square", accent ? 1760 : 1320, t, 0.12, 0.05);

  // 저음과 화음은 부드럽게 깎는다
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 900;
  low.connect(master);

  // 카운트 4박: 3 · 2 · 1 · 시작
  for (let b = 0; b < COUNT_IN; b++) stick(startAt + b * beat, b === 0);
  // 8마디
  for (let bar = 0; bar < BARS; bar++) {
    const chord = CHORDS[bar % CHORDS.length];
    const barAt = startAt + (COUNT_IN + bar * 4) * beat;
    for (let b = 0; b < 4; b++) {
      const t = barAt + b * beat;
      kick(t);
      if (b % 2 === 1) snare(t);
      hat(t + beat / 2, b === 3);
      hat(t, false);
      // 베이스: 8분음표로 근음 · 옥타브
      osc("sawtooth", midiHz(chord.root), t, 0.22, beat * 0.4, low);
      osc("sawtooth", midiHz(chord.root + 12), t + beat / 2, 0.14, beat * 0.3, low);
      // 화음 스탭: 뒷박
      if (b % 2 === 1) for (const m of [chord.root + 12, chord.third + 12, chord.fifth + 12]) osc("triangle", midiHz(m), t + beat / 2, 0.06, beat * 0.45, low, 0.01);
    }
  }
  // 끝 화음
  const endAt = startAt + (COUNT_IN + BARS * 4) * beat;
  kick(endAt);
  burst(endAt, 0.2, 0.9, 5000);
  for (const m of [57, 60, 64, 69]) osc("triangle", midiHz(m), endAt, 0.1, 1.4, low, 0.01);

  const latency = (ctx.outputLatency || ctx.baseLatency || 0) * 1000;
  return {
    ctx,
    startAt,
    now: () => (ctx.currentTime - startAt) * 1000 - latency,
    hit: (midi, perfect) => {
      const t = ctx.currentTime;
      osc("triangle", midiHz(midi), t, perfect ? 0.32 : 0.2, 0.28);
      osc("sine", midiHz(midi + 12), t, perfect ? 0.12 : 0.05, 0.18);
    },
    miss: () => {
      const t = ctx.currentTime;
      const o = osc("sawtooth", 140, t, 0.12, 0.18, low);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.18);
    },
    stop: () => {
      for (const n of nodes) { try { n.stop(); } catch { /* 이미 끝남 */ } }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      void ctx.close().catch(() => {});
    },
  };
}
