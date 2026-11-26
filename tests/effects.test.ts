// C4 — 효과 메커니즘 검사 (.forge/loop.md)
// 카메라 pose로 판정되지 않는 기법은 sample(t)의 샷 구성·전환·시간·효과 값으로 정의를 단언한다.
import { describe, expect, it } from 'vitest';
import type { Frame, Vec3 } from '../src/techniques/types';
import { activePasses } from '../src/view/composite';
import { cam, cutCount, dist, impl, len, project, samples, samplesDt, segments, sub, subj } from './helpers';

const range = (v: number[]) => Math.max(...v) - Math.min(...v);
const st = (f: Frame) => f.shots[0].world.sceneTime;
const passesOf = (f: Frame) => activePasses(f.composite, f.effects);
const anyFrame = (id: number, pred: (f: Frame) => boolean, n = 240) => samples(impl(id), n).some(pred);
const vec = (v: unknown): Vec3 => {
  expect(Array.isArray(v) && v.length === 3).toBe(true);
  return v as Vec3;
};

describe('C4 공통', () => {
  it('50개 모두 자리표시자가 아님', () => {
    for (let id = 1; id <= 50; id++) expect(impl(id).placeholder === true, `#${id} placeholder`).toBe(false);
  });
});

describe('C4 점프 컷·장면 전환', () => {
  it('16 점프 컷: 같은 구도, 시간 불연속 컷 ≥ 2', () => {
    const fr = samplesDt(impl(16), 1 / 60);
    const p0 = cam(fr[0]);
    for (const f of fr) {
      expect(dist(cam(f).position, p0.position)).toBeLessThan(1e-6);
      expect(dist(cam(f).target, p0.target)).toBeLessThan(1e-6);
      expect(Math.abs(cam(f).fov - p0.fov)).toBeLessThan(1e-6);
    }
    let jumps = 0;
    for (let i = 1; i < fr.length; i++) if (Math.abs(st(fr[i]) - st(fr[i - 1])) > 0.5) jumps++;
    expect(cutCount(fr)).toBeGreaterThanOrEqual(2);
    expect(jumps).toBeGreaterThanOrEqual(2);
  });

  it('17 디졸브: 중간에 두 샷이 0<α<1로 섞이고, 두 샷의 시간대가 다름', () => {
    const blends = samples(impl(17)).filter((f) => f.composite.kind === 'dissolve' && f.composite.alpha > 0.05 && f.composite.alpha < 0.95);
    expect(blends.length).toBeGreaterThan(10);
    for (const f of blends) {
      expect(f.shots.length).toBe(2);
      expect(Math.abs(f.shots[0].world.timeOfDay - f.shots[1].world.timeOfDay)).toBeGreaterThan(0.2);
    }
  });

  it('18 와이프: 경계선 진행도가 0→1로 이동', () => {
    const w = samples(impl(18)).filter((f) => f.composite.kind === 'wipe');
    expect(w.length).toBeGreaterThan(10);
    const prog = w.map((f) => (f.composite.kind === 'wipe' ? f.composite.progress : 0));
    expect(Math.min(...prog)).toBeLessThan(0.1);
    expect(Math.max(...prog)).toBeGreaterThan(0.9);
    for (let i = 1; i < prog.length; i++) expect(prog[i]).toBeGreaterThanOrEqual(prog[i - 1] - 1e-9);
  });

  it('19 매치 컷: 컷 직전 달과 컷 직후 캐릭터가 같은 자리·비슷한 크기', () => {
    const fr = samplesDt(impl(19), 1 / 60);
    const i = fr.findIndex((f, k) => k > 0 && f.shots[0].id !== fr[k - 1].shots[0].id);
    expect(i).toBeGreaterThan(0);
    const before = fr[i - 1];
    const after = fr[i];
    const moon = vec(before.shots[0].world.props.moon);
    const moonR = before.shots[0].world.props.moonRadius as number;
    expect(typeof moonR).toBe('number');
    const a = project(cam(before), moon);
    const b = project(cam(after), subj(after));
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(0.15);
    const sizeA = Math.atan(moonR / dist(cam(before).position, moon)) / cam(before).fov;
    const sizeB = Math.atan(0.5 / dist(cam(after).position, subj(after))) / cam(after).fov;
    expect(sizeA / sizeB).toBeGreaterThan(0.7);
    expect(sizeA / sizeB).toBeLessThan(1.4);
  });

  it('21 스매시 컷: 고요(≤0.1)에서 소란(≥0.9)으로 한 프레임에 급변', () => {
    const fr = samplesDt(impl(21), 1 / 60);
    let ok = false;
    for (let i = 1; i < fr.length; i++) {
      const a = fr[i - 1].shots[0].world.props.loudness as number;
      const b = fr[i].shots[0].world.props.loudness as number;
      if (fr[i].shots[0].id !== fr[i - 1].shots[0].id && a <= 0.1 && b >= 0.9) ok = true;
    }
    expect(ok).toBe(true);
  });

  it('22 아이리스: 원형 마스크 반경이 ≥0.9에서 ≤0.05까지 변함', () => {
    const r = samples(impl(22)).filter((f) => f.composite.kind === 'iris').map((f) => (f.composite.kind === 'iris' ? f.composite.radius : 1));
    expect(r.length).toBeGreaterThan(10);
    expect(Math.max(...r)).toBeGreaterThanOrEqual(0.9);
    expect(Math.min(...r)).toBeLessThanOrEqual(0.05);
  });

  it('23 페이드 아웃: 밝기가 1에서 0으로', () => {
    const b = samples(impl(23)).map((f) => f.effects.brightness);
    expect(Math.max(...b)).toBeGreaterThanOrEqual(0.99);
    expect(Math.min(...b)).toBeLessThanOrEqual(0.02);
  });
});

