import type { TechniqueImpl, Vec3 } from './types';
import { SUBJECT_Y, add, defaultWorld, dist, frame, lerp, noise1, pose, prog, shot, smooth } from './util';

// 6부 렌즈·빛·색(37~42) + 7부 특수 렌즈와 룩(43~50)

const deg = (d: number) => (d * Math.PI) / 180;
const S = (x: number, z = 0): Vec3 => [x, SUBJECT_Y, z];
export const FOREST_X = 66;
const TRACK_Z = -28;

/** 방위·피치(도)로 바라보는 점 */
function lookDir(p: Vec3, yaw: number, pitch: number, d = 10): Vec3 {
  return [p[0] + Math.sin(deg(yaw)) * Math.cos(deg(pitch)) * d, p[1] + Math.sin(deg(pitch)) * d, p[2] - Math.cos(deg(yaw)) * Math.cos(deg(pitch)) * d];
}

/** Catmull-Rom 스플라인 */
function spline(pts: Vec3[], k: number): Vec3 {
  const n = pts.length - 1;
  const x = Math.min(n - 1e-9, Math.max(0, k * n));
  const i = Math.floor(x);
  const u = x - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[Math.min(n, i + 1)];
  const p3 = pts[Math.min(n, i + 2)];
  const out: number[] = [0, 0, 0];
  for (let a = 0; a < 3; a++) {
    out[a] =
      0.5 *
      (2 * p1[a] + (-p0[a] + p2[a]) * u + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * u * u + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * u * u * u);
  }
  return out as Vec3;
}

