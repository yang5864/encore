# 캐릭터 고퀄리티 리메이크 — Higgsfield 프롬프트 (Claude 채팅용)

Claude 채팅에 Higgsfield MCP를 연결하고 무제한 체험으로 뽑는 문서예요. Claude Code에서는 무제한이 막혀 있어서 생성은 채팅에서 하고, 받은 이미지를 `inbox` 폴더에 넣어 주면 배경 제거·정렬·게임 연결·배포는 Claude Code에서 처리해요.

## 범위

18명 × 기본 6장 = **108장**. 게임 모든 장면의 기본 동작과 표정이 이 6장에서 나와요.

| 파일 이름 | 쓰이는 곳 | 만드는 방법 |
|---|---|---|
| `idle-open.png` | 대시보드 프로필, 장면 전용 동작이 없는 모든 이벤트 | **마스터**. 기존 이미지를 레퍼런스로 새로 생성 |
| `idle-closed.png` | 눈 깜빡임 (idle과 교차 재생) | 마스터를 편집: 눈만 감기 |
| `sing.png` | 앨범·녹음·공연·투어 | 마스터를 레퍼런스로 포즈만 변경 |
| `dance.png` | 댄스·챌린지·아육대 | 마스터를 레퍼런스로 포즈만 변경 |
| `mood-sad.png` | 논란·부상·탈락 등 나쁜 이벤트 | 마스터를 편집: 표정만 울상 |
| `mood-happy.png` | 수상·1위 등 좋은 이벤트 | 마스터를 편집: 표정만 활짝 |

레퍼런스 이미지는 [refs](refs/) 폴더에 `avatar-0.png`~`avatar-17.png`로 모아 뒀어요. 채팅에 첨부해서 올리면 돼요.

시상식 의상·군악대 같은 장면별 의상(약 400장)은 이 6장이 확정된 뒤 2단계로 진행해요. 기본 6장의 화풍이 정해져야 장면 의상도 같은 화풍으로 맞출 수 있어요.

---

## 1. Claude 채팅에 처음 붙여넣을 지시문

새 채팅을 열고, 아래 지시문과 함께 `refs/avatar-0.png`를 첨부해서 보내세요. 한 채팅에서 캐릭터 2~3명씩 진행하는 게 안정적이에요.

```text
Higgsfield MCP로 내 모바일 게임(K-pop 아이돌 육성 게임)의 캐릭터 아트를 고퀄리티로 다시 만들 거야.
첨부한 이미지는 지금 게임에 쓰는 캐릭터야. 이 캐릭터의 정체성(머리 모양·머리색·눈·헤어 액세서리·의상 색)은 그대로 두고, 그림 품질만 끌어올리는 게 목표야.

규칙:
- 모델: nano_banana_2_1, resolution "2k", aspect_ratio "1:1", use_unlim: true. 무제한이 거절되면 크레딧으로 넘어가지 말고 멈춰서 나한테 알려줘.
- 첨부 이미지는 media_upload_widget으로 올려서 image_references로 써.
- 순서: (1) 마스터 idle-open을 count 4로 뽑아서 보여줘 → 내가 하나 고르면 (2) 그 결과의 job_id를 레퍼런스로 나머지 5장(idle-closed, sing, dance, mood-sad, mood-happy)을 만들어줘. 마스터 확정 전에는 다른 포즈를 만들지 마.
- 프롬프트는 아래 [공통 스타일] + [정체성] + [포즈] 세 블록을 순서대로 이어 붙여서 써. 블록 문구를 바꾸지 마.
- 결과마다 파일 이름(avatar-N/idle-open.png 같은 형식)과 다운로드 링크를 표로 정리해줘.

[공통 스타일]
(문서 2번 블록 붙여넣기)

[정체성]
(문서 3번 표에서 이 캐릭터 문구 붙여넣기)

[포즈]
(문서 4번에서 해당 포즈 문구 붙여넣기)
```

> 실제로 보낼 때는 괄호 부분을 아래 블록으로 바꿔서 한 번에 보내세요. 아바타 0번용 완성본은 6번에 있어요.

---

## 2. 공통 스타일 블록 (모든 프롬프트 맨 앞)

