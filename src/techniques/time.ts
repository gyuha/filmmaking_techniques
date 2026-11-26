import type { TechniqueImpl, Vec3 } from './types';
import { SUBJECT_Y, clamp, defaultWorld, frame, lerp, noise1, pose, prog, shot, smooth } from './util';

// 5부 시간(29~36): 장면 시간(sceneTime)과 실제 재생 시간(t)을 분리한다.
// timeScale = d(sceneTime)/dt

const deg = (d: number) => (d * Math.PI) / 180;
export const FOUNTAIN: Vec3 = [-2.2, 0, -1.2];

/** 속도 함수 ts(t)를 0..t 적분해 장면 시간을 구한다 */
function integrate(ts: (t: number) => number, t: number, dt = 1 / 240) {
  let s = 0;
  let x = 0;
  for (; x + dt <= t; x += dt) s += ts(x + dt / 2) * dt;
  return s + ts((x + t) / 2) * (t - x);
}

/** 장면 시간에 따른 점프 높이(주기 2초 중 1초 동안 포물선) */
function jumpY(st: number, period = 2, air = 1, h = 1.3) {
  const p = ((st % period) + period) % period;
  if (p > air) return 0;
  const k = p / air;
  return 4 * h * k * (1 - k);
}

const T: TechniqueImpl[] = [
  // 29 슬로 모션 — 분수 물방울과 점프가 아주 느리게
  {
    id: 29,
    duration: 7,
    props: ['fountain'],
    sample: (t) => {
      const ts = t < 1 ? 1 : 0.2;
      const st = t < 1 ? t : 1 + (t - 1) * 0.2;
      const y = SUBJECT_Y + jumpY(st + 0.4, 2.2, 1.1, 1.0);
      const k = prog(t, 0, 7);
      return frame(
        t,
        [
          shot(
            '분수',
            pose([lerp(1.2, 0.4, k), 1.3, lerp(4.8, 3.6, k)], [-1.0, 1.1, -0.8], 50),
            defaultWorld(st, { subject: { position: [-0.6, y, 0], heading: 0.3, pose: y > SUBJECT_Y + 0.05 ? 'happy' : 'idle', squash: y < SUBJECT_Y + 0.02 ? 0.15 : 0 }, timeOfDay: 0.12, props: { fountainPos: FOUNTAIN } }),
          ),
        ],
        { timeScale: ts },
      );
    },
  },
  // 30 타임랩스 — 고정 카메라, 한낮이 몇 초 만에 밤으로
  {
    id: 30,
    duration: 6,
    props: ['clockHands', 'clouds'],
    sample: (t) => {
      const ts = 7200; // 1초 = 2시간
      const st = t * ts;
      const tod = clamp(t / 6) * 0.98;
      return frame(
        t,
        [
          shot(
            '광장 고정',
            pose([25.5, 1.6, 3.4], [30, 5.2, -9], 55),
            defaultWorld(st, {
              subject: { position: [lerp(24, 33, (Math.sin(t * 9) + 1) / 2), SUBJECT_Y, lerp(-3, 2, (Math.cos(t * 7) + 1) / 2)], heading: t * 20, pose: 'walk' },
              timeOfDay: tod,
              props: { clockMinutes: 12 * 60 + st / 60, sunAzimuth: lerp(1.6, -0.6, t / 6), cloudTime: st / 600 },
            }),
          ),
        ],
        { timeScale: ts },
      );
    },
  },
  // 31 스피드 램프 — 빠르게 달리다 점프 순간만 느려졌다가 다시 빨라짐
  {
    id: 31,
    duration: 7,
    sample: (t) => {
      const ts = (x: number) => 2 - 1.75 * Math.exp(-Math.pow((x - 3.5) / 0.75, 2));
      const st = integrate(ts, t);
      const stJump = integrate(ts, 3.5);
      const x = -10 + st * 2.4;
      const air = 1.0;
      const dj = st - (stJump - air / 2);
      const y = SUBJECT_Y + (dj > 0 && dj < air ? 4 * 1.6 * (dj / air) * (1 - dj / air) : 0);
      return frame(
        t,
        [
          shot(
            '달리기',
            pose([x - 1.0, 1.2, 5.2], [x + 0.6, 0.9, 0], 48),
            defaultWorld(st, { subject: { position: [x, y, 0], heading: Math.PI / 2, pose: y > SUBJECT_Y + 0.05 ? 'surprised' : 'run' } }),
          ),
        ],
        { timeScale: ts(t), effects: { motionBlur: ts(t) > 1.2 ? 0.6 : 0 } },
      );
    },
  },
  // 32 프리즈 프레임 — 점프한 순간 화면이 멈추고 이름표가 붙음
  {
    id: 32,
    duration: 7,
    sample: (t) => {
      const freezeA = 3;
      const freezeB = 5;
      const frozen = t >= freezeA && t < freezeB;
      const st = t < freezeA ? t : t < freezeB ? freezeA : t - (freezeB - freezeA);
      const x = -6 + st * 2;
      const dj = st - 2.5;
      const y = SUBJECT_Y + (dj > 0 && dj < 1 ? 4 * 1.5 * dj * (1 - dj) : 0);
      return frame(
        t,
        [
          shot(
            '점프',
            pose([x - 1.5, 1.2, 5], [x, 1.0, 0], 46),
            defaultWorld(st, {
              subject: { position: [x, y, 0], heading: Math.PI / 2, pose: y > SUBJECT_Y + 0.05 ? 'happy' : 'run' },
              props: frozen ? { caption: '주황이 — 이 이야기의 주인공' } : {},
            }),
          ),
        ],
        { timeScale: frozen ? 0 : 1, effects: frozen ? { colorGrade: 0.35, vignette: 0.3 } : {} },
      );
    },
  },
  // 33 리버스 — 깨진 화분이 다시 붙어 제자리로 올라감
  {
    id: 33,
    duration: 7,
    props: ['flowerPot'],
    sample: (t) => {
      const forwardEnd = 2.6;
      const ts = t < forwardEnd ? 1 : t < 6.3 ? -0.8 : 0;
      const st = t < forwardEnd ? t : t < 6.3 ? forwardEnd - (t - forwardEnd) * 0.8 : forwardEnd - (6.3 - forwardEnd) * 0.8;
      return frame(
        t,
        [
          shot(
            '화분',
            pose([lerp(4.2, 3.6, t / 7), 1.3, 4.2], [1.4, 0.9, -0.6], 45),
            defaultWorld(st, { subject: { position: [-0.8, SUBJECT_Y, 0.4], heading: 0.8, pose: ts < 0 ? 'happy' : st > 1.6 ? 'sad' : 'surprised' }, props: { potTime: st } }),
          ),
        ],
        { timeScale: ts, effects: ts < 0 ? { colorGrade: 0.25 } : {} },
      );
    },
  },
  // 34 하이퍼랩스 — 카메라가 거리를 성큼성큼 나아가며 시간도 빠르게
  {
    id: 34,
    duration: 7,
    props: ['clouds'],
    sample: (t) => {
      const ts = 900;
      const st = t * ts;
      const step = Math.floor(t * 8) / 8; // 몇 걸음마다 한 장씩
      const x = lerp(-34, 26, step / 7);
      const bob = noise1(step * 13, 3) * 0.05;
      return frame(
        t,
        [
          shot(
            '거리',
            pose([x, 1.6 + bob, 1.2], [x + 10, 1.2, -0.6], 55),
            defaultWorld(st, {
              subject: { position: [x + 4 + Math.sin(st * 0.01) * 0.3, SUBJECT_Y, -0.2], heading: Math.PI / 2, pose: 'walk' },
              timeOfDay: lerp(0.05, 0.6, t / 7),
              props: { sunAzimuth: lerp(1.2, 1.6, t / 7), cloudTime: st / 600 },
            }),
          ),
        ],
        { timeScale: ts },
      );
    },
  },
  // 35 불릿 타임 — 공중에 멈춘 캐릭터 주위를 카메라만 돈다
  {
    id: 35,
    duration: 7,
    props: ['fountain'],
    sample: (t) => {
      const ts = (x: number) => (x < 1.5 ? 1 : x < 5.5 ? 0.02 : 1);
      const st = t < 1.5 ? t : t < 5.5 ? 1.5 + (t - 1.5) * 0.02 : 1.58 + (t - 5.5);
      const apex = 1.5;
      const dj = st - (apex - 0.6);
      const y = SUBJECT_Y + (dj > 0 && dj < 1.2 ? 4 * 1.4 * (dj / 1.2) * (1 - dj / 1.2) : 0);
      const subj: Vec3 = [-0.6, y, 0];
      const a = deg(lerp(0, 220, smooth(prog(t, 1.5, 5.5))));
      const r = 4.2;
      return frame(
        t,
        [
          shot(
            '공중 정지',
            pose([subj[0] + Math.sin(a) * r, 1.5, subj[2] + Math.cos(a) * r], subj, 48),
            defaultWorld(st, { subject: { position: subj, heading: 0, pose: 'surprised' }, props: { fountainPos: FOUNTAIN } }),
          ),
        ],
        { timeScale: ts(t), effects: ts(t) < 0.5 ? { colorGrade: 0.4 } : {} },
      );
    },
  },
  // 36 스톱모션 — 블록이 한 칸씩 뚝뚝 끊기며 줄을 섬
  {
    id: 36,
    duration: 7,
    props: ['blocks'],
    sample: (t) => {
      const fps = 8;
      const q = Math.floor(t * fps) / fps; // 한 장씩 찍은 시간
      const start: Vec3 = [-2.4, 0.2, 1.4];
      const end: Vec3 = [-1.2, 0.2, 0];
      const k = smooth(prog(q, 0, 1.2));
      const lead: Vec3 = [lerp(start[0], end[0], k), 0.2, lerp(start[2], end[2], k)];
      return frame(t, [
        shot(
          '블록',
          pose([lerp(0.4, 0.2, t / 7), 2.2, lerp(4.8, 4.2, t / 7)], [0.6, 0.2, 0], 42),
          defaultWorld(q, { subject: { position: [3.0, SUBJECT_Y, -0.6], heading: -1.0, pose: q > 6 ? 'happy' : 'idle' }, props: { stopT: q, blockLead: lead } }),
        ),
      ]);
    },
  },
];

export const TIME_TECHNIQUES: TechniqueImpl[] = T;
