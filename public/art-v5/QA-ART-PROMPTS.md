# 베타 QA 이미지 생성 프롬프트

베타 QA에서 코드로 못 고친 항목은 전부 "이미지가 없어서"예요. 아래 순서대로 뽑으면 게임이 자동으로 집어 써요. 규칙은 [연말 시상식 장면 생성 프롬프트](../art-v4/AWARDS-PROMPTS.md)와 같아요: **배경은 4:3 한 장**, **캐릭터는 투명 배경에 캐릭터만**.

| 우선 | 작업 | 수량 | 왜 필요한가 |
|---|---|---|---|
| 1 | 시상식 배경 8장 재생성 (관객 포함) | 8 | QA: "시상식장 이미지에 사람이 없음". 지금 배경은 빈 객석·빈 무대예요 |
| 2 | 새 아바타 6–17 시상식 프레임 | 12명 × 7장면 × 4프레임 = 336 | 시상식 프레임은 아바타 0–5만 있어요. 6–17은 평상복 기본 동작으로 대체되는 중이에요 |
| 3 | 표정 프레임 (울상 · 활짝) | 18명 × 2 = 36 | QA: "안 좋은 이벤트엔 울상". 지금은 💧/✨ 뱃지로 때우고 있어요 |
| 4 | 새 이벤트 배경 4장 | 4 | 아육대 · 인스타 개설 · 군악대 · 연습실(평가 올인)이 다른 장면을 빌려 쓰고 있어요 |
| 5 | 군악대 남성 프레임 | 9명 × 2 = 18 | 4번 군악대 배경에 올릴 캐릭터 |

---

## 공통 스타일 접두 (모든 프롬프트 앞에 붙이기)

```text
Use case: illustration-story. Cute polished crisp pixel-art, 16-bit JRPG cutscene style, elegant soft lilac mint peach cream palette with warm gold accents, confident clean pixel clusters and restrained dithering, subtle material shading, no blurry edges, no photorealism, no text, no logo, no watermark.
```

---

## 1) 시상식 배경 8장 재생성 — 관객이 있는 시상식장

기존 파일을 **같은 이름으로 덮어쓰면** 코드 수정 없이 바로 바뀌어요: `public/art-v3/backgrounds/awards-<id>.png` (4:3).

핵심은 두 가지예요. **객석에 사람이 있어야 하고**, **화면 가운데 아래쪽은 비워야** 해요 (그 자리에 플레이어와 멤버 캐릭터를 겹쳐 올려요). 관객은 작은 픽셀 군중·뒷모습·응원봉 바다로 그리고, 앞줄 중앙엔 얼굴이 드러나는 인물을 두지 않아요.

한 번에 8장: "아래 8개 배경을 각각 독립된 이미지로 생성해줘. 같은 시상식장, 같은 팔레트, 같은 카메라 높이." 뒤에 아래를 붙여요.

```text
Each image: wide 4:3 background plate for a Korean year-end music awards ceremony held in a packed arena. The venue is FULL of audience: thousands of tiny pixel-art spectators drawn as small simplified figures, backs of heads, silhouettes and a sea of glowing lightsticks, plus seated celebrities at round tables drawn small and from behind or in profile. Keep the lower-center third of the frame EMPTY (no figures, no props) because the player's character will be composited there. No readable faces in the foreground, no lettering, no logos. Consistent venue, palette and camera height across all 8 images.
1. awards-redcarpet — red carpet entrance at night: crowds of fans and photographers behind velvet ropes on both sides, camera flashes as small white star bursts, gold abstract photo wall (no letters). Carpet center stays empty.
2. awards-stage — huge arena stage seen from the performer's side looking out: a sea of lightsticks in one color filling the arena floor and tiers, lilac and gold spotlights crossing, LED wall with abstract waves. Stage floor center-bottom stays empty.
3. awards-seat — artist seating area seen from the aisle: round tables with white cloth and small warm lamps, other artists seated at surrounding tables drawn small from behind, staff in the aisles, stage glowing in the distance. One table in the lower center is empty.
4. awards-announce — main stage podium with a gold envelope and a crystal trophy on a stand, single spotlight, the dim arena behind filled with silhouettes of the audience and scattered lightsticks. Podium front stays empty.
5. awards-win — same seating area as 3 with gold confetti bursting from above, spotlights swinging toward the empty center table, neighboring tables standing and applauding (small, from behind).
6. awards-cry — same as 5 but softer: warm bokeh lights, slow-falling gold confetti, audience holding lightsticks up quietly.
7. awards-speech — podium from the audience side, microphone stand and trophy on the podium, the whole arena dimmed to a warm glow with thousands of raised lightsticks and phone lights. Podium itself stays empty.
8. awards-lose — seating area at night in calm blue lighting, the stage lit for someone else far away, surrounding tables applauding politely, audience lightsticks in a different color. Center table empty.
```

검수 체크: (1) 가운데 아래가 비어 있는가 (2) 글자가 없는가 (3) 8장의 조명 색이 같은 톤인가.