```text
High-quality pixel-art game character, cute chibi K-pop idol, polished 32-bit era sprite quality with refined shading. Exactly ONE character, full body, front view, standing centered, head-to-body ratio about 1:1.6 (big head, small body), large sparkling eyes with two white highlights, soft blush on cheeks.
Clean crisp pixel clusters, consistent 1-pixel dark outline around the whole silhouette, gentle 3-step cel shading with soft rim light, limited harmonious palette, no anti-aliased blur, no painterly brush texture, no photorealism, no 3D render look.
Composition: square canvas, character occupies about 84% of canvas height, feet on one horizontal baseline at about 93% of canvas height, generous empty margin on all sides, nothing cropped (hair, hands and shoes fully visible).
Background: perfectly flat pure white #FFFFFF, no floor, no shadow, no gradient, no props, no scenery.
No text, no logo, no watermark, no border, no sprite sheet, no extra characters, no duplicate body.
Match the identity, hairstyle, hair accessory and outfit colors of the reference image exactly; improve only rendering quality.
```

---

## 3. 정체성 블록 (캐릭터별)

| N | 성별 | 레퍼런스 | 정체성 문구 |
|---|---|---|---|
| 0 | 여 | `refs/avatar-0.png` | Character: girl with glossy black chin-length bob and straight blunt bangs, lilac ribbon-flower hair clip with a small dangling gem on the right side, big warm brown eyes, cheerful open smile. Outfit: lilac knit cardigan with tiny cream flower embroidery over a white collared blouse with a black ribbon tie, black pleated mini skirt, white socks with lilac stripe, black Mary Jane shoes. |
| 1 | 여 | `refs/avatar-1.png` | Character: girl with fluffy medium-length brown hair with soft side-swept bangs, mint-green music-note hair clip on the right side, big brown eyes, bright open smile. Outfit: mint-green zip-up hoodie jacket over a white tee, white shorts, white socks, mint-and-white sneakers. |
| 2 | 여 | `refs/avatar-2.png` | Character: girl with long wavy chestnut-brown hair past the shoulders, pink cherry-blossom hair clip on the right side, big brown eyes, sweet open smile. Outfit: peach-pink cropped cardigan with a ribbon over a frilled pink blouse, pink pleated skirt with white lace trim, white socks, pink Mary Jane shoes. |
| 3 | 남 | `refs/avatar-3.png` | Character: boy with black textured medium-short hair with a center-parted fringe, light-blue star hair clip on the right side, big dark-brown eyes, friendly open smile. Outfit: royal-blue varsity jacket with white sleeves and a small gold star patch, white tee, black wide trousers, blue-and-white sneakers. |
| 4 | 남 | `refs/avatar-4.png` | Character: boy with fluffy golden-blond layered hair swept to the side, yellow star hair clip on the right side, big brown eyes, bright open smile. Outfit: butter-yellow knit V-neck sweater with a small star over a white collared shirt, cream chino trousers with a chain, yellow sneakers. |
| 5 | 남 | `refs/avatar-5.png` | Character: boy with silver-lavender tousled layered hair, teal music-note hair clip on the right side, big gray-green eyes, gentle open smile. Outfit: teal denim jacket over a white tee with a silver pendant necklace, black slim trousers with a silver wallet chain, teal-and-white sneakers. |
| 6 | 여 | `refs/avatar-6.png` | Character: girl with ink-black waist-length straight hime-cut hair with blunt cheek-length side locks and no fringe covering the forehead, cool almond cat eyes in deep brown, straight brows, tiny confident closed-mouth smile, jade geometric barrette on one side. Outfit: jade-green cropped jacket over a cream high-neck top, black tailored wide-leg trousers, white chunky sneakers. |
| 7 | 여 | `refs/avatar-7.png` | Character: girl with dusty rose-pink hair in one long loose side braid over the shoulder, swept side part, big round warm amber eyes, bright bunny-like smile, one tiny cheek beauty mark, small burgundy ribbon at the braid end. Outfit: burgundy cardigan over a cream blouse, charcoal pleated knee-length skirt, ankle socks, burgundy loafers. |
| 8 | 여 | `refs/avatar-8.png` | Character: girl with rich copper-orange hair in a high swinging ponytail with two thin face-framing wisps, upturned fox-shaped brown eyes, gently arched brows, cheeky toothy grin, black ponytail cuff. Outfit: orange sporty zip jacket over a white tee, dark navy cargo trousers, orange-and-white trainers. |
| 9 | 여 | `refs/avatar-9.png` | Character: girl with a very short jet-black asymmetrical pixie cut, one side tucked behind the ear, thin silver oval eyeglasses over cool gray-brown eyes, strong straight eyebrows, small composed closed-mouth smile. Outfit: slate-gray short blazer over a soft lavender turtleneck, tailored charcoal shorts over opaque tights, black lace-up ankle boots. |
| 10 | 여 | `refs/avatar-10.png` | Character: girl with dark chocolate-brown curly hair in two compact high puff buns with airy curly forehead wisps, round dark green-brown eyes with gentle downturned corners, broad sunny smile, subtle freckles, cream fabric scrunchies. Outfit: butter-yellow oversized varsity jacket, denim overalls with straight legs, cream canvas sneakers. |
| 11 | 여 | `refs/avatar-11.png` | Character: girl with icy platinum-blond waist-length straight hair and a thick blunt eyebrow-length fringe, slightly elongated violet-brown eyes, delicate low brows, tiny gentle reserved smile, two narrow black ribbon ties near the temples. Outfit: powder-blue knit vest over a white long-sleeve blouse, navy A-line knee-length skirt, white socks, blue Mary Jane shoes. |
| 12 | 남 | `refs/avatar-12.png` | Character: boy with a sandy-blond medium-long layered wolf cut reaching the nape, swept-back front with long side layers, forehead visible, slanted hazel-brown eyes, bold eyebrows, crooked confident smile, tiny silver ear cuff. Outfit: cream denim jacket with a black collar, plain charcoal tee, black slim cargo pants, chunky black sneakers. |
| 13 | 남 | `refs/avatar-13.png` | Character: boy with warm chestnut-brown fluffy curly hair and a soft rounded curly fringe, large soft drooping puppy eyes in amber brown, thick softly curved brows, friendly dimpled smile. Outfit: forest-green varsity jacket, cream crewneck shirt, beige straight trousers, green-and-white low-top sneakers. |
| 14 | 남 | `refs/avatar-14.png` | Character: boy with a neat black undercut, short straight textured top and tidy short fringe, clear translucent rectangular glasses over charcoal-brown eyes, straight brows, calm subtle smile. Outfit: lavender oversized button-up overshirt over a white tee, charcoal tapered pants, clean white sneakers. |
| 15 | 남 | `refs/avatar-15.png` | Character: boy with deep navy-blue chin-length asymmetrical layered hair, one longer strand on one side and the other side tucked behind the ear, angular cat eyes in dark brown, sharp brows, playful tiny smirk, small black ear stud. Outfit: wine-red cropped bomber jacket over a charcoal high-neck tee, black wide-leg trousers, burgundy platform sneakers. |
| 16 | 남 | `refs/avatar-16.png` | Character: boy with warm auburn-copper short swept-back hair with subtle shaved sides, forehead fully visible, broad friendly olive-brown eyes, bold upward brows, warm toothy smile, a few faint nose freckles. Outfit: navy track jacket with a cream stripe, white tee, olive cargo pants, navy running shoes. |
| 17 | 남 | `refs/avatar-17.png` | Character: boy with an ash-lavender short two-block haircut, neat airy straight fringe and dark short sides, elongated dark-brown fox eyes, slim brows, small shy closed-mouth smile, one small silver hoop earring. Outfit: dusty-pink unstructured cardigan over a black crewneck, slate wide-leg jeans, cream sneakers with black accents. |

