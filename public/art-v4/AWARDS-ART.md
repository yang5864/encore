# 시상식 이미지 제작본

[AWARDS-PROMPTS.md](AWARDS-PROMPTS.md)를 기준으로 8개 상황의 배경과 4단계 동작을 제작했습니다.

- 배경 8장: `../art-v3/backgrounds/awards-*.png` (4:3, 인물 없음)
- 기존 캐릭터 6명 × 7개 상황 × 4동작: 168장
- 별도 성인 진행자 × 발표 4동작: 4장
- 최종 이미지 총 180장, 원본 4동작 시트 43장 별도 보관
- 개별 프레임: `characters/avatar-{0..5}/awards-{상황}/01.png`–`04.png`
- 발표 진행자: `characters/presenter/awards-announce/01.png`–`04.png`
- 원본 시트: `awards-sheets/`

[시상식 미리보기](awards-preview.html) · [상세 목록](AWARDS-MANIFEST.json) · [연결용 카탈로그](AWARDS-CATALOG.json)

상황: 레드카펫, 공연, 객석 대기, 수상자 발표, 수상 확정, 감격, 수상 소감, 동료에게 박수.

## 제작 기록과 검증

built-in image_gen을 사용했습니다. 전체 프롬프트와 보정 요청은 [AWARDS-GENERATION.jsonl](AWARDS-GENERATION.jsonl)에, 작업별 참조·원본·저장 경로와 프레임 정보는 `awards-production/*.json`에 보관했습니다. 교체 전 시트는 프로젝트의 `art-archive/awards-background-repair/`에 보관했습니다.

4동작 시트를 등분하여 각 프레임을 저장했습니다. 같은 시트의 프레임은 공통 크기 기준과 발 위치 기준을 사용하여 앉기·점프 동작의 크기 변화가 임의로 상쇄되지 않게 했습니다. 모든 프레임의 투명도와 경계 잘림, 시트별 4개 동작의 파일 차이를 검사했습니다. 미리보기의 이미지 51개도 모두 정상 로드했습니다.

## 실행 연결 상태

이미지 제작만 완료했습니다. 기존 실행용 카탈로그는 수정하지 않았습니다. 현재 ArtFrames 컴포넌트는 2프레임 로딩을 전제로 하므로, 별도 AWARDS-CATALOG.json의 4프레임을 게임에 연결하려면 해당 로딩·재생 처리도 함께 확장해야 합니다. 원본 프롬프트 문서의 4프레임 자동 재생 설명과 실제 코드가 다른 점을 반영한 상태입니다.

발표 장면은 플레이어 대신 별도의 성인 진행자가 등장합니다. 새로 추가한 캐릭터 ID 6–17의 시상식 의상은 이 제작본에 포함되지 않습니다.
