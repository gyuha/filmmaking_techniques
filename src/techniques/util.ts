import { NO_EFFECTS, type CameraPose, type Composite, type Effects, type Frame, type ShotFrame, type Vec3, type WorldState } from './types';

export const SUBJECT_RADIUS = 0.5;
/** 캐릭터 중심 높이(구 반지름) */
export const SUBJECT_Y = SUBJECT_RADIUS;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (k: number) => {
  const x = clamp(k);
  return x * x * (3 - 2 * x);
};
/** t를 [a,b] 구간의 0~1 진행도로 */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const v3 = (x: number, y: number, z: number): Vec3 => [x, y, z];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const vlerp = (a: Vec3, b: Vec3, k: number): Vec3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const dist = (a: Vec3, b: Vec3) => len(sub(a, b));

/** 결정적 의사난수 노이즈(-1~1). 같은 입력이면 같은 값 */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u);
}

export function defaultWorld(sceneTime: number, patch: Partial<WorldState> = {}): WorldState {
  return {
    sceneTime,
    subject: { position: [0, SUBJECT_Y, 0], heading: 0, pose: 'idle' },
    timeOfDay: 0.15,
    props: {},
    ...patch,
  };
}

export function pose(position: Vec3, target: Vec3, fov = 45, roll = 0): CameraPose {
  return { position, target, fov, roll };
}

export function shot(id: string, camera: CameraPose, world: WorldState): ShotFrame {
  return { id, camera, world };
}

export function effects(patch: Partial<Effects> = {}): Effects {
  return { ...NO_EFFECTS, ...patch };
}

export function frame(t: number, shots: ShotFrame[], opts: { composite?: Composite; effects?: Partial<Effects>; timeScale?: number } = {}): Frame {
  return {
    t,
    shots,
    composite: opts.composite ?? { kind: 'single' },
    effects: effects(opts.effects),
    timeScale: opts.timeScale ?? 1,
  };
}

/** 한 샷짜리 프레임 */
export function single(t: number, camera: CameraPose, world: WorldState, opts: { id?: string; effects?: Partial<Effects>; timeScale?: number } = {}): Frame {
  return frame(t, [shot(opts.id ?? 'main', camera, world)], { effects: opts.effects, timeScale: opts.timeScale });
}

/** 구간 목록에서 t가 속한 구간 */
export function segmentAt<T extends { start: number; end: number }>(segments: T[], t: number): T {
  return segments.find((s) => t >= s.start && t < s.end) ?? segments[segments.length - 1];
}
