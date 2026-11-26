import type { TechniqueImpl } from './types';
import { placeholder } from './placeholder';
import { CAMERA_TECHNIQUES } from './camera';
import { TRANSITION_TECHNIQUES } from './transitions';
import { TIME_TECHNIQUES } from './time';
import { LOOK_TECHNIQUES } from './look';
import { EXTRA_TECHNIQUES } from './extra';
import { TECHNIQUES } from '../data/techniques';

const implemented: TechniqueImpl[] = [...CAMERA_TECHNIQUES, ...TRANSITION_TECHNIQUES, ...TIME_TECHNIQUES, ...LOOK_TECHNIQUES, ...EXTRA_TECHNIQUES];

export const IMPLS: Map<number, TechniqueImpl> = new Map();
for (const { id } of TECHNIQUES) IMPLS.set(id, implemented.find((t) => t.id === id) ?? placeholder(id));

export function getImpl(id: number): TechniqueImpl {
  const impl = IMPLS.get(id);
  if (!impl) throw new Error(`unknown technique ${id}`);
  return impl;
}
