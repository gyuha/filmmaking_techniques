import type { TechniqueImpl, Vec3 } from './types';
import { SUBJECT_Y, add, clamp, defaultWorld, frame, lerp, noise1, pose, prog, shot, smooth } from './util';

// 8부 카메라·앵글 확장(51~56) · 9부 편집 문법·전환(57~65) · 10부 빛·렌즈·룩(66~71)

const S = (x: number, z = 0, y = SUBJECT_Y): Vec3 => [x, y, z];
const PLAZA_X = 30;
const TOWER: Vec3 = [30, 0, -10];

const T: TechniqueImpl[] = [
  // ── 8부 카메라·앵글 확장 ──────────────────────────
  // 51 스노리캠 — 카메라가 캐릭터 몸에 고정, 세상만 흔들림
  {
    id: 51,
    duration: 6,
    sample: (t) => {
      const x = lerp(-5, 5, t / 6);
      const bob = Math.abs(Math.sin(t * 8)) * 0.14;
      const sway = Math.sin(t * 4) * 0.25;
      const s: Vec3 = [x, SUBJECT_Y + bob, sway];
      const cam = add(s, [1.3, 0.12, 0]);
      return frame(t, [
        shot('몸에 단 카메라', pose(cam, add(s, [0, 0.05, 0]), 62, noise1(t * 2.2, 5) * 7), defaultWorld(t, { subject: { position: s, heading: Math.PI / 2, pose: 'surprised' }, timeOfDay: 0.55 })),
      ]);
    },
  },
  // 52 에어리얼 숏 — 드론처럼 마을 위를 넓게 비행
  {
    id: 52,
    duration: 8,
    props: ['clouds'],
    sample: (t) => {
      const k = smooth(prog(t, 0, 8));
      const p: Vec3 = [lerp(-42, 22, k), lerp(22, 17, k), lerp(26, 8, k)];
      return frame(t, [
        shot('드론', pose(p, [p[0] + 14, 0, p[2] - 18], 55), defaultWorld(t, { subject: { position: S(lerp(-6, 8, k)), heading: Math.PI / 2, pose: 'walk' }, timeOfDay: 0.3, props: { cloudTime: t * 2 } })),
      ]);
    },
  },
  // 53 배럴 롤 — 렌즈 방향을 축으로 한 바퀴
  {
    id: 53,
    duration: 6,
    sample: (t) => {
      const roll = lerp(0, 360, smooth(prog(t, 0.8, 5.2)));
      return frame(t, [shot('회전', pose([0, 1.4, lerp(6.5, 5, t / 6)], [0, 0.9, 0], 50, roll), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'surprised' } }))]);
    },
  },
  // 54 웜즈아이 뷰 — 땅바닥에서 가파르게 올려다봄
  {
    id: 54,
    duration: 6,
    sample: (t) => {
      const cam: Vec3 = [27 + lerp(0.6, 0.2, t / 6), 0.12, -4.4];
      return frame(t, [shot('땅바닥', pose(cam, [28.4, 6.5, -8.6], 75), defaultWorld(t, { subject: { position: S(27.5, -5.3), heading: 0.3, pose: 'happy' } }))]);
    },
  },
  // 55 숏 사이즈 — 익스트림 와이드 → 와이드 → 풀 → 미디엄 → 클로즈업
  {
    id: 55,
    duration: 10,
    sample: (t) => {
      const sizes = [
        { id: '익스트림 와이드', d: 40, y: 9, look: 0.5 },
        { id: '와이드', d: 14, y: 2.5, look: 0.5 },
        { id: '풀 숏', d: 5.5, y: 1.2, look: 0.5 },
        { id: '미디엄 숏', d: 2.6, y: 0.85, look: 0.65 },
        { id: '클로즈업', d: 1.25, y: 0.7, look: 0.65 },
      ];
      const i = Math.min(4, Math.floor(t / 2));
      const c = sizes[i];
      const push = 1 - 0.04 * prog(t, i * 2, i * 2 + 2);
      return frame(t, [shot(c.id, pose([0.15 * c.d * 0.1, c.y, c.d * push], [0, c.look, 0], 45), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'idle' } }))]);
    },
  },
  // 56 설정 숏 — 마을 전경 후 인물로
  {
    id: 56,
    duration: 7,
    sample: (t) => {
      if (t < 3.5) {
        const k = prog(t, 0, 3.5);
        return frame(t, [shot('마을 전경', pose([lerp(-6, 0, k), 25, 60], [0, 0, -5], 40), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'idle' }, timeOfDay: 0.1 }))]);
      }
      const k = prog(t, 3.5, 7);
      return frame(t, [shot('인물', pose([0.6, 1.0, lerp(2.6, 2.2, k)], [0, 0.65, 0], 45), defaultWorld(t, { subject: { position: S(0), heading: 0.2, pose: 'happy' }, timeOfDay: 0.1 }))]);
    },
  },

  // ── 9부 편집 문법·전환 ───────────────────────────
  // 57 180도 규칙 — 축의 한쪽에서만 찍다가 마지막에 넘어감
  {
    id: 57,
    duration: 9,
    props: ['friend', 'axisLine'],
    sample: (t) => {
      const A = S(-1.1);
      const B = S(1.1);
      const shots = [
        { id: '투 숏', end: 2, cam: [0, 1.6, 5.5] as Vec3, look: [0, 0.6, 0] as Vec3, crossed: false },
        { id: 'A 어깨 너머', end: 4, cam: [-2.2, 1.0, 1.0] as Vec3, look: B, crossed: false },
        { id: 'B 어깨 너머', end: 6, cam: [2.2, 1.0, 1.0] as Vec3, look: A, crossed: false },
        { id: '축을 넘음!', end: 9, cam: [0.3, 1.3, -4.6] as Vec3, look: [0, 0.6, 0] as Vec3, crossed: true },
      ];
      const c = shots.find((s) => t < s.end) ?? shots[shots.length - 1];
      return frame(t, [
        shot(
          c.id,
          pose(c.cam, c.look, 45),
          defaultWorld(t, {
            subject: { position: A, heading: Math.PI / 2, pose: 'happy', squash: Math.max(0, Math.sin(t * 9)) * 0.08 },
            props: { partner: B, friendPos: B, friendFacing: -Math.PI / 2, axisCrossed: c.crossed, caption: c.crossed ? '축을 넘어 좌우가 뒤바뀜' : '' },
          }),
        ),
      ]);
    },
  },
  // 58 숏/리버스 숏 — 어깨 너머로 번갈아
  {
    id: 58,
    duration: 8,
    props: ['friend'],
    sample: (t) => {
      const A = S(-1.1);
      const B = S(1.1);
      const i = Math.min(3, Math.floor(t / 2));
      const aTalks = i % 2 === 0;
      const z = lerp(0.8, 0.5, t / 8); // 대화가 깊어질수록 조금씩 다가감
      const cam: Vec3 = aTalks ? [1.9, lerp(1.05, 0.9, t / 8), z] : [-1.9, lerp(1.05, 0.9, t / 8), z];
      const look = aTalks ? A : B;
      return frame(t, [
        shot(
          aTalks ? `A가 말함 ${i + 1}` : `B가 말함 ${i + 1}`,
          pose(cam, look, 40),
          defaultWorld(t, {
            subject: { position: A, heading: Math.PI / 2, pose: aTalks ? 'happy' : 'idle', squash: aTalks ? Math.max(0, Math.sin(t * 10)) * 0.1 : 0 },
            timeOfDay: 0.45,
            props: { partner: B, friendPos: B, friendFacing: -Math.PI / 2, friendTalk: aTalks ? 0 : Math.max(0, Math.sin(t * 10)) * 0.1 },
          }),
        ),
      ]);
    },
  },
  // 59 컷 온 액션 — 문 여는 동작 도중에 컷
  {
    id: 59,
    duration: 6,
    props: ['door'],
    sample: (t) => {
      const progress = smooth(prog(t, 1.5, 4.5));
      const world = defaultWorld(t, { subject: { position: S(0.55, -0.9), heading: Math.PI, pose: 'idle' }, props: { actionProgress: progress } });
      if (t < 3) return frame(t, [shot('먼 숏', pose([3.8, 1.6, 6.5], [0, 1.1, -1.4], 42), world)]);
      return frame(t, [shot('가까운 숏', pose([-1.3, 1.25, 0.9], [0.2, 1.1, -1.5], 50), world)]);
    },
  },
  // 60 아이라인 매치 — 위를 보는 캐릭터 → 그 시선 끝의 풍선
  {
    id: 60,
    duration: 6,
    props: ['balloon'],
    sample: (t) => {
      const balloon: Vec3 = [2.4, 6 + Math.sin(t * 1.5) * 0.15, -4];
      const world = defaultWorld(t, { subject: { position: S(0), heading: 0.4, pose: 'surprised' }, props: { lookTarget: balloon, balloonPos: balloon } });
      if (t < 3) return frame(t, [shot('올려다보는 캐릭터', pose([0.6, 0.55, 2.2], [0, 0.8, 0], 45), world)]);
      const eye: Vec3 = [0.1, 0.75, 0.2];
      return frame(t, [shot('시선 끝', pose(eye, balloon, lerp(40, 30, prog(t, 3, 6))), world)]);
    },
  },
  // 61 쿨레쇼프 효과 — 같은 얼굴, 다른 앞 장면
  {
    id: 61,
    duration: 9,
    props: ['kuleshov'],
    sample: (t) => {
      const i = Math.min(5, Math.floor(t / 1.5));
      const contexts = ['food', 'flower', 'gift'];
      const ctxNames: Record<string, string> = { food: '따뜻한 수프', flower: '시든 꽃', gift: '선물 상자' };
      if (i % 2 === 1) {
        const ctx = contexts[(i - 1) / 2];
        const k = prog(t, i * 1.5, i * 1.5 + 1.5);
        return frame(t, [
          shot(
            ctxNames[ctx],
            pose([20, 1.3, lerp(2.4, 2.1, k)], [20, 0.5, 0], 40),
            defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'idle' }, props: { kind: 'context', context: ctx, hideSubject: true } }),
          ),
        ]);
      }
      return frame(t, [
        shot(`같은 얼굴 ${i / 2 + 1}`, pose([0, 0.65, 1.6], [0, 0.6, 0], 40), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'idle' }, props: { kind: 'face', context: contexts[Math.max(0, i / 2 - 1)] } })),
      ]);
    },
  },
  // 62 인비저블 컷 — 가림막이 화면을 덮는 순간 컷
  {
    id: 62,
    duration: 6,
    props: ['pillar'],
    sample: (t) => {
      const before = t < 3;
      const camX = before ? lerp(-6, -1, t / 3) : lerp(PLAZA_X - 3, PLAZA_X + 2, (t - 3) / 3) - 0.0;
      const pillarX = before ? -1 : PLAZA_X - 3;
      const occlusion = clamp(1 - Math.abs(camX - pillarX) / 1.0);
      return frame(t, [
        shot(
          before ? '골목' : '광장',
          pose([camX, 1.4, 4.2], [camX + 0.8, 1.0, -2], 55),
          defaultWorld(t, {
            subject: { position: before ? S(-2, -0.5) : S(PLAZA_X + 1, -1.5), heading: Math.PI / 2, pose: before ? 'walk' : 'happy' },
            props: { pillarPos: [pillarX, 0, 3.5], occlusion },
          }),
        ),
      ]);
    },
  },
  // 63 J컷·L컷 — 소리가 화면보다 먼저/늦게 넘어감
  {
    id: 63,
    duration: 9,
    props: ['train'],
    sample: (t) => {
      const pic = t < 3 ? 'A' : t < 6 ? 'B' : 'C';
      const audio = t < 2.3 ? 'A' : t < 6.7 ? 'B' : 'C';
      const labels: Record<string, string> = { A: '캐릭터의 말소리', B: '기차 소리', C: '역 안내 방송' };
      const note = audio !== pic ? (audio > pic ? ' (J컷: 다음 장면 소리가 먼저)' : ' (L컷: 이전 장면 소리가 남음)') : '';
      const props = { audio, caption: `♪ ${labels[audio]}${note}`, trainX: pic === 'B' ? lerp(-40, 30, prog(t, 3, 6)) : 10 };
      if (pic === 'A') return frame(t, [shot('A', pose([0.6, 1.0, 2.6], [0, 0.65, 0], 45), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'happy', squash: Math.max(0, Math.sin(t * 10)) * 0.1 }, props }))]);
      if (pic === 'B') return frame(t, [shot('B', pose([8, 2.2, -21], [0, 1.4, -28], 50), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'idle' }, props }))]);
      return frame(t, [shot('C', pose([PLAZA_X - 3, 1.4, -19.5], [PLAZA_X, 1.2, -25], 50), defaultWorld(t, { subject: { position: S(PLAZA_X - 1, -25), heading: 0, pose: 'surprised' }, props }))]);
    },
  },
  // 64 리플 디졸브 — 물결치며 회상으로
  {
    id: 64,
    duration: 7,
    props: ['bigTree'],
    sample: (t) => {
      const now = shot('현재', pose([-1, 1.3, 6], [2.5, 2.8, -1], 50), defaultWorld(t, { subject: { position: S(0.6, 0.3), heading: 1.2, pose: 'idle' }, timeOfDay: 0.12, props: { treeScale: 1 } }));
      const past = shot('어린 시절', pose([0.2, 1.1, 3.6], [2.4, 0.5, -1], 45), defaultWorld(t - 1e6, { subject: { position: [1.5, SUBJECT_Y * 0.7, -0.4], heading: 0.9, pose: 'happy' }, timeOfDay: 0.2, props: { treeScale: 0.22 } }));
      if (t < 2) return frame(t, [now]);
      if (t >= 4.5) return frame(t, [past], { effects: { sepia: 0.75, vignette: 0.6 } });
      const a = smooth(prog(t, 2, 4.5));
      return frame(t, [now, past], { composite: { kind: 'ripple', alpha: a, amp: Math.sin(Math.PI * a) + 0.2 }, effects: { sepia: a * 0.75, vignette: a * 0.6 } });
    },
  },
  // 65 화이트 플래시 — 하얗게 번쩍이며 다른 장소로
  {
    id: 65,
    duration: 6,
    sample: (t) => {
      const flash = clamp(1 - Math.abs(t - 3) / 0.4);
      if (t < 3) return frame(t, [shot('길', pose([lerp(-3, -1, t / 3), 1.4, 6], [0, 0.6, 0], 45), defaultWorld(t, { subject: { position: S(0), heading: 0.3, pose: 'idle' } }))], { effects: { flash } });
      return frame(t, [shot('광장', pose([PLAZA_X - 4, 1.6, lerp(6, 4, (t - 3) / 3)], [PLAZA_X, 3, -8], 50), defaultWorld(t, { subject: { position: S(PLAZA_X - 2, 0), heading: 0, pose: 'happy' }, timeOfDay: 0.4 }))], { effects: { flash } });
    },
  },

  // ── 10부 빛·렌즈·룩 ──────────────────────────────
  // 66 강제 원근법 — 카메라 앞의 캐릭터가 먼 시계탑보다 커 보임
  {
    id: 66,
    duration: 6,
    sample: (t) => {
      const k = smooth(prog(t, 3.4, 5.8));
      const cam: Vec3 = [lerp(26, 33.5, k), lerp(0.6, 2.2, k), lerp(7.6, 6.5, k)];
      const target: Vec3 = [lerp(26.9, 27.8, k), lerp(1.6, 1.4, k), lerp(-4, 0, k)];
      return frame(t, [
        shot(
          k < 0.01 ? '속임수' : '비밀 공개',
          pose(cam, target, 50),
          defaultWorld(t, { subject: { position: [26.25, 0.55, 6.05], heading: 0.2, pose: 'happy' }, props: { landmark: TOWER, landmarkHeight: 10.5 } }),
        ),
      ]);
    },
  },
  // 67 이중 노출 — 캐릭터와 마을 풍경을 겹침
  {
    id: 67,
    duration: 6,
    sample: (t) => {
      const portrait = shot('인물', pose([1.6, 0.7, 0.4], [0, 0.65, 0], 35), defaultWorld(t, { subject: { position: S(0), heading: Math.PI / 2, pose: 'sad' }, timeOfDay: 0.5, props: { sunAzimuth: 2.0 } }));
      const scenery = shot('마을', pose([lerp(-10, -4, t / 6), 6, 12], [0, 3, -10], 50), defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'idle' }, timeOfDay: 0.5, props: { hideSubject: true } }));
      return frame(t, [portrait, scenery], { composite: { kind: 'double', amount: lerp(0, 0.7, smooth(prog(t, 0.6, 2.6))) } });
    },
  },
  // 68 아나모픽 렌즈 — 가로 빛줄기, 타원 보케, 2.39:1
  {
    id: 68,
    duration: 6,
    props: ['bokehLights'],
    sample: (t) => {
      const cam: Vec3 = [lerp(0.6, -0.6, t / 6), 0.9, 2.6];
      return frame(t, [shot('시네마틱', pose(cam, [0, 0.9, -2], 42), defaultWorld(t, { subject: { position: S(0, 0), heading: 0.1, pose: 'idle' }, timeOfDay: 0.52, props: { sunAzimuth: 0.05 } }))], {
        effects: { anamorphic: 1, letterbox: 2.39, flare: 0.7, dof: { focusDistance: 2.2, aperture: 0.8 }, bokeh: 1, colorGrade: 0.3 },
      });
    },
  },
  // 69 하이키·로우키 조명 — 조명만 바꿔 분위기 비교
  {
    id: 69,
    duration: 9,
    sample: (t) => {
      const i = Math.min(2, Math.floor(t / 3));
      const lighting = (['high', 'low', 'silhouette'] as const)[i];
      const names = { high: '하이키', low: '로우키', silhouette: '실루엣' };
      const k = prog(t, i * 3, i * 3 + 3);
      return frame(t, [
        shot(
          names[lighting],
          pose([lerp(0.4, 0.1, k), 0.9, 3.2], [0, 1.0, 0], 45),
          defaultWorld(t, { subject: { position: S(0), heading: 0, pose: lighting === 'high' ? 'happy' : 'idle' }, timeOfDay: lighting === 'silhouette' ? 0.48 : lighting === 'low' ? 0.85 : 0.05, props: { lighting, caption: names[lighting], sunAzimuth: lighting === 'silhouette' ? 0 : 2.6 } }),
        ),
      ]);
    },
  },
  // 70 딥 포커스 — 얕은 심도 → 앞뒤 모두 선명
  {
    id: 70,
    duration: 7,
    props: ['flower'],
    sample: (t) => {
      const cam: Vec3 = [lerp(-1.3, -1.0, t / 7), 0.95, 5.2];
      const flower: Vec3 = [-0.8, 0.8, 4.0];
      const subj = S(0.9, -2.6);
      const ap = t < 3 ? 1 : 1 - prog(t, 3, 3.6);
      const dof = ap > 0.02 ? { focusDistance: Math.hypot(cam[0] - flower[0], cam[1] - flower[1], cam[2] - flower[2]), aperture: ap } : null;
      return frame(t, [shot(dof ? '얕은 심도' : '깊은 심도', pose(cam, [0.4, 0.8, 0], 40), defaultWorld(t, { subject: { position: subj, heading: -0.6, pose: 'happy' }, props: { flower } }))], { effects: { dof } });
    },
  },
  // 71 글리치·VHS 룩
  {
    id: 71,
    duration: 6,
    sample: (t) => {
      const x = lerp(-2.5, 2.5, t / 6);
      return frame(
        t,
        [shot('비디오테이프', pose([x - 1, 1.1, 3.4], [x, 0.7, 0], 50), defaultWorld(t, { subject: { position: S(x, 0, SUBJECT_Y + Math.abs(Math.sin(t * 5)) * 0.3), heading: Math.PI / 2, pose: 'happy' }, timeOfDay: 0.2 }))],
        { effects: { glitch: 1 } },
      );
    },
  },
];

export const EXTRA_TECHNIQUES: TechniqueImpl[] = T;
