// AppController — wires the browser host, the host-neutral engine, the editor
// overlay, the timeline, and the UI panels (build plan §7). Owns the animation
// loop and translates UI time into explicit frameIndex/timeSeconds for the engine.

import { MeteorEngine } from '../engine/index.js';
import { BrowserHost } from './BrowserHost.js';
import { loadShaderSources } from './ShaderSourceManifest.js';
import { loadImageBitmap, uploadImageTexture, loadMicroNormal } from './BrowserAssetLoader.js';
import { ClientState } from './ClientState.js';
import { loadAndValidate } from './serialization/ProjectMigration.js';
import { TimelineController } from './timeline/TimelineController.js';
import { EditorController } from './editor/EditorController.js';
import { ParameterPanel } from './ui/ParameterPanel.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { PresetBar } from './ui/PresetBar.js';
import { ProjectMenu } from './ui/ProjectMenu.js';
import { ChipStack } from './ui/ChipStack.js';
import { Notifications } from './ui/Notifications.js';
import { ScenePicker } from './ui/ScenePicker.js';
import { getScene, DEFAULT_SCENE_ID } from './projects/scenes.js';

const MICRO_URL = `${import.meta.env.BASE_URL}assets/normals/wet-micro-normal.png`;

export class AppController {
  constructor(dom) {
    this.dom = dom;
    this.state = new ClientState();
    this.notify = new Notifications(dom.notifications);
    this.projectDirty = false;
    this.inputTexture = null;
    this._frameTimes = [];
  }

  async start() {
    // True capability check: only this case is genuinely "WebGPU unavailable".
    if (!BrowserHost.isSupported()) {
      this._showStartupError(
        'WebGPU is not available',
        'navigator.gpu is undefined in this browser/context. WebGPU needs a '
          + 'secure context (https) and a supporting browser. On iOS all browsers '
          + 'share Safari’s setting (enable Settings → Safari → Advanced '
          + '→ Feature Flags → WebGPU on iOS 17; on by default in iOS 18). '
          + 'On Android use Chrome 121+.',
      );
      return;
    }

    // Everything past the capability check is a real startup error if it throws.
    // Show the ACTUAL reason on screen — on mobile there is no console to read.
    try {
      this.host = new BrowserHost(this.dom.canvas);
      await this.host.init();
      this.host.onDeviceLost = (info) => this._handleDeviceLost(info);

      const shaderSources = loadShaderSources();
      this.engine = await MeteorEngine.create({
        device: this.host.device,
        queue: this.host.queue,
        outputFormat: this.host.format,
        shaderSources,
        diagnostics: (d) => this._onDiagnostic(d),
      });

      const micro = await loadMicroNormal(this.host.device, MICRO_URL);
      this.engine.registerAssets({ microNormal: micro });

      // load the default scene's plate + project BEFORE building UI (timeline/editor
      // read state.project on construction).
      const scene = getScene(DEFAULT_SCENE_ID);
      this.currentSceneId = scene.id;
      await this._loadPlate(scene.plateUrl);
      this._loadProject(structuredClone(scene.project));

      this._buildUI();
      this.state.addEventListener('change', (e) => this._onStateChange(e));
      this._loop();
      this.notify.info('Meteor demo ready — pick a scene, drag a rain field, raise density.');
    } catch (e) {
      const detail = `${e?.name || 'Error'}: ${e?.message || String(e)}`
        + (this.host?.adapterInfo ? `  [adapter: ${this.host.adapterInfo}]` : '');
      this._showStartupError('Couldn’t start the demo', detail);
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.error('[meteor] startup failed:', e);
    }
  }

  _showStartupError(title, detail) {
    const el = this.dom.unsupported;
    if (!el) return;
    const h2 = el.querySelector('h2');
    const p = el.querySelector('p');
    if (h2) h2.textContent = title;
    if (p) p.textContent = detail;
    el.hidden = false;
  }

  /** Switch to a bundled scene (plate image + its starter project). */
  async loadScene(sceneId) {
    const scene = getScene(sceneId);
    this.currentSceneId = scene.id;
    await this._loadPlate(scene.plateUrl);
    this._loadProject(structuredClone(scene.project));
    if (this.timeline) {
      this.timeline.clock.durationFrames = this.state.project.durationFrames;
      this.timeline.jumpTo(0);
    }
    this.paramPanel?.syncAll();
    this.notify.info(`Loaded scene: ${scene.name}`);
  }

  /** Load a user-uploaded plate, keeping the current project (re-calibrate). */
  async loadUploadedPlate(file) {
    try {
      const bmp = await createImageBitmap(file, { colorSpaceConversion: 'none' });
      this.inputTexture = uploadImageTexture(this.host.device, bmp, 'plate');
      this.plateSize = { width: bmp.width, height: bmp.height };
      this.notify.info('Custom plate loaded — recalibrate surfaces if needed.');
    } catch (e) {
      this.notify.error(`Plate load failed: ${e.message}`);
    }
  }

  async _loadPlate(url) {
    try {
      const bmp = await loadImageBitmap(url);
      this.inputTexture = uploadImageTexture(this.host.device, bmp, 'plate');
      this.plateSize = { width: bmp.width, height: bmp.height };
    } catch (e) {
      this.notify.warn(`Plate missing (${e.message}); run "npm run assets".`);
      this.inputTexture = uploadImageTexture(this.host.device, await blankBitmap(), 'plate');
      this.plateSize = { width: 1920, height: 1080 };
    }
  }

  _loadProject(json) {
    const { project, warnings } = loadAndValidate(json);
    this.state.setProject(project);
    this.engine.setProject(project);
    this.engine.setParameters(this.state.params);
    warnings.forEach((w) => this.notify?.warn(w));
    this.projectDirty = false;
    if (this.timeline) this.timeline.jumpTo(0);
  }

