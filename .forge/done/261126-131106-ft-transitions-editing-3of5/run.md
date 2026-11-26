# RUN — 3부 장면 전환(17~23) + 4부 편집 기법(24~28) 연출 구현
slug: ft-transitions-editing-3of5

## 작업 단위별 결과
- S1 멀티샷 인프라 — ✅ 작업 1에서 미리 만든 합성 셰이더·다중 리그·타임라인을 그대로 사용(추가 작업 없음)
- S2 17~23 전환(src/techniques/transitions.ts) — ✅ 계획대로. 매치 컷은 달·캐릭터의 화면 크기를 atan(R/d)로 맞춰 계산, 휩 팬은 셔터 누적 모션 블러로 번짐 속 컷
- S3 24~28 편집 + 소품(눈·알람시계·스케이트보드·기차/선로/승강장·친구·시계 바늘·큰 나무) — ⚠ C5 E2E가 26 분할 화면·27 인서트에서 "시간에 따라 화면이 변하지 않음"을 잡아냄 → 두 기법에 천천히 다가가는 카메라 이동 추가. 선로가 두 번째 집 줄과 겹쳐 TRACK_Z를 -24→-28로 이동
- S4 17~28 시각 확인 — ✅ ego-browser 시트(/tmp/ft_ref/uat3/sA.png·sB.png) 검토

## 진행 메모
- 캐릭터 생성 함수를 src/scene/character.ts로 분리(친구 소품이 재사용, 순환 import 방지). 달 위치는 props.moon으로 덮어쓸 수 있게 함

## Rulings
- fg-loop 무인 진행: Workflow 대신 메인 세션 직접 실행
- TDD: config 기본값(off)

## DoD baseline → after
- C3 20 + C4 17~19·21~28: 12 failed → 12 passed (vitest 누적 34 passed) (Measured)
- C5: "#17 변하지 않음"에서 실패 → "#29 변하지 않음"에서 실패(1~28 통과) (Measured)
- C6: 561쌍 → 231쌍(전부 29~50 자리표시자끼리 — 1~28은 서로 모두 다름) (Measured)
- 회귀: C1 build exit 0, C2 green 유지 (Measured)