describe('C4 편집 기법', () => {
  it('24 몽타주: 짧은 샷(≤2.5초) ≥ 4개', () => {
    const segs = segments(samplesDt(impl(24), 1 / 60));
    const short = segs.filter((s) => s.to - s.from <= 2.5);
    expect(new Set(short.map((s) => s.id)).size).toBeGreaterThanOrEqual(4);
  });

  it('25 교차 편집: 두 줄기가 번갈아 ≥ 4회, 뒤로 갈수록 짧아짐', () => {
    const segs = segments(samplesDt(impl(25), 1 / 60));
    const lines = segs.map((s) => s.frames[0].shots[0].world.props.line);
    expect(new Set(lines).size).toBe(2);
    let alt = 0;
    for (let i = 1; i < lines.length; i++) if (lines[i] !== lines[i - 1]) alt++;
    expect(alt).toBeGreaterThanOrEqual(4);
    const dur = segs.map((s) => s.to - s.from);
    expect(dur[dur.length - 1]).toBeLessThan(dur[0]);
  });

  it('26 분할 화면: 화면 영역 ≥ 2, 샷 ≥ 2 동시', () => {
    expect(anyFrame(26, (f) => f.composite.kind === 'split' && f.composite.panes >= 2 && f.shots.length >= 2)).toBe(true);
  });

  it('27 인서트: 같은 줄기 사이에 ≤2초 디테일 샷이 끼어듦', () => {
    const segs = segments(samplesDt(impl(27), 1 / 60));
    let ok = false;
    for (let i = 1; i < segs.length - 1; i++) {
      const ins = segs[i];
      const detail = cam(ins.frames[0]).fov <= 25 || dist(cam(ins.frames[0]).position, cam(ins.frames[0]).target) <= 2;
      if (ins.to - ins.from <= 2 && segs[i - 1].id === segs[i + 1].id && ins.id !== segs[i - 1].id && detail) ok = true;
    }
    expect(ok).toBe(true);
  });

  it('28 플래시백: 과거 샷만 세피아+비네트, 현재 샷은 없음', () => {
    const fr = samples(impl(28));
    const past = fr.filter((f) => f.effects.sepia >= 0.5);
    const now = fr.filter((f) => f.effects.sepia === 0);
    expect(past.length).toBeGreaterThan(10);
    expect(now.length).toBeGreaterThan(10);
    for (const f of past) expect(f.effects.vignette).toBeGreaterThan(0);
    expect(new Set(past.map((f) => f.shots[0].id)).size).toBeGreaterThanOrEqual(1);
    const pastIds = new Set(past.map((f) => f.shots[0].id));
    for (const f of now) expect(pastIds.has(f.shots[0].id)).toBe(false);
  });
});