---

## 4. 포즈 블록

**마스터** — 레퍼런스: `refs/avatar-N.png`

```text
Pose (idle-open): relaxed standing pose facing the viewer, arms naturally at the sides with hands slightly away from the body, feet together, eyes fully open, cheerful expression from the identity description.
```

**나머지 5장** — 레퍼런스: 확정한 마스터의 job_id. 모두 "마스터와 같은 캐릭터, 같은 크기, 같은 발 위치"가 핵심이에요.

```text
Pose (idle-closed): EDIT the reference image. Change ONLY both eyes: lids fully closed as soft natural curves, no visible iris or white. Keep the exact same face, mouth, hair, accessories, outfit, pose, size, position and canvas.
```

```text
Pose (sing): same character as the reference, same scale and same foot baseline. Holding a handheld wireless microphone close to the mouth with the right hand, left arm opened gracefully to the side, eyes softly closed in a happy singing expression, no floating music notes or sparkle effects. Same outfit.
```

```text
Pose (dance): same character as the reference, same scale and same foot baseline. Energetic K-pop dance pose: one arm raised high with a pointing hand, the other arm bent at the waist, one knee bent with the weight on the other leg, hair and clothes slightly swinging, confident smile. Both feet stay on the baseline. Same outfit.
```

```text
Pose (mood-sad): EDIT the reference image. Change ONLY the facial expression: downturned eyebrows, glistening lowered eyes, small wobbling frown, one tiny tear drop at the outer corner of one eye, slightly flushed cheeks. Keep everything else identical.
```

