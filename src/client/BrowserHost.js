// BrowserHost — owns ALL browser/WebGPU acquisition (build plan §7.1). It checks
// support, requests adapter/device, configures the canvas, handles device loss,
// uploads the plate, and supplies the output texture view to the engine. The
// engine never sees navigator.gpu or GPUCanvasContext.

export class BrowserHost {
  constructor(canvas) {
    this.canvas = canvas;
    this.device = null;
    this.context = null;
    this.format = null;
    this.adapter = null;
    this.onDeviceLost = null;
  }

  static isSupported() {
    return typeof navigator !== 'undefined' && !!navigator.gpu;
  }

  async init() {
    if (!BrowserHost.isSupported()) throw new Error('WebGPU is not available in this browser.');
    this.adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!this.adapter) throw new Error('No suitable GPU adapter found.');

    this.device = await this.adapter.requestDevice({
      // request only what we need; rgba16float storage/filterable is core in WebGPU.
      requiredFeatures: [],
    });

    this.device.lost.then((info) => {
      if (info.reason !== 'destroyed') this.onDeviceLost?.(info);
    });
    this.device.onuncapturederror = (e) => {
      // surfaced to the app for the "error log must stay empty" test (§24.3)
      this.lastUncapturedError = e.error;
      // eslint-disable-next-line no-console
      console.error('[webgpu uncaptured]', e.error?.message);
    };

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context = this.canvas.getContext('webgpu');
    this.configureCanvas();
    return this.device;
  }

  configureCanvas() {
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });
  }

  /** Match the drawing buffer to CSS size * DPR; reconfigure context. */
  resizeToDisplay() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.configureCanvas();
      return true;
    }
    return false;
  }

  currentOutputView() {
    return this.context.getCurrentTexture().createView();
  }

  get queue() {
    return this.device.queue;
  }
}
