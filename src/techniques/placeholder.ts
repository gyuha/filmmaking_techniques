import type { TechniqueImpl } from './types';
import { defaultWorld, pose, single } from './util';

/** 기반 작업용 자리표시자: 모든 기법이 같은 정적 화면을 쓴다(C3~C6은 실패하는 게 정상) */
export function placeholder(id: number): TechniqueImpl {
  return {
    id,
    duration: 4,
    placeholder: true,
    sample: (t) => single(t, pose([0, 1.6, 8], [0, 0.6, 0], 45), defaultWorld(t)),
  };
}