```text
Pose (mood-happy): EDIT the reference image. Change ONLY the facial expression: eyes curved into bright crescents, big open smile showing a hint of teeth, raised eyebrows, rosy cheeks. Keep everything else identical, no added sparkles or effects.
```

---

## 5. 받은 이미지 넣는 곳

다운로드한 이미지를 아래처럼 넣어 주세요. 파일 이름만 맞으면 배경 제거, 발 위치 정렬, 크기 맞춤, 카탈로그 등록은 Claude Code가 해요.

```
encore-v2/public/art-v6/inbox/avatar-0/idle-open.png
encore-v2/public/art-v6/inbox/avatar-0/idle-closed.png
encore-v2/public/art-v6/inbox/avatar-0/sing.png
encore-v2/public/art-v6/inbox/avatar-0/dance.png
encore-v2/public/art-v6/inbox/avatar-0/mood-sad.png
encore-v2/public/art-v6/inbox/avatar-0/mood-happy.png
… avatar-17까지
```

배경은 흰색이어도 괜찮아요. 캐릭터 외곽선이 닫혀 있으면 가장자리부터 흰색을 지워서 투명하게 만들어요. 일부만 먼저 넣어도 되고, 그 캐릭터만 먼저 게임에 반영할 수 있어요.

---

## 6. 아바타 0번 완성 프롬프트 (그대로 복사)

채팅에 `refs/avatar-0.png`를 첨부하고 1번 지시문 뒤에 붙여 보내세요.

```text
High-quality pixel-art game character, cute chibi K-pop idol, polished 32-bit era sprite quality with refined shading. Exactly ONE character, full body, front view, standing centered, head-to-body ratio about 1:1.6 (big head, small body), large sparkling eyes with two white highlights, soft blush on cheeks.
Clean crisp pixel clusters, consistent 1-pixel dark outline around the whole silhouette, gentle 3-step cel shading with soft rim light, limited harmonious palette, no anti-aliased blur, no painterly brush texture, no photorealism, no 3D render look.
Composition: square canvas, character occupies about 84% of canvas height, feet on one horizontal baseline at about 93% of canvas height, generous empty margin on all sides, nothing cropped (hair, hands and shoes fully visible).
Background: perfectly flat pure white #FFFFFF, no floor, no shadow, no gradient, no props, no scenery.
No text, no logo, no watermark, no border, no sprite sheet, no extra characters, no duplicate body.
Match the identity, hairstyle, hair accessory and outfit colors of the reference image exactly; improve only rendering quality.
Character: girl with glossy black chin-length bob and straight blunt bangs, lilac ribbon-flower hair clip with a small dangling gem on the right side, big warm brown eyes, cheerful open smile. Outfit: lilac knit cardigan with tiny cream flower embroidery over a white collared blouse with a black ribbon tie, black pleated mini skirt, white socks with lilac stripe, black Mary Jane shoes.
Pose (idle-open): relaxed standing pose facing the viewer, arms naturally at the sides with hands slightly away from the body, feet together, eyes fully open, cheerful expression from the identity description.
```

---

## 7. 검수 체크리스트 (마스터 고를 때)

- 레퍼런스와 머리 모양·머리색·헤어 액세서리 위치가 같은가
- 머리, 손, 신발이 잘리지 않았는가
- 배경이 완전히 흰색이고 바닥 그림자가 없는가
- 외곽선이 끊기지 않았는가 (끊기면 배경 제거 때 옷 안쪽 흰색까지 지워져요)
- 다른 캐릭터들과 머리:몸 비율이 비슷한가 (첫 2~3명을 뽑은 뒤 나란히 놓고 비교해 보세요)

## 8. 참고

- 무제한은 Nano Banana 2/2.1, GPT Image 2·2.5·2.6(low·medium 품질만), Seedream 5 Pro에 적용되고 최대 2K예요.
- 체험은 3일 뒤 Ultra 유료 구독(첫 달 $79, 이후 $129)으로 자동 전환돼요. 원하지 않으면 채팅에서 "cancel auto-renewal"이라고 말해 자동 갱신을 꺼 두세요.