const T: TechniqueImpl[] = [
  // 37 랙 포커스 — 앞의 꽃에서 뒤의 캐릭터로 초점 이동
  {
    id: 37,
    duration: 6,
    props: ['flower'],
    sample: (t) => {
      const cam: Vec3 = [lerp(0.85, 0.7, t / 6), 0.8, 5.0];
      const flower: Vec3 = [0.45, 0.7, 3.8];
      const subj = S(-0.2, -2);
      const k = smooth(prog(t, 2, 3.6));
      const focus = lerp(dist(cam, flower), dist(cam, subj) - SUBJECT_Y * 0.9, k); // 캐릭터 앞 표면에 초점
      return frame(
        t,
        [shot('랙 포커스', pose(cam, [0.05, 0.62, 0], 38), defaultWorld(t, { subject: { position: subj, heading: 0.1, pose: k > 0.5 ? 'happy' : 'idle' }, props: { flower } }))],
        { effects: { dof: { focusDistance: focus, aperture: 1 } } },
      );
    },
  },
  // 38 렌즈 플레어 — 지는 해를 지나갈 때 빛망울이 줄지어 생김
  {
    id: 38,
    duration: 6,
    sample: (t) => {
      const p: Vec3 = [0, 1.3, 6];
      const yaw = lerp(-28, 22, smooth(prog(t, 0, 6)));
      return frame(
        t,
        [shot('노을 패닝', pose(p, lookDir(p, yaw, 6), 50), defaultWorld(t, { subject: { position: S(-1.2, 0.5), heading: 0.5, pose: 'happy' }, timeOfDay: 0.5, props: { sunAzimuth: 0 } }))],
        { effects: { flare: 1 } },
      );
    },
  },
  // 39 카메라 셰이크 — 무거운 추가 떨어지는 순간만 크고 짧게 흔들림
  {
    id: 39,
    duration: 5,
    props: ['weight'],
    sample: (t) => {
      const impact = 1.6;
      const base: Vec3 = [lerp(2.4, 2.1, t / 5), 1.4, lerp(6.4, 6.0, t / 5)];
      const dt = t - impact;
      const amp = dt > 0 ? 0.32 * Math.exp(-dt * 6) : 0;
      const shake: Vec3 = [noise1(t * 28, 1) * amp, noise1(t * 31, 2) * amp, noise1(t * 25, 3) * amp * 0.5];
      const weightY = dt < 0 ? Math.max(0.5, 9 - 4.9 * Math.pow(t + 0.15, 2) * 1.35) : 0.5;
      return frame(t, [
        shot(
          '쿵',
          pose(add(base, shake), [0, 0.9, -0.5], 48, dt > 0 ? noise1(t * 20, 4) * amp * 12 : 0),
          defaultWorld(t, {
            subject: { position: [1.4, SUBJECT_Y + (dt > 0 && dt < 0.4 ? Math.sin((dt / 0.4) * Math.PI) * 0.4 : 0), 0.6], heading: -0.6, pose: dt > 0 ? 'surprised' : 'idle' },
            props: { weightY, cameraBase: base },
          }),
        ),
      ]);
    },
  },
  // 40 모션 블러 — 빠르게 지나가는 기차가 셔터 시간만큼 번짐
  {
    id: 40,
    duration: 6,
    props: ['train'],
    sample: (t) => {
      const trainX = lerp(-55, 75, t / 6);
      return frame(
        t,
        [
          shot(
            '승강장',
            pose([10 + lerp(0, 1, t / 6), 1.5, TRACK_Z + 7], [10, 1.4, TRACK_Z], 50),
            defaultWorld(t, { subject: { position: S(12.5, TRACK_Z + 3.4), heading: Math.PI, pose: 'surprised' }, timeOfDay: 0.25, props: { trainX } }),
          ),
        ],
        { effects: { motionBlur: 1 } },
      );
    },
  },
  // 41 컬러 그레이딩 — 원본 노을 들판이 틸 앤 오렌지로
  {
    id: 41,
    duration: 6,
    props: ['swing'],
    sample: (t) => {
      const theta = 0.35 * Math.sin(t * 2.2);
      return frame(
        t,
        [
          shot(
            '노을 그네',
            pose([lerp(-1.5, 1.5, t / 6), 1.6, 7.5], [0, 1.6, -0.6], 48),
            defaultWorld(t, {
              subject: { position: [0, 3.2 - 2.7 * Math.cos(theta) + SUBJECT_Y - 0.05, -0.6 + 2.7 * Math.sin(theta)], heading: 0, pose: 'happy' },
              timeOfDay: 0.47,
              props: { swingPos: [0, 0, -0.6], swingAngle: theta, sunAzimuth: 0.3 },
            }),
          ),
        ],
        { effects: { colorGrade: smooth(prog(t, 1.2, 3)) } },
      );
    },
  },
  // 42 레터박스 — 위아래 검은 띠로 2.39:1 영화관 비율
  {
    id: 42,
    duration: 6,
    sample: (t) => {
      const p: Vec3 = [lerp(-6, 6, t / 6), 2.0, 4.6];
      return frame(
        t,
        [shot('와이드', pose(p, [p[0] * 0.6, 1.6, -10], 40), defaultWorld(t, { subject: { position: S(lerp(-2, 2, t / 6), 0.3), heading: Math.PI / 2, pose: 'walk' }, timeOfDay: 0.42 }))],
        { effects: { letterbox: t >= 1.2 ? 2.39 : 0 } },
      );
    },
  },

  // 43 보케 — 밤거리 불빛이 동그랗게 번짐
  {
    id: 43,
    duration: 6,
    props: ['bokehLights'],
    sample: (t) => {
      const cam: Vec3 = [lerp(0.3, -0.2, t / 6), 0.85, 2.4];
      const subj = S(0, 0);
      const lightsD = 9;
      const k = smooth(prog(t, 3.6, 5));
      return frame(
        t,
        [shot('밤거리', pose(cam, [0, 0.75, 0], 40), defaultWorld(t, { subject: { position: subj, heading: 0.15, pose: 'happy' }, timeOfDay: 0.96 }))],
        { effects: { dof: { focusDistance: lerp(dist(cam, subj) - SUBJECT_Y * 0.9, lightsD, k), aperture: 1 }, bokeh: 1 } },
      );
    },
  },
  // 44 틸트 시프트 — 위아래를 흐리게 해 진짜 마을이 미니어처처럼
  {
    id: 44,
    duration: 6,
    props: ['train'],
    sample: (t) => {
      const ts = 3;
      const st = t * ts;
      const p: Vec3 = [lerp(4, 10, t / 6), 15, 15];
      return frame(
        t,
        [
          shot(
            '옥상에서',
            pose(p, [p[0] - 4, 0, -6], 38),
            defaultWorld(st, { subject: { position: S(lerp(-3, 9, t / 6), 0), heading: Math.PI / 2, pose: 'walk' }, props: { trainX: lerp(-40, 40, t / 6) } }),
          ),
        ],
        { timeScale: ts, effects: { tiltShift: 1, colorGrade: 0.15 } },
      );
    },
  },
  // 45 어안 렌즈 — 스케이트보드 타는 캐릭터를 가까이, 가장자리가 둥글게 휨
  {
    id: 45,
    duration: 6,
    props: ['skateboard'],
    sample: (t) => {
      const x = lerp(-6, 6, t / 6);
      const s: Vec3 = [x, SUBJECT_Y + 0.12, 0];
      return frame(
        t,
        [shot('스케이트', pose([x - 1.1, 0.35, 1.1], [x + 0.2, 0.9, -0.2], 115), defaultWorld(t, { subject: { position: s, heading: Math.PI / 2, pose: 'happy' }, props: { skate: true } }))],
        { effects: { fisheye: 1 } },
      );
    },
  },
  // 46 갓레이 — 안개 낀 숲, 나뭇잎 사이로 햇빛 줄기
  {
    id: 46,
    duration: 7,
    props: ['forest'],
    sample: (t) => {
      const p: Vec3 = [FOREST_X + lerp(-1, 1, t / 7), 1.5, 12];
      return frame(
        t,
        [
          shot(
            '안개 숲',
            pose(p, lookDir(p, lerp(-6, 6, t / 7), 16), 55),
            defaultWorld(t, { subject: { position: S(FOREST_X + 0.5, 6), heading: Math.PI, pose: 'surprised' }, timeOfDay: 0.4, props: { sunAzimuth: 0, fog: 0.035 } }),
          ),
        ],
        { effects: { godRays: 1 } },
      );
    },
  },
  // 47 셀렉티브 컬러 — 흑백 시장에 캐릭터의 주황색만 남김
  {
    id: 47,
    duration: 6,
    props: ['market'],
    sample: (t) => {
      const g = smooth(prog(t, 1.2, 2.6));
      return frame(
        t,
        [shot('시장', pose([lerp(-2, 1, t / 6), 1.5, 6.5], [0, 1.0, -1.5], 48), defaultWorld(t, { subject: { position: S(lerp(-1, 1, t / 6), 0.4), heading: Math.PI / 2, pose: 'walk' } }))],
        { effects: { grayscale: g, selectiveHue: 28 } },
      );
    },
  },
  // 48 데이 포 나이트 — 낮 장면을 어둡게·푸르게·하늘 더 어둡게
  {
    id: 48,
    duration: 7,
    sample: (t) => {
      const k = smooth(prog(t, 1.2, 4.2));
      return frame(
        t,
        [shot('들판', pose([lerp(-3, 3, t / 7), 1.4, 8], [0, 1.2, -6], 50), defaultWorld(t, { subject: { position: S(lerp(1, -1, t / 7), 1), heading: -Math.PI / 2, pose: 'walk' }, timeOfDay: 0.08 }))],
        { effects: { dayForNight: k } },
      );
    },
  },
  // 49 필름 그레인 — 노을 속 그네 장면에 자글자글한 필름 입자
  {
    id: 49,
    duration: 6,
    props: ['swing'],
    sample: (t) => {
      const theta = 0.45 * Math.sin(t * 2);
      return frame(
        t,
        [
          shot(
            '필름',
            pose([4.5, 1.2, lerp(3, 2, t / 6)], [-1.6, 1.4, -0.6], 42),
            defaultWorld(t, {
              subject: { position: [-1.6, 3.2 - 2.7 * Math.cos(theta) + SUBJECT_Y - 0.05, -0.6 + 2.7 * Math.sin(theta)], heading: Math.PI / 2, pose: 'happy' },
              timeOfDay: 0.52,
              props: { swingPos: [-1.6, 0, -0.6], swingAngle: theta, sunAzimuth: -0.6 },
            }),
          ),
        ],
        { effects: { grain: 1, vignette: 0.35 } },
      );
    },
  },
  // 50 원테이크 — 집 앞에서 출발해 골목을 지나 광장까지 끊김 없이
  {
    id: 50,
    duration: 20,
    sample: (t) => {
      const k = t / 20;
      const camPath: Vec3[] = [
        [-12, 1.3, -4.8],
        [-11, 1.4, -2.0],
        [-8, 1.5, 2.5],
        [-2, 1.6, 3.2],
        [5, 1.8, 3.4],
        [12, 2.2, 2.8],
        [19, 2.8, 4.5],
        [25, 4.5, 6.5],
        [31, 8, 9.5],
        [36, 11, 8],
      ];
      const lookPath: Vec3[] = [
        [-12, 1.2, -6.5],
        [-11.5, 0.9, -5],
        [-9, 0.7, -1],
        [-4, 0.7, 0],
        [3, 0.7, 0],
        [10, 0.8, 0],
        [17, 1.2, -1.5],
        [26, 2.5, -4],
        [30, 4.5, -7],
        [30, 3, -6],
      ];
      const ck = smooth(k * 0.98 + 0.01);
      const cam = spline(camPath, ck);
      const look = spline(lookPath, ck);
      const sx = lerp(-12, 27, smooth(prog(t, 1.5, 17)));
      return frame(t, [
        shot(
          '원테이크',
          pose(cam, look, 50),
          defaultWorld(t, { subject: { position: [sx, SUBJECT_Y, t < 3 ? lerp(-5.8, -1.0, smooth(prog(t, 0.5, 3))) : 0], heading: t < 3 ? 0 : Math.PI / 2, pose: t > 17 ? 'happy' : 'walk' }, timeOfDay: lerp(0.18, 0.45, k), props: { sunAzimuth: lerp(2.6, 0.4, k) } }),
        ),
      ]);
    },
  },
];

export const LOOK_TECHNIQUES: TechniqueImpl[] = T;
