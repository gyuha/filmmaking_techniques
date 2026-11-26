import { getImpl } from '../src/techniques';
import type { CameraPose, Frame, TechniqueImpl, Vec3 } from '../src/techniques/types';

export const R = 0.5; // 캐릭터 반지름

export function impl(id: number): TechniqueImpl {
  return getImpl(id);
}

/** 0..duration 을 n 등분해 샘플 */
export function samples(t: TechniqueImpl, n = 240): Frame[] {
  return Array.from({ length: n + 1 }, (_, i) => t.sample((t.duration * i) / n));
}

/** 일정 간격 dt로 샘플 */
export function samplesDt(t: TechniqueImpl, dt: number): Frame[] {
  const out: Frame[] = [];
  for (let x = 0; x <= t.duration + 1e-9; x += dt) out.push(t.sample(x));
  return out;
}

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const dist = (a: Vec3, b: Vec3) => len(sub(a, b));
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const deg = (r: number) => (r * 180) / Math.PI;

export const cam = (f: Frame): CameraPose => f.shots[0].camera;
export const subj = (f: Frame): Vec3 => f.shots[0].world.subject.position;

/** 카메라가 바라보는 방위각(도): +x 쪽이 +, -z 정면이 0 */
export function yaw(p: CameraPose) {
  const d = sub(p.target, p.position);
  return deg(Math.atan2(d[0], -d[2]));
}

/** 카메라 피치(도): 위를 보면 +, 아래를 보면 - */
export function pitch(p: CameraPose) {
  const d = sub(p.target, p.position);
  return deg(Math.atan2(d[1], Math.hypot(d[0], d[2])));
}

/** 각도 차이를 -180~180 으로 */
export function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/** 누적 방위각 변화량(펼친 값) */
export function unwrapRange(values: number[]) {
  let acc = 0;
  let min = 0;
  let max = 0;
  for (let i = 1; i < values.length; i++) {
    acc += angleDiff(values[i], values[i - 1]);
    min = Math.min(min, acc);
    max = Math.max(max, acc);
  }
  return max - min;
}

/** 캐릭터가 화면 세로에서 차지하는 비율 */
export function subjectScreenFraction(f: Frame) {
  const p = cam(f);
  const d = dist(p.position, subj(f));
  return (2 * Math.atan(R / d)) / ((p.fov * Math.PI) / 180);
}

/** 카메라 기준 피사체 방위각(도) — 피사체를 중심으로 카메라가 어디 있는가 */
export function azimuthAroundSubject(f: Frame) {
  const d = sub(cam(f).position, subj(f));
  return deg(Math.atan2(d[0], d[2]));
}

/** 월드 점을 샷 카메라로 투영한 NDC 좌표(x,y ∈ -1..1) */
export function project(p: CameraPose, point: Vec3, aspect = 16 / 9): [number, number, number] {
  const fwd = norm(sub(p.target, p.position));
  const worldUp: Vec3 = [0, 1, 0];
  let right = norm(cross(fwd, worldUp));
  let up = cross(right, fwd);
  const r = (p.roll * Math.PI) / 180;
  if (r) {
    const r2 = add(scale(right, Math.cos(r)), scale(up, Math.sin(r)));
    const u2 = add(scale(up, Math.cos(r)), scale(right, -Math.sin(r)));
    right = r2;
    up = u2;
  }
  const v = sub(point, p.position);
  const z = dot(v, fwd);
  const th = Math.tan(((p.fov / 2) * Math.PI) / 180);
  return [dot(v, right) / (z * th * aspect), dot(v, up) / (z * th), z];
}

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: Vec3): Vec3 => scale(a, 1 / (len(a) || 1));

/** 연속 샘플에서 샷 id가 바뀐 횟수(컷 수) */
export function cutCount(frames: Frame[]) {
  let n = 0;
  for (let i = 1; i < frames.length; i++) if (frames[i].shots[0].id !== frames[i - 1].shots[0].id) n++;
  return n;
}

/** 연속된 같은 샷 id 구간 */
export function segments(frames: Frame[]) {
  const segs: { id: string; from: number; to: number; frames: Frame[] }[] = [];
  for (const f of frames) {
    const id = f.shots[0].id;
    const last = segs[segs.length - 1];
    if (last && last.id === id) {
      last.to = f.t;
      last.frames.push(f);
    } else segs.push({ id, from: f.t, to: f.t, frames: [f] });
  }
  return segs;
}