  _buildUI() {
    new ScenePicker(this.dom.scenePicker, {
      onScene: (id) => this.loadScene(id),
      onUpload: (file) => this.loadUploadedPlate(file),
    });
    new ChipStack(this.dom.chipStack, this.state, { notify: this.notify });
    this.paramPanel = new ParameterPanel(this.dom.paramPanel, this.state);
    this.debugPanel = new DebugPanel(this.dom.debugPanel, this.state, {
      onResetSim: () => { this.engine.resetSimulation({}); this.notify.info('Wet state reset'); },
      onBake: () => this.notify.info('Baked to current frame'),
    });
    new PresetBar(this.dom.presetBar, this.state, {
      notify: this.notify,
      onApplied: () => { this.paramPanel.syncAll(); },
    });
    new ProjectMenu(this.dom.projectMenu, this.state, {
      notify: this.notify,
      onProjectLoaded: (p) => { this._loadProject(p); this.paramPanel?.syncAll(); },
      onReloadDemo: () => { this._loadProject(structuredClone(demoProjectRaw)); this.paramPanel?.syncAll(); this.notify.info('Demo reloaded'); },
    });
    this.timeline = new TimelineController(this.dom.timeline, {
      frameRate: this.state.project.frameRate,
      durationFrames: this.state.project.durationFrames,
      onSeek: () => {},
    });
    this.editor = new EditorController(this.dom.overlay, this.dom.viewport, this.state, {
      notify: this.notify,
      getFrame: () => this.timeline.clock.frame,
    });
  }

  _onStateChange(e) {
    const k = e.detail.kind;
    // param-only changes are pushed every frame (cheap); structural changes mark
    // the project dirty so it is recompiled once per frame.
    if (['project', 'surface', 'field', 'relief', 'hero', 'selection'].includes(k)) {
      this.projectDirty = true;
    }
  }

  _loop() {
    const frame = (now) => {
      this._raf = requestAnimationFrame(frame);
      if (!this.engine) return;

      if (this.host.resizeToDisplay()) {
        this.engine.resize({ width: this.host.canvas.width, height: this.host.canvas.height, pixelAspect: 1 });
      }
      this.engine.resize({ width: this.host.canvas.width, height: this.host.canvas.height, pixelAspect: 1 });

      const frameIndex = this.timeline.update(now);

      if (this.projectDirty) {
        this.engine.setProject(this.state.project);
        this.projectDirty = false;
      }
      this.engine.setParameters(this.state.params);

      const t0 = performance.now();
      this.engine.render({
        inputTextureView: this.inputTexture.createView(),
        outputTextureView: this.host.currentOutputView(),
        width: this.host.canvas.width,
        height: this.host.canvas.height,
        pixelAspect: 1,
        frameIndex,
        timeSeconds: this.timeline.clock.timeSeconds,
        frameRate: this.state.project.frameRate,
        debugMode: this.state.params.get('debugMode'),
      });
      this._perf(performance.now() - t0);

      this.editor.render();
    };
    this._raf = requestAnimationFrame(frame);
  }

  _perf(ms) {
    this._frameTimes.push(ms);
    if (this._frameTimes.length > 30) this._frameTimes.shift();
    if (this.timeline.clock.frame % 15 === 0 && this.debugPanel) {
      const avg = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
      this.debugPanel.setPerf(`CPU encode: ${avg.toFixed(1)} ms · ${this.host.canvas.width}×${this.host.canvas.height}`);
    }
  }

  /** Test helper: deterministically render a single frame and flush the GPU. */
  async captureFrame(frameIndex) {
    this.timeline.clock.pause();
    this.timeline.jumpTo(frameIndex);
    this.engine.setProject(this.state.project);
    this.projectDirty = false;
    this.engine.setParameters(this.state.params);
    this.engine.render({
      inputTextureView: this.inputTexture.createView(),
      outputTextureView: this.host.currentOutputView(),
      width: this.host.canvas.width,
      height: this.host.canvas.height,
      pixelAspect: 1,
      frameIndex,
      timeSeconds: frameIndex / this.state.project.frameRate,
      frameRate: this.state.project.frameRate,
      debugMode: this.state.params.get('debugMode'),
    });
    await this.host.device.queue.onSubmittedWorkDone();
  }

  get uncapturedError() {
    return this.host?.lastUncapturedError ?? null;
  }

  _onDiagnostic(d) {
    if (d.level === 'error') this.notify.error(`[engine] ${d.message}`);
    else if (d.level === 'warn') console.warn('[engine]', d.message);
  }

  async _handleDeviceLost(info) {
    this.notify.error(`GPU device lost (${info.message}); rebuilding…`);
    cancelAnimationFrame(this._raf);
    this.engine?.dispose();
    await this.host.init();
    const shaderSources = loadShaderSources();
    this.engine = await MeteorEngine.create({
      device: this.host.device, queue: this.host.queue,
      outputFormat: this.host.format, shaderSources,
      diagnostics: (d) => this._onDiagnostic(d),
    });
    const micro = await loadMicroNormal(this.host.device, MICRO_URL);
    this.engine.registerAssets({ microNormal: micro });
    await this._loadPlate(getScene(this.currentSceneId).plateUrl);
    this.engine.setProject(this.state.project);
    this.engine.setParameters(this.state.params);
    this._loop();
  }
}

async function blankBitmap() {
  const data = new Uint8ClampedArray(4).fill(40);
  data[3] = 255;
  return createImageBitmap(new ImageData(data, 1, 1));
}
