# ENCORE v3 이미지 에셋

2026-10-31 · 이미지 전용 작업 · built-in image_gen 사용

이 폴더에는 앱 코드·게임 규칙·가격·상점 로직·배포 설정의 변경이 없습니다. 기존 `/scenes/*.webp`와 `/sprites.webp`도 보존했습니다. 이번 작업에서는 앱의 이미지 경로 연결 및 애니메이션 재생 코드를 추가하지 않았습니다.

## 구성

| 분류 | 내용 | 기본 경로 |
|---|---|---|
| 이벤트 배경 | 32종, 모든 인물·관객·거울/화면 속 인물 제거 | `backgrounds/<scene>.png` |
| 캐릭터 | 기존 선택 순서 6종 × 7프레임 = 42장 (폐안 포함) | `characters/avatar-<0..5>/<action>-<01..02>.png` |
| 아이템 | 12종 × 2변형 = 24장 | `items/<item>-<01..02>.png` |

기존 92장에 완전 폐안 깜빡임 6장을 추가해 총 98개의 고유 제작 이미지입니다. 인이어의 옛 파일명 `wireless-in-ear-01/02.png`는 동일 이미지의 호환용 사본입니다. 실제 묘사된 장비는 케이블형 인이어 모니터이며 정식 카탈로그 이름은 `in-ear-monitor`입니다.

## 배경

배경은 1536×1024 PNG입니다. 캐릭터가 그려져 있지 않으므로 별도 캐릭터를 겹쳐 사용합니다. 중앙 하단 동선을 비웠고, 거울·모니터·포스터에 남은 인물도 제거했습니다. 기존 scene ID와 같은 이름을 사용합니다. 배경만 단독으로 원래 경로에 덮어쓰면 캐릭터가 나타나지 않으므로, 원본은 그대로 두었습니다.

장면: advert, album, audition, awards, birthday, challenge, clinic, coachella, contract, dance, debut, donation, dorm, drama, family, fansign, festival, livestream, mc, military-concert, military, press, rest, retirement, school, songwriting, survival, tour, variety, vocal, wedding, youtube.

- 춤·챌린지·퍼포먼스 장면: dance 프레임
- 노래·녹음·콘서트 장면: sing 프레임
- 대화·휴식·계약·학교 등: idle 프레임
- 합성 시 기본 발 위치 제안: 배경 가로 50%, 세로 86%. 장면별 가구를 보고 조정합니다.
- 캐릭터의 초기 표시 높이 제안: 배경 높이의 50~55%. 이는 구현값이 아니라 합성 참고값입니다.

## 캐릭터 프레임

한 파일에 한 캐릭터, 한 동작만 있는 실제 알파 투명 PNG입니다. 기존 시트를 자르거나 이웃 캐릭터를 포함하지 않았습니다. 캐릭터 번호는 기존 선택 순서와 같습니다.

| 번호 | 식별 |
|---|---|
| 0 | 검정 단발 · 보라 꽃핀 · 라일락 가디건 |
| 1 | 갈색 단발 · 음표핀 · 민트 후드 |
| 2 | 긴 갈색 머리 · 꽃핀 · 분홍 의상 |
| 3 | 검정 머리 · 별핀 · 파랑 바시티 재킷 |
| 4 | 금발 · 별핀 · 노랑 스웨터 |
| 5 | 은발 · 음표핀 · 청록 재킷 |

| 동작 | 파일 순서 | 재생 참고 |
|---|---|---|
| 대기/숨쉬기 | idle-01 → idle-02 | 각 450ms, 반복 |
| 노래 | sing-01 → sing-02 | 각 250ms, 반복 |
| 춤 | dance-01 → dance-02 | 각 280ms, 반복 |

위 시간은 재생 메타데이터 제안입니다. 앱에 타이머나 렌더러를 추가하지 않았습니다. 프레임은 같은 1254×1254 캔버스이며 완성된 이미지 자체를 표시합니다. `background-size:600%` 또는 CSS 이미지 자르기를 사용하지 않습니다. 실제 알파 영역과 발 기준점은 `manifest.json`에 기록합니다. 프레임 간 여백/자세 차이가 있어 발 기준점과 동일한 표시 크기를 맞춰 연결해야 합니다.

## 아이템

모두 1254×1254 투명 PNG입니다. 01/02는 각각 독립적인 색상·형태 변형이며 능력치나 가격을 바꾸지 않습니다.

| ID | 이름 |
|---|---|
| studio-microphone | 홈 레코딩 마이크 |
| headphones | 스튜디오 헤드폰 |
| in-ear-monitor | 무대용 인이어 모니터 |
| midi-keyboard | 작곡용 MIDI 키보드 |
| audio-interface | 오디오 인터페이스 |
| dance-sneakers | 안무 연습화 |
| full-length-mirror | 전신 연습 거울 |
| ring-light | 라이브 촬영 조명 |
| vlog-camera | 브이로그 카메라 |
| vocal-booth | 개인 보컬 부스 |
| practice-room-pass | 연습실 장기 이용권 |
| songwriter-notebook | 작곡 노트 |

## 제작 기록

최종 프롬프트와 원본 참고 이미지 경로는 [BACKGROUNDS-A.md](BACKGROUNDS-A.md), [BACKGROUNDS-B.md](BACKGROUNDS-B.md), [CHARACTERS.md](CHARACTERS.md), [CHARACTERS-A.md](CHARACTERS-A.md), [CHARACTERS-B.md](CHARACTERS-B.md), [CHARACTERS-C-DANCE.md](CHARACTERS-C-DANCE.md), [ITEMS.md](ITEMS.md)에 분담별로 기록합니다. 앱 코드 검증 대신 에셋의 파일 존재·PNG 손상 여부·실제 크기·투명도·가장자리 잘림을 확인합니다.


## 2026-11-03 눈 깜빡임 수정

`characters/avatar-<0..5>/blink-closed.png` 6장을 내장 image_gen으로 추가했습니다. 두 눈 모두 완전히 감긴 이미지이며, 생성 원본과 자세·의상·입 모양을 유지했습니다. 기존 반쯤 감긴 `idle-02.png`는 이력으로 보존하되 기본 대기 애니메이션에서 사용하지 않습니다. 현재 앱의 대기는 `idle-01 → blink-closed`이며 4,074ms 뜸 / 126ms 감음으로 표시합니다. 모션 감소 설정에서는 눈을 뜬 상태로 고정합니다. 정확한 생성 프롬프트와 참조 파일은 [BLINK-PROMPTS.jsonl](BLINK-PROMPTS.jsonl)에 기록했습니다. 초기 제작 당시 코드 미연결 안내는 위의 과거 작업 기록이며, 현재 ENCORE v2에는 이미지가 연결되어 있습니다.
