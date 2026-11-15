# 베타 QA 2차 이미지 프롬프트 (Claude 채팅 · Higgsfield)

코드로 못 고치는 두 가지예요. [캐릭터 프롬프트](HIGGSFIELD-PROMPTS.md)와 같은 방식으로 Claude 채팅에서 뽑고, 받은 파일을 아래 경로에 넣어 주시면 연결은 Claude Code가 해요.

| 작업 | 수량 | 저장 경로 |
|---|---|---|
| 1. 상점 아이템 3단계 그림 | 13종 × 3단계 = 39 | `public/art-v6/inbox/items/<key>-01.png` · `-02` · `-03` |
| ~~2. 시상식 객석 의자 통일~~ | — | 의자에 앉은 그림을 아예 쓰지 않기로 해서 필요 없어요 |

모델: `nano_banana_2_1`, `resolution: "2k"`, `aspect_ratio: "1:1"`, `use_unlim: true`. 배경은 흰색(#FFFFFF)이면 Claude Code가 지워요.

---

## 1. 상점 아이템 — 값이 비싸면 한눈에 비싸 보이게

지금은 마스터(03)가 프로(02) 그림을 같이 쓰고, 단계 차이가 잘 안 보여요. 단계마다 재질과 장식을 확실히 다르게 해요.

### 공통 스타일

```text
Single game shop item icon, cute polished pixel art, 32-bit era sprite quality, three-quarter front view, centered, item fills about 80% of a square canvas, crisp 1-pixel dark outline, gentle cel shading, no character, no hands, no text, no logo, no price tag, plain pure white #FFFFFF background, no shadow on the ground.
```

### 단계 블록 (하나만 붙이기)

```text
Tier 01 (basic): plain everyday version made of matte plastic and fabric in soft pastel colours, simple shapes, no ornament, looks affordable.
```

```text
Tier 02 (pro): professional studio-grade version in brushed silver metal and deep navy, extra knobs or padding, a small blue LED accent, looks like serious gear.
```

```text
Tier 03 (master): luxurious master edition in polished gold and black lacquer with tiny inset gemstones and a soft golden glow outline, ornate trim, placed on a small velvet cushion, unmistakably the most expensive item.
```

### 아이템 블록

| key | 아이템 문구 |
|---|---|
| `songwriter-notebook` | a songwriter's lyric notebook with a pen clipped to it |
| `full-length-mirror` | a full-length standing mirror on a stand |
| `dance-sneakers` | a pair of high-top dance sneakers |
| `headphones` | over-ear studio monitor headphones |
| `ring-light` | a ring light on a small tripod with a phone holder |
| `practice-room-pass` | a practice room key card with a lanyard and a small key |
| `vlog-camera` | a compact vlog camera with a flip screen and mini tripod grip |
| `studio-microphone` | a large-diaphragm studio condenser microphone with a shock mount |
| `wireless-in-ear` | a wireless in-ear monitor bodypack with earpieces |
| `in-ear-monitor` | a pair of custom-molded in-ear monitors with a coiled cable |
| `midi-keyboard` | a compact 49-key MIDI keyboard with pads and knobs |
| `audio-interface` | a desktop audio interface with two input knobs and a level meter |
| `vocal-booth` | a small portable vocal booth with acoustic foam panels |

프롬프트 = 공통 스타일 + `Item: <아이템 문구>.` + 단계 블록. 한 아이템의 세 단계를 연달아 뽑으면 비교가 쉬워요.

---

## 2. 시상식 객석 의자 통일 (취소)

> 초기 캐릭터 0~5를 폐기하고, 시상식에서 의자에 앉은 프레임을 쓰지 않기로 해서 이 작업은 하지 않아요.
