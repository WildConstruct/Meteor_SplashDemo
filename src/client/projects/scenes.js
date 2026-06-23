// Bundled demo scenes (plate + starter project). The flagship is the top-down
// "two distinct surface patches" plate, where the car body acts as the raised
// relief that wetness/flow divides around. The 3/4 plates ship with starter
// calibration — drag the A·B·C·D quad handles to fit.

import topdown from './hard-surface-topdown.meteor.json';
import tesla from './tesla-model3.meteor.json';
import ioniq from './ioniq5-split.meteor.json';
import synthetic from './car-hood-demo.meteor.json';

// Respect Vite's base path so assets resolve under a GitHub Pages project subpath.
const BASE = import.meta.env.BASE_URL;

export const SCENES = [
  {
    id: 'hard-surface-topdown',
    name: 'Hard-Surface (top-down: asphalt | concrete)',
    plateUrl: `${BASE}assets/demo/hard-surface-topdown.png`,
    project: topdown,
  },
  {
    id: 'tesla-model3',
    name: 'Tesla Model 3 (3/4 — hood + ground)',
    plateUrl: `${BASE}assets/demo/tesla-model3.png`,
    project: tesla,
  },
  {
    id: 'ioniq5-split',
    name: 'Hyundai Ioniq 5 (3/4 — hood + ground)',
    plateUrl: `${BASE}assets/demo/ioniq5-split.png`,
    project: ioniq,
  },
  {
    id: 'car-hood-demo',
    name: 'Synthetic (procedural fallback)',
    plateUrl: `${BASE}assets/demo/car-hood-demo.png`,
    project: synthetic,
  },
];

export const DEFAULT_SCENE_ID = 'hard-surface-topdown';

export function getScene(id) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
