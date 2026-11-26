import './style.css';
import { TECHNIQUES } from './data/techniques';
import { bindControls, buildSidebar, buildTimeline, showInfo, updateLive } from './ui/app';
import { Stage } from './view/stage';

const params = new URLSearchParams(location.search);
const requested = Number(params.get('technique'));
const initialId = TECHNIQUES.some((t) => t.id === requested) ? requested : 1;

const stage = new Stage(
  document.getElementById('director-canvas') as HTMLCanvasElement,
  document.getElementById('camera-canvas') as HTMLCanvasElement,
  initialId,
);

function select(id: number) {
  stage.select(id);
  showInfo(id);
  buildTimeline(stage);
  const url = new URL(location.href);
  url.searchParams.set('technique', String(id));
  url.searchParams.delete('t');
  history.replaceState(null, '', url);
}

buildSidebar(select);
const syncPlay = bindControls(stage);
stage.onTick(updateLive);
showInfo(initialId);
buildTimeline(stage);

const ro = new ResizeObserver(() => stage.resize());
ro.observe(document.getElementById('views')!);
stage.resize();

const tParam = params.get('t');
if (tParam !== null) {
  stage.playing = false;
  stage.seek(Number(tParam));
  syncPlay();
}
stage.start();

// 테스트·디버그용 API
declare global {
  interface Window {
    __ft: {
      ready: boolean;
      select(id: number): void;
      seek(t: number): void;
      pause(): void;
      play(): void;
      renderNow(): void;
      getState(): ReturnType<Stage['debugState']>;
      hasCameraRig(): boolean;
    };
  }
}

window.__ft = {
  ready: true,
  select,
  seek: (t) => {
    stage.playing = false;
    syncPlay();
    stage.seek(t);
  },
  pause: () => {
    stage.playing = false;
    syncPlay();
  },
  play: () => {
    stage.playing = true;
    syncPlay();
  },
  renderNow: () => stage.renderNow(),
  getState: () => stage.debugState(),
  hasCameraRig: () => stage.director.visibleRigCount() > 0,
};
