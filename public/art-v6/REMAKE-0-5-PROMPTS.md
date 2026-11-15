# 기존 캐릭터 0~5 리메이크 — 새 캐릭터와 같은 비율로

초기 캐릭터 6명(여 0·1·2, 남 3·4·5)은 머리가 크고 몸이 짧은 짧뚱한 비율이라, 나중에 만든 12명(6~17)과 나란히 서면 어색해요. 이 6명을 새 비율로 다시 그려요. 얼굴·머리·헤어핀·평상복 색은 그대로 두고 **몸 비율만** 새 캐릭터에 맞춰요.

## 범위 (캐릭터당 13장, 총 78장)

| 묶음 | 장수 | 파일 이름 |
|---|---|---|
| 기본 포즈·표정 | 6 | `idle-open` · `idle-closed` · `sing` · `dance` · `mood-sad` · `mood-happy` |
| 시상식 7장면 (4프레임 가로 스트립) | 7 | `awards/redcarpet` · `stage` · `seat` · `win` · `cry` · `speech` · `lose` |

그 밖의 이벤트 장면(앨범·투어 등 33개)은 다시 그리지 않아요. 새 캐릭터 12명처럼 기본 포즈로 그려지고, 그룹 장면에서 포즈가 제각각이던 문제도 같이 사라져요. 시상식 객석 의자도 이번 리메이크에서 가는 금색 의자로 통일돼요(QA2 문서의 의자 작업 대신 이걸로 끝나요).

## 레퍼런스 (`public/art-v6/refs/remake/`)

| 파일 | 용도 |
|---|---|
| `avatar-N-identity.png` | 그 캐릭터의 얼굴·머리·헤어핀·옷 (지키는 것) |
| `proportion-female.png` / `proportion-male.png` | 몸 비율 기준 (새 캐릭터 7번 / 13번) |
| `pose-female-awards-<장면>.png` / `pose-male-awards-<장면>.png` | 시상식 4프레임 포즈 기준 (새 캐릭터 8번 / 13번, 가는 금색 의자) |

여자 0·1·2는 `female`, 남자 3·4·5는 `male` 레퍼런스를 써요.

## 생성 설정

모델 `nano_banana_2_1`, `resolution: "2k"`, `use_unlim: true`. 기본 포즈는 `aspect_ratio: "1:1"`, 시상식 스트립은 `"21:9"` 또는 레퍼런스와 같은 3:1에 가장 가까운 값. 무제한이 거절되면 멈추기.

---

## 1단계: 마스터 (`idle-open`)

레퍼런스 순서: ① `avatar-N-identity.png` ② `proportion-<성별>.png`. 4장 뽑아서 하나 고르기.

```text
Redraw the character from image 1 in the body proportions of image 2. Keep EXACTLY from image 1: face shape, eye colour and shape, expression, hairstyle, hair colour, the hair accessory and its position, the outfit, its colours and details, the shoes. Change ONLY the body proportions to match image 2: same head size relative to body, same longer torso and legs, same overall height and slimmer silhouette, same chibi pixel-art rendering and outline weight as image 2. Do not copy image 2's face, hair or clothes.
Pose: relaxed standing pose facing the viewer, arms at the sides, feet together, eyes open.
Full body, centered, character about 84% of the canvas height, nothing cropped. Plain pure white #FFFFFF background, no floor, no shadow, no text.
```

검수: 머리 대 몸 비율이 레퍼런스 ②와 같은가, 헤어핀 위치가 ①과 같은가.

## 2단계: 나머지 기본 5장

레퍼런스: 1단계에서 고른 결과(job_id). 프롬프트는 [캐릭터 프롬프트](HIGGSFIELD-PROMPTS.md) 4번 포즈 블록을 그대로 써요(`idle-closed` · `sing` · `dance` · `mood-sad` · `mood-happy`). 앞에 이 줄만 붙여요.

```text
Same character, same proportions, same scale and same foot position as the reference image. Plain pure white #FFFFFF background.
```

## 3단계: 시상식 7장면

레퍼런스 순서: ① 1단계 마스터(job_id) ② `pose-<성별>-awards-<장면>.png`. 장면마다 한 번씩, 7번.

```text
Horizontal strip of 4 animation frames of the character from image 1, laid out exactly like image 2: same four poses in the same order, same frame spacing, same scale and foot baseline, same props (chair, trophy, microphone) as image 2.
Keep the character from image 1: face, hair, hair accessory and proportions. Outfit: a black formal awards-night outfit with small gold details (an elegant dress for a girl, a tailored suit with a bow tie for a boy) in the same style as image 2.
Do not copy image 2's face or hair. Plain pure white #FFFFFF background, no floor, no text, no extra people.
```

`seat` 장면은 의자가 레퍼런스 ②와 같은 가는 금색 의자인지 꼭 확인해요.

---

## 넣는 곳

```
public/art-v6/inbox/remake/avatar-0/idle-open.png      (… idle-closed, sing, dance, mood-sad, mood-happy)
public/art-v6/inbox/remake/avatar-0/awards/redcarpet.png (… stage, seat, win, cry, speech, lose)
… avatar-5까지
```

넣은 뒤 Claude Code에 "리메이크 연결해줘"라고 하면 아래를 돌려요. 캐릭터 일부만 먼저 넣어도 그 캐릭터만 연결돼요.

```bash
python3 scripts/import-remake.py
```

흰 배경 제거, 기존 규칙에 맞춘 배율·발 위치 정렬, 카탈로그 교체(기본 포즈·표정·시상식 7장면, 옛 장면 그림 해제)를 한 번에 해요.
