import type * as THREE from 'three';
import type { WorldState } from '../techniques/types';

// 기법별 소품. 기법 구현의 `props` 목록에 이름을 넣으면 장면에 켜진다.
// 각 소품은 world.props 값을 읽어 스스로 움직인다.

export interface PropInstance {
  object: THREE.Object3D;
  update?(world: WorldState): void;
}

export interface PropDef {
  create(): PropInstance;
}

export const PROP_DEFS: Record<string, PropDef> = {};

/** 소품 모듈이 자기 소품을 등록할 때 쓴다 */
export function registerProps(defs: Record<string, PropDef>) {
  Object.assign(PROP_DEFS, defs);
}