describe('C4 시간', () => {
  /** 장면 시간의 실제 변화율 */
  const rates = (id: number, dt = 1 / 60) => {
    const fr = samplesDt(impl(id), dt);
    return fr.slice(1).map((f, i) => ({ f, rate: (st(f) - st(fr[i])) / dt, cut: f.shots[0].id !== fr[i].shots[0].id }));
  };

  it('29 슬로 모션: 대부분 timeScale ≤ 0.5 이고 실제 장면 시간도 느림', () => {
    const r = rates(29).filter((x) => !x.cut);
    const slow = r.filter((x) => x.f.timeScale <= 0.5 && x.rate <= 0.5 + 1e-6 && x.rate > 0);
    expect(slow.length).toBeGreaterThan(r.length * 0.5);
  });

  it('30 타임랩스: timeScale ≥ 20, 시간대 변화 ≥ 0.3', () => {
    const fr = samples(impl(30));
    expect(Math.max(...fr.map((f) => f.timeScale))).toBeGreaterThanOrEqual(20);
    expect(range(fr.map((f) => f.shots[0].world.timeOfDay))).toBeGreaterThanOrEqual(0.3);
  });

  it('31 스피드 램프: 속도 비 ≥ 4, 연속적으로 변함', () => {
    const fr = samplesDt(impl(31), 1 / 60);
    const ts = fr.map((f) => f.timeScale);
    expect(Math.max(...ts) / Math.max(1e-6, Math.min(...ts))).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < ts.length; i++) expect(Math.abs(ts[i] - ts[i - 1])).toBeLessThan(Math.max(ts[i], ts[i - 1]) * 0.5 + 1e-6);
  });

  it('32 프리즈 프레임: ≥ 1초 정지 구간과 움직이는 구간이 모두 있음', () => {
    const r = rates(32);
    let run = 0;
    let best = 0;
    for (const x of r) {
      run = x.f.timeScale === 0 && Math.abs(x.rate) < 1e-9 ? run + 1 / 60 : 0;
      best = Math.max(best, run);
    }
    expect(best).toBeGreaterThanOrEqual(1);
    expect(r.some((x) => x.rate > 0.5)).toBe(true);
  });

  it('33 리버스: ≥ 1초 동안 장면 시간이 거꾸로 흐름', () => {
    const r = rates(33);
    const back = r.filter((x) => x.rate < 0 && x.f.timeScale < 0);
    expect(back.length / 60).toBeGreaterThanOrEqual(1);
  });

  it('34 하이퍼랩스: timeScale ≥ 10, 카메라 이동 ≥ 10', () => {
    const fr = samples(impl(34));
    expect(Math.max(...fr.map((f) => f.timeScale))).toBeGreaterThanOrEqual(10);
    expect(dist(cam(fr[0]).position, cam(fr[fr.length - 1]).position)).toBeGreaterThanOrEqual(10);
  });

  it('36 스톱모션: 계단식 움직임(정지 비율 ≥ 60%, 총 이동 > 1)', () => {
    const fr = samplesDt(impl(36), 1 / 60);
    const blocks = (f: Frame) => vec(f.shots[0].world.props.blockLead);
    let still = 0;
    let total = 0;
    for (let i = 1; i < fr.length; i++) {
      const d = dist(blocks(fr[i]), blocks(fr[i - 1]));
      if (d < 1e-9) still++;
      total += d;
    }
    expect(still / (fr.length - 1)).toBeGreaterThanOrEqual(0.6);
    expect(total).toBeGreaterThan(1);
  });
});

