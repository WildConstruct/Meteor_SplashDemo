// ScenePicker — choose among the bundled demo plates (build plan §5.1: bundled by
// default, replaceable). Selecting a scene swaps the plate image + its starter
// project. Custom plate upload is also exposed here.

import { SCENES, DEFAULT_SCENE_ID } from '../projects/scenes.js';

export class ScenePicker {
  constructor(mount, { onScene, onUpload }) {
    this.mount = mount;
    this.onScene = onScene;
    this.onUpload = onUpload;
    this._build();
  }

  _build() {
    const el = document.createElement('div');
    el.className = 'scene-picker';
    const options = SCENES.map(
      (s) => `<option value="${s.id}"${s.id === DEFAULT_SCENE_ID ? ' selected' : ''}>${s.name}</option>`
    ).join('');
    el.innerHTML = `
      <select data-act="scene" title="Bundled demo scene">${options}</select>
      <button data-act="upload" title="Use your own plate image">Upload Plate</button>
      <input type="file" accept="image/*" data-act="file" hidden />`;
    this.mount.appendChild(el);

    el.querySelector('[data-act=scene]').addEventListener('change', (e) => this.onScene?.(e.target.value));
    const file = el.querySelector('[data-act=file]');
    el.querySelector('[data-act=upload]').addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files?.[0];
      if (f) this.onUpload?.(f);
      file.value = '';
    });
  }
}
