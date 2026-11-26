# RUN — 6부 렌즈·빛·색(37~42) + 7부 특수 렌즈와 룩(43~50) 구현 및 전체 E2E 통과
slug: ft-lens-look-5of5

## 작업 단위별 결과
- S1 37~42(src/techniques/look.ts) + 소품(꽃·무거운 추), 기차 재사용 — ✅ 계획대로
- S2 43~49 + 소품(밤거리 줄조명·안개 숲·시장) + 장면 안개(props.fog) — ⚠ 43 보케에서 캐릭터 중심까지 거리로 초점을 잡아 캐릭터가 흐렸음 → 앞 표면(중심-0.45)에 초점. 37도 같은 보정. 보케 표본 24→48, 최대 번짐 22→18px
- S3 50 원테이크(20초, Catmull-Rom 경로, 집 앞→길→광장 크레인 업) — ✅ 계획대로
- S4 전체 통과 — ✅ C1~C6 모두 green(검사 약화 없음)
- S5 37~50 시각 확인 — ⚠ 42 레터박스 카메라가 나무 줄(z 6~8.5) 안에 있어 화면 절반이 가려짐 → z 4.6으로 이동. 시트: /tmp/ft_ref/uat5/sA.png·sB.png·fx.png·f43c.png

## Rulings
- fg-loop 무인 진행: Workflow 대신 메인 세션 직접 실행
- TDD: config 기본값(off)

## DoD baseline → after
- C1 `pnpm build`: exit 0 → exit 0 (Measured)
- C2 data: 5 passed → 5 passed (Measured)
- C3 camera-semantics: 1 failed(50) → 19 passed (Measured)
- C4 effects: 15 failed → 33 passed (Measured)
- C5 E2E: "#37 변하지 않음" 실패 → passed (4.0m) (Measured)
- C6 E2E: 91쌍 실패 → passed (1.2m) (Measured)