---

## 2) 새 아바타 6–17 시상식 프레임

기존 6명과 똑같이 **7개 장면 × 4프레임**이에요. 발표(`awards-announce`)는 진행자가 따로 있어서 빼요. 저장 경로는 기존 규칙 그대로: `public/art-v4/characters/avatar-<N>/awards-<장면>/01.png`–`04.png`.

레퍼런스로 `public/art-v5/characters/avatar-<N>/idle-open.png`를 첨부하고 아래 프롬프트를 써요. 한 장면을 **1×4 가로 스트립**으로 뽑아 4등분하면 프레임 간 일관성이 가장 좋아요.

```text
Use case: identity-preserve game character animation frames. Edit the supplied isolated avatar reference. Horizontal strip of 4 sequential animation frames, equal spacing, same scale, same camera, same foot baseline, full body cute crisp pixel-art chibi, feet visible, genuinely transparent background, no ground shadow, no text, no border, no duplicate body.
Preserve face identity, eye color and shape, hairstyle, hair color and the exact hair accessory from the reference. Only the outfit and the pose change.
Outfit: black formal awards-night outfit with small gold details (tailored suit or elegant dress matching the character), neat hair.
Identity: [AVATAR]
[SCENE]
```

`[SCENE]` 자리에는 장면 동작 줄을 하나만 넣어요 (기존 문서와 동일):

```text
awards-redcarpet — Frames: (1) standing straight on a red carpet, (2) waving right hand at cameras, (3) hand on hip pose, (4) small polite bow.
awards-stage — Frames: (1) holding a wireless microphone at chest, (2) singing with mic raised, (3) free arm stretched toward the crowd, (4) sharp dance pose with one knee bent.
awards-seat — Frames: (1) sitting on a chair with hands clasped on lap, (2) hands pressed together under chin, (3) glancing to the side, (4) biting lower lip with wide eyes.
awards-win — Frames: (1) sitting, mouth covered with both hands in shock, (2) half standing, (3) fully standing with both arms raised, (4) jumping with sparkles around.
awards-cry — Frames: (1) eyes glistening, (2) one hand wiping a tear, (3) trembling smile with tears, (4) head bowed, hand on chest.
awards-speech — Frames: (1) holding a crystal trophy at a microphone stand, (2) trophy hugged to the chest, (3) speaking with one hand open, (4) deep 90-degree bow holding the trophy.
awards-lose — Frames: (1) clapping with a soft smile, (2) clapping higher, (3) nodding, (4) sitting back calmly with hands on lap.
```

`[AVATAR]` 자리에 넣을 정체성 문구 (제작 때 쓴 원문 그대로):

| N | 성별 | 정체성 문구 |
|---|---|---|
| 6 | 여 | ink-black waist-length straight hime-cut hair with blunt cheek-length side locks and no fringe, cool almond cat eyes in deep brown, straight brows, tiny confident closed-mouth smile, jade geometric barrette on one side |
| 7 | 여 | dusty rose-pink hair in one long loose side braid over shoulder, big round warm amber eyes, bright bunny-like smile, one tiny cheek beauty mark, small burgundy ribbon at braid end |
| 8 | 여 | rich copper-orange hair in a high swinging ponytail with two thin face-framing wisps, upturned fox-shaped brown eyes, cheeky toothy grin, black ponytail cuff |
| 9 | 여 | very short jet-black asymmetrical pixie cut tucked behind one ear, silver thin oval eyeglasses over cool gray-brown eyes, strong straight eyebrows, composed closed-mouth smile |
| 10 | 여 | dark chocolate brown curly hair in two compact high puff buns with curly forehead wisps, round dark green-brown eyes with downturned corners, broad sunny smile, subtle freckles, cream scrunchies |
| 11 | 여 | icy platinum blond waist-length straight hair with a blunt eyebrow-length fringe, slightly elongated violet-brown eyes, tiny gentle smile, two narrow black ribbon ties near temples |
| 12 | 남 | sandy blond medium-long layered wolf cut with swept-back front, slanted hazel-brown eyes, bold eyebrows, crooked confident smile, tiny silver ear cuff |
| 13 | 남 | warm chestnut brown fluffy curly hair with rounded curly fringe, large soft drooping puppy eyes in amber brown, thick curved brows, friendly dimpled smile |
| 14 | 남 | neat black undercut with short textured top and tidy fringe, clear rectangular glasses over charcoal-brown eyes, straight brows, calm subtle smile |
| 15 | 남 | deep navy-blue chin-length asymmetrical layered hair, one longer strand and the other side tucked behind the ear, angular cat eyes in dark brown, sharp brows, playful tiny smirk, small black ear stud |
| 16 | 남 | warm auburn-copper short swept-back hair with subtle shaved sides, broad friendly olive-brown eyes, bold upward brows, warm toothy smile, faint nose freckles |
| 17 | 남 | ash-lavender short two-block haircut with neat airy straight fringe and dark short sides, elongated dark-brown fox eyes, slim brows, small shy closed-mouth smile, one small silver hoop earring |