describe('C4 렌즈·빛·색·룩', () => {
  const has = (id: number, pass: string) => expect(anyFrame(id, (f) => passesOf(f).includes(pass)), `#${id} ${pass}`).toBe(true);

  it('37 랙 포커스: 초점이 꽃(가까이)에서 캐릭터(멀리)로', () => {
    const fr = samples(impl(37)).filter((f) => f.effects.dof);
    expect(fr.length).toBeGreaterThan(10);
    const f0 = fr[0];
    const f1 = fr[fr.length - 1];
    const flower = vec(f0.shots[0].world.props.flower);
    const dFlower = dist(cam(f0).position, flower);
    const dSubj = dist(cam(f1).position, subj(f1));
    expect(Math.abs(f0.effects.dof!.focusDistance - dFlower) / dFlower).toBeLessThan(0.3);
    expect(Math.abs(f1.effects.dof!.focusDistance - dSubj) / dSubj).toBeLessThan(0.3);
    expect(dSubj).toBeGreaterThan(dFlower * 2);
  });

  it('38 렌즈 플레어: 플레어 패스 활성', () => has(38, 'flare'));

  it('39 카메라 셰이크: 순간적으로 크게 흔들리고 금방 멈춤', () => {
    const fr = samplesDt(impl(39), 1 / 60);
    const base = fr.map((f) => vec(f.shots[0].world.props.cameraBase ?? cam(f).position));
    const dev = fr.map((f, i) => len(sub(cam(f).position, base[i])));
    const peak = Math.max(...dev);
    expect(peak).toBeGreaterThanOrEqual(0.1);
    const tail = dev.slice(Math.floor(dev.length * 0.7));
    expect(Math.max(...tail)).toBeLessThan(peak * 0.2);
  });

  it('40 모션 블러: 블러 패스 + 움직이는 기차', () => {
    has(40, 'motionBlur');
    const fr = samples(impl(40));
    expect(range(fr.map((f) => f.shots[0].world.props.trainX as number))).toBeGreaterThan(5);
  });

  it('41 컬러 그레이딩: 그레이딩 패스 활성', () => has(41, 'colorGrade'));

  it('42 레터박스: 화면비 ≈ 2.39', () => {
    const lb = samples(impl(42)).map((f) => f.effects.letterbox).filter((x) => x > 0);
    expect(lb.length).toBeGreaterThan(10);
    for (const x of lb) expect(Math.abs(x - 2.39)).toBeLessThanOrEqual(0.02);
  });

  it('43 보케: 피사계 심도 + 보케 패스', () => {
    has(43, 'bokeh');
    has(43, 'dof');
  });

  it('44 틸트 시프트: 패스 활성 + 높은 곳에서 내려다봄', () => {
    has(44, 'tiltShift');
    for (const f of samples(impl(44), 20)) {
      const d = sub(cam(f).target, cam(f).position);
      expect(Math.atan2(d[1], Math.hypot(d[0], d[2])) * (180 / Math.PI)).toBeLessThan(-20);
    }
  });

  it('45 어안: 패스 활성 + 화각 ≥ 100°', () => {
    has(45, 'fisheye');
    expect(anyFrame(45, (f) => f.effects.fisheye > 0 && cam(f).fov >= 100)).toBe(true);
  });

  it('46 갓레이: 패스 활성', () => has(46, 'godRays'));

  it('47 셀렉티브 컬러: 흑백 ≥ 0.9 + 주황 색상만 남김', () => {
    expect(
      anyFrame(47, (f) => f.effects.grayscale >= 0.9 && f.effects.selectiveHue !== null && Math.abs(f.effects.selectiveHue - 30) <= 15),
    ).toBe(true);
    has(47, 'selectiveColor');
  });

  it('48 데이 포 나이트: 낮에 찍은 장면(timeOfDay ≤ 0.3)에 밤 보정 ≥ 0.8', () => {
    expect(anyFrame(48, (f) => f.effects.dayForNight >= 0.8 && f.shots[0].world.timeOfDay <= 0.3)).toBe(true);
  });

  it('49 필름 그레인: 패스 활성', () => has(49, 'grain'));
});
