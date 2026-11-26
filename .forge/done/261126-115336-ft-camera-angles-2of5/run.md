# RUN — 1부 카메라 무빙(1~9) + 2부 앵글과 숏(10~16) 연출 구현
slug: ft-camera-angles-2of5

## 작업 단위별 결과
- S1 1~9 카메라 무빙(src/techniques/camera.ts) — ✅ 계획대로. 달리 줌은 피사체 화면 비율이 정확히 일정하도록 화각을 거리에서 역산
- S2 10~15 앵글과 숏 + 그네 소품(src/scene/allProps.ts) — ⚠ 14 익스트림 클로즈업 첫 구현이 너무 가까워 눈동자만 꽉 찬 검은 화면 → 스크린샷 검토로 발견, 거리 2.6·화각 7.5°로 수정
- S3 16 점프 컷 — ✅ 계획대로(고정 카메라, 4컷, 장면 시간 9초씩 점프)
- S4 1~16 시각 확인 — ✅ ego-browser 16장 시트(/tmp/ft_ref/uat2/sheetA.png·sheetB.png) 검토. 감독 시점이 너무 멀고 앞줄 나무에 가려 카메라 모형이 작게 보이던 문제 → 프레이밍 거리 축소·고도 상향

## 진행 메모
- 캐릭터 표정·동작(놀람/슬픔/기쁨 눈동자, 눈물, 걸음 흔들림)을 Town.applyWorld의 시각 효과로 추가(기법 상태값은 불변)

## Rulings
- fg-loop 무인 진행: Workflow 대신 메인 세션 직접 실행(작업 1과 같은 이유)
- TDD: config 기본값(off)

## DoD baseline → after
- C3 1~15 (camera-semantics 1부·2부): 15 failed → 15 passed (Measured, vitest -t)
- C4 16 점프 컷: failed → passed (Measured)
- 회귀: C1 pnpm build exit 0 유지, C2 5 passed 유지 (Measured)
- 1~16 스크린샷 검토 완료 (Measured)
