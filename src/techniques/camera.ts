import type { TechniqueImpl, Vec3 } from './types';
import { SUBJECT_Y, add, defaultWorld, frame, lerp, noise1, pose, prog, shot, single, smooth } from './util';

// 1부 카메라 무빙(1~9) + 2부 앵글과 숏(10~16)

const SUBJ: Vec3 = [0, SUBJECT_Y, 0];
const LOOK: Vec3 = [0, 0.6, 0];
const deg = (d: number) => (d * Math.PI) / 180;

/** 그네: 축(높이 3.2)에서 줄 길이 2.7로 흔들린다 */
const SWING_PIVOT_Y = 3.2;
const SWING_LEN = 2.7;
function swingSubject(theta: number, base: Vec3 = [0, 0, 0]): Vec3 {
  return [base[0], SWING_PIVOT_Y - SWING_LEN * Math.cos(theta) + SUBJECT_Y - 0.05, base[2] + SWING_LEN * Math.sin(theta)];
}

/** 화각 비율(피사체가 화면에서 차지하는 비율)이 일정하도록 거리에 맞춘 화각(도) */
function dollyZoomFov(d: number, d0: number, fov0: number) {
  const c = (2 * Math.atan(SUBJECT_Y / d0)) / deg(fov0);
  return (2 * Math.atan(SUBJECT_Y / d)) / c * (180 / Math.PI);
}

