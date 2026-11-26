// C3 — 카메라 동작 의미 검사 (.forge/loop.md)
// 각 기법의 순수 sample(t)에서 카메라 pose·피사체 상태를 꺼내 정의를 단언한다.
import { describe, expect, it } from 'vitest';
import {
  angleDiff, azimuthAroundSubject, cam, cutCount, dist, impl, len, pitch, samples, samplesDt, sub, subj,
  subjectScreenFraction, unwrapRange, yaw, dot,
} from './helpers';
import { TOTAL } from './fixtures/technique-names';

const first = <T>(a: T[]) => a[0];
const last = <T>(a: T[]) => a[a.length - 1];
const range = (v: number[]) => Math.max(...v) - Math.min(...v);

describe('C3 공통', () => {
  it('모든 기법이 유한한 pose와 정상 화각', () => {
    for (let id = 1; id <= TOTAL; id++) {
      for (const f of samples(impl(id), 60)) {
        for (const s of f.shots) {
          for (const v of [...s.camera.position, ...s.camera.target, s.camera.fov, s.camera.roll]) expect(Number.isFinite(v), `#${id}`).toBe(true);
          expect(s.camera.fov, `#${id} fov`).toBeGreaterThan(1);
          expect(s.camera.fov, `#${id} fov`).toBeLessThan(179);
        }
      }
    }
  });
});

describe('C3 1부 카메라 무빙', () => {
  it('1 달리 인: 피사체 거리 감소, 화각 불변', () => {
    const fr = samples(impl(1));
    const d0 = dist(cam(fr[Math.floor(fr.length * 0.1)]).position, subj(fr[Math.floor(fr.length * 0.1)]));
    const d1 = dist(cam(fr[Math.floor(fr.length * 0.9)]).position, subj(fr[Math.floor(fr.length * 0.9)]));
    expect(d0).toBeGreaterThan(d1 * 1.3);
    expect(range(fr.map((f) => cam(f).fov))).toBeLessThan(0.01);
  });

  it('2 줌 인: 위치 불변, 화각 감소', () => {
    const fr = samples(impl(2));
    const p0 = cam(first(fr)).position;
    for (const f of fr) expect(dist(cam(f).position, p0)).toBeLessThan(1e-6);
    expect(cam(last(fr)).fov).toBeLessThan(cam(first(fr)).fov * 0.7);
  });

  it('3 팬·틸트: 위치 불변, 좌우(yaw)와 상하(pitch) 회전', () => {
    const fr = samples(impl(3));
    const p0 = cam(first(fr)).position;
    for (const f of fr) expect(dist(cam(f).position, p0)).toBeLessThan(1e-6);
    expect(unwrapRange(fr.map((f) => yaw(cam(f))))).toBeGreaterThanOrEqual(30);
    expect(range(fr.map((f) => pitch(cam(f))))).toBeGreaterThanOrEqual(15);
  });

  it('4 트래킹: 피사체와 같은 방향·속도로 이동, 거리 일정', () => {
    const fr = samples(impl(4));
    const sd = sub(subj(last(fr)), subj(first(fr)));
    const cd = sub(cam(last(fr)).position, cam(first(fr)).position);
    expect(len(sd)).toBeGreaterThanOrEqual(3);
    expect(dot(sd, cd) / (len(sd) * len(cd))).toBeGreaterThan(0.95);
    expect(Math.abs(len(cd) - len(sd)) / len(sd)).toBeLessThan(0.2);
    const ds = fr.map((f) => dist(cam(f).position, subj(f)));
    const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
    for (const d of ds) expect(Math.abs(d - mean) / mean).toBeLessThan(0.1);
  });

  it('5 크레인: 카메라가 높이 올라감(≥ 5)', () => {
    const fr = samples(impl(5));
    expect(cam(last(fr)).position[1] - cam(first(fr)).position[1]).toBeGreaterThanOrEqual(5);
  });

  it('6 달리 줌: 거리와 화각이 함께 변하고 피사체 화면 크기는 ±10%', () => {
    const fr = samples(impl(6));
    const d = fr.map((f) => dist(cam(f).position, subj(f)));
    expect(Math.max(...d) / Math.min(...d)).toBeGreaterThanOrEqual(1.5);
    expect(range(fr.map((f) => cam(f).fov))).toBeGreaterThan(10);
    const s0 = subjectScreenFraction(first(fr));
    for (const f of fr) expect(Math.abs(subjectScreenFraction(f) / s0 - 1)).toBeLessThanOrEqual(0.1);
  });

  it('7 아크: 피사체 거리 ±5%, 방위각 ≥ 60° 변화', () => {
    const fr = samples(impl(7));
    const d = fr.map((f) => dist(cam(f).position, subj(f)));
    const mean = d.reduce((a, b) => a + b, 0) / d.length;
    for (const x of d) expect(Math.abs(x - mean) / mean).toBeLessThanOrEqual(0.05);
    expect(unwrapRange(fr.map(azimuthAroundSubject))).toBeGreaterThanOrEqual(60);
  });

  it('8 크래시 줌: 0.3초 안에 화각 50% 이상 감소', () => {
    const fr = samplesDt(impl(8), 1 / 120);
    let ok = false;
    for (let i = 0; i < fr.length && !ok; i++) {
      for (let j = i + 1; j < fr.length && fr[j].t - fr[i].t <= 0.3; j++) {
        if (cam(fr[j]).fov <= cam(fr[i]).fov * 0.5) ok = true;
      }
    }
    expect(ok).toBe(true);
  });

  it('9 핸드헬드: 작은 고주파 흔들림이 있음', () => {
    const fr = samplesDt(impl(9), 1 / 60);
    const ps = fr.map((f) => cam(f).position);
    const k = 15; // 0.25초 이동평균
    let maxDev = 0;
    for (let i = k; i < ps.length - k; i++) {
      const avg = [0, 1, 2].map((a) => ps.slice(i - k, i + k + 1).reduce((s, p) => s + p[a], 0) / (2 * k + 1));
      maxDev = Math.max(maxDev, Math.hypot(ps[i][0] - avg[0], ps[i][1] - avg[1], ps[i][2] - avg[2]));
    }
    expect(maxDev).toBeGreaterThan(0.005);
    expect(maxDev).toBeLessThan(0.3);
  });
});

