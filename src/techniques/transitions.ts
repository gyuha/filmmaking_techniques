import type { TechniqueImpl, Vec3 } from './types';
import { SUBJECT_Y, defaultWorld, frame, lerp, noise1, pose, prog, shot, smooth } from './util';

// 3부 장면 전환(17~23) + 4부 편집 기법(24~28)

const S = (x: number, z = 0): Vec3 => [x, SUBJECT_Y, z];
const deg = (d: number) => (d * Math.PI) / 180;

/** 기차 선로(마을 뒤편) */
export const TRACK_Z = -28;
/** 역(선로 옆 승강장) 위치 */
export const STATION_X = 30;
/** 시계탑 시계판 */
const CLOCK_FACE: Vec3 = [30, 7.2, -8.68];

const T: TechniqueImpl[] = [
  // 17 디졸브 — 낮의 공원이 저녁의 공원으로 겹쳐지며 바뀜
  {
    id: 17,
    duration: 6,
    sample: (t) => {
      const day = shot('낮', pose([2.5, 1.5, 7.5], [0, 0.8, 0], 45), defaultWorld(t, { subject: { position: S(0), heading: 0.3, pose: 'happy' }, timeOfDay: 0.08 }));
      const eve = shot(
        '저녁',
        pose([-2.5, 1.4, 7.0], [0, 0.8, 0], 45),
        defaultWorld(t + 20, { subject: { position: S(0.4, 0.3), heading: -0.3, pose: 'idle' }, timeOfDay: 0.62 }),
      );
      const a = smooth(prog(t, 2, 4));
      if (t < 2) return frame(t, [day]);
      if (t >= 4) return frame(t, [eve]);
      return frame(t, [day, eve], { composite: { kind: 'dissolve', alpha: a } });
    },
  },
  // 18 와이프 — 사선 경계선이 밤 장면을 쓸어내며 눈 오는 장면을 엶
  {
    id: 18,
    duration: 6,
    props: ['snow'],
    sample: (t) => {
      const night = shot('밤', pose([0, 1.5, 8], [0, 1.2, 0], 50), defaultWorld(t, { subject: { position: S(-1), heading: 0.4, pose: 'idle' }, timeOfDay: 0.95, props: { snow: 0 } }));
      const snow = shot('눈', pose([3, 1.6, 7], [0, 1.0, 0], 50), defaultWorld(t, { subject: { position: S(0.5), heading: -0.5, pose: 'happy' }, timeOfDay: 0.25, props: { snow: 1 } }));
      if (t < 1.5) return frame(t, [night]);
      if (t >= 4.5) return frame(t, [snow]);
      return frame(t, [night, snow], { composite: { kind: 'wipe', progress: smooth(prog(t, 1.5, 4.5)), angle: deg(-35) } });
    },
  },
  // 19 매치 컷 — 밤하늘의 둥근 보름달이 같은 자리·같은 크기의 둥근 캐릭터로
  {
    id: 19,
    duration: 6,
    sample: (t) => {
      const moon: Vec3 = [0, 14, -45];
      const moonRadius = 3;
      const camA: Vec3 = [0, 1.5, 8];
      const dA = Math.hypot(moon[0] - camA[0], moon[1] - camA[1], moon[2] - camA[2]);
      const fov = 30;
      // 같은 화면 크기: atan(R/d)가 같도록 캐릭터까지 거리 결정
      const dB = SUBJECT_Y / Math.tan(Math.atan(moonRadius / dA));
      if (t < 3) {
        const k = smooth(prog(t, 0, 3));
        const p: Vec3 = [0, 1.5, lerp(9.5, 8, k)];
        return frame(t, [shot('달', pose(p, moon, fov), defaultWorld(t, { timeOfDay: 0.92, props: { moon, moonRadius, hideSubject: true } }))]);
      }
      const k = smooth(prog(t, 3.3, 6));
      return frame(t, [
        shot(
          '캐릭터',
          pose([0, SUBJECT_Y, lerp(dB, dB * 1.8, k)], S(0), fov),
          defaultWorld(t, { subject: { position: S(0), heading: 0, pose: 'happy' }, timeOfDay: 0.92, props: { moon: [-40, 60, -150], moonRadius: 5 } }),
        ),
      ]);
    },
  },
  // 20 휩 팬 — 카메라를 휙 돌려 번진 화면 속에 컷을 숨기고 다른 장소로
  {
    id: 20,
    duration: 5,
    sample: (t) => {
      const whipStart = 2.0;
      const cutAt = 2.22;
      const whipEnd = 2.5;
      if (t < cutAt) {
        const yaw = lerp(0, 80, Math.pow(prog(t, whipStart, cutAt), 1.5));
        const p: Vec3 = [-8, 1.6, 6];
        const dir: Vec3 = [Math.sin(deg(yaw)), -0.08, -Math.cos(deg(yaw))];
        return frame(
          t,
          [shot('지붕 아래', pose(p, [p[0] + dir[0] * 10, p[1] + dir[1] * 10, p[2] + dir[2] * 10], 45), defaultWorld(t, { subject: { position: S(-8, 0), heading: 0, pose: 'happy' } }))],
          { effects: { motionBlur: t > whipStart ? 1 : 0 } },
        );
      }
      const yaw = lerp(-70, 0, smooth(prog(t, cutAt, whipEnd + 0.2)));
      const p: Vec3 = [STATION_X, 1.6, 6];
      const dir: Vec3 = [Math.sin(deg(yaw)), -0.08, -Math.cos(deg(yaw))];
      return frame(
        t,
        [shot('광장', pose(p, [p[0] + dir[0] * 10, p[1] + dir[1] * 10, p[2] + dir[2] * 10], 45), defaultWorld(t, { subject: { position: S(STATION_X, -1), heading: 0, pose: 'surprised' } }))],
        { effects: { motionBlur: t < whipEnd ? 1 : 0 } },
      );
    },
  },
  // 21 스매시 컷 — 고요하게 잠든 밤에서 알람이 울리는 시끄러운 아침으로 뚝
  {
    id: 21,
    duration: 5,
    props: ['alarmClock'],
    sample: (t) => {
      if (t < 2.5) {
        const k = prog(t, 0, 2.5);
        return frame(t, [
          shot(
            '고요한 밤',
            pose([1.6, 1.0, lerp(3.4, 3.0, k)], [0, 0.5, 0], 40),
            defaultWorld(t, { subject: { position: S(0), heading: 0.2, pose: 'sit', squash: 0.15 }, timeOfDay: 0.97, props: { loudness: 0, ringing: false } }),
          ),
        ]);
      }
      const shake: Vec3 = [noise1(t * 30, 1) * 0.05, noise1(t * 30, 2) * 0.05, 0];
      return frame(t, [
        shot(
          '시끄러운 아침',
          pose([1.6 + shake[0], 1.0 + shake[1], 3.0], [0, 0.6, 0], 40),
          defaultWorld(t, {
            subject: { position: [0, SUBJECT_Y + Math.abs(Math.sin(t * 12)) * 0.25, 0], heading: 0.2, pose: 'surprised' },
            timeOfDay: 0.02,
            props: { loudness: 1, ringing: true },
          }),
        ),
      ]);
    },
  },
  // 22 아이리스 — 캐릭터만 남기고 둥근 원이 줄어들며 닫힘
  {
    id: 22,
    duration: 5,
    sample: (t) => {
      const r = t < 2.6 ? lerp(1, 0.13, smooth(prog(t, 0.6, 2.6))) : lerp(0.13, 0, smooth(prog(t, 3.4, 4.2)));
      return frame(
        t,
        [shot('마지막 장면', pose([1.5, 1.3, 7], [0.3, 0.6, 0], 42), defaultWorld(t, { subject: { position: S(lerp(-0.6, 0.6, t / 5)), heading: Math.PI / 2, pose: 'walk' }, timeOfDay: 0.4 }))],
        { composite: { kind: 'iris', radius: r } },
      );
    },
  },
  // 23 페이드 아웃 — 점점 어두워져 까맣게 사라졌다가 다음 날 아침으로 페이드 인
  {
    id: 23,
    duration: 6.5,
    sample: (t) => {
      if (t < 3.3) {
        const b = 1 - smooth(prog(t, 1.2, 3.1));
        return frame(
          t,
          [shot('저녁', pose([2, 1.4, 7], [0, 0.6, 0], 45), defaultWorld(t, { subject: { position: S(lerp(0, -2.5, t / 3.3)), heading: -Math.PI / 2, pose: 'walk' }, timeOfDay: 0.62 }))],
          { effects: { brightness: b } },
        );
      }
      const b = smooth(prog(t, 3.8, 5.6));
      return frame(
        t,
        [shot('다음 날 아침', pose([2, 1.4, 7], [0, 0.6, 0], 45), defaultWorld(t, { subject: { position: S(-2.5), heading: Math.PI / 2, pose: 'happy' }, timeOfDay: 0.02 }))],
        { effects: { brightness: b } },
      );
    },
  },

  // 24 몽타주 — 연습하고, 넘어지고, 다시 일어나는 짧은 장면들
  {
    id: 24,
    duration: 8,
    props: ['skateboard'],
    sample: (t) => {
      const cuts: { id: string; cam: Vec3; look: (x: number) => Vec3; x: (k: number) => number; pose: 'idle' | 'happy' | 'sad' | 'surprised' | 'run'; fall?: boolean; jump?: boolean; tod: number }[] = [
        { id: '1일차 연습', cam: [0, 1.2, 5], look: (x) => [x, 0.6, 0], x: (k) => lerp(-3, 1, k), pose: 'idle', tod: 0.1 },
        { id: '꽈당', cam: [3, 0.7, 3], look: (x) => [x, 0.4, 0], x: () => 1.4, pose: 'surprised', fall: true, tod: 0.15 },
        { id: '다시 일어남', cam: [-1.5, 0.9, 3], look: (x) => [x, 0.6, 0], x: () => 1.2, pose: 'sad', tod: 0.3 },
        { id: '3일차', cam: [-6, 2.5, 6], look: (x) => [x, 0.5, 0], x: (k) => lerp(-6, 2, k), pose: 'run', tod: 0.45 },
        { id: '5일차 점프', cam: [0, 0.4, 4], look: (x) => [x, 1.2, 0], x: (k) => lerp(-1.5, 1.5, k), pose: 'surprised', jump: true, tod: 0.08 },
        { id: '성공!', cam: [1.2, 1.5, 3.4], look: (x) => [x, 0.7, 0], x: () => 0, pose: 'happy', tod: 0.55 },
      ];
      const len = 8 / cuts.length;
      const i = Math.min(cuts.length - 1, Math.floor(t / len));
      const c = cuts[i];
      const k = (t - i * len) / len;
      const x = c.x(k);
      const y = SUBJECT_Y + 0.12 + (c.jump ? Math.sin(Math.PI * k) * 1.4 : 0) - (c.fall ? 0.12 : 0);
      return frame(t, [
        shot(
          c.id,
          pose(c.cam, c.look(x), 50),
          defaultWorld(i * 86400 + t, {
            subject: { position: [x, y, c.fall ? 0.5 : 0], heading: Math.PI / 2, pose: c.pose, squash: c.fall ? 0.4 : 0 },
            timeOfDay: c.tod,
            props: { skate: true, skateFall: c.fall === true },
          }),
        ),
      ]);
    },
  },
  // 25 교차 편집 — 역으로 달리는 캐릭터와 다가오는 기차가 점점 짧게 번갈아
  {
    id: 25,
    duration: 9,
    props: ['train'],
    sample: (t) => {
      const lens = [1.8, 1.6, 1.3, 1.1, 0.9, 0.7, 0.6, 0.5, 0.5];
      let acc = 0;
      let i = 0;
      while (i < lens.length - 1 && t >= acc + lens[i]) acc += lens[i++];
      const line = i % 2 === 0 ? 'character' : 'train';
      const runX = lerp(STATION_X - 22, STATION_X - 1, t / 9);
      const trainX = lerp(-70, STATION_X + 4, smooth(t / 9));
      const world = defaultWorld(t, {
        subject: { position: [runX, SUBJECT_Y + Math.abs(Math.sin(t * 11)) * 0.12, TRACK_Z + 3], heading: Math.PI / 2, pose: 'run' },
        timeOfDay: 0.35,
        props: { line, trainX },
      });
      const cam =
        line === 'character'
          ? pose([runX - 1.5, 1.2, TRACK_Z + 7.5], [runX + 1, 0.6, TRACK_Z + 3], 45)
          : pose([trainX + 14, 2.2, TRACK_Z + 6], [trainX, 1.4, TRACK_Z], 45);
      return frame(t, [shot(line === 'character' ? `달리기 ${i + 1}` : `기차 ${i + 1}`, cam, world)]);
    },
  },
  // 26 분할 화면 — 역의 캐릭터와 멀리 있는 친구가 같은 순간 통화
  {
    id: 26,
    duration: 6,
    props: ['friend', 'train'],
    sample: (t) => {
      const talkA = Math.max(0, Math.sin(t * 9)) * 0.12 * (Math.sin(t * 1.3) > 0 ? 1 : 0.2);
      const talkB = Math.max(0, Math.sin(t * 8)) * 0.12 * (Math.sin(t * 1.3) <= 0 ? 1 : 0.2);
      const a = shot(
        '역',
        pose([STATION_X + lerp(3.2, 1.2, t / 6), lerp(1.4, 0.9, t / 6), TRACK_Z + lerp(7, 5.2, t / 6)], [STATION_X, 0.6, TRACK_Z + 3], 45),
        defaultWorld(t, { subject: { position: S(STATION_X, TRACK_Z + 3), heading: lerp(0.9, 0.2, t / 6), pose: 'happy', squash: talkA }, timeOfDay: 0.3, props: { trainX: STATION_X - 12, friendPos: [-38, SUBJECT_Y, 4] } }),
      );
      const b = shot(
        '친구 집 앞',
        pose([lerp(-35, -37.2, t / 6), lerp(1.4, 0.9, t / 6), lerp(8, 5.9, t / 6)], [-38, 0.6, 4], 45),
        defaultWorld(t, { subject: { position: S(STATION_X, TRACK_Z + 3), heading: 0, pose: 'idle' }, timeOfDay: 0.55, props: { hideSubject: true, friendPos: [-38, SUBJECT_Y, 4], friendTalk: talkB, trainX: -200 } }),
      );
      return frame(t, [a, b], { composite: { kind: 'split', panes: 2 } });
    },
  },
  // 27 인서트 숏 — 캐릭터 장면 사이에 역 시계 클로즈업이 잠깐 끼어듦
  {
    id: 27,
    duration: 6,
    props: ['clockHands'],
    sample: (t) => {
      const minutes = 4 * 60 + 58 + (t / 6) * 2; // 4시 58분 → 5시
      const world = defaultWorld(t, {
        subject: { position: S(STATION_X - 2, -2.5), heading: Math.PI, pose: t > 3.7 ? 'surprised' : 'idle' },
        timeOfDay: 0.32,
        props: { clockMinutes: t > 2.5 ? 300 : minutes },
      });
      if (t >= 2.5 && t < 3.7) {
        return frame(t, [shot('시계 인서트', pose([CLOCK_FACE[0], CLOCK_FACE[1], CLOCK_FACE[2] + 4.5], CLOCK_FACE, 18), world)]);
      }
      return frame(t, [shot('캐릭터', pose([STATION_X - lerp(5.5, 3.2, t / 6), lerp(1.6, 1.1, t / 6), lerp(5, 1.5, t / 6)], [STATION_X - 2, 1.5, -2.5], 48), world)]);
    },
  },
  // 28 플래시백 — 큰 나무를 보다가 어릴 적 심던 장면이 빛바랜 색으로
  {
    id: 28,
    duration: 8,
    props: ['bigTree'],
    sample: (t) => {
      const past = t >= 3 && t < 5.5;
      if (past) {
        const k = prog(t, 3, 5.5);
        return frame(
          t,
          [
            shot(
              '과거: 나무 심던 날',
              pose([lerp(-0.5, 0.5, k), 1.1, 3.6], [2.4, 0.5, -1], 45),
              defaultWorld(t - 1e6, { subject: { position: [1.5, SUBJECT_Y * 0.7, -0.4], heading: 0.9, pose: 'happy' }, timeOfDay: 0.2, props: { treeScale: 0.22 } }),
            ),
          ],
          { effects: { sepia: 0.85, vignette: 0.85 } },
        );
      }
      const k = prog(t, t < 3 ? 0 : 5.5, t < 3 ? 3 : 8);
      return frame(t, [
        shot(
          '현재',
          pose([lerp(-1, 0, k), 1.3, 6], [2.5, 2.8, -1], 50),
          defaultWorld(t, { subject: { position: S(0.6, 0.3), heading: 1.2, pose: t > 5.5 ? 'happy' : 'idle' }, timeOfDay: 0.12, props: { treeScale: 1 } }),
        ),
      ]);
    },
  },
];

export const TRANSITION_TECHNIQUES: TechniqueImpl[] = T;
