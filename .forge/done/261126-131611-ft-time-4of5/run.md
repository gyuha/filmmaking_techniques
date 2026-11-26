# RUN — 5부 시간(29~36) 연출 구현
slug: ft-time-4of5

## 작업 단위별 결과
- S1 장면 시간/카메라 시간 분리 — ✅ 계약(world.sceneTime + frame.timeScale)은 작업 1에서 이미 마련, 속도 그래프도 타임라인에 이미 있음. 가변 속도용 적분 함수 integrate() 추가
- S2 29~36 구현(src/techniques/time.ts) + 소품(분수·구름·화분/담장·장난감 블록) — ✅ 8개 단위 테스트가 첫 구현에서 통과
- S3 29~36 시각 확인 — ⚠ 30 타임랩스 카메라가 앞줄 나무·가로등에 가려져 길가(25.5, 1.6, 3.4)로 이동. 시트: /tmp/ft_ref/uat4/s.png · c30b.png

## Rulings
- fg-loop 무인 진행: Workflow 대신 메인 세션 직접 실행
- TDD: config 기본값(off)

## DoD baseline → after
- C3 35 + C4 29~34·36: 8 failed → 8 passed (vitest 누적 42 passed) (Measured)
- C5: "#29 변하지 않음" → "#37 변하지 않음"(1~36 통과) (Measured)
- C6: 231쌍 → 91쌍(전부 37~50 자리표시자끼리) (Measured)
- 회귀: C1 exit 0, C2 green 유지 (Measured)
