// 기법 계약: 모든 기법은 순수 함수 sample(t)로 "그 순간의 촬영 상태"를 돌려준다.
// 렌더러는 이 값을 그대로 화면에 옮기고, 테스트는 같은 값을 수학적으로 검사한다.

export type Vec3 = [number, number, number];

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  /** 세로 화각(도) */
  fov: number;
  /** 카메라 롤(도). 더치 앵글 등 */
  roll: number;
}

export interface SubjectState {
  position: Vec3;
  /** 바라보는 방향(라디안, +z 기준 y축 회전) */
  heading: number;
  /** 표정/동작 힌트 */
  pose?: 'idle' | 'walk' | 'run' | 'jump' | 'sit' | 'surprised' | 'sad' | 'happy' | 'cry';
  /** 0~1 찌그러짐(점프 착지 등) */
  squash?: number;
}

export type PropValue = number | boolean | string | Vec3;

export interface WorldState {
  /** 장면 안의 시간(초). 캐릭터·소품 애니메이션이 이 값을 따른다 */
  sceneTime: number;
  subject: SubjectState;
  /** 0 = 한낮, 0.5 = 노을, 1 = 밤 */
  timeOfDay: number;
  props: Record<string, PropValue>;
}

export interface ShotFrame {
  /** 샷 식별자. 값이 바뀌면 컷 */
  id: string;
  camera: CameraPose;
  world: WorldState;
}

export type Composite =
  | { kind: 'single' }
  | { kind: 'dissolve'; alpha: number }
  | { kind: 'wipe'; progress: number; angle: number }
  | { kind: 'iris'; radius: number }
  | { kind: 'split'; panes: number }
  | { kind: 'ripple'; alpha: number; amp: number }
  | { kind: 'double'; amount: number };

export interface DepthOfField {
  focusDistance: number;
  /** 0~1 흐림 세기 */
  aperture: number;
}

export interface Effects {
  /** 1 = 정상, 0 = 검정 */
  brightness: number;
  grayscale: number;
  /** 셀렉티브 컬러로 남길 색상(도, 0~360). grayscale과 함께 쓴다 */
  selectiveHue: number | null;
  sepia: number;
  vignette: number;
  /** 레터박스 목표 화면비(예: 2.39). 0이면 없음 */
  letterbox: number;
  grain: number;
  colorGrade: number;
  dayForNight: number;
  fisheye: number;
  tiltShift: number;
  motionBlur: number;
  dof: DepthOfField | null;
  bokeh: number;
  flare: number;
  godRays: number;
  /** 화면 전체가 하얗게 번쩍임(0~1) */
  flash: number;
  /** 아나모픽 렌즈: 가로 빛줄기·타원 보케 */
  anamorphic: number;
  /** 글리치·VHS: 색 어긋남·주사선·줄 밀림 */
  glitch: number;
}

export interface Frame {
  t: number;
  /** 화면에 쓰이는 샷들. composite가 single이면 1개 */
  shots: ShotFrame[];
  composite: Composite;
  effects: Effects;
  /** 장면 시간 / 실제 시간 비율(슬로 < 1, 정지 = 0, 역재생 < 0) */
  timeScale: number;
}

export interface PartInfo {
  part: number;
  partName: string;
}

export interface TechniqueImpl {
  id: number;
  /** 한 번 재생 길이(초). 반복 재생 */
  duration: number;
  sample(t: number): Frame;
  /** 이 기법이 쓰는 소품 이름(장면에서 표시할 것) */
  props?: string[];
  /** 자리표시자 구현 여부(기반 작업에서만 true) */
  placeholder?: boolean;
}

export const NO_EFFECTS: Effects = {
  brightness: 1,
  grayscale: 0,
  selectiveHue: null,
  sepia: 0,
  vignette: 0,
  letterbox: 0,
  grain: 0,
  colorGrade: 0,
  dayForNight: 0,
  fisheye: 0,
  tiltShift: 0,
  motionBlur: 0,
  dof: null,
  bokeh: 0,
  flare: 0,
  godRays: 0,
  flash: 0,
  anamorphic: 0,
  glitch: 0,
};