기존 0–5 문구(참고): 0 black bob, purple flower hairclip · 1 brown bob, green music-note hairclip · 2 long brown hair, pink flower hairclip · 3 black parted hair, blue star hairclip · 4 blond hair, gold star hairclip · 5 silver hair, teal music-note hairclip.

---

## 3) 표정 프레임 — 울상 · 활짝 (18명)

나쁜 이벤트(논란·부상·탈락·시상식 패배)와 좋은 이벤트(수상·1위)에서 **얼굴만 바뀐 기본 자세** 1장씩이에요. 저장: `public/art-v5/characters/avatar-<N>/mood-sad.png`, `mood-happy.png`. 레퍼런스는 각 아바타의 `idle-open.png`.

```text
Use case: precise-object-edit. Edit the supplied single transparent pixel-art game character. Change ONLY the facial expression. Preserve the exact same hair, accessories, outfit, body pose, hands, feet, pixel rendering, position, size, canvas dimensions and transparent padding. Genuine transparent alpha background, no shadows, no text, no additional figure.
Expression: [MOOD]
```

```text
sad   — downturned eyebrows, glistening lowered eyes, small wobbling frown, one tiny tear drop at the outer corner of one eye, slightly flushed cheeks.
happy — eyes curved into bright crescents, big open smile showing a hint of teeth, raised eyebrows, rosy cheeks, two tiny sparkle pixels beside the head.
```

---

## 4) 새 이벤트 배경 4장

새 이벤트가 다른 장면을 빌려 쓰고 있어요. 아래 이름으로 저장한 뒤 `catalog.json`에 등록하면 바뀌어요: `public/art-v3/backgrounds/<id>.png` (4:3, 캐릭터 없음, 가운데 아래 비우기).

```text
Each image: wide 4:3 pixel-art background plate, no main character, lower-center kept empty for a composited character, no lettering.
1. isac — indoor sports arena for an idol athletics championship: red rubber running track with white lanes in the foreground, archery targets at the far end, cheering fandom sections in the stands with colored balloons and lightsticks, broadcast cameras on cranes. (지금은 challenge 장면을 빌려 씀)
2. sns-open — cozy dorm room corner at night: a smartphone propped on a small ring-light tripod facing the viewer, soft pastel LED strip, posters without text, a laptop showing an abstract social feed with heart icons only. (지금은 livestream 장면을 빌려 씀)
3. military-band — military band stage at a base festival: a modest outdoor stage with green camouflage drapery, brass instruments on stands, rows of soldiers in olive uniforms seated as small figures seen from behind, warm evening sky. (남성 군악대 복무 · 지금은 military 정문 장면을 빌려 씀)
4. practice — trainee practice room late at night: mirrored wall reflecting a single bright ceiling light, scuffed wooden floor, water bottles and a towel on the floor, a wall clock showing late hour without numerals. (평가 올인 선택지 · 카탈로그에 없어 rest로 대체 중)
```

---

## 5) 군악대 남성 프레임 (9명 × 2)

4번 `military-band` 배경에 올릴 남성 아바타(3·4·5·12–17) 프레임이에요. 저장: `public/art-v4/characters/avatar-<N>/military-band/01.png`, `02.png`. 레퍼런스는 각 아바타의 기본 서 있는 프레임.

```text
Use case: identity-preserve game character animation frames. Edit the supplied isolated avatar reference. Horizontal strip of 2 frames, same scale, same foot baseline, full body cute crisp pixel-art chibi, transparent background, no shadow, no text.
Preserve face identity, eye color, hairstyle and hair color. Hair is trimmed shorter and neat (military regulation), no hair accessory.
Outfit: olive-green military band dress uniform with a small gold braid and a garrison cap.
Identity: [AVATAR]
Frames: (1) standing at attention holding a trumpet at the chest, (2) playing the trumpet raised with cheeks puffed.
```

---

## 6) 카탈로그 등록

- 1번은 파일 덮어쓰기만으로 끝나요.
- 2·3·5번은 `lib/art/catalog.json`의 해당 장면 `avatars`에 `"6": [...]`처럼 번호를 추가해요. `height`/`x`/`y`는 기존 항목과 같은 방식(알파 바운딩 박스 기준)이고, 기존 제작본의 `awards-production/*.json` 스크립트를 그대로 돌리면 자동으로 채워져요.
- 4번은 `scenes`에 새 id로 `background`와 빈 `avatars: {}`를 넣고, `lib/game/events/idol.ts`의 `scene: "challenge"`(아육대) · `scene: "livestream"`(인스타 개설) · 군악대 선택지의 장면을 새 id로 바꿔주면 돼요. `practice`는 이미 코드에서 쓰고 있어서 등록만 하면 돼요.
- 3번 표정 프레임은 `EventArt`의 `mood` 뱃지를 프레임 교체로 바꾸는 작은 코드 수정이 같이 필요해요. 이미지가 준비되면 말해 주세요.