describe('C3 2부 앵글과 숏', () => {
  const mid = (id: number) => impl(id).sample(impl(id).duration / 2);

  it('10 하이 앵글: 카메라가 눈높이보다 높고 내려다봄', () => {
    for (const f of samples(impl(10), 20)) {
      expect(cam(f).position[1]).toBeGreaterThan(subj(f)[1] + 0.15 + 1);
      expect(pitch(cam(f))).toBeLessThan(-15);
    }
  });

  it('11 로우 앵글: 카메라가 눈높이보다 낮고 올려다봄', () => {
    for (const f of samples(impl(11), 20)) {
      expect(cam(f).position[1]).toBeLessThan(subj(f)[1] + 0.15);
      expect(pitch(cam(f))).toBeGreaterThan(10);
    }
  });

  it('12 버즈아이: 피치 ≤ -75°', () => {
    for (const f of samples(impl(12), 20)) expect(pitch(cam(f))).toBeLessThanOrEqual(-75);
  });

  it('13 더치: |roll| ≥ 10°', () => {
    expect(Math.abs(cam(mid(13)).roll)).toBeGreaterThanOrEqual(10);
  });

  it('14 익스트림 클로즈업: 피사체가 화면을 가득 채움', () => {
    expect(subjectScreenFraction(mid(14))).toBeGreaterThanOrEqual(0.9);
  });

  it('15 POV: 카메라가 캐릭터 눈 위치에 붙어 함께 이동', () => {
    const fr = samples(impl(15));
    for (const f of fr) expect(dist(cam(f).position, subj(f))).toBeLessThan(0.7);
    let path = 0;
    for (let i = 1; i < fr.length; i++) path += dist(cam(fr[i]).position, cam(fr[i - 1]).position);
    expect(path).toBeGreaterThan(0.5);
  });
});

describe('C3 그 밖의 카메라 정의', () => {
  it('20 휩 팬: 짧은 구간 yaw 각속도 ≥ 300°/s', () => {
    const fr = samplesDt(impl(20), 1 / 120);
    let maxRate = 0;
    for (let i = 1; i < fr.length; i++) {
      if (fr[i].shots[0].id !== fr[i - 1].shots[0].id) continue;
      maxRate = Math.max(maxRate, Math.abs(angleDiff(yaw(cam(fr[i])), yaw(cam(fr[i - 1])))) / (fr[i].t - fr[i - 1].t));
    }
    expect(maxRate).toBeGreaterThanOrEqual(300);
  });

  it('35 불릿 타임: 피사체 시간 정지 + 카메라 방위각 ≥ 90°', () => {
    const t = impl(35);
    const fr = samples(t);
    const frozen = fr.filter((f) => Math.abs(f.timeScale) < 0.05);
    expect(frozen.length).toBeGreaterThan(fr.length * 0.3);
    const st = frozen.map((f) => f.shots[0].world.sceneTime);
    expect(range(st)).toBeLessThan(0.05 * (last(frozen).t - first(frozen).t));
    expect(unwrapRange(frozen.map(azimuthAroundSubject))).toBeGreaterThanOrEqual(90);
  });

  it('50 원테이크: 컷 없음, pose 연속, 큰 이동', () => {
    const t = impl(50);
    expect(t.duration).toBeGreaterThanOrEqual(15);
    const fr = samplesDt(t, 1 / 30);
    expect(cutCount(fr)).toBe(0);
    let path = 0;
    for (let i = 1; i < fr.length; i++) {
      const step = dist(cam(fr[i]).position, cam(fr[i - 1]).position);
      expect(step).toBeLessThan(1.0);
      path += step;
    }
    expect(path).toBeGreaterThanOrEqual(30);
  });
});

