// main.js — browser entry point. Collects DOM mounts and starts the app.
import { AppController } from './AppController.js';

const dom = {
  canvas: document.getElementById('gpu-canvas'),
  overlay: document.getElementById('overlay'),
  viewport: document.getElementById('viewport'),
  unsupported: document.getElementById('unsupported'),
  chipStack: document.getElementById('chip-stack-mount'),
  paramPanel: document.getElementById('parameter-panel-mount'),
  debugPanel: document.getElementById('debug-panel-mount'),
  presetBar: document.getElementById('preset-bar-mount'),
  projectMenu: document.getElementById('project-menu-mount'),
  timeline: document.getElementById('timeline-mount'),
  notifications: document.getElementById('notifications-mount'),
};

const app = new AppController(dom);
// test hook (browser integration/visual specs drive deterministic frames)
window.__meteorApp = app;
app.start()
  .then(() => { window.__meteorReady = true; })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    window.__meteorError = e.message;
    dom.unsupported.hidden = false;
    dom.unsupported.querySelector('p').textContent = e.message;
  });
