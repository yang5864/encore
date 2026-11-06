# 베타 QA 추가 이미지 제작본

기준 문서: [QA-ART-PROMPTS.md](QA-ART-PROMPTS.md)

총 **402장**의 최종 PNG를 제작했습니다. 캐릭터의 원본 가로 스트립 93장은 별도로 보관합니다.

| 종류 | 수량 | 저장 경로 |
|---|---:|---|
| 관객이 있는 시상식 배경 교체 | 8 | `public/art-v3/backgrounds/awards-*.png` |
| 새 이벤트 배경 | 4 | `public/art-v3/backgrounds/{isac,sns-open,military-band,practice}.png` |
| 새 아바타 시상식 동작 | 336 | `public/art-v4/characters/avatar-{6..17}/awards-<scene>/{01..04}.png` |
| 울상·활짝 표정 | 36 | `public/art-v5/characters/avatar-{0..17}/mood-{sad,happy}.png` |
| 남성 군악대 동작 | 18 | `public/art-v4/characters/avatar-{3,4,5,12..17}/military-band/{01,02}.png` |

## 미리보기와 제작 기록

- [전체 이미지 미리보기](qa-preview.html): 배경, 표정, 아바타별 시상식 7장면, 군악대 스트립.
- [최종 이미지 목록·검수 결과](QA-ART-MANIFEST.json): 파일별 치수·알파·여백·해시 및 누락 검사.
- [카탈로그 연결용 데이터](QA-CATALOG-PATCH.json): 장면별 URL과 height/x/y, 표정 교체용 데이터. 실제 런타임 카탈로그에는 병합하지 않았습니다.
- [생성 기록](QA-GENERATION.jsonl): 프롬프트, 레퍼런스, 생성 원본 경로, 최종 파일 목록.
- [제작 작업 목록](qa-production/jobs.json), [작업별 기록](qa-production/records/), [생성 시도별 기록](qa-production/attempts/).
- 캐릭터 원본 스트립: `public/art-v5/qa-sheets/avatar-<N>/<scene>.png`.

이미지는 내장 imagegen으로 생성·수정했습니다. 배경은 1448×1086의 4:3 이미지입니다. 캐릭터는 투명 알파 PNG이며, 문서에 지정된 가로 스트립을 같은 너비로 나누어 저장했습니다. 같은 장면의 프레임에는 공통 크기와 바닥 기준점을 사용하도록 연결 데이터를 준비했습니다. 표정은 각 기본 캐릭터와 같은 캔버스 크기로 생성했습니다.

군악대는 남성 9명만 제작했습니다. 이전 요청의 군 복무 묘사에 맞춰 짧은 어두운 모근의 머리와 낮게 쓴 모자로 정리했습니다. 군악대 모자는 이번 문서의 garrison cap 지시를 따릅니다.

## 적용 범위

기존 시상식 배경 8장은 같은 파일 경로에 교체했습니다. 이전 파일은 프로젝트의 `art-archive/qa-before-20261106/`에 보관했습니다.

새 이미지와 연결용 데이터는 준비되어 있습니다. 앱 코드, `lib/art/catalog.json`, 이벤트 장면 연결, 표정 전환 로직은 변경하지 않았습니다. 커밋·푸시·배포는 수행하지 않았습니다.