describe('C3 8부 카메라·앵글 확장', () => {
  it('51 스노리캠: 카메라가 캐릭터에 고정(상대 위치 일정), 캐릭터는 ≥ 3 이동', () => {
    const fr = samples(impl(51));
    const rel = fr.map((f) => sub(cam(f).position, subj(f)));
    for (const r of rel) expect(dist(r, rel[0])).toBeLessThan(0.02);
    expect(dist(subj(first(fr)), subj(last(fr)))).toBeGreaterThanOrEqual(3);
  });

  it('52 에어리얼 숏: 높이 ≥ 15 유지, 수평 이동 ≥ 30', () => {
    const fr = samples(impl(52));
    for (const f of fr) expect(cam(f).position[1]).toBeGreaterThanOrEqual(15);
    const a = cam(first(fr)).position;
    const b = cam(last(fr)).position;
    expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThanOrEqual(30);
  });

  it('53 배럴 롤: 롤이 ≥ 270° 회전', () => {
    expect(range(samples(impl(53)).map((f) => cam(f).roll))).toBeGreaterThanOrEqual(270);
  });

  it('54 웜즈아이 뷰: 땅 높이(≤ 0.2)에서 ≥ 50° 올려다봄', () => {
    for (const f of samples(impl(54), 20)) {
      expect(cam(f).position[1]).toBeLessThanOrEqual(0.2);
      expect(pitch(cam(f))).toBeGreaterThanOrEqual(50);
    }
  });

  it('55 숏 사이즈: 컷 ≥ 4, 캐릭터 화면 비율이 컷마다 커져 처음 대비 ≥ 8배', () => {
    const fr = samplesDt(impl(55), 1 / 30);
    expect(cutCount(fr)).toBeGreaterThanOrEqual(4);
    const segs: number[] = [];
    for (let i = 0; i < fr.length; i++) {
      if (i === 0 || fr[i].shots[0].id !== fr[i - 1].shots[0].id) segs.push(subjectScreenFraction(fr[i]));
    }
    for (let i = 1; i < segs.length; i++) expect(segs[i]).toBeGreaterThan(segs[i - 1]);
    expect(segs[segs.length - 1] / segs[0]).toBeGreaterThanOrEqual(8);
  });

  it('56 설정 숏: 아주 넓은 숏(캐릭터 ≤ 5%)으로 시작해 컷 후 가까운 숏(≥ 30%)', () => {
    const fr = samplesDt(impl(56), 1 / 30);
    expect(subjectScreenFraction(fr[0])).toBeLessThanOrEqual(0.05);
    expect(cutCount(fr)).toBeGreaterThanOrEqual(1);
    expect(subjectScreenFraction(last(fr))).toBeGreaterThanOrEqual(0.3);
  });
});

describe('C3 9부 대화 문법', () => {
  /** 두 인물을 잇는 축의 어느 쪽에 카메라가 있는지(부호) */
  const side = (f: ReturnType<typeof impl>['sample'] extends (t: number) => infer F ? F : never) => {
    const a = subj(f);
    const b = f.shots[0].world.props.partner as [number, number, number];
    const p = cam(f).position;
    return Math.sign((b[0] - a[0]) * (p[2] - a[2]) - (b[2] - a[2]) * (p[0] - a[0]));
  };

  it('57 180도 규칙: 지키는 샷은 모두 축 한쪽, 넘는 샷(axisCrossed)은 반대쪽', () => {
    const fr = samplesDt(impl(57), 1 / 30);
    const keep = fr.filter((f) => f.shots[0].world.props.axisCrossed !== true);
    const cross = fr.filter((f) => f.shots[0].world.props.axisCrossed === true);
    expect(keep.length).toBeGreaterThan(10);
    expect(cross.length).toBeGreaterThan(10);
    expect(cutCount(keep)).toBeGreaterThanOrEqual(1);
    const s0 = side(keep[0]);
    for (const f of keep) expect(side(f)).toBe(s0);
    for (const f of cross) expect(side(f)).toBe(-s0);
  });

  it('58 숏/리버스 숏: 컷 ≥ 3, 어깨 너머(상대 인물 가까이)에서 번갈아 촬영', () => {
    const fr = samplesDt(impl(58), 1 / 30);
    expect(cutCount(fr)).toBeGreaterThanOrEqual(3);
    let aShots = 0;
    let bShots = 0;
    for (const f of fr) {
      const partner = f.shots[0].world.props.partner as [number, number, number];
      const c = cam(f);
      if (dist(c.position, partner) < 1.3 && dist(c.target, subj(f)) < 0.8) aShots++;
      if (dist(c.position, subj(f)) < 1.3 && dist(c.target, partner) < 0.8) bShots++;
    }
    expect(aShots).toBeGreaterThan(10);
    expect(bShots).toBeGreaterThan(10);
  });
});
