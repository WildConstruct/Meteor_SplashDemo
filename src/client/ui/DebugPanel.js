// DebugPanel — debug-view selector + wet-state controls (build plan §4 step 14,
// §17.2). Debug modes match plugin.params.json's debugMode enum.

import { paramDefById } from '../../engine/ParameterState.js';

export class DebugPanel {
  constructor(mount, state, { onResetSim, onBake, perf }) {
    this.mount = mount;
    this.state = state;
    this.onResetSim = onResetSim;
    this.onBake = onBake;
    this.perf = perf;
    this._build();
  }

  _build() {
    const def = paramDefById('debugMode');
    const opts = (def.options || []).map((o, i) => `<option value="${i}">${o}</option>`).join('');
    const panel = document.createElement('div');
    panel.className = 'panel debug-panel';
    panel.innerHTML = `
      <h3>Debug &amp; Simulation</h3>
      <label class="param-row"><span>Debug View</span>
        <select data-act="debug">${opts}</select></label>
      <div class="btn-row">
        <button data-act="reset-sim">Reset Wet State</button>
        <button data-act="bake">Bake to Frame</button>
      </div>
      <div class="perf" data-act="perf">—</div>`;
    this.mount.appendChild(panel);

    panel.querySelector('[data-act=debug]').addEventListener('change', (e) => {
      this.state.setParam('debugMode', Number(e.target.value));
    });
    panel.querySelector('[data-act=reset-sim]').addEventListener('click', () => this.onResetSim?.());
    panel.querySelector('[data-act=bake]').addEventListener('click', () => this.onBake?.());
    this.perfEl = panel.querySelector('[data-act=perf]');
  }

  setPerf(text) {
    if (this.perfEl) this.perfEl.textContent = text;
  }
}