const T: TechniqueImpl[] = [
  // 1 달리 인 — 카메라 몸체가 피사체 쪽으로 이동, 화각 고정
  {
    id: 1,
    duration: 5,
    sample: (t) => {
      const k = smooth(prog(t, 0.3, 4.6));
      return single(t, pose([0, 1.15, lerp(12, 2.8, k)], LOOK, 40), defaultWorld(t));
    },
  },
  // 2 줌 인 — 위치 고정, 화각만 좁아짐
  {
    id: 2,
    duration: 5,
    sample: (t) => {
      const k = smooth(prog(t, 0.3, 4.6));
      return single(t, pose([0, 1.15, 12], LOOK, lerp(40, 11, k)), defaultWorld(t));
    },
  },
  // 3 팬·틸트 — 제자리에서 좌우로 훑고 마지막에 하늘로 틸트 업
  {
    id: 3,
    duration: 7,
    sample: (t) => {
      const p: Vec3 = [0, 1.6, 9];
      const yaw = lerp(-55, 40, smooth(prog(t, 0.2, 4.4)));
      const pitch = lerp(-4, 38, smooth(prog(t, 4.6, 6.6)));
      const dir: Vec3 = [Math.sin(deg(yaw)) * Math.cos(deg(pitch)), Math.sin(deg(pitch)), -Math.cos(deg(yaw)) * Math.cos(deg(pitch))];
      return single(t, pose(p, add(p, dir), 50), defaultWorld(t));
    },
  },
  // 4 트래킹 숏 — 걷는 캐릭터 옆에서 같은 속도로 나란히 이동
  {
    id: 4,
    duration: 6,
    sample: (t) => {
      const x = lerp(-7, 7, t / 6);
      const bob = Math.abs(Math.sin(t * 7)) * 0.06;
      const s: Vec3 = [x, SUBJECT_Y + bob, 0];
      return single(
        t,
        pose([x, 1.0, 5.2], [x, 0.6, 0], 42),
        defaultWorld(t, { subject: { position: s, heading: Math.PI / 2, pose: 'walk' } }),
      );
    },
  },
  // 5 크레인 숏 — 캐릭터 근처에서 하늘 높이 들려 올라가며 마을 전체를 보여줌
  {
    id: 5,
    duration: 6,
    sample: (t) => {
      const k = smooth(prog(t, 0.3, 5.6));
      const p: Vec3 = [lerp(0.5, 0, k), lerp(0.9, 17, k), lerp(3.6, 15, k)];
      const target: Vec3 = [0, lerp(0.6, 0, k), lerp(0, -6, k)];
      return single(t, pose(p, target, lerp(45, 55, k)), defaultWorld(t));
    },
  },
  // 6 달리 줌 — 뒤로 물러나면서 줌 인, 피사체 크기는 그대로·배경만 다가옴
  {
    id: 6,
    duration: 5,
    sample: (t) => {
      const k = smooth(prog(t, 0.4, 4.6));
      const d = lerp(3, 12, k);
      const fov = dollyZoomFov(d, 3, 60);
      return single(t, pose([0, SUBJECT_Y, d], [0, SUBJECT_Y, 0], fov), defaultWorld(t, { subject: { position: SUBJ, heading: 0, pose: 'surprised' } }));
    },
  },
  // 7 아크 숏 — 피사체를 중심으로 일정 거리에서 원을 그리며 돈다
  {
    id: 7,
    duration: 7,
    sample: (t) => {
      const a = deg(lerp(-70, 100, smooth(prog(t, 0.2, 6.8))));
      const r = 4.5;
      return single(t, pose([Math.sin(a) * r, 1.2, Math.cos(a) * r], [0, SUBJECT_Y, 0], 45), defaultWorld(t));
    },
  },
  // 8 크래시 줌 — 순식간에 화각이 확 좁아져 얼굴로 당겨짐
  {
    id: 8,
    duration: 4,
    sample: (t) => {
      const k = smooth(prog(t, 1.5, 1.7));
      return single(
        t,
        pose([0, 1.2, 14], [0, 0.62, 0], lerp(50, 6.5, k)),
        defaultWorld(t, { subject: { position: SUBJ, heading: 0, pose: t > 1.4 ? 'surprised' : 'idle' } }),
      );
    },
  },
  // 9 핸드헬드 — 달리는 캐릭터 옆에서 손으로 든 듯 잔잔하게 흔들림
  {
    id: 9,
    duration: 6,
    sample: (t) => {
      const x = lerp(-5, 5, t / 6);
      const s: Vec3 = [x, SUBJECT_Y + Math.abs(Math.sin(t * 9)) * 0.1, 0];
      const shake: Vec3 = [
        noise1(t * 2.5, 1) * 0.05 + noise1(t * 7, 2) * 0.02,
        noise1(t * 3, 3) * 0.05 + noise1(t * 8, 4) * 0.015,
        noise1(t * 2, 5) * 0.03,
      ];
      const base: Vec3 = [x - 0.4, 1.25, 4.2];
      const look: Vec3 = [x + noise1(t * 1.7, 6) * 0.12, 0.6 + noise1(t * 2.2, 7) * 0.08, 0];
      return single(
        t,
        pose(add(base, shake), look, 48, noise1(t * 1.3, 8) * 2.2),
        defaultWorld(t, { subject: { position: s, heading: Math.PI / 2, pose: 'run' } }),
      );
    },
  },

  // 10 하이 앵글 — 눈높이보다 높은 곳에서 비스듬히 내려다봄
  {
    id: 10,
    duration: 5,
    props: ['swing'],
    sample: (t) => {
      const k = smooth(prog(t, 0, 5));
      return single(
        t,
        pose([lerp(1.5, 0.6, k), lerp(7.5, 6.5, k), lerp(6.5, 5.2, k)], SUBJ, 42),
        defaultWorld(t, { subject: { position: SUBJ, heading: 0.2, pose: 'sad' }, props: { swingPos: [-2.4, 0, -0.6], swingAngle: Math.sin(t) * 0.1 } }),
      );
    },
  },
  // 11 로우 앵글 — 땅 가까이에서 올려다봄, 하늘을 등지고 우뚝
  {
    id: 11,
    duration: 5,
    props: ['swing'],
    sample: (t) => {
      const k = smooth(prog(t, 0, 5));
      return single(
        t,
        pose([lerp(0.5, -0.3, k), 0.22, lerp(2.6, 2.1, k)], [0, 1.25, 0], 55),
        defaultWorld(t, { subject: { position: SUBJ, heading: 0, pose: 'happy' }, props: { swingPos: [-2.4, 0, -0.6], swingAngle: Math.sin(t) * 0.1 } }),
      );
    },
  },
  // 12 버즈아이 뷰 — 바로 위에서 수직으로 내려다봄
  {
    id: 12,
    duration: 5,
    props: ['swing'],
    sample: (t) => {
      const k = smooth(prog(t, 0, 5));
      const h = lerp(20, 13, k);
      const a = lerp(0, 0.6, k);
      return single(
        t,
        pose([Math.sin(a) * 0.6, h, Math.cos(a) * 0.6], [0, 0, 0], 50),
        defaultWorld(t, { subject: { position: [lerp(-1, 1, k), SUBJECT_Y, 0], heading: Math.PI / 2, pose: 'walk' }, props: { swingPos: [-2.4, 0, -0.6], swingAngle: Math.sin(t * 1.2) * 0.25 } }),
      );
    },
  },
  // 13 더치 앵글 — 카메라를 비스듬히 기울여 불안한 느낌
  {
    id: 13,
    duration: 5,
    props: ['swing'],
    sample: (t) => {
      const roll = lerp(0, 18, smooth(prog(t, 0.2, 1.6))) + Math.sin(t * 1.3) * 2;
      return single(
        t,
        pose([1.2, 1.1, lerp(6.5, 5.5, t / 5)], [-1.2, 1.2, -0.6], 45, roll),
        defaultWorld(t, { subject: { position: [1.0, SUBJECT_Y, -0.4], heading: -0.4, pose: 'sad' }, timeOfDay: 0.55, props: { swingPos: [-1.6, 0, -0.6], swingAngle: Math.sin(t * 1.6) * 0.35 } }),
      );
    },
  },
  // 14 익스트림 클로즈업 — 눈 하나가 화면 가득
  {
    id: 14,
    duration: 5,
    sample: (t) => {
      const k = smooth(prog(t, 0.2, 2.5));
      const eye: Vec3 = [0.17, SUBJECT_Y + 0.12, 0.42];
      const cam: Vec3 = [lerp(0.05, 0.17, k), lerp(SUBJECT_Y + 0.05, eye[1], k), lerp(4.2, 2.6, k)];
      const target: Vec3 = [lerp(0, eye[0], k), lerp(SUBJECT_Y, eye[1], k), lerp(0, eye[2], k)];
      return single(t, pose(cam, target, lerp(24, 7.5, k)), defaultWorld(t, { subject: { position: SUBJ, heading: 0, pose: t > 3 ? 'cry' : 'sad' } }));
    },
  },
  // 15 POV 숏 — 그네 타는 캐릭터의 눈 위치에서 보는 화면
  {
    id: 15,
    duration: 6,
    props: ['swing'],
    sample: (t) => {
      const theta = 0.55 * Math.sin((t * 2 * Math.PI) / 2.6);
      const s = swingSubject(theta);
      // 캐릭터는 +z(집들 쪽)를 보고 앉아 있다. 눈은 몸 앞쪽 표면
      const fwd: Vec3 = [0, Math.sin(theta) * 0.9, Math.cos(theta)];
      const eyePos: Vec3 = [s[0], s[1] + 0.15, s[2] + 0.6 * Math.cos(theta)];
      const target: Vec3 = add(eyePos, [fwd[0] * 10, fwd[1] * 10 - 1.2, fwd[2] * 10]);
      return single(t, pose(eyePos, target, 70), defaultWorld(t, { subject: { position: s, heading: 0, pose: 'sit' }, props: { swingPos: [0, 0, 0], swingAngle: theta } }));
    },
  },
  // 16 점프 컷 — 같은 구도에서 시간만 툭툭 건너뜀
  {
    id: 16,
    duration: 6,
    sample: (t) => {
      const seg = Math.min(3, Math.floor(t / 1.5));
      const spots: { p: Vec3; h: number; pose: 'idle' | 'happy' | 'sad' | 'surprised' }[] = [
        { p: [-2.6, SUBJECT_Y, -0.4], h: 0.5, pose: 'idle' },
        { p: [1.9, SUBJECT_Y, 0.6], h: -0.6, pose: 'happy' },
        { p: [-0.4, SUBJECT_Y, 1.6], h: 0.1, pose: 'surprised' },
        { p: [2.8, SUBJECT_Y, -0.8], h: -1.2, pose: 'sad' },
      ];
      const sp = spots[seg];
      const world = defaultWorld(t + seg * 9, {
        subject: { position: sp.p, heading: sp.h, pose: sp.pose },
        timeOfDay: 0.12 + seg * 0.06,
      });
      return frame(t, [shot(`컷${seg + 1}`, pose([0, 1.4, 8], [0, 0.6, 0], 42), world)]);
    },
  },
];

export const CAMERA_TECHNIQUES: TechniqueImpl[] = T;
export { swingSubject };
