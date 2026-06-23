// PresetBar — factory + user .wcx look presets (build plan §10). Uses the shared
// .wcx contract via MeteorPresetAdapter. Factory presets are bundled and imported;
// user presets download as files and load through a file input.

import { createWcx, applyWcx, downloadWcx, importWcxFile } from '../serialization/MeteorPresetAdapter.js';

// bundle factory presets as raw text (they are JSON with a .wcx extension)
const factoryRaw = import.meta.glob('../../presets/factory/*.wcx', {
  query: '?raw', import: 'default', eager: true,
});

function loadFactory() {
  return Object.entries(factoryRaw).map(([path, raw]) => {
    const doc = JSON.parse(raw);
    doc.__file = path.split('/').pop();
    return doc;
  });
}

export class PresetBar {
  constructor(mount, state, { notify, onApplied }) {
    this.mount = mount;
    this.state = state;
    this.notify = notify;
    this.onApplied = onApplied;
    this.factory = loadFactory();
    this._build();
  }

  _build() {
    const bar = document.createElement('div');
    bar.className = 'preset-bar';
    const options = this.factory
      .map((p, i) => `<option value="${i}">${p.name} (${p.category})</option>`)
      .join('');
    bar.innerHTML = `
      <select data-act="factory"><option value="">Factory Look…</option>${options}</select>
      <button data-act="save">Save .wcx</button>
      <button data-act="import">Import .wcx</button>
      <input type="file" accept=".wcx,application/json" data-act="file" hidden />`;
    this.mount.appendChild(bar);

    bar.querySelector('[data-act=factory]').addEventListener('change', (e) => {
      const idx = e.target.value;
      if (idx === '') return;
      this._apply(this.factory[Number(idx)]);
    });
    bar.querySelector('[data-act=save]').addEventListener('click', () => {
      const name = prompt('Look preset name:', 'My Look');
      if (!name) return;
      const wcx = createWcx(this.state.params, { name });
      downloadWcx(wcx);
      this.notify?.info(`Saved ${name}.wcx`);
    });
    const fileInput = bar.querySelector('[data-act=file]');
    bar.querySelector('[data-act=import]').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const wcx = await importWcxFile(file);
        this._apply(wcx);
      } catch (err) {
        this.notify?.error(`Import failed: ${err.message}`);
      }
      fileInput.value = '';
    });
  }

  _apply(wcx) {
    try {
      const { applied, warnings } = applyWcx(wcx, this.state.params);
      this.state.emit('preset');
      this.onApplied?.();
      this.notify?.info(`Applied "${wcx.name}" (${applied} params)`);
      warnings.forEach((w) => this.notify?.warn(w));
    } catch (err) {
      this.notify?.error(err.message);
    }
  }
}
