# 연말 시상식 장면 생성 프롬프트

게임의 `AwardShow`는 아래 장면 id를 순서대로 보여줘요. 아트 카탈로그(`lib/art/catalog.json`)에 같은 id의 장면을 넣으면 자동으로 그 장면을 쓰고, 없으면 기본 `awards` 장면으로 대신해요.

| 장면 id | 언제 | 캐릭터 동작 (프레임 흐름) |
|---|---|---|
| `awards-redcarpet` | 입장 | 레드카펫 위에서 손 흔들기 → 포즈 → 살짝 고개 숙여 인사 |
| `awards-stage` | 연말 무대 | 마이크 들고 노래 → 팔 뻗기 → 안무 포즈 |
| `awards-seat` | 발표 직전 | 객석에 앉아 두 손 모으기 → 옆을 보기 → 긴장해 입술 깨물기 |
| `awards-announce` | 두구두구 | 시상자 봉투 들기 → 봉투 열기 → 카드 읽기 (시상자는 별도 인물) |
| `awards-win` | 호명 | 놀라 입 가리기 → 벌떡 일어나기 → 두 팔 들기 |
| `awards-cry` | 호명 (눈물) | 눈물 글썽 → 눈물 닦기 → 떨리는 미소 |
| `awards-speech` | 수상소감 | 트로피 들고 마이크 앞 → 트로피 가슴에 안기 → 90도 인사 |
| `awards-lose` | 수상 없음 | 박수 치기 → 미소 → 담담히 앉기 |

배경은 장면당 1장(`backgrounds/awards-<id>.png`), 캐릭터는 아바타 6종 × 장면당 3~4프레임이에요. 기존 아트와 같은 규칙으로 **투명 배경, 캐릭터만** 뽑고, 배경은 **캐릭터 없이** 뽑아요.

---

## 공통 스타일 접두 (모든 프롬프트 앞에 붙이기)

```text
Use case: illustration-story. Cute polished crisp pixel-art, 16-bit JRPG cutscene style, elegant soft lilac mint peach cream palette with warm gold accents, confident clean pixel clusters and restrained dithering, subtle material shading, no blurry edges, no photorealism, no text, no logo, no watermark.
```

## 1) 배경 (장면당 1장, 캐릭터 없음)

한 번에 여러 장: "아래 8개 배경을 각각 독립된 이미지로 생성해줘. 같은 시상식장, 같은 팔레트, 같은 카메라 높이." 뒤에 아래를 붙여요.

```text
Each image: wide 4:3 background plate for a Korean year-end music awards ceremony, absolutely no people, no faces, no silhouettes, no lettering. Consistent venue across all images.
1. awards-redcarpet — red carpet entrance at night, photo wall with abstract gold sponsor pattern (no letters), camera flashes as small white star bursts, velvet ropes.
2. awards-stage — huge arena stage from the performer's side, lilac and gold spotlights crossing, LED wall with abstract waves, sea of lightsticks in one color far below.
3. awards-seat — artist seating area of the arena seen from the aisle, round tables with white cloth, small warm lamps, stage glowing in the distance, empty chairs.
4. awards-announce — main stage podium with a gold envelope and a crystal trophy on a stand, single spotlight, rest of the stage dim.
5. awards-win — same seating area as 3 but with gold confetti bursting from above and spotlights swinging toward the empty table.
6. awards-cry — same as 5 but softer, warm bokeh lights, slow-falling gold confetti.
7. awards-speech — podium from the audience side, microphone stand, trophy on the podium, arena lights dimmed to a warm glow.
8. awards-lose — seating area at night, calm blue lighting, stage lit for someone else far away, gentle applause mood.
```

## 2) 캐릭터 프레임 (아바타별 × 장면별, 투명 배경)

한 번에 여러 프레임: 한 장면의 프레임들을 **한 이미지에 가로 스트립(1×4)** 으로 뽑고 나중에 잘라 쓰면 일관성이 가장 좋아요. 아바타 설명은 기존 캐릭터 시트 문구를 그대로 쓰세요(머리색·의상 고정). 아래 `[AVATAR]` 자리에 넣어요.

```text
Character sheet, horizontal strip of 4 sequential animation frames, equal spacing, same scale, same camera, full body chibi, feet visible, transparent background, no ground shadow, no text.
Character: [AVATAR], wearing a black formal awards-night outfit with small gold details (tailored suit or elegant dress matching the character), neat hair.
```

장면별 동작 줄(위 공통 문단 뒤에 하나만 붙이기):

```text
awards-redcarpet — Frames: (1) standing straight on a red carpet, (2) waving right hand at cameras, (3) hand on hip pose, (4) small polite bow.
awards-stage — Frames: (1) holding a wireless microphone at chest, (2) singing with mic raised, (3) free arm stretched toward the crowd, (4) sharp dance pose with one knee bent.
awards-seat — Frames: (1) sitting on a chair with hands clasped on lap, (2) hands pressed together under chin, (3) glancing to the side, (4) biting lower lip with wide eyes.
awards-announce — presenter character instead of the idol: an elegant adult host in a dark suit, (1) holding a sealed gold envelope, (2) opening the envelope, (3) reading the card, (4) pointing toward the audience with a big smile. Same chibi pixel style.
awards-win — Frames: (1) sitting, mouth covered with both hands in shock, (2) half standing, (3) fully standing with both arms raised, (4) jumping with sparkles around.
awards-cry — Frames: (1) eyes glistening, (2) one hand wiping a tear, (3) trembling smile with tears, (4) head bowed, hand on chest.
awards-speech — Frames: (1) holding a crystal trophy at a microphone stand, (2) trophy hugged to the chest, (3) speaking with one hand open, (4) deep 90-degree bow holding the trophy.
awards-lose — Frames: (1) clapping with a soft smile, (2) clapping higher, (3) nodding, (4) sitting back calmly with hands on lap.
```

## 3) 카탈로그 등록

`lib/art/catalog.json`의 `scenes`에 아래 형태로 추가하면 바로 쓰여요 (기존 `awards` 항목과 같은 구조). 프레임은 2개 이상이면 `ArtFrames`가 교차 재생해요.

```json
"awards-win": {
  "background": "/art-v3/backgrounds/awards-win.png",
  "avatars": { "0": [{ "url": "/art-v4/characters/avatar-0/awards-win/01.png", "height": 1, "x": 0, "y": 0 }, { "url": ".../02.png", "height": 1, "x": 0, "y": 0 }] }
}
```

`height`/`x`/`y`는 기존 항목처럼 캐릭터 프레임의 보이는 높이 비율과 오프셋이에요. 스트립으로 뽑았다면 4등분해서 `01~04.png`로 저장한 뒤 넣으면 돼요.
