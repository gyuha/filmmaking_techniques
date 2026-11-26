import type { TechniqueImpl } from './types';
import { placeholder } from './placeholder';
import { CAMERA_TECHNIQUES } from './camera';
import { TRANSITION_TECHNIQUES } from './transitions';
import { TIME_TECHNIQUES } from './time';
import { LOOK_TECHNIQUES } from './look';

const implemented: TechniqueImpl[] = [...CAMERA_TECHNIQUES, ...TRANSITION_TECHNIQUES, ...TIME_TECHNIQUES, ...LOOK_TECHNIQUES];

export const IMPLS: Map<number, TechniqueImpl> = new Map();
for (let id = 1; id <= 50; id++) IMPLS.set(id, implemented.find((t) => t.id === id) ?? placeholder(id));

export function getImpl(id: number): TechniqueImpl {
  const impl = IMPLS.get(id);
  if (!impl) throw new Error(`unknown technique ${id}`);
  return impl;
}
